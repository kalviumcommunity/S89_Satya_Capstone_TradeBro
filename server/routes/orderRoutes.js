const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const VirtualMoney = require('../models/VirtualMoney');
const User = require('../models/User');
const { verifyToken } = require('../middleware/auth');
const axios = require('axios');

// Get all orders for the current user
router.get('/all', verifyToken, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user.id })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: orders
    });
  } catch (error) {
    console.error('Error getting orders:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Place a new order
router.post('/place', verifyToken, async (req, res) => {
  try {
    const { 
      type, 
      stockSymbol, 
      stockName, 
      quantity, 
      price, 
      orderType, 
      limitPrice 
    } = req.body;

    // Validate input
    if (!type || !stockSymbol || !stockName || !quantity || !price || !orderType) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
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

    if (orderType === 'LIMIT' && (!limitPrice || limitPrice <= 0)) {
      return res.status(400).json({
        success: false,
        message: 'Limit price is required for limit orders and must be greater than 0'
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

    // For market orders, execute immediately
    if (orderType === 'MARKET') {
      // Get virtual money account
      let virtualMoney = await VirtualMoney.findOne({ userId: req.user.id });

      if (!virtualMoney) {
        virtualMoney = new VirtualMoney({
          userId: req.user.id,
          userEmail: user.email,
          balance: 10000
        });
        await virtualMoney.save();
      }

      // Calculate total
      const total = quantity * price;

      // For buy orders, check if user has enough balance
      if (type === 'BUY') {
        if (virtualMoney.balance < total) {
          return res.status(400).json({
            success: false,
            message: `Insufficient balance. You need ${total} coins but have ${virtualMoney.balance} coins.`
          });
        }

        // Execute buy
        const result = await virtualMoney.buyStock(stockSymbol, quantity, price);
        
        if (!result.success) {
          return res.status(400).json({
            success: false,
            message: result.message
          });
        }
      } else if (type === 'SELL') {
        // For sell orders, check if user has enough shares
        const result = await virtualMoney.sellStock(stockSymbol, quantity, price);
        
        if (!result.success) {
          return res.status(400).json({
            success: false,
            message: result.message
          });
        }
      }

      // Create and save the order as FILLED
      const order = new Order({
        userId: req.user.id,
        userEmail: user.email,
        type,
        stockSymbol,
        stockName,
        quantity,
        price,
        orderType,
        limitPrice: orderType === 'LIMIT' ? limitPrice : null,
        status: 'FILLED',
        filledAt: new Date(),
        total: quantity * price
      });

      await order.save();

      return res.status(201).json({
        success: true,
        message: `${type === 'BUY' ? 'Buy' : 'Sell'} order executed successfully`,
        data: {
          order,
          balance: virtualMoney.balance,
          portfolio: virtualMoney.portfolio
        }
      });
    } else {
      // For limit orders, just create the order
      const order = new Order({
        userId: req.user.id,
        userEmail: user.email,
        type,
        stockSymbol,
        stockName,
        quantity,
        price,
        orderType,
        limitPrice,
        total: quantity * price
      });

      await order.save();

      return res.status(201).json({
        success: true,
        message: `${type === 'BUY' ? 'Buy' : 'Sell'} limit order placed successfully`,
        data: { order }
      });
    }
  } catch (error) {
    console.error('Error placing order:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Cancel an order
router.post('/cancel/:orderId', verifyToken, async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findOne({ 
      _id: orderId,
      userId: req.user.id
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    const result = await order.cancelOrder();

    if (result.success) {
      res.status(200).json({
        success: true,
        message: result.message,
        data: { order }
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message
      });
    }
  } catch (error) {
    console.error('Error cancelling order:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

module.exports = router;
