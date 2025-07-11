/**
 * Order Helper Functions
 * Modular functions for order calculations, validation, and execution
 */

const Order = require('../models/Order');
const VirtualMoney = require('../models/VirtualMoney');

// Import notification system safely
let createSystemNotification;
try {
  const notificationRoutes = require('../routes/notificationRoutes');
  createSystemNotification = notificationRoutes.createSystemNotification;
} catch (error) {
  console.warn('Notification system not available:', error.message);
  createSystemNotification = null;
}

/**
 * Calculate order total with fees
 * @param {number} quantity - Number of shares
 * @param {number} price - Price per share
 * @param {string} orderType - MARKET or LIMIT
 * @param {number} fees - Trading fees (optional)
 * @returns {object} Calculation result
 */
const calculateOrderTotal = (quantity, price, orderType = 'MARKET', fees = 0) => {
  try {
    // Input validation
    if (!quantity || !price || quantity <= 0 || price <= 0) {
      throw new Error('Invalid quantity or price');
    }

    const subtotal = quantity * price;
    const tradingFees = fees || calculateTradingFees(subtotal, orderType);
    const total = subtotal + tradingFees;

    return {
      success: true,
      data: {
        quantity,
        price: Math.round(price * 100) / 100,
        subtotal: Math.round(subtotal * 100) / 100,
        fees: Math.round(tradingFees * 100) / 100,
        total: Math.round(total * 100) / 100
      }
    };
  } catch (error) {
    return {
      success: false,
      message: error.message,
      code: 'CALCULATION_ERROR'
    };
  }
};

/**
 * Calculate trading fees based on order value
 * @param {number} orderValue - Total order value
 * @param {string} orderType - MARKET or LIMIT
 * @returns {number} Trading fees
 */
const calculateTradingFees = (orderValue, orderType = 'MARKET') => {
  // Fee structure (can be made configurable)
  const feeRates = {
    MARKET: 0.001, // 0.1%
    LIMIT: 0.0005  // 0.05%
  };

  const rate = feeRates[orderType] || feeRates.MARKET;
  const fees = orderValue * rate;
  
  // Minimum fee of ₹1, maximum fee of ₹100
  return Math.max(1, Math.min(100, Math.round(fees * 100) / 100));
};

/**
 * Validate order business rules
 * @param {object} orderData - Order data to validate
 * @param {object} user - User object
 * @param {object} virtualMoney - VirtualMoney object
 * @returns {object} Validation result
 */
const validateOrderBusinessRules = async (orderData, user, virtualMoney) => {
  try {
    const { type, quantity, price, orderType, limitPrice, stockSymbol } = orderData;

    // Calculate total cost
    const priceToUse = orderType === 'LIMIT' ? limitPrice : price;
    const calculation = calculateOrderTotal(quantity, priceToUse, orderType);
    
    if (!calculation.success) {
      return calculation;
    }

    const { total } = calculation.data;

    // For BUY orders, check balance
    if (type === 'BUY') {
      if (virtualMoney.balance < total) {
        return {
          success: false,
          message: `Insufficient balance. Required: ₹${total.toLocaleString('en-IN')}, Available: ₹${virtualMoney.balance.toLocaleString('en-IN')}`,
          code: 'INSUFFICIENT_BALANCE',
          data: {
            required: total,
            available: virtualMoney.balance,
            shortfall: total - virtualMoney.balance
          }
        };
      }
    }

    // For SELL orders, check portfolio
    if (type === 'SELL') {
      const holding = virtualMoney.portfolio.find(p => p.stockSymbol === stockSymbol);
      
      if (!holding || holding.quantity < quantity) {
        return {
          success: false,
          message: `Insufficient shares. Required: ${quantity}, Available: ${holding ? holding.quantity : 0}`,
          code: 'INSUFFICIENT_SHARES',
          data: {
            required: quantity,
            available: holding ? holding.quantity : 0,
            shortfall: quantity - (holding ? holding.quantity : 0)
          }
        };
      }
    }

    // Check for duplicate orders (same stock, type, price within 5 minutes)
    const recentDuplicate = await Order.findOne({
      userId: user.id,
      stockSymbol,
      type,
      status: { $in: ['PENDING', 'OPEN'] },
      createdAt: { $gte: new Date(Date.now() - 5 * 60 * 1000) }, // Last 5 minutes
      $or: [
        { orderType: 'MARKET' },
        { orderType: 'LIMIT', limitPrice: priceToUse }
      ]
    });

    if (recentDuplicate) {
      return {
        success: false,
        message: 'Duplicate order detected. Please wait before placing a similar order.',
        code: 'DUPLICATE_ORDER',
        data: { duplicateOrderId: recentDuplicate._id }
      };
    }

    return {
      success: true,
      data: { calculation: calculation.data }
    };

  } catch (error) {
    return {
      success: false,
      message: 'Order validation failed',
      code: 'VALIDATION_ERROR',
      error: error.message
    };
  }
};

