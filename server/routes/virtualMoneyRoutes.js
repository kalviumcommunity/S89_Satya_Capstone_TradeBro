const express = require('express');
const router = express.Router();
const VirtualMoney = require('../models/VirtualMoney');
const User = require('../models/User');
const { verifyToken } = require('../middleware/auth');
const axios = require('axios');

// Get user's virtual money account
router.get('/account', verifyToken, async (req, res) => {
  try {
    // Find or create virtual money account
    let virtualMoney = await VirtualMoney.findOne({ userId: req.user.id });

    if (!virtualMoney) {
      virtualMoney = new VirtualMoney({
        userId: req.user.id,
        balance: 10000, // Start with 10,000 virtual coins
      });
      await virtualMoney.save();
    }

    res.status(200).json({
      success: true,
      data: {
        balance: virtualMoney.balance,
        lastLoginReward: virtualMoney.lastLoginReward,
        portfolio: virtualMoney.portfolio
      }
    });
  } catch (error) {
    console.error('Error getting virtual money account:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Get user's transaction history
router.get('/transactions', verifyToken, async (req, res) => {
  try {
    const virtualMoney = await VirtualMoney.findOne({ userId: req.user.id });

    if (!virtualMoney) {
      return res.status(404).json({
        success: false,
        message: 'Virtual money account not found'
      });
    }

    // Sort transactions by timestamp (newest first)
    const transactions = [...virtualMoney.transactions].sort((a, b) =>
      new Date(b.timestamp) - new Date(a.timestamp)
    );

    res.status(200).json({
      success: true,
      data: transactions
    });
  } catch (error) {
    console.error('Error getting transactions:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Claim daily login reward
router.post('/claim-reward', verifyToken, async (req, res) => {
  try {
    let virtualMoney = await VirtualMoney.findOne({ userId: req.user.id });

    if (!virtualMoney) {
      virtualMoney = new VirtualMoney({
        userId: req.user.id
      });
    }

    const rewardClaimed = await virtualMoney.addLoginReward();

    if (rewardClaimed) {
      res.status(200).json({
        success: true,
        message: 'Daily reward claimed successfully',
        data: {
          balance: virtualMoney.balance,
          rewardAmount: 1
        }
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Daily reward already claimed today'
      });
    }
  } catch (error) {
    console.error('Error claiming reward:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Buy stock
router.post('/buy', verifyToken, async (req, res) => {
  try {
    const { stockSymbol, quantity, price } = req.body;

    // Validate input
    if (!stockSymbol || !quantity || !price) {
      return res.status(400).json({
        success: false,
        message: 'Stock symbol, quantity, and price are required'
      });
    }

    if (quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be greater than 0'
      });
    }

    if (price <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Price must be greater than 0'
      });
    }

    let virtualMoney = await VirtualMoney.findOne({ userId: req.user.id });

    if (!virtualMoney) {
      virtualMoney = new VirtualMoney({
        userId: req.user.id
      });
      await virtualMoney.save();
    }

    const result = await virtualMoney.buyStock(stockSymbol, quantity, price);

    if (result.success) {
      res.status(200).json({
        success: true,
        message: result.message,
        data: {
          balance: virtualMoney.balance,
          portfolio: virtualMoney.portfolio
        }
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message
      });
    }
  } catch (error) {
    console.error('Error buying stock:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Sell stock
router.post('/sell', verifyToken, async (req, res) => {
  try {
    const { stockSymbol, quantity, price } = req.body;

    // Validate input
    if (!stockSymbol || !quantity || !price) {
      return res.status(400).json({
        success: false,
        message: 'Stock symbol, quantity, and price are required'
      });
    }

    if (quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be greater than 0'
      });
    }

    if (price <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Price must be greater than 0'
      });
    }

    const virtualMoney = await VirtualMoney.findOne({ userId: req.user.id });

    if (!virtualMoney) {
      return res.status(404).json({
        success: false,
        message: 'Virtual money account not found'
      });
    }

    const result = await virtualMoney.sellStock(stockSymbol, quantity, price);

    if (result.success) {
      res.status(200).json({
        success: true,
        message: result.message,
        data: {
          balance: virtualMoney.balance,
          portfolio: virtualMoney.portfolio
        }
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message
      });
    }
  } catch (error) {
    console.error('Error selling stock:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Get portfolio
router.get('/portfolio', verifyToken, async (req, res) => {
  try {
    const virtualMoney = await VirtualMoney.findOne({ userId: req.user.id });

    if (!virtualMoney) {
      return res.status(404).json({
        success: false,
        message: 'Virtual money account not found'
      });
    }

    res.status(200).json({
      success: true,
      data: virtualMoney.portfolio
    });
  } catch (error) {
    console.error('Error getting portfolio:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

module.exports = router;
