const express = require('express');
const { verifyToken } = require('../utils/tokenUtils');
const VirtualMoney = require('../models/VirtualMoney');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

// Middleware to verify JWT token
const authenticateToken = asyncHandler(async (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ success: false, message: 'Access denied' });
  }

  try {
    const decoded = verifyToken(token);
    req.userId = decoded.id;
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: 'Invalid token' });
  }
});

// Get portfolio
router.get('/:userId', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const portfolio = await VirtualMoney.findOne({ userId: req.params.userId });
    
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
router.post('/create', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const existingPortfolio = await VirtualMoney.findOne({ userId: req.userId });
    
    if (existingPortfolio) {
      return res.json({ success: true, data: existingPortfolio });
    }

    const newPortfolio = new VirtualMoney({
      userId: req.userId,
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

module.exports = router;