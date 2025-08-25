const Order = require('../models/Order');
const VirtualMoney = require('../models/VirtualMoney');
const { validateSymbol } = require('../utils/watchlistUtils');

// Import notification system safely
let createSystemNotification;
try {
  const notificationRoutes = require('../routes/notificationRoutes');
  createSystemNotification = notificationRoutes.createSystemNotification;
} catch (error) {
  console.warn('Notification system not available:', error.message);
  createSystemNotification = null;
}

const calculateOrderTotal = (quantity, price, orderType = 'MARKET') => {
  try {
    if (!quantity || !price || quantity <= 0 || price <= 0) {
      throw new Error('Invalid quantity or price');
    }

    const subtotal = quantity * price;
    const tradingFees = calculateTradingFees(subtotal, orderType);
    const total = subtotal + tradingFees;

    return {
      success: true,
      data: {
        quantity,
        price: Number(price.toFixed(2)),
        subtotal: Number(subtotal.toFixed(2)),
        fees: Number(tradingFees.toFixed(2)),
        total: Number(total.toFixed(2))
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

const calculateTradingFees = (orderValue, orderType = 'MARKET') => {
  const feeRates = {
    MARKET: 0.001, // 0.1%
    LIMIT: 0.0005  // 0.05%
  };
  const rate = feeRates[orderType] || feeRates.MARKET;
  const fees = orderValue * rate;
  return Math.max(1, Math.min(100, fees));
};

const validateOrderBusinessRules = async (orderData, user, virtualMoney) => {
  try {
    const { type, quantity, price, orderType, limitPrice, stockSymbol } = orderData;
    
    const symbolValidation = validateSymbol(stockSymbol);
    if (!symbolValidation.valid) {
      return { success: false, message: symbolValidation.message, code: 'INVALID_SYMBOL' };
    }

    const priceToUse = orderType === 'LIMIT' ? limitPrice : price;
    const calculation = calculateOrderTotal(quantity, priceToUse, orderType);
    if (!calculation.success) {
      return calculation;
    }

    const { total } = calculation.data;

    if (type === 'BUY') {
      if (virtualMoney.balance < total) {
        return {
          success: false,
          message: 'Insufficient balance',
          code: 'INSUFFICIENT_BALANCE',
          data: { required: total, available: virtualMoney.balance }
        };
      }
    }

    if (type === 'SELL') {
      const holding = virtualMoney.portfolio.find(p => p.stockSymbol === stockSymbol);
      if (!holding || holding.quantity < quantity) {
        return {
          success: false,
          message: 'Insufficient shares',
          code: 'INSUFFICIENT_SHARES',
          data: { required: quantity, available: holding?.quantity || 0 }
        };
      }
    }

    return { success: true, data: { calculation: calculation.data } };
  } catch (error) {
    return {
      success: false,
      message: 'Order validation failed',
      code: 'VALIDATION_ERROR',
      error: error.message
    };
  }
};

const executeMarketOrder = async (orderData, user, virtualMoney) => {
  const validation = await validateOrderBusinessRules(orderData, user, virtualMoney);
  if (!validation.success) return validation;

  const { calculation } = validation.data;
  const order = new Order({
    userId: user._id,
    type: orderData.type,
    stockSymbol: orderData.stockSymbol,
    stockName: orderData.stockName,
    quantity: orderData.quantity,
    price: orderData.price,
    orderType: 'MARKET',
    status: 'FILLED',
    executionPrice: orderData.price,
    executedAt: new Date(),
    fees: calculation.fees,
    total: calculation.total
  });

  await order.save();
  return { success: true, message: 'Market order executed', data: { order } };
};

const createLimitOrder = async (orderData, user) => {
  const order = new Order({
    userId: user._id,
    type: orderData.type,
    stockSymbol: orderData.stockSymbol,
    stockName: orderData.stockName,
    quantity: orderData.quantity,
    price: orderData.limitPrice,
    orderType: 'LIMIT',
    status: 'PENDING'
  });

  await order.save();
  return { success: true, message: 'Limit order created', data: { order } };
};

const sendOrderNotification = async (user, order, status) => {
  if (createSystemNotification) {
    try {
      await createSystemNotification(user._id, {
        type: 'ORDER_UPDATE',
        title: `Order ${status}`,
        message: `Your ${order.type} order for ${order.stockSymbol} has been ${status.toLowerCase()}`,
        data: { orderId: order._id, status }
      });
    } catch (error) {
      console.warn('Failed to send order notification:', error.message);
    }
  }
};

const generateIdempotencyKey = () => {
  return `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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