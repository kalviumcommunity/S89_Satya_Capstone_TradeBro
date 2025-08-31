const express = require('express');
const router = express.Router();
const Trade = require('../models/Trade');
const { verifyToken } = require('../middleware/auth');

// Apply authentication to all routes
router.use(verifyToken);

// Get all trades for authenticated user
router.get('/', async (req, res) => {
  try {
    const trades = await Trade.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json({ success: true, trades });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Create a new trade
router.post('/', async (req, res) => {
  try {
    const trade = new Trade({
      userId: req.user.id,
      ticker: req.body.ticker,
      quantity: req.body.quantity,
      price: req.body.price,
      type: req.body.type,
    });
    
    const newTrade = await trade.save();
    res.status(201).json({ success: true, trade: newTrade });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Get a single trade
router.get('/:id', async (req, res) => {
  try {
    const trade = await Trade.findOne({ 
      _id: req.params.id, 
      userId: req.user.id 
    });
    
    if (!trade) {
      return res.status(404).json({ success: false, message: 'Trade not found' });
    }
    
    res.json({ success: true, trade });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Update a trade
router.patch('/:id', async (req, res) => {
  try {
    const trade = await Trade.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!trade) {
      return res.status(404).json({ success: false, message: 'Trade not found' });
    }

    res.json({ success: true, trade });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Delete a trade
router.delete('/:id', async (req, res) => {
  try {
    const trade = await Trade.findOneAndDelete({ 
      _id: req.params.id, 
      userId: req.user.id 
    });
    
    if (!trade) {
      return res.status(404).json({ success: false, message: 'Trade not found' });
    }
    
    res.json({ success: true, message: 'Trade deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;