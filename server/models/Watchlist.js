const mongoose = require('mongoose');

const watchlistSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userEmail: {
    type: String,
    required: true
  },
  stocks: [
    {
      symbol: {
        type: String,
        required: true
      },
      name: {
        type: String,
        default: ''
      },
      addedAt: {
        type: Date,
        default: Date.now
      }
    }
  ]
}, { timestamps: true });

// Method to add a stock to watchlist
watchlistSchema.methods.addStock = async function(symbol, name = '') {
  // Check if stock already exists in watchlist
  const stockExists = this.stocks.some(stock => stock.symbol === symbol);
  
  if (stockExists) {
    return { success: false, message: 'Stock already in watchlist' };
  }
  
  // Add stock to watchlist
  this.stocks.push({
    symbol,
    name,
    addedAt: new Date()
  });
  
  await this.save();
  return { success: true, message: 'Stock added to watchlist' };
};

// Method to remove a stock from watchlist
watchlistSchema.methods.removeStock = async function(symbol) {
  const initialLength = this.stocks.length;
  
  // Remove stock from watchlist
  this.stocks = this.stocks.filter(stock => stock.symbol !== symbol);
  
  if (this.stocks.length === initialLength) {
    return { success: false, message: 'Stock not found in watchlist' };
  }
  
  await this.save();
  return { success: true, message: 'Stock removed from watchlist' };
};

const Watchlist = mongoose.model('Watchlist', watchlistSchema);

module.exports = Watchlist;
