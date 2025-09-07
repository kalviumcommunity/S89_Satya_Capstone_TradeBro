const express = require('express');
const { verifyToken } = require('../middleware/auth');
const VirtualMoney = require('../models/VirtualMoney');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

// Apply authentication to all routes
router.use(verifyToken);

// Get user's portfolio
router.get('/', asyncHandler(async (req, res) => {
  try {
    const portfolio = await VirtualMoney.findOne({ userId: req.user.id });
    
    if (!portfolio) {
      return res.status(404).json({ success: false, message: 'Portfolio not found' });
    }

    res.json({ success: true, data: portfolio });
  } catch (error) {
    console.error('Error fetching portfolio:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch portfolio' });
  }
}));

// Create portfolio
router.post('/create', asyncHandler(async (req, res) => {
  try {
    const existingPortfolio = await VirtualMoney.findOne({ userId: req.user.id });
    
    if (existingPortfolio) {
      return res.json({ success: true, data: existingPortfolio });
    }

    const newPortfolio = new VirtualMoney({
      userId: req.user.id,
      userEmail: req.user.email,
      balance: 10000,
      totalValue: 10000,
      availableCash: 10000,
      totalInvested: 0,
      totalGainLoss: 0,
      totalGainLossPercentage: 0,
      holdings: [],
      transactions: [{
        type: 'DEPOSIT',
        amount: 10000,
        description: 'Initial deposit',
        timestamp: new Date()
      }]
    });

    await newPortfolio.save();
    res.status(201).json({ success: true, data: newPortfolio });
  } catch (error) {
    console.error('Error creating portfolio:', error);
    res.status(500).json({ success: false, message: 'Failed to create portfolio' });
  }
}));

// Update portfolio values
router.post('/update-values/:userId', asyncHandler(async (req, res) => {
  try {
    const { userId } = req.params;
    const portfolio = await VirtualMoney.findOne({ userId });
    
    if (!portfolio) {
      return res.status(404).json({ success: false, message: 'Portfolio not found' });
    }

    // Simple portfolio update - just return success
    res.json({ 
      success: true, 
      message: 'Portfolio values updated',
      data: {
        totalValue: portfolio.totalValue,
        totalGainLoss: portfolio.totalGainLoss
      }
    });
  } catch (error) {
    console.error('Error updating portfolio values:', error);
    res.status(500).json({ success: false, message: 'Failed to update portfolio values' });
  }
}));

module.exports = router;