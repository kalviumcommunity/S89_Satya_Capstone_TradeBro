const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { provideDefaultUser } = require('../middleware/defaultUser');

// Enhanced Watchlist Model Schema (to be added to existing models)
const mongoose = require('mongoose');

const watchlistSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userEmail: {
    type: String,
    required: true
  },
  stocks: [
    {
      symbol: {
        type: String,
        required: true
      },
      name: {
        type: String,
        default: ''
      },
      addedAt: {
        type: Date,
        default: Date.now
      },
      notes: {
        type: String,
        default: '',
        maxlength: 500
      },
      targetPrice: {
        type: Number,
        default: null,
        min: 0
      },
      alertEnabled: {
        type: Boolean,
        default: false
      },
      tags: [{
        type: String,
        maxlength: 50
      }],
      priority: {
        type: String,
        enum: ['Low', 'Medium', 'High'],
        default: 'Medium'
      }
    }
  ]
}, { timestamps: true });

// Enhanced Watchlist Methods
watchlistSchema.methods.addStock = async function(stockData) {
  const { symbol, name = '', notes = '', targetPrice = null, alertEnabled = false, tags = [], priority = 'Medium' } = stockData;
  
  // Check if stock already exists
  const stockExists = this.stocks.some(stock => stock.symbol === symbol);
  
  if (stockExists) {
    return { success: false, message: 'Stock already in watchlist' };
  }

  // Add stock to watchlist
  this.stocks.push({
    symbol: symbol.toUpperCase(),
    name,
    addedAt: new Date(),
    notes,
    targetPrice,
    alertEnabled: alertEnabled && targetPrice !== null,
    tags,
    priority
  });

  await this.save();
  return { success: true, message: 'Stock added to watchlist successfully' };
};

watchlistSchema.methods.updateStock = async function(symbol, updateData) {
  const stock = this.stocks.find(stock => stock.symbol === symbol);
  
  if (!stock) {
    return { success: false, message: 'Stock not found in watchlist' };
  }

  // Update allowed fields
  if (updateData.notes !== undefined) stock.notes = updateData.notes;
  if (updateData.targetPrice !== undefined) stock.targetPrice = updateData.targetPrice;
  if (updateData.alertEnabled !== undefined) stock.alertEnabled = updateData.alertEnabled;
  if (updateData.tags !== undefined) stock.tags = updateData.tags;
  if (updateData.priority !== undefined) stock.priority = updateData.priority;

  await this.save();
  return { success: true, message: 'Stock updated successfully', stock };
};

const EnhancedWatchlist = mongoose.model('EnhancedWatchlist', watchlistSchema);

