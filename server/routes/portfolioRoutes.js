const express = require('express');
const mongoose = require('mongoose');

// Import models
const User = require('../models/User');
const VirtualMoney = require('../models/VirtualMoney');
const Order = require('../models/Order');
const Watchlist = require('../models/Watchlist');

// Import utilities and middleware
const { verifyToken } = require('../utils/tokenUtils');
const asyncHandler = require('../utils/asyncHandler');
const { createRateLimit } = require('../middleware/rateLimiter');

const router = express.Router();

// Rate limiting for portfolio routes
const portfolioRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many portfolio requests. Please try again later.'
  }
});

// JWT verification middleware
const verifyTokenMiddleware = asyncHandler(async (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No token provided.'
    });
  }

  try {
    const decoded = verifyToken(token);
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token. User not found.'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Invalid token.'
    });
  }
});

// ========================================
// 📊 PORTFOLIO ENDPOINTS
// ========================================

/**
 * @route   GET /api/portfolio/:userId
 * @desc    Get user's portfolio data
 * @access  Private
 */
router.get('/:userId', portfolioRateLimit, verifyTokenMiddleware, asyncHandler(async (req, res) => {
  try {
    const { userId } = req.params;

    // Verify user can access this portfolio
    if (req.user.id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Cannot access another user\'s portfolio.'
      });
    }

    // Get virtual money data
    let virtualMoney = await VirtualMoney.findOne({ userId });

    if (!virtualMoney) {
      // Get user details for email
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Create default portfolio if doesn't exist
      virtualMoney = new VirtualMoney({
        userId,
        userEmail: user.email, // Add required userEmail field
        totalValue: 10000,
        availableCash: 10000,
        totalInvested: 0,
        totalGainLoss: 0,
        totalGainLossPercentage: 0,
        holdings: [],
        transactions: []
      });
      await virtualMoney.save();
      console.log('Created new virtual money account for user:', user.email);
    }

    // Get watchlist
    const watchlist = await Watchlist.find({ userId }).select('symbol addedAt');

    // Get recent transactions
    const transactions = await Order.find({ userId })
      .sort({ createdAt: -1 })
      .limit(50)
      .select('symbol type quantity price total status createdAt');

    const portfolioData = {
      totalValue: virtualMoney.totalValue,
      availableCash: virtualMoney.availableCash,
      totalInvested: virtualMoney.totalInvested,
      totalGainLoss: virtualMoney.totalGainLoss,
      totalGainLossPercentage: virtualMoney.totalGainLossPercentage,
      holdings: virtualMoney.holdings || [],
      transactions: transactions || [],
      watchlist: watchlist.map(item => item.symbol) || []
    };

    res.json({
      success: true,
      data: portfolioData
    });

  } catch (error) {
    console.error('Portfolio fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching portfolio data'
    });
  }
}));

/**
 * @route   POST /api/portfolio/create
 * @desc    Create default portfolio for new user
 * @access  Private
 */
router.post('/create', portfolioRateLimit, verifyTokenMiddleware, asyncHandler(async (req, res) => {
  try {
    const { userId, initialCash = 10000 } = req.body;

    // Verify user can create this portfolio
    if (req.user.id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Cannot create portfolio for another user.'
      });
    }

    // Check if portfolio already exists
    const existingPortfolio = await VirtualMoney.findOne({ userId });
    if (existingPortfolio) {
      return res.status(400).json({
        success: false,
        message: 'Portfolio already exists for this user'
      });
    }

    // Get user details for email
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Create new portfolio
    const virtualMoney = new VirtualMoney({
      userId,
      userEmail: user.email, // Add required userEmail field
      totalValue: initialCash,
      availableCash: initialCash,
      totalInvested: 0,
      totalGainLoss: 0,
      totalGainLossPercentage: 0,
      holdings: [],
      transactions: []
    });

    await virtualMoney.save();

    const portfolioData = {
      totalValue: virtualMoney.totalValue,
      availableCash: virtualMoney.availableCash,
      totalInvested: virtualMoney.totalInvested,
      totalGainLoss: virtualMoney.totalGainLoss,
      totalGainLossPercentage: virtualMoney.totalGainLossPercentage,
      holdings: virtualMoney.holdings,
      transactions: virtualMoney.transactions,
      watchlist: []
    };

    res.status(201).json({
      success: true,
      message: 'Portfolio created successfully',
      data: portfolioData
    });

  } catch (error) {
    console.error('Portfolio creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating portfolio'
    });
  }
}));

