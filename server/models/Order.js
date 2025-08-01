const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  userEmail: {
    type: String,
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['BUY', 'SELL'],
    required: true,
    index: true
  },
  stockSymbol: {
    type: String,
    required: true,
    uppercase: true,
    match: /^[A-Z0-9]{1,10}$/,
    index: true
  },
  stockName: {
    type: String,
    required: true,
    maxlength: 100,
    trim: true
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, 'Quantity must be at least 1'],
    max: [10000, 'Quantity cannot exceed 10,000'],
    validate: {
      validator: Number.isInteger,
      message: 'Quantity must be a whole number'
    }
  },
  price: {
    type: Number,
    required: true,
    min: [0.01, 'Price must be at least ₹0.01'],
    max: [1000000, 'Price cannot exceed ₹10,00,000'],
    set: function(value) {
      return Math.round(value * 100) / 100; // Round to 2 decimal places
    }
  },
  orderType: {
    type: String,
    enum: ['MARKET', 'LIMIT'],
    required: true,
    index: true
  },
  limitPrice: {
    type: Number,
    min: [0.01, 'Limit price must be at least ₹0.01'],
    max: [1000000, 'Limit price cannot exceed ₹10,00,000'],
    default: null,
    set: function(value) {
      return value ? Math.round(value * 100) / 100 : null;
    }
  },
  status: {
    type: String,
    enum: ['PENDING', 'OPEN', 'FILLED', 'CANCELLED', 'REJECTED'],
    default: 'PENDING',
    index: true
  },
  filledAt: {
    type: Date,
    default: null
  },
  cancelledAt: {
    type: Date,
    default: null
  },
  rejectedAt: {
    type: Date,
    default: null
  },
  rejectionReason: {
    type: String,
    default: null
  },
  total: {
    type: Number,
    required: true,
    min: 0,
    set: function(value) {
      return Math.round(value * 100) / 100;
    }
  },
  executionPrice: {
    type: Number,
    default: null,
    set: function(value) {
      return value ? Math.round(value * 100) / 100 : null;
    }
  },
  idempotencyKey: {
    type: String,
    unique: true,
    sparse: true, // Allow null values but ensure uniqueness when present
    index: true
  },
  fees: {
    type: Number,
    default: 0,
    min: 0
  },
  notes: {
    type: String,
    maxlength: 500,
    default: null
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound indexes for better query performance
orderSchema.index({ userId: 1, status: 1, createdAt: -1 });
orderSchema.index({ userId: 1, stockSymbol: 1, createdAt: -1 });
orderSchema.index({ userId: 1, type: 1, createdAt: -1 });
orderSchema.index({ status: 1, orderType: 1, createdAt: 1 }); // For order processing
orderSchema.index({ stockSymbol: 1, status: 1, orderType: 1 }); // For market data

// Virtual fields
orderSchema.virtual('isActive').get(function() {
  return ['PENDING', 'OPEN'].includes(this.status);
});

orderSchema.virtual('isExecuted').get(function() {
  return this.status === 'FILLED';
});

orderSchema.virtual('isCancellable').get(function() {
  return ['PENDING', 'OPEN'].includes(this.status);
});

orderSchema.virtual('actualTotal').get(function() {
  return this.executionPrice ? (this.quantity * this.executionPrice) : this.total;
});

orderSchema.virtual('profitLoss').get(function() {
  if (!this.executionPrice) return 0;
  const actualTotal = this.quantity * this.executionPrice;
  return this.type === 'BUY' ? (this.total - actualTotal) : (actualTotal - this.total);
});

// Pre-save middleware for validation
orderSchema.pre('save', function(next) {
  // Validate limit price for LIMIT orders
  if (this.orderType === 'LIMIT' && !this.limitPrice) {
    return next(new Error('Limit price is required for LIMIT orders'));
  }

  // Ensure limit price is not set for MARKET orders
  if (this.orderType === 'MARKET' && this.limitPrice) {
    this.limitPrice = null;
  }

  // Calculate total if not set
  if (!this.total) {
    const priceToUse = this.orderType === 'LIMIT' ? this.limitPrice : this.price;
    this.total = this.quantity * priceToUse;
  }

  // Set execution price for filled orders
  if (this.status === 'FILLED' && !this.executionPrice) {
    this.executionPrice = this.price;
  }

  next();
});

// Enhanced method to cancel an order
orderSchema.methods.cancelOrder = async function(reason = null) {
  if (!this.isCancellable) {
    return {
      success: false,
      message: `Cannot cancel order with status: ${this.status}. Only PENDING or OPEN orders can be cancelled.`,
      code: 'ORDER_NOT_CANCELLABLE'
    };
  }

  this.status = 'CANCELLED';
  this.cancelledAt = new Date();
  if (reason) {
    this.notes = reason;
  }

  await this.save();

  return {
    success: true,
    message: 'Order cancelled successfully',
    data: this
  };
};

// Enhanced method to fill an order
orderSchema.methods.fillOrder = async function(executionPrice, fees = 0) {
  if (!['PENDING', 'OPEN'].includes(this.status)) {
    return {
      success: false,
      message: `Cannot fill order with status: ${this.status}`,
      code: 'ORDER_NOT_FILLABLE'
    };
  }

  // Validate execution price
  if (!executionPrice || executionPrice <= 0) {
    return {
      success: false,
      message: 'Invalid execution price',
      code: 'INVALID_EXECUTION_PRICE'
    };
  }

  // For limit orders, check if the price conditions are met
  if (this.orderType === 'LIMIT') {
    if (this.type === 'BUY' && executionPrice > this.limitPrice) {
      return {
        success: false,
        message: `Execution price ₹${executionPrice} exceeds limit price ₹${this.limitPrice} for buy order`,
        code: 'PRICE_ABOVE_LIMIT'
      };
    }
    if (this.type === 'SELL' && executionPrice < this.limitPrice) {
      return {
        success: false,
        message: `Execution price ₹${executionPrice} is below limit price ₹${this.limitPrice} for sell order`,
        code: 'PRICE_BELOW_LIMIT'
      };
    }
  }

  this.status = 'FILLED';
  this.filledAt = new Date();
  this.executionPrice = executionPrice;
  this.fees = fees || 0;
  this.total = (this.quantity * executionPrice) + this.fees;

  await this.save();

  return {
    success: true,
    message: 'Order filled successfully',
    data: this
  };
};

// Method to reject an order
orderSchema.methods.rejectOrder = async function(reason) {
  if (!['PENDING', 'OPEN'].includes(this.status)) {
    return {
      success: false,
      message: `Cannot reject order with status: ${this.status}`,
      code: 'ORDER_NOT_REJECTABLE'
    };
  }

  this.status = 'REJECTED';
  this.rejectedAt = new Date();
  this.rejectionReason = reason;

  await this.save();

  return {
    success: true,
    message: 'Order rejected',
    data: this
  };
};

// Static method to find orders with filters
orderSchema.statics.findWithFilters = function(userId, filters = {}) {
  const query = { userId };

  if (filters.status) query.status = filters.status;
  if (filters.type) query.type = filters.type;
  if (filters.orderType) query.orderType = filters.orderType;
  if (filters.stockSymbol) query.stockSymbol = filters.stockSymbol.toUpperCase();

  return this.find(query);
};

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