// Get enhanced watchlist with filtering and sorting
router.get('/enhanced', provideDefaultUser, async (req, res) => {
  try {
    const { 
      search = '', 
      sortBy = 'addedAt', 
      order = 'desc', 
      priority = '', 
      tags = '',
      alertsOnly = false 
    } = req.query;

    console.log('Fetching enhanced watchlist for user:', req.user.id);

    // Get user details
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Find or create enhanced watchlist
    let watchlist = await EnhancedWatchlist.findOne({ userId: req.user.id });

    if (!watchlist) {
      watchlist = new EnhancedWatchlist({
        userId: req.user.id,
        userEmail: user.email,
        stocks: []
      });
      await watchlist.save();
    }

    let filteredStocks = [...watchlist.stocks];

    // Apply filters
    if (search) {
      const searchLower = search.toLowerCase();
      filteredStocks = filteredStocks.filter(stock =>
        stock.symbol.toLowerCase().includes(searchLower) ||
        stock.name.toLowerCase().includes(searchLower) ||
        stock.notes.toLowerCase().includes(searchLower) ||
        stock.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    if (priority) {
      filteredStocks = filteredStocks.filter(stock => stock.priority === priority);
    }

    if (tags) {
      const tagArray = tags.split(',').map(tag => tag.trim().toLowerCase());
      filteredStocks = filteredStocks.filter(stock =>
        stock.tags.some(stockTag => 
          tagArray.some(filterTag => stockTag.toLowerCase().includes(filterTag))
        )
      );
    }

    if (alertsOnly === 'true') {
      filteredStocks = filteredStocks.filter(stock => stock.alertEnabled && stock.targetPrice);
    }

    // Sort stocks
    const validSortFields = ['symbol', 'name', 'addedAt', 'priority', 'targetPrice'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'addedAt';
    const sortOrder = order === 'asc' ? 1 : -1;

    filteredStocks.sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];

      if (sortField === 'priority') {
        const priorityOrder = { 'High': 3, 'Medium': 2, 'Low': 1 };
        aValue = priorityOrder[aValue] || 0;
        bValue = priorityOrder[bValue] || 0;
      }

      if (aValue === null || aValue === undefined) aValue = sortOrder === 1 ? Number.MAX_VALUE : Number.MIN_VALUE;
      if (bValue === null || bValue === undefined) bValue = sortOrder === 1 ? Number.MAX_VALUE : Number.MIN_VALUE;

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return aValue.localeCompare(bValue) * sortOrder;
      }

      return (aValue - bValue) * sortOrder;
    });

    // Format response data
    const formattedStocks = filteredStocks.map(stock => ({
      id: stock._id,
      symbol: stock.symbol,
      name: stock.name,
      addedAt: stock.addedAt,
      notes: stock.notes,
      targetPrice: stock.targetPrice,
      targetPriceFormatted: stock.targetPrice ? `₹${stock.targetPrice.toLocaleString('en-IN')}` : null,
      alertEnabled: stock.alertEnabled,
      tags: stock.tags,
      priority: stock.priority,
      daysSinceAdded: Math.floor((new Date() - new Date(stock.addedAt)) / (1000 * 60 * 60 * 24))
    }));

    // Get summary statistics
    const summary = {
      totalStocks: watchlist.stocks.length,
      filteredCount: filteredStocks.length,
      priorityBreakdown: {
        high: watchlist.stocks.filter(s => s.priority === 'High').length,
        medium: watchlist.stocks.filter(s => s.priority === 'Medium').length,
        low: watchlist.stocks.filter(s => s.priority === 'Low').length
      },
      alertsEnabled: watchlist.stocks.filter(s => s.alertEnabled).length,
      averageTargetPrice: watchlist.stocks
        .filter(s => s.targetPrice)
        .reduce((sum, s, _, arr) => sum + s.targetPrice / arr.length, 0),
      uniqueTags: [...new Set(watchlist.stocks.flatMap(s => s.tags))]
    };

    res.status(200).json({
      success: true,
      data: formattedStocks,
      summary,
      filters: {
        search,
        sortBy: sortField,
        order,
        priority,
        tags,
        alertsOnly
      }
    });
  } catch (error) {
    console.error('Error fetching enhanced watchlist:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching watchlist',
      error: error.message
    });
  }
});

// Add stock to enhanced watchlist
router.post('/enhanced/add', provideDefaultUser, async (req, res) => {
  try {
    const { symbol, name, notes, targetPrice, alertEnabled, tags, priority } = req.body;

    // Validate input
    if (!symbol) {
      return res.status(400).json({
        success: false,
        message: 'Stock symbol is required'
      });
    }

    console.log(`Adding stock ${symbol} to enhanced watchlist for user:`, req.user.id);

    // Get user details
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Find or create enhanced watchlist
    let watchlist = await EnhancedWatchlist.findOne({ userId: req.user.id });

    if (!watchlist) {
      watchlist = new EnhancedWatchlist({
        userId: req.user.id,
        userEmail: user.email,
        stocks: []
      });
    }

    // Validate tags
    const validatedTags = Array.isArray(tags) ? 
      tags.filter(tag => typeof tag === 'string' && tag.trim().length > 0).slice(0, 10) : [];

    // Add stock to watchlist
    const result = await watchlist.addStock({
      symbol: symbol.toUpperCase(),
      name: name || '',
      notes: notes || '',
      targetPrice: targetPrice || null,
      alertEnabled: alertEnabled || false,
      tags: validatedTags,
      priority: priority || 'Medium'
    });

    if (result.success) {
      res.status(201).json({
        success: true,
        message: result.message,
        data: watchlist.stocks[watchlist.stocks.length - 1] // Return the newly added stock
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message
      });
    }
  } catch (error) {
    console.error('Error adding stock to enhanced watchlist:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while adding stock',
      error: error.message
    });
  }
});

