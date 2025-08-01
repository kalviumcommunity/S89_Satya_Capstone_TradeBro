const express = require('express');
const router = express.Router();
const Watchlist = require('../models/Watchlist');
const User = require('../models/User');
const { provideDefaultUser } = require('../middleware/defaultUser');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const FMP_API = process.env.FMP_API_KEY;

// Get user's watchlist
router.get('/stocks', provideDefaultUser, async (req, res) => {
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
          addedAt: watchlistStock.addedAt,
          notes: watchlistStock.notes,
          targetPrice: watchlistStock.targetPrice,
          alertEnabled: watchlistStock.alertEnabled
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
        addedAt: stock.addedAt,
        notes: stock.notes,
        targetPrice: stock.targetPrice,
        alertEnabled: stock.alertEnabled
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
router.post('/add', provideDefaultUser, async (req, res) => {
  try {
    const { symbol, name, notes, targetPrice, alertEnabled } = req.body;

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
    const result = await watchlist.addStock(symbol.toUpperCase(), name, notes, targetPrice, alertEnabled);

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
router.delete('/remove/:symbol', provideDefaultUser, async (req, res) => {
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
router.get('/search', provideDefaultUser, async (req, res) => {
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

// Export watchlist to CSV
router.get('/export/csv', provideDefaultUser, async (req, res) => {
  try {
    // Get user's watchlist
    const watchlist = await Watchlist.findOne({ userId: req.user.id });

    if (!watchlist || watchlist.stocks.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No stocks found in watchlist to export'
      });
    }

    // Get symbols for FMP API call
    const symbols = watchlist.stocks.map(stock => stock.symbol).join(',');

    try {
      // Fetch current stock data from FMP API
      const response = await axios.get(
        `https://financialmodelingprep.com/api/v3/quote/${symbols}?apikey=${FMP_API}`
      );

      // Create CSV content with enhanced data
      let csvContent = 'Symbol,Name,Current Price,Change,Change %,Market Cap,Volume,Added Date,Notes,Target Price,Alert Enabled\n';

      watchlist.stocks.forEach(stock => {
        const marketData = response.data.find(data => data.symbol === stock.symbol);
        const price = marketData ? marketData.price : 'N/A';
        const change = marketData ? marketData.change : 'N/A';
        const changePercent = marketData ? marketData.changesPercentage : 'N/A';
        const marketCap = marketData ? marketData.marketCap : 'N/A';
        const volume = marketData ? marketData.volume : 'N/A';

        // Escape quotes in notes for CSV
        const escapedNotes = stock.notes ? `"${stock.notes.replace(/"/g, '""')}"` : '';

        csvContent += `${stock.symbol},${stock.name || stock.symbol},${price},${change},${changePercent},${marketCap},${volume},${stock.addedAt.toISOString().split('T')[0]},${escapedNotes},${stock.targetPrice || ''},${stock.alertEnabled}\n`;
      });

      // Set headers for file download
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="watchlist_${new Date().toISOString().split('T')[0]}.csv"`);

      res.status(200).send(csvContent);
    } catch (apiError) {
      console.error('Error fetching stock data for export:', apiError);

      // Fallback CSV without market data
      let csvContent = 'Symbol,Name,Added Date,Notes,Target Price,Alert Enabled\n';

      watchlist.stocks.forEach(stock => {
        const escapedNotes = stock.notes ? `"${stock.notes.replace(/"/g, '""')}"` : '';
        csvContent += `${stock.symbol},${stock.name || stock.symbol},${stock.addedAt.toISOString().split('T')[0]},${escapedNotes},${stock.targetPrice || ''},${stock.alertEnabled}\n`;
      });

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="watchlist_basic_${new Date().toISOString().split('T')[0]}.csv"`);

      res.status(200).send(csvContent);
    }
  } catch (error) {
    console.error('Error exporting watchlist:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during export',
      error: error.message
    });
  }
});

// Bulk add stocks to watchlist
router.post('/bulk/add', provideDefaultUser, async (req, res) => {
  try {
    const { stocks } = req.body;

    // Validate input
    if (!stocks || !Array.isArray(stocks) || stocks.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Stocks array is required and must not be empty'
      });
    }

    // Limit bulk operations to prevent abuse
    if (stocks.length > 50) {
      return res.status(400).json({
        success: false,
        message: 'Bulk add limited to 50 stocks at a time'
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

    // Perform bulk add operation
    const result = await watchlist.bulkAddStocks(stocks);

    res.status(200).json({
      success: true,
      message: result.message,
      data: {
        added: result.results.added,
        skipped: result.results.skipped,
        errors: result.results.errors,
        totalStocks: watchlist.stocks.length
      }
    });
  } catch (error) {
    console.error('Error bulk adding stocks:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during bulk add',
      error: error.message
    });
  }
});

// Bulk remove stocks from watchlist
router.delete('/bulk/remove', provideDefaultUser, async (req, res) => {
  try {
    const { symbols } = req.body;

    // Validate input
    if (!symbols || !Array.isArray(symbols) || symbols.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Symbols array is required and must not be empty'
      });
    }

    // Limit bulk operations to prevent abuse
    if (symbols.length > 50) {
      return res.status(400).json({
        success: false,
        message: 'Bulk remove limited to 50 stocks at a time'
      });
    }

    // Get user's watchlist
    const watchlist = await Watchlist.findOne({ userId: req.user.id });

    if (!watchlist) {
      return res.status(404).json({
        success: false,
        message: 'Watchlist not found'
      });
    }

    // Perform bulk remove operation
    const result = await watchlist.bulkRemoveStocks(symbols);

    res.status(200).json({
      success: true,
      message: result.message,
      data: {
        removed: result.results.removed,
        notFound: result.results.notFound,
        totalStocks: watchlist.stocks.length
      }
    });
  } catch (error) {
    console.error('Error bulk removing stocks:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during bulk remove',
      error: error.message
    });
  }
});

// Update stock notes
router.put('/notes/:symbol', provideDefaultUser, async (req, res) => {
  try {
    const { symbol } = req.params;
    const { notes } = req.body;

    // Get user's watchlist
    const watchlist = await Watchlist.findOne({ userId: req.user.id });

    if (!watchlist) {
      return res.status(404).json({
        success: false,
        message: 'Watchlist not found'
      });
    }

    // Update stock notes
    const result = await watchlist.updateStockNotes(symbol.toUpperCase(), notes);

    if (result.success) {
      res.status(200).json({
        success: true,
        message: result.message,
        data: watchlist.stocks.find(s => s.symbol === symbol.toUpperCase())
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message
      });
    }
  } catch (error) {
    console.error('Error updating stock notes:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Update target price and alert settings
router.put('/target-price/:symbol', provideDefaultUser, async (req, res) => {
  try {
    const { symbol } = req.params;
    const { targetPrice, alertEnabled } = req.body;

    // Get user's watchlist
    const watchlist = await Watchlist.findOne({ userId: req.user.id });

    if (!watchlist) {
      return res.status(404).json({
        success: false,
        message: 'Watchlist not found'
      });
    }

    // Update target price
    const result = await watchlist.updateTargetPrice(symbol.toUpperCase(), targetPrice, alertEnabled);

    if (result.success) {
      res.status(200).json({
        success: true,
        message: result.message,
        data: watchlist.stocks.find(s => s.symbol === symbol.toUpperCase())
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message
      });
    }
  } catch (error) {
    console.error('Error updating target price:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Get sorted watchlist with enhanced sorting options
router.get('/sorted', provideDefaultUser, async (req, res) => {
  try {
    const { sortBy = 'addedAt', order = 'desc', search = '' } = req.query;

    // Validate sort parameters
    const validSortFields = ['symbol', 'name', 'addedAt', 'price', 'change', 'changePercent', 'marketCap', 'volume', 'targetPrice'];
    const validOrders = ['asc', 'desc'];

    if (!validSortFields.includes(sortBy)) {
      return res.status(400).json({
        success: false,
        message: `Invalid sort field. Valid options: ${validSortFields.join(', ')}`
      });
    }

    if (!validOrders.includes(order)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid sort order. Use "asc" or "desc"'
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
      await watchlist.save();
    }

    // If watchlist is empty, return empty array
    if (watchlist.stocks.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
        sortBy,
        order,
        search: search || null
      });
    }

    // Filter stocks by search query if provided
    let filteredStocks = watchlist.stocks;
    if (search) {
      const searchTermLower = search.toLowerCase();
      filteredStocks = watchlist.stocks.filter(stock =>
        stock.symbol.toLowerCase().includes(searchTermLower) ||
        (stock.name && stock.name.toLowerCase().includes(searchTermLower)) ||
        (stock.notes && stock.notes.toLowerCase().includes(searchTermLower))
      );
    }

    // If no stocks match the search query, return empty array
    if (filteredStocks.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
        sortBy,
        order,
        search: search || null,
        message: search ? `No stocks found matching "${search}"` : 'No stocks in watchlist'
      });
    }

    try {
      // Get symbols for FMP API call
      const symbols = filteredStocks.map(stock => stock.symbol).join(',');

      // Fetch current stock data from FMP API
      const response = await axios.get(
        `https://financialmodelingprep.com/api/v3/quote/${symbols}?apikey=${FMP_API}`
      );

      // Map response data to include watchlist info
      let watchlistData = response.data.map(stockData => {
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
          addedAt: watchlistStock.addedAt,
          notes: watchlistStock.notes,
          targetPrice: watchlistStock.targetPrice,
          alertEnabled: watchlistStock.alertEnabled
        };
      });

      // Sort the data based on the specified field and order
      watchlistData.sort((a, b) => {
        let aValue = a[sortBy];
        let bValue = b[sortBy];

        // Handle null/undefined values
        if (aValue === null || aValue === undefined) aValue = order === 'asc' ? Number.MAX_VALUE : Number.MIN_VALUE;
        if (bValue === null || bValue === undefined) bValue = order === 'asc' ? Number.MAX_VALUE : Number.MIN_VALUE;

        // Handle different data types
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          aValue = aValue.toLowerCase();
          bValue = bValue.toLowerCase();
        }

        if (aValue < bValue) return order === 'asc' ? -1 : 1;
        if (aValue > bValue) return order === 'asc' ? 1 : -1;
        return 0;
      });

      res.status(200).json({
        success: true,
        data: watchlistData,
        sortBy,
        order,
        search: search || null,
        total: watchlist.stocks.length,
        filtered_count: filteredStocks.length
      });
    } catch (apiError) {
      console.error('Error fetching stock data for sorting:', apiError);

      // Fallback sorting without market data
      let basicWatchlistData = filteredStocks.map(stock => ({
        id: stock._id,
        symbol: stock.symbol,
        name: stock.name || stock.symbol,
        addedAt: stock.addedAt,
        notes: stock.notes,
        targetPrice: stock.targetPrice,
        alertEnabled: stock.alertEnabled
      }));

      // Sort basic data
      basicWatchlistData.sort((a, b) => {
        let aValue = a[sortBy];
        let bValue = b[sortBy];

        if (aValue === null || aValue === undefined) aValue = order === 'asc' ? Number.MAX_VALUE : Number.MIN_VALUE;
        if (bValue === null || bValue === undefined) bValue = order === 'asc' ? Number.MAX_VALUE : Number.MIN_VALUE;

        if (typeof aValue === 'string' && typeof bValue === 'string') {
          aValue = aValue.toLowerCase();
          bValue = bValue.toLowerCase();
        }

        if (aValue < bValue) return order === 'asc' ? -1 : 1;
        if (aValue > bValue) return order === 'asc' ? 1 : -1;
        return 0;
      });

      res.status(200).json({
        success: true,
        data: basicWatchlistData,
        message: 'Using basic data due to API limitations',
        sortBy,
        order,
        search: search || null,
        total: watchlist.stocks.length,
        filtered_count: filteredStocks.length
      });
    }
  } catch (error) {
    console.error('Error getting sorted watchlist:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

module.exports = router;