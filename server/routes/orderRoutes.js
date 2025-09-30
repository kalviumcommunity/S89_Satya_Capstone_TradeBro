const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const VirtualMoney = require('../models/VirtualMoney');
const User = require('../models/User');
const { provideDefaultUser } = require('../middleware/defaultUser');
const { createRateLimit } = require('../middleware/rateLimiter');
const {
  validateOrderPlacement,
  validateOrderQuery
} = require('../middleware/validation');
const {
  executeMarketOrder,
  createLimitOrder,
  sendOrderNotification,
  generateIdempotencyKey
} = require('../utils/orderHelpers');

// Rate limiting for order placement
const orderRateLimit = createRateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // 10 orders per minute per user
  message: {
    success: false,
    message: 'Too many orders placed. Please try again later.',
    code: 'RATE_LIMIT_EXCEEDED',
    retryAfter: '1 minute'
  },
});

// Idempotency store (in production, use Redis)
const idempotencyStore = new Map();

// Get all orders for the current user with pagination and filters
router.get('/all', provideDefaultUser, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      type,
      stockSymbol,
      sort = '-createdAt'
    } = req.query;

    const skip = (page - 1) * limit;

    const query = { userId: req.user.id };
    if (status && status !== 'all') query.status = status.toUpperCase();
    if (type && type !== 'all') query.type = type.toUpperCase();
    if (stockSymbol) query.stockSymbol = stockSymbol.toUpperCase();

    const totalCount = await Order.countDocuments(query);
    const totalPages = Math.ceil(totalCount / limit);

    const orders = await Order.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const summary = await Order.aggregate([
      { $match: { userId: req.user.id } },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          filledOrders: { $sum: { $cond: [{ $eq: ['$status', 'FILLED'] }, 1, 0] } },
          openOrders: { $sum: { $cond: [{ $in: ['$status', ['PENDING', 'OPEN']] }, 1, 0] } },
          cancelledOrders: { $sum: { $cond: [{ $eq: ['$status', 'CANCELLED'] }, 1, 0] } },
          rejectedOrders: { $sum: { $cond: [{ $eq: ['$status', 'REJECTED'] }, 1, 0] } },
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: orders,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalCount,
        limit: parseInt(limit),
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      },
      summary: summary[0] || {}
    });
  } catch (error) {
    console.error('Error getting orders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve orders',
      error: error.message
    });
  }
});

// Place a new order
router.post('/place', provideDefaultUser, orderRateLimit, validateOrderPlacement, async (req, res) => {
  try {
    let {
      type,
      stockSymbol,
      stockName,
      quantity,
      price,
      orderType,
      limitPrice,
      idempotencyKey
    } = req.body;

    if (!idempotencyKey) {
      idempotencyKey = generateIdempotencyKey();
    }

    if (idempotencyStore.has(idempotencyKey)) {
      return res.status(200).json(idempotencyStore.get(idempotencyKey));
    }

    stockSymbol = stockSymbol.toUpperCase();

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    let virtualMoney = await VirtualMoney.findOne({ userId: req.user.id });
    if (!virtualMoney) {
      virtualMoney = new VirtualMoney({ userId: req.user.id, userEmail: user.email, balance: 10000 });
      await virtualMoney.save();
    }

    const orderData = { type, stockSymbol, stockName, quantity, price, orderType, limitPrice, idempotencyKey };
    let result;

    if (orderType === 'MARKET') {
      result = await executeMarketOrder(orderData, user, virtualMoney);
    } else {
      result = await createLimitOrder(orderData, user);
    }

    if (result.success) {
      idempotencyStore.set(idempotencyKey, result);
      setTimeout(() => idempotencyStore.delete(idempotencyKey), 60 * 60 * 1000);
      res.status(201).json(result);
    } else {
      idempotencyStore.set(idempotencyKey, result);
      res.status(400).json(result);
    }

  } catch (error) {
    console.error('Error placing order:', error);
    res.status(500).json({ success: false, message: 'Order placement failed', error: error.message });
  }
});

// Cancel an order
router.post('/cancel/:orderId', provideDefaultUser, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { reason } = req.body;

    const order = await Order.findOne({ _id: orderId, userId: req.user.id });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    
    // Check if the order is already cancelled
    if (order.status === 'CANCELLED' || order.status === 'REJECTED' || order.status === 'FILLED') {
      return res.status(400).json({ success: false, message: `Cannot cancel an order with status: ${order.status}` });
    }

    order.status = 'CANCELLED';
    order.cancelledAt = new Date();
    if (reason) order.notes = reason;
    await order.save();

    await sendOrderNotification(req.user, order, 'CANCELLED');

    res.status(200).json({ success: true, message: 'Order cancelled successfully', data: order });
  } catch (error) {
    console.error('Error cancelling order:', error);
    res.status(500).json({ success: false, message: 'Order cancellation failed', error: error.message });
  }
});

// Get order by ID
router.get('/:orderId', provideDefaultUser, async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findOne({ _id: orderId, userId: req.user.id }).lean();

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    res.status(200).json({ success: true, data: order });
  } catch (error) {
    console.error('Error getting order:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve order', error: error.message });
  }
});

module.exports = router;