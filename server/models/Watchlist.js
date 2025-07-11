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
      },
      notes: {
        type: String,
        default: '',
        maxlength: 500 // Limit notes to 500 characters
      },
      targetPrice: {
        type: Number,
        default: null,
        min: 0 // Target price cannot be negative
      },
      alertEnabled: {
        type: Boolean,
        default: false
      }
    }
  ]
}, { timestamps: true });

// Method to add a stock to watchlist
watchlistSchema.methods.addStock = async function(symbol, name = '', notes = '', targetPrice = null, alertEnabled = false) {
  // Check if stock already exists in watchlist
  const stockExists = this.stocks.some(stock => stock.symbol === symbol);

  if (stockExists) {
    return { success: false, message: 'Stock already in watchlist' };
  }

  // Add stock to watchlist
  this.stocks.push({
    symbol,
    name,
    addedAt: new Date(),
    notes,
    targetPrice,
    alertEnabled
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

// Method to update stock notes
watchlistSchema.methods.updateStockNotes = async function(symbol, notes) {
  const stock = this.stocks.find(stock => stock.symbol === symbol);

  if (!stock) {
    return { success: false, message: 'Stock not found in watchlist' };
  }

  // Validate notes length
  if (notes && notes.length > 500) {
    return { success: false, message: 'Notes cannot exceed 500 characters' };
  }

  stock.notes = notes || '';
  await this.save();
  return { success: true, message: 'Stock notes updated successfully' };
};

// Method to update target price and alert settings
watchlistSchema.methods.updateTargetPrice = async function(symbol, targetPrice, alertEnabled = false) {
  const stock = this.stocks.find(stock => stock.symbol === symbol);

  if (!stock) {
    return { success: false, message: 'Stock not found in watchlist' };
  }

  // Validate target price
  if (targetPrice !== null && (isNaN(targetPrice) || targetPrice < 0)) {
    return { success: false, message: 'Target price must be a positive number or null' };
  }

  stock.targetPrice = targetPrice;
  stock.alertEnabled = alertEnabled && targetPrice !== null;
  await this.save();
  return { success: true, message: 'Target price updated successfully' };
};

// Method to bulk add stocks
watchlistSchema.methods.bulkAddStocks = async function(stocksArray) {
  const results = {
    added: [],
    skipped: [],
    errors: []
  };

  for (const stockData of stocksArray) {
    try {
      const { symbol, name = '', notes = '', targetPrice = null, alertEnabled = false } = stockData;

      if (!symbol) {
        results.errors.push({ symbol: 'unknown', error: 'Symbol is required' });
        continue;
      }

      // Check if stock already exists
      const stockExists = this.stocks.some(stock => stock.symbol === symbol.toUpperCase());

      if (stockExists) {
        results.skipped.push({ symbol: symbol.toUpperCase(), reason: 'Already in watchlist' });
        continue;
      }

      // Add stock to watchlist
      this.stocks.push({
        symbol: symbol.toUpperCase(),
        name,
        addedAt: new Date(),
        notes,
        targetPrice,
        alertEnabled: alertEnabled && targetPrice !== null
      });

      results.added.push({ symbol: symbol.toUpperCase(), name });
    } catch (error) {
      results.errors.push({ symbol: stockData.symbol || 'unknown', error: error.message });
    }
  }

  if (results.added.length > 0) {
    await this.save();
  }

  return {
    success: true,
    message: `Bulk operation completed: ${results.added.length} added, ${results.skipped.length} skipped, ${results.errors.length} errors`,
    results
  };
};

// Method to bulk remove stocks
watchlistSchema.methods.bulkRemoveStocks = async function(symbols) {
  const results = {
    removed: [],
    notFound: []
  };

  const initialLength = this.stocks.length;

  for (const symbol of symbols) {
    const symbolUpper = symbol.toUpperCase();
    const stockExists = this.stocks.some(stock => stock.symbol === symbolUpper);

    if (stockExists) {
      this.stocks = this.stocks.filter(stock => stock.symbol !== symbolUpper);
      results.removed.push(symbolUpper);
    } else {
      results.notFound.push(symbolUpper);
    }
  }

  if (results.removed.length > 0) {
    await this.save();
  }

  return {
    success: true,
    message: `Bulk removal completed: ${results.removed.length} removed, ${results.notFound.length} not found`,
    results
  };
};

const Watchlist = mongoose.model('Watchlist', watchlistSchema);

module.exports = Watchlist;
