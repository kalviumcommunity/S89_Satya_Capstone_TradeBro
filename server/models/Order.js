const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userEmail: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['BUY', 'SELL'],
    required: true
  },
  stockSymbol: {
    type: String,
    required: true
  },
  stockName: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  orderType: {
    type: String,
    enum: ['MARKET', 'LIMIT'],
    required: true
  },
  limitPrice: {
    type: Number,
    min: 0,
    default: null
  },
  status: {
    type: String,
    enum: ['OPEN', 'FILLED', 'CANCELLED'],
    default: 'OPEN'
  },
  filledAt: {
    type: Date,
    default: null
  },
  cancelledAt: {
    type: Date,
    default: null
  },
  total: {
    type: Number,
    required: true
  }
}, { timestamps: true });

// Method to cancel an order
orderSchema.methods.cancelOrder = async function() {
  if (this.status !== 'OPEN') {
    return { success: false, message: 'Only open orders can be cancelled' };
  }

  this.status = 'CANCELLED';
  this.cancelledAt = new Date();
  await this.save();
  
  return { success: true, message: 'Order cancelled successfully' };
};

// Method to fill an order
orderSchema.methods.fillOrder = async function(executionPrice) {
  if (this.status !== 'OPEN') {
    return { success: false, message: 'Only open orders can be filled' };
  }

  // For limit orders, check if the price conditions are met
  if (this.orderType === 'LIMIT') {
    if (this.type === 'BUY' && executionPrice > this.limitPrice) {
      return { success: false, message: 'Execution price exceeds limit price for buy order' };
    }
    if (this.type === 'SELL' && executionPrice < this.limitPrice) {
      return { success: false, message: 'Execution price is below limit price for sell order' };
    }
  }

  this.status = 'FILLED';
  this.filledAt = new Date();
  this.price = executionPrice;
  this.total = this.quantity * executionPrice;
  await this.save();
  
  return { success: true, message: 'Order filled successfully' };
};

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