// Update stock in enhanced watchlist
router.put('/enhanced/:symbol', provideDefaultUser, async (req, res) => {
  try {
    const { symbol } = req.params;
    const updateData = req.body;

    console.log(`Updating stock ${symbol} in enhanced watchlist for user:`, req.user.id);

    // Get user's enhanced watchlist
    const watchlist = await EnhancedWatchlist.findOne({ userId: req.user.id });

    if (!watchlist) {
      return res.status(404).json({
        success: false,
        message: 'Watchlist not found'
      });
    }

    // Update stock
    const result = await watchlist.updateStock(symbol.toUpperCase(), updateData);

    if (result.success) {
      res.status(200).json({
        success: true,
        message: result.message,
        data: result.stock
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message
      });
    }
  } catch (error) {
    console.error('Error updating stock in enhanced watchlist:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating stock',
      error: error.message
    });
  }
});

// Get watchlist analytics
router.get('/enhanced/analytics', provideDefaultUser, async (req, res) => {
  try {
    console.log('Fetching watchlist analytics for user:', req.user.id);

    const watchlist = await EnhancedWatchlist.findOne({ userId: req.user.id });

    if (!watchlist || watchlist.stocks.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          totalStocks: 0,
          analytics: {
            priorityDistribution: { high: 0, medium: 0, low: 0 },
            alertsSetup: 0,
            averageTargetPrice: 0,
            tagsUsage: [],
            addingTrends: []
          }
        }
      });
    }

    // Calculate analytics
    const priorityDistribution = {
      high: watchlist.stocks.filter(s => s.priority === 'High').length,
      medium: watchlist.stocks.filter(s => s.priority === 'Medium').length,
      low: watchlist.stocks.filter(s => s.priority === 'Low').length
    };

    const alertsSetup = watchlist.stocks.filter(s => s.alertEnabled && s.targetPrice).length;

    const stocksWithTargetPrice = watchlist.stocks.filter(s => s.targetPrice);
    const averageTargetPrice = stocksWithTargetPrice.length > 0 ?
      stocksWithTargetPrice.reduce((sum, s) => sum + s.targetPrice, 0) / stocksWithTargetPrice.length : 0;

    // Tag usage analysis
    const tagCounts = {};
    watchlist.stocks.forEach(stock => {
      stock.tags.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });

    const tagsUsage = Object.entries(tagCounts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Adding trends (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentStocks = watchlist.stocks.filter(s => new Date(s.addedAt) >= thirtyDaysAgo);
    const addingTrends = [];

    for (let i = 0; i < 30; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const stocksAddedOnDate = recentStocks.filter(s => 
        new Date(s.addedAt).toISOString().split('T')[0] === dateStr
      ).length;

      addingTrends.unshift({ date: dateStr, count: stocksAddedOnDate });
    }

    const analytics = {
      totalStocks: watchlist.stocks.length,
      priorityDistribution,
      alertsSetup,
      averageTargetPrice: parseFloat(averageTargetPrice.toFixed(2)),
      averageTargetPriceFormatted: `₹${averageTargetPrice.toLocaleString('en-IN')}`,
      tagsUsage,
      addingTrends,
      oldestStock: watchlist.stocks.reduce((oldest, stock) => 
        new Date(stock.addedAt) < new Date(oldest.addedAt) ? stock : oldest
      ),
      newestStock: watchlist.stocks.reduce((newest, stock) => 
        new Date(stock.addedAt) > new Date(newest.addedAt) ? stock : newest
      )
    };

    res.status(200).json({
      success: true,
      data: analytics,
      message: 'Watchlist analytics retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching watchlist analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching analytics',
      error: error.message
    });
  }
});

module.exports = router;
