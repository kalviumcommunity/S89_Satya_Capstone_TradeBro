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
    match: /^[A-Z0-9.-]{1,10}$/,
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
    set: (value) => value ? Number(value.toFixed(2)) : null
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
    set: (value) => value ? Number(value.toFixed(2)) : null
  },
  status: {
    type: String,
    enum: ['PENDING', 'OPEN', 'FILLED', 'CANCELLED', 'REJECTED'],
    default: 'PENDING',
    index: true
  },
  filledAt: { type: Date, default: null },
  cancelledAt: { type: Date, default: null },
  rejectedAt: { type: Date, default: null },
  rejectionReason: { type: String, default: null },
  total: {
    type: Number,
    required: true,
    min: 0,
    set: (value) => Number(value.toFixed(2))
  },
  executionPrice: {
    type: Number,
    default: null,
    set: (value) => value ? Number(value.toFixed(2)) : null
  },
  idempotencyKey: {
    type: String,
    unique: true,
    sparse: true,
    index: true
  },
  fees: {
    type: Number,
    default: 0,
    min: 0,
    set: (value) => Number(value.toFixed(2))
  },
  notes: { type: String, maxlength: 500, default: null }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

orderSchema.index({ userId: 1, status: 1, createdAt: -1 });
orderSchema.index({ userId: 1, stockSymbol: 1, createdAt: -1 });
orderSchema.index({ userId: 1, type: 1, createdAt: -1 });
orderSchema.index({ status: 1, orderType: 1, createdAt: 1 });
orderSchema.index({ stockSymbol: 1, status: 1, orderType: 1 });

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;