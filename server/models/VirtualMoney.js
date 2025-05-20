const mongoose = require('mongoose');

const virtualMoneySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userEmail: {
    type: String,
    ref: 'User',
    required: true
  },
  balance: {
    type: Number,
    default: 10000,
    required: true
  },
  lastLoginReward: {
    type: Date,
    default: null
  },
  transactions: [
    {
      type: {
        type: String,
        enum: ['DEPOSIT', 'BUY', 'SELL', 'LOGIN_REWARD'],
        required: true
      },
      amount: {
        type: Number,
        required: true
      },
      stockSymbol: {
        type: String,
        default: null
      },
      stockQuantity: {
        type: Number,
        default: null
      },
      stockPrice: {
        type: Number,
        default: null
      },
      timestamp: {
        type: Date,
        default: Date.now
      },
      description: {
        type: String,
        default: ''
      }
    }
  ],
  portfolio: [
    {
      stockSymbol: {
        type: String,
        required: true
      },
      quantity: {
        type: Number,
        required: true,
        min: 0
      },
      averageBuyPrice: {
        type: Number,
        required: true
      },
      lastUpdated: {
        type: Date,
        default: Date.now
      }
    }
  ]
}, { timestamps: true });

// No longer needed - implemented directly in route

// Method to buy stock
virtualMoneySchema.methods.buyStock = async function(stockSymbol, quantity, price) {
  const totalCost = quantity * price;

  // Check if user has enough balance
  if (this.balance < totalCost) {
    return { success: false, message: 'Insufficient balance' };
  }

  // Update balance
  this.balance -= totalCost;

  // Add transaction record
  this.transactions.push({
    type: 'BUY',
    amount: -totalCost,
    stockSymbol,
    stockQuantity: quantity,
    stockPrice: price,
    description: `Bought ${quantity} shares of ${stockSymbol} at ₹${price.toLocaleString('en-IN')}`
  });

  // Update portfolio
  const existingStock = this.portfolio.find(item => item.stockSymbol === stockSymbol);

  if (existingStock) {
    // Calculate new average buy price
    const totalShares = existingStock.quantity + quantity;
    const totalValue = (existingStock.quantity * existingStock.averageBuyPrice) + (quantity * price);
    existingStock.averageBuyPrice = totalValue / totalShares;
    existingStock.quantity = totalShares;
    existingStock.lastUpdated = new Date();
  } else {
    // Add new stock to portfolio
    this.portfolio.push({
      stockSymbol,
      quantity,
      averageBuyPrice: price,
      lastUpdated: new Date()
    });
  }

  await this.save();
  return { success: true, message: 'Stock purchased successfully' };
};

// Method to sell stock
virtualMoneySchema.methods.sellStock = async function(stockSymbol, quantity, price) {
  // Find stock in portfolio
  const stockIndex = this.portfolio.findIndex(item => item.stockSymbol === stockSymbol);

  if (stockIndex === -1) {
    return { success: false, message: 'Stock not found in portfolio' };
  }

  const stock = this.portfolio[stockIndex];

  // Check if user has enough shares
  if (stock.quantity < quantity) {
    return { success: false, message: 'Insufficient shares' };
  }

  // Calculate sale amount
  const saleAmount = quantity * price;

  // Update balance
  this.balance += saleAmount;

  // Add transaction record
  this.transactions.push({
    type: 'SELL',
    amount: saleAmount,
    stockSymbol,
    stockQuantity: quantity,
    stockPrice: price,
    description: `Sold ${quantity} shares of ${stockSymbol} at ₹${price.toLocaleString('en-IN')}`
  });

  // Update portfolio
  if (stock.quantity === quantity) {
    // Remove stock from portfolio if all shares are sold
    this.portfolio.splice(stockIndex, 1);
  } else {
    // Update quantity
    stock.quantity -= quantity;
    stock.lastUpdated = new Date();
  }

  await this.save();
  return { success: true, message: 'Stock sold successfully' };
};

const VirtualMoney = mongoose.model('VirtualMoney', virtualMoneySchema);

module.exports = VirtualMoney;