/**
 * @route   POST /api/portfolio/buy
 * @desc    Buy stock
 * @access  Private
 */
router.post('/buy', portfolioRateLimit, verifyTokenMiddleware, asyncHandler(async (req, res) => {
  try {
    const { userId, symbol, quantity, price } = req.body;

    // Verify user can trade for this portfolio
    if (req.user.id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Cannot trade for another user.'
      });
    }

    // Validate input
    if (!symbol || !quantity || !price || quantity <= 0 || price <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid trade parameters'
      });
    }

    const totalCost = quantity * price;

    // Get user's portfolio
    const virtualMoney = await VirtualMoney.findOne({ userId });
    if (!virtualMoney) {
      return res.status(404).json({
        success: false,
        message: 'Portfolio not found'
      });
    }

    // Check if user has enough cash
    if (virtualMoney.availableCash < totalCost) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient funds'
      });
    }

    // Update portfolio
    virtualMoney.availableCash -= totalCost;
    virtualMoney.totalInvested += totalCost;

    // Update holdings
    const existingHolding = virtualMoney.holdings.find(h => h.symbol === symbol);
    if (existingHolding) {
      const newTotalQuantity = existingHolding.quantity + quantity;
      const newAveragePrice = ((existingHolding.averagePrice * existingHolding.quantity) + (price * quantity)) / newTotalQuantity;
      
      existingHolding.quantity = newTotalQuantity;
      existingHolding.averagePrice = newAveragePrice;
      existingHolding.currentValue = newTotalQuantity * price; // This should be updated with real-time price
    } else {
      virtualMoney.holdings.push({
        symbol,
        quantity,
        averagePrice: price,
        currentPrice: price,
        currentValue: quantity * price,
        gainLoss: 0,
        gainLossPercentage: 0
      });
    }

    // Recalculate total value
    virtualMoney.totalValue = virtualMoney.availableCash + virtualMoney.totalInvested;

    await virtualMoney.save();

    // Create order record
    const order = new Order({
      userId,
      symbol,
      type: 'BUY',
      quantity,
      price,
      total: totalCost,
      status: 'completed',
      executedAt: new Date()
    });
    await order.save();

    // Return updated portfolio
    const portfolioData = {
      totalValue: virtualMoney.totalValue,
      availableCash: virtualMoney.availableCash,
      totalInvested: virtualMoney.totalInvested,
      totalGainLoss: virtualMoney.totalGainLoss,
      totalGainLossPercentage: virtualMoney.totalGainLossPercentage,
      holdings: virtualMoney.holdings,
      transactions: [order],
      watchlist: []
    };

    res.json({
      success: true,
      message: `Successfully bought ${quantity} shares of ${symbol}`,
      data: portfolioData
    });

  } catch (error) {
    console.error('Buy stock error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while buying stock'
    });
  }
}));

/**
 * @route   POST /api/portfolio/sell
 * @desc    Sell stock
 * @access  Private
 */