/**
 * Execute market order
 * @param {object} orderData - Order data
 * @param {object} user - User object
 * @param {object} virtualMoney - VirtualMoney object
 * @returns {object} Execution result
 */
const executeMarketOrder = async (orderData, user, virtualMoney) => {
  try {
    const { type, stockSymbol, stockName, quantity, price } = orderData;
    
    // Calculate fees
    const fees = calculateTradingFees(quantity * price, 'MARKET');
    
    let result;
    
    if (type === 'BUY') {
      result = await virtualMoney.buyStock(stockSymbol, quantity, price);
    } else {
      result = await virtualMoney.sellStock(stockSymbol, quantity, price);
    }

    if (!result.success) {
      return result;
    }

    // Create filled order
    const order = new Order({
      userId: user.id,
      userEmail: user.email,
      type,
      stockSymbol: stockSymbol.toUpperCase(),
      stockName,
      quantity,
      price,
      orderType: 'MARKET',
      status: 'FILLED',
      filledAt: new Date(),
      executionPrice: price,
      fees,
      total: (quantity * price) + fees,
      idempotencyKey: orderData.idempotencyKey
    });

    await order.save();

    // Send notification
    await sendOrderNotification(user, order, 'FILLED');

    return {
      success: true,
      message: `${type} order executed successfully`,
      data: {
        order,
        balance: virtualMoney.balance,
        portfolio: virtualMoney.portfolio
      }
    };

  } catch (error) {
    return {
      success: false,
      message: 'Order execution failed',
      code: 'EXECUTION_ERROR',
      error: error.message
    };
  }
};

/**
 * Create limit order
 * @param {object} orderData - Order data
 * @param {object} user - User object
 * @returns {object} Creation result
 */
const createLimitOrder = async (orderData, user) => {
  try {
    const { type, stockSymbol, stockName, quantity, price, limitPrice } = orderData;
    
    const fees = calculateTradingFees(quantity * limitPrice, 'LIMIT');
    
    const order = new Order({
      userId: user.id,
      userEmail: user.email,
      type,
      stockSymbol: stockSymbol.toUpperCase(),
      stockName,
      quantity,
      price,
      orderType: 'LIMIT',
      limitPrice,
      status: 'OPEN',
      fees,
      total: (quantity * limitPrice) + fees,
      idempotencyKey: orderData.idempotencyKey
    });

    await order.save();

    // Send notification
    await sendOrderNotification(user, order, 'PLACED');

    return {
      success: true,
      message: `${type} limit order placed successfully`,
      data: { order }
    };

  } catch (error) {
    return {
      success: false,
      message: 'Limit order creation failed',
      code: 'CREATION_ERROR',
      error: error.message
    };
  }
};

/**
 * Send order notification
 * @param {object} user - User object
 * @param {object} order - Order object
 * @param {string} event - Event type (PLACED, FILLED, CANCELLED)
 */
const sendOrderNotification = async (user, order, event) => {
  try {
    const eventMessages = {
      PLACED: {
        type: 'info',
        title: 'Order Placed',
        message: `Your ${order.type} order for ${order.quantity} shares of ${order.stockSymbol} has been placed successfully.`
      },
      FILLED: {
        type: 'success',
        title: 'Order Executed',
        message: `Your ${order.type} order for ${order.quantity} shares of ${order.stockSymbol} has been executed at ₹${order.executionPrice}.`
      },
      CANCELLED: {
        type: 'warning',
        title: 'Order Cancelled',
        message: `Your ${order.type} order for ${order.quantity} shares of ${order.stockSymbol} has been cancelled.`
      },
      REJECTED: {
        type: 'error',
        title: 'Order Rejected',
        message: `Your ${order.type} order for ${order.quantity} shares of ${order.stockSymbol} has been rejected. ${order.rejectionReason || ''}`
      }
    };

    const notification = eventMessages[event];
    if (notification && createSystemNotification) {
      await createSystemNotification(
        user.id,
        user.email,
        notification.type,
        notification.title,
        notification.message,
        `/orders/${order._id}`
      );
    }
  } catch (error) {
    console.error('Failed to send order notification:', error);
  }
};

/**
 * Generate idempotency key
 * @returns {string} UUID v4 string
 */
const generateIdempotencyKey = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

module.exports = {
  calculateOrderTotal,
  calculateTradingFees,
  validateOrderBusinessRules,
  executeMarketOrder,
  createLimitOrder,
  sendOrderNotification,
  generateIdempotencyKey
};
