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
  calculateOrderTotal,
  validateOrderBusinessRules,
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
  standardHeaders: true,
  legacyHeaders: false
});

// Idempotency store (in production, use Redis)
const idempotencyStore = new Map();

// Get all orders for the current user with pagination and filters
router.get('/all', provideDefaultUser, validateOrderQuery, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      type,
      orderType,
      stockSymbol,
      sort = '-createdAt'
    } = req.query;

    const skip = (page - 1) * limit;

    // Build query with filters
    const query = { userId: req.user.id };
    if (status) query.status = status;
    if (type) query.type = type;
    if (orderType) query.orderType = orderType;
    if (stockSymbol) query.stockSymbol = stockSymbol.toUpperCase();

    // Get total count for pagination
    const totalCount = await Order.countDocuments(query);
    const totalPages = Math.ceil(totalCount / limit);

    // Get orders with pagination
    const orders = await Order.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Calculate summary statistics
    const summary = await Order.aggregate([
      { $match: { userId: req.user.id } },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          filledOrders: {
            $sum: { $cond: [{ $eq: ['$status', 'FILLED'] }, 1, 0] }
          },
          openOrders: {
            $sum: { $cond: [{ $in: ['$status', ['PENDING', 'OPEN']] }, 1, 0] }
          },
          cancelledOrders: {
            $sum: { $cond: [{ $eq: ['$status', 'CANCELLED'] }, 1, 0] }
          },
          totalValue: {
            $sum: { $cond: [{ $eq: ['$status', 'FILLED'] }, '$total', 0] }
          }
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
      summary: summary[0] || {
        totalOrders: 0,
        filledOrders: 0,
        openOrders: 0,
        cancelledOrders: 0,
        totalValue: 0
      },
      filters: {
        status,
        type,
        orderType,
        stockSymbol,
        sort
      }
    });
  } catch (error) {
    console.error('Error getting orders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve orders',
      code: 'FETCH_ERROR',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Place a new order with comprehensive validation and business logic
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

    // Generate idempotency key if not provided
    if (!idempotencyKey) {
      idempotencyKey = generateIdempotencyKey();
    }

    // Check for duplicate idempotency key
    if (idempotencyStore.has(idempotencyKey)) {
      const existingResult = idempotencyStore.get(idempotencyKey);
      return res.status(200).json(existingResult);
    }

    // Normalize stock symbol
    stockSymbol = stockSymbol.toUpperCase();

    // Get user details
    const user = await User.findById(req.user.id);
    if (!user) {
      const errorResponse = {
        success: false,
        message: 'User not found',
        code: 'USER_NOT_FOUND'
      };
      idempotencyStore.set(idempotencyKey, errorResponse);
      return res.status(404).json(errorResponse);
    }

    // Get or create virtual money account
    let virtualMoney = await VirtualMoney.findOne({ userId: req.user.id });
    if (!virtualMoney) {
      virtualMoney = new VirtualMoney({
        userId: req.user.id,
        userEmail: user.email,
        balance: 10000
      });
      await virtualMoney.save();
    }

    // Validate business rules
    const orderData = { type, stockSymbol, stockName, quantity, price, orderType, limitPrice, idempotencyKey };
    const validation = await validateOrderBusinessRules(orderData, user, virtualMoney);

    if (!validation.success) {
      idempotencyStore.set(idempotencyKey, validation);
      return res.status(400).json(validation);
    }

    let result;

    // Execute based on order type
    if (orderType === 'MARKET') {
      result = await executeMarketOrder(orderData, user, virtualMoney);
    } else {
      result = await createLimitOrder(orderData, user);
    }

    // Store result in idempotency cache (expire after 1 hour)
    idempotencyStore.set(idempotencyKey, result);
    setTimeout(() => idempotencyStore.delete(idempotencyKey), 60 * 60 * 1000);

    if (result.success) {
      res.status(201).json(result);
    } else {
      res.status(400).json(result);
    }

  } catch (error) {
    console.error('Error placing order:', error);

    const errorResponse = {
      success: false,
      message: 'Order placement failed',
      code: 'PLACEMENT_ERROR',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    };

    // Store error in idempotency cache
    if (idempotencyKey) {
      idempotencyStore.set(idempotencyKey, errorResponse);
    }

    res.status(500).json(errorResponse);
  }
});

// Cancel an order with enhanced validation and notifications
router.post('/cancel/:orderId', provideDefaultUser, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { reason } = req.body;

    // Validate ObjectId format
    if (!orderId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order ID format',
        code: 'INVALID_ORDER_ID'
      });
    }

    const order = await Order.findOne({
      _id: orderId,
      userId: req.user.id
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found or does not belong to you',
        code: 'ORDER_NOT_FOUND'
      });
    }

    const result = await order.cancelOrder(reason);

    if (result.success) {
      // Send cancellation notification
      const user = await User.findById(req.user.id);
      if (user) {
        await sendOrderNotification(user, order, 'CANCELLED');
      }

      res.status(200).json({
        success: true,
        message: result.message,
        data: result.data
      });
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error cancelling order:', error);
    res.status(500).json({
      success: false,
      message: 'Order cancellation failed',
      code: 'CANCELLATION_ERROR',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get order by ID
router.get('/:orderId', provideDefaultUser, async (req, res) => {
  try {
    const { orderId } = req.params;

    // Validate ObjectId format
    if (!orderId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order ID format',
        code: 'INVALID_ORDER_ID'
      });
    }

    const order = await Order.findOne({
      _id: orderId,
      userId: req.user.id
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
        code: 'ORDER_NOT_FOUND'
      });
    }

    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Error getting order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve order',
      code: 'FETCH_ERROR',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;