router.post('/sell', portfolioRateLimit, verifyTokenMiddleware, asyncHandler(async (req, res) => {
  try {
    const { userId, symbol, quantity, price } = req.body;

    // Verify user can trade for this portfolio
    if (req.user.id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Cannot trade for another user.'
      });
    }

    // Validate input
    if (!symbol || !quantity || !price || quantity <= 0 || price <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid trade parameters'
      });
    }

    const totalValue = quantity * price;

    // Get user's portfolio
    const virtualMoney = await VirtualMoney.findOne({ userId });
    if (!virtualMoney) {
      return res.status(404).json({
        success: false,
        message: 'Portfolio not found'
      });
    }

    // Find the holding
    const holding = virtualMoney.holdings.find(h => h.symbol === symbol);
    if (!holding || holding.quantity < quantity) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient shares to sell'
      });
    }

    // Update portfolio
    virtualMoney.availableCash += totalValue;

    // Calculate the cost basis for the shares being sold
    const costBasis = holding.averagePrice * quantity;
    virtualMoney.totalInvested -= costBasis;

    // Update holdings
    holding.quantity -= quantity;
    if (holding.quantity === 0) {
      // Remove holding if quantity becomes 0
      virtualMoney.holdings = virtualMoney.holdings.filter(h => h.symbol !== symbol);
    } else {
      holding.currentValue = holding.quantity * price;
    }

    // Recalculate total value
    virtualMoney.totalValue = virtualMoney.availableCash + virtualMoney.totalInvested;

    await virtualMoney.save();

    // Create order record
    const order = new Order({
      userId,
      symbol,
      type: 'SELL',
      quantity,
      price,
      total: totalValue,
      status: 'completed',
      executedAt: new Date()
    });
    await order.save();

    // Return updated portfolio
    const portfolioData = {
      totalValue: virtualMoney.totalValue,
      availableCash: virtualMoney.availableCash,
      totalInvested: virtualMoney.totalInvested,
      totalGainLoss: virtualMoney.totalGainLoss,
      totalGainLossPercentage: virtualMoney.totalGainLossPercentage,
      holdings: virtualMoney.holdings,
      transactions: [order],
      watchlist: []
    };

    res.json({
      success: true,
      message: `Successfully sold ${quantity} shares of ${symbol}`,
      data: portfolioData
    });

  } catch (error) {
    console.error('Sell stock error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while selling stock'
    });
  }
}));

/**
 * @route   POST /api/portfolio/update-values/:userId
 * @desc    Update portfolio values with current market prices
 * @access  Private
 */
router.post('/update-values/:userId', portfolioRateLimit, verifyTokenMiddleware, asyncHandler(async (req, res) => {
  try {
    const { userId } = req.params;

    // Verify user can update this portfolio
    if (req.user.id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Cannot update another user\'s portfolio.'
      });
    }

    const virtualMoney = await VirtualMoney.findOne({ userId });
    if (!virtualMoney) {
      return res.status(404).json({
        success: false,
        message: 'Portfolio not found'
      });
    }

    // Here you would typically fetch current market prices
    // For now, we'll just recalculate based on existing data
    let totalCurrentValue = 0;
    let totalGainLoss = 0;

    virtualMoney.holdings.forEach(holding => {
      const currentValue = holding.quantity * holding.currentPrice;
      const costBasis = holding.quantity * holding.averagePrice;
      const gainLoss = currentValue - costBasis;

      holding.currentValue = currentValue;
      holding.gainLoss = gainLoss;
      holding.gainLossPercentage = costBasis > 0 ? (gainLoss / costBasis) * 100 : 0;

      totalCurrentValue += currentValue;
      totalGainLoss += gainLoss;
    });

    virtualMoney.totalValue = virtualMoney.availableCash + totalCurrentValue;
    virtualMoney.totalGainLoss = totalGainLoss;
    virtualMoney.totalGainLossPercentage = virtualMoney.totalInvested > 0 ?
      (totalGainLoss / virtualMoney.totalInvested) * 100 : 0;

    await virtualMoney.save();

    const portfolioData = {
      totalValue: virtualMoney.totalValue,
      availableCash: virtualMoney.availableCash,
      totalInvested: virtualMoney.totalInvested,
      totalGainLoss: virtualMoney.totalGainLoss,
      totalGainLossPercentage: virtualMoney.totalGainLossPercentage,
      holdings: virtualMoney.holdings,
      transactions: [],
      watchlist: []
    };

    res.json({
      success: true,
      message: 'Portfolio values updated successfully',
      data: portfolioData
    });

  } catch (error) {
    console.error('Update portfolio values error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating portfolio values'
    });
  }
}));

module.exports = router;
