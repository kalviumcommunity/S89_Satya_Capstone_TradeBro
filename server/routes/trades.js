const express = require('express');
const router = express.Router();
const Trade = require('../models/Trade');
const authenticateToken = require('../middleware/tradeAuth');

// Apply authentication to all routes
router.use(authenticateToken);

// Get all trades for authenticated user
router.get('/', async (req, res) => {
  try {
    const trades = await Trade.find({ userId: req.user.userId });
    res.json(trades);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create a new trade
router.post('/', async (req, res) => {
  const trade = new Trade({
    userId: req.user.userId,
    ticker: req.body.ticker,
    quantity: req.body.quantity,
    price: req.body.price,
    type: req.body.type,
  });
  
  try {
    const newTrade = await trade.save();
    res.status(201).json(newTrade);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Get a single trade
router.get('/:id', async (req, res) => {
  try {
    const trade = await Trade.findOne({ 
      _id: req.params.id, 
      userId: req.user.userId 
    });
    
    if (!trade) {
      return res.status(404).json({ message: 'Trade not found' });
    }
    
    res.json(trade);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update a trade
router.patch('/:id', async (req, res) => {
  try {
    const trade = await Trade.findOne({ 
      _id: req.params.id, 
      userId: req.user.userId 
    });
    
    if (!trade) {
      return res.status(404).json({ message: 'Trade not found' });
    }

    // Update fields
    Object.keys(req.body).forEach(key => {
      if (key !== 'userId' && req.body[key] !== undefined) {
        trade[key] = req.body[key];
      }
    });

    const updatedTrade = await trade.save();
    res.json(updatedTrade);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete a trade
router.delete('/:id', async (req, res) => {
  try {
    const trade = await Trade.findOneAndDelete({ 
      _id: req.params.id, 
      userId: req.user.userId 
    });
    
    if (!trade) {
      return res.status(404).json({ message: 'Trade not found' });
    }
    
    res.json({ message: 'Trade deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;