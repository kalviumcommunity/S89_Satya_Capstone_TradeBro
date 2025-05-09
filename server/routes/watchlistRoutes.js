const express = require('express');
const router = express.Router();
const Watchlist = require('../models/Watchlist');
const User = require('../models/User');
const { verifyToken } = require('../middleware/auth');
const axios = require('axios');
require('dotenv').config();

const FMP_API = process.env.FMP_API_KEY;

// Get user's watchlist
router.get('/stocks', verifyToken, async (req, res) => {
  try {
    // Get search query if provided
    const searchQuery = req.query.search ? req.query.search : '';

    // Get user details
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Find or create watchlist
    let watchlist = await Watchlist.findOne({ userId: req.user.id });

    if (!watchlist) {
      watchlist = new Watchlist({
        userId: req.user.id,
        userEmail: user.email,
        stocks: []
      });
      await watchlist.save();
    }

    // If watchlist is empty, return empty array
    if (watchlist.stocks.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
        filtered: false,
        query: null
      });
    }

    // Filter stocks by search query if provided
    let filteredStocks = watchlist.stocks;
    if (searchQuery) {
      const searchTermLower = searchQuery.toLowerCase();
      filteredStocks = watchlist.stocks.filter(stock =>
        stock.symbol.toLowerCase().includes(searchTermLower) ||
        (stock.name && stock.name.toLowerCase().includes(searchTermLower))
      );
    }

    // If no stocks match the search query, return empty array
    if (filteredStocks.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
        filtered: searchQuery ? true : false,
        query: searchQuery || null,
        message: searchQuery ? `No stocks found matching "${searchQuery}"` : 'No stocks in watchlist'
      });
    }

    // Get symbols from filtered watchlist
    const symbols = filteredStocks.map(stock => stock.symbol).join(',');

    try {
      // Fetch current stock data from FMP API
      const response = await axios.get(
        `https://financialmodelingprep.com/api/v3/quote/${symbols}?apikey=${FMP_API}`
      );

      // Map response data to include watchlist info
      const watchlistData = response.data.map(stockData => {
        const watchlistStock = filteredStocks.find(s => s.symbol === stockData.symbol);
        return {
          id: watchlistStock._id,
          symbol: stockData.symbol,
          name: stockData.name,
          price: stockData.price,
          change: stockData.change,
          changePercent: stockData.changesPercentage,
          marketCap: stockData.marketCap,
          volume: stockData.volume,
          addedAt: watchlistStock.addedAt
        };
      });

      res.status(200).json({
        success: true,
        data: watchlistData,
        filtered: searchQuery ? true : false,
        query: searchQuery || null,
        total: watchlist.stocks.length,
        filtered_count: filteredStocks.length
      });
    } catch (apiError) {
      console.error('Error fetching stock data:', apiError);

      // Return basic watchlist data if API call fails
      const basicWatchlistData = filteredStocks.map(stock => ({
        id: stock._id,
        symbol: stock.symbol,
        name: stock.name || stock.symbol,
        addedAt: stock.addedAt
      }));

      res.status(200).json({
        success: true,
        data: basicWatchlistData,
        message: 'Using basic data due to API limitations',
        filtered: searchQuery ? true : false,
        query: searchQuery || null,
        total: watchlist.stocks.length,
        filtered_count: filteredStocks.length
      });
    }
  } catch (error) {
    console.error('Error getting watchlist:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Add stock to watchlist
router.post('/add', verifyToken, async (req, res) => {
  try {
    const { symbol, name } = req.body;

    // Validate input
    if (!symbol) {
      return res.status(400).json({
        success: false,
        message: 'Stock symbol is required'
      });
    }

    // Get user details
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Find or create watchlist
    let watchlist = await Watchlist.findOne({ userId: req.user.id });

    if (!watchlist) {
      watchlist = new Watchlist({
        userId: req.user.id,
        userEmail: user.email,
        stocks: []
      });
    }

    // Add stock to watchlist
    const result = await watchlist.addStock(symbol.toUpperCase(), name);

    if (result.success) {
      res.status(201).json({
        success: true,
        message: result.message,
        data: watchlist.stocks
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message
      });
    }
  } catch (error) {
    console.error('Error adding stock to watchlist:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Remove stock from watchlist
router.delete('/remove/:symbol', verifyToken, async (req, res) => {
  try {
    const { symbol } = req.params;

    // Get user's watchlist
    const watchlist = await Watchlist.findOne({ userId: req.user.id });

    if (!watchlist) {
      return res.status(404).json({
        success: false,
        message: 'Watchlist not found'
      });
    }

    // Remove stock from watchlist
    const result = await watchlist.removeStock(symbol.toUpperCase());

    if (result.success) {
      res.status(200).json({
        success: true,
        message: result.message,
        data: watchlist.stocks
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message
      });
    }
  } catch (error) {
    console.error('Error removing stock from watchlist:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Search for stocks (both in watchlist and external)
router.get('/search', verifyToken, async (req, res) => {
  try {
    const { query } = req.query;

    if (!query || query.length < 1) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    // Get user's watchlist for reference
    const watchlist = await Watchlist.findOne({ userId: req.user.id });
    const watchlistSymbols = watchlist ? watchlist.stocks.map(s => s.symbol) : [];

    try {
      // Search for stocks using FMP API
      const response = await axios.get(
        `https://financialmodelingprep.com/api/v3/search?query=${query}&limit=10&apikey=${FMP_API}`
      );

      // Filter out non-stock results and prioritize exact matches
      let searchResults = response.data
        .filter(item => item.type === 'stock' || item.type === 'etf')
        .map(stock => ({
          symbol: stock.symbol,
          name: stock.name || stock.symbol,
          exchange: stock.exchangeShortName || 'Unknown',
          type: stock.type || 'stock',
          inWatchlist: watchlistSymbols.includes(stock.symbol)
        }));

      // Sort results: exact symbol matches first, then by symbol length (shorter first)
      searchResults.sort((a, b) => {
        // Exact symbol match gets highest priority
        if (a.symbol.toLowerCase() === query.toLowerCase()) return -1;
        if (b.symbol.toLowerCase() === query.toLowerCase()) return 1;

        // Starts with the query gets second priority
        const aStartsWith = a.symbol.toLowerCase().startsWith(query.toLowerCase());
        const bStartsWith = b.symbol.toLowerCase().startsWith(query.toLowerCase());
        if (aStartsWith && !bStartsWith) return -1;
        if (!aStartsWith && bStartsWith) return 1;

        // Shorter symbols get third priority
        return a.symbol.length - b.symbol.length;
      });

      res.status(200).json({
        success: true,
        data: searchResults,
        query
      });
    } catch (apiError) {
      console.error('Error searching for stocks:', apiError);

      // Fallback to a basic search if API fails
      // Create mock results based on the query
      const mockResults = [
        {
          symbol: query.toUpperCase(),
          name: `${query.toUpperCase()} Corporation`,
          exchange: 'NASDAQ',
          type: 'stock',
          inWatchlist: watchlistSymbols.includes(query.toUpperCase())
        },
        {
          symbol: `${query.toUpperCase()}.X`,
          name: `${query.toUpperCase()} Index`,
          exchange: 'NYSE',
          type: 'etf',
          inWatchlist: watchlistSymbols.includes(`${query.toUpperCase()}.X`)
        }
      ];

      res.status(200).json({
        success: true,
        data: mockResults,
        query,
        note: 'Using fallback data due to API limitations'
      });
    }
  } catch (error) {
    console.error('Error in stock search:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

module.exports = router;
