const express = require('express');
const router = express.Router();
const Watchlist = require('../models/Watchlist');
const User = require('../models/User');
const { provideDefaultUser } = require('../middleware/defaultUser');
const axios = require('axios');
require('dotenv').config();

const FMP_API = process.env.FMP_API_KEY;

// Utility functions
const fetchStockData = async (symbols) => {
  try {
    const symbolString = Array.isArray(symbols) ? symbols.join(',') : symbols;
    if (!symbolString) return { success: true, data: [], source: 'empty' };

    const response = await axios.get(
      `https://financialmodelingprep.com/api/v3/quote/${symbolString}?apikey=${FMP_API}`,
      { timeout: 10000 }
    );

    return { success: true, data: response.data, source: 'api' };
  } catch (error) {
    console.error('Error fetching stock data:', error.message);
    const symbolArray = Array.isArray(symbols) ? symbols : [symbols];
    const fallbackData = symbolArray.map(symbol => ({
      symbol: symbol,
      name: symbol,
      price: null,
      change: null,
      changesPercentage: null
    }));
    return { success: false, data: fallbackData, source: 'fallback' };
  }
};

const validateSymbol = (symbol) => {
  if (!symbol || typeof symbol !== 'string') {
    return { valid: false, message: 'Symbol must be a non-empty string' };
  }
  const cleanSymbol = symbol.trim().toUpperCase();
  const symbolRegex = /^[A-Z0-9.-]{1,10}$/;
  if (!symbolRegex.test(cleanSymbol)) {
    return { valid: false, message: 'Invalid symbol format' };
  }
  return { valid: true, symbol: cleanSymbol };
};

// --- WATCHLIST CRUD OPERATIONS ---

// Get user's watchlists
router.get('/', provideDefaultUser, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    let watchlists = await Watchlist.find({ userId: req.user.id });

    if (watchlists.length === 0) {
      const defaultWatchlist = new Watchlist({
        userId: req.user.id,
        userEmail: user.email,
        name: 'My Watchlist',
        isDefault: true,
        stocks: []
      });
      await defaultWatchlist.save();
      watchlists.push(defaultWatchlist);
    }

    const allStocks = watchlists.flatMap(wl => wl.stocks.map(s => s.symbol));
    let stockData = {};
    if (allStocks.length > 0) {
      const stockResponse = await fetchStockData(allStocks);
      if (stockResponse.success) {
        stockResponse.data.forEach(stock => {
          stockData[stock.symbol] = stock;
        });
      }
    }

    const watchlistsWithPrices = watchlists.map(wl => ({
      ...wl.toObject(),
      stocks: wl.stocks.map(stock => ({
        ...stock.toObject(),
        ...stockData[stock.symbol]
      }))
    }));

    res.status(200).json({ success: true, data: watchlistsWithPrices });
  } catch (error) {
    console.error('Error getting watchlists:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// Add stock to a specific watchlist
router.post('/add', provideDefaultUser, async (req, res) => {
  try {
    const { symbol, watchlistId, name, notes, targetPrice, alertEnabled } = req.body;
    
    // Validate symbol
    const symbolValidation = validateSymbol(symbol);
    if (!symbolValidation.valid) {
      return res.status(400).json({ success: false, message: symbolValidation.message });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const watchlist = await Watchlist.findOne({ _id: watchlistId, userId: req.user.id });
    if (!watchlist) {
      return res.status(404).json({ success: false, message: 'Watchlist not found' });
    }

    const stockExists = watchlist.stocks.some(s => s.symbol === symbolValidation.symbol);
    if (stockExists) {
      return res.status(409).json({ success: false, message: 'Stock already in this watchlist' });
    }

    const newStock = {
      symbol: symbolValidation.symbol,
      name: name || symbolValidation.symbol,
      addedAt: new Date(),
      notes: notes || '',
      targetPrice: targetPrice || null,
      alertEnabled: alertEnabled || false
    };

    watchlist.stocks.push(newStock);
    await watchlist.save();

    res.status(201).json({ success: true, message: 'Stock added successfully', data: newStock });
  } catch (error) {
    console.error('Error adding stock to watchlist:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// Remove stock from a specific watchlist
router.delete('/remove/:symbol/:watchlistId?', provideDefaultUser, async (req, res) => {
  try {
    const { symbol, watchlistId } = req.params;

    let watchlist;
    if (watchlistId) {
      watchlist = await Watchlist.findOne({ _id: watchlistId, userId: req.user.id });
    } else {
      // Find the first watchlist that contains the symbol
      watchlist = await Watchlist.findOne({ userId: req.user.id, 'stocks.symbol': symbol.toUpperCase() });
    }

    if (!watchlist) {
      return res.status(404).json({ success: false, message: 'Watchlist or stock not found' });
    }

    const initialStockCount = watchlist.stocks.length;
    watchlist.stocks = watchlist.stocks.filter(s => s.symbol !== symbol.toUpperCase());

    if (initialStockCount === watchlist.stocks.length) {
      return res.status(404).json({ success: false, message: 'Stock not found in the specified watchlist' });
    }

    await watchlist.save();
    res.status(200).json({ success: true, message: 'Stock removed successfully' });
  } catch (error) {
    console.error('Error removing stock from watchlist:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// Create new watchlist
router.post('/create', provideDefaultUser, async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'Watchlist name is required' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const newWatchlist = new Watchlist({
      userId: req.user.id,
      userEmail: user.email,
      name,
      description: description || '',
      stocks: [],
      isDefault: false // A new list is not the default by design
    });
    await newWatchlist.save();

    res.status(201).json({ success: true, message: 'Watchlist created successfully', data: newWatchlist });
  } catch (error) {
    console.error('Error creating watchlist:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// Delete watchlist
router.delete('/:watchlistId', provideDefaultUser, async (req, res) => {
  try {
    const { watchlistId } = req.params;
    const result = await Watchlist.findOneAndDelete({ _id: watchlistId, userId: req.user.id });

    if (!result) {
      return res.status(404).json({ success: false, message: 'Watchlist not found or you do not have permission to delete it.' });
    }

    res.status(200).json({ success: true, message: 'Watchlist deleted successfully.' });
  } catch (error) {
    console.error('Error deleting watchlist:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

module.exports = router;