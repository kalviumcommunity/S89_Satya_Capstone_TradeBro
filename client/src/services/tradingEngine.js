/**
 * TradeBro Trading Engine
 * Handles all trading operations, portfolio calculations, and position management
 */

class TradingEngine {
  constructor() {
    this.portfolio = new Map(); // symbol -> position data
    this.tradingHistory = [];
    this.virtualBalance = 1000000; // ₹10 Lakh starting balance
    this.listeners = new Set();
    this.loadPortfolioFromStorage();
  }

  /**
   * Load portfolio from localStorage
   */
  loadPortfolioFromStorage() {
    try {
      const savedPortfolio = localStorage.getItem('tradebro_portfolio');
      const savedBalance = localStorage.getItem('tradebro_balance');
      const savedHistory = localStorage.getItem('tradebro_history');

      if (savedPortfolio) {
        const portfolioData = JSON.parse(savedPortfolio);
        this.portfolio = new Map(Object.entries(portfolioData));
      }

      if (savedBalance) {
        this.virtualBalance = parseFloat(savedBalance);
      }

      if (savedHistory) {
        this.tradingHistory = JSON.parse(savedHistory);
      }
    } catch (error) {
      console.error('Error loading portfolio from storage:', error);
    }
  }

  /**
   * Save portfolio to localStorage
   */
  savePortfolioToStorage() {
    try {
      const portfolioObj = Object.fromEntries(this.portfolio);
      localStorage.setItem('tradebro_portfolio', JSON.stringify(portfolioObj));
      localStorage.setItem('tradebro_balance', this.virtualBalance.toString());
      localStorage.setItem('tradebro_history', JSON.stringify(this.tradingHistory));
    } catch (error) {
      console.error('Error saving portfolio to storage:', error);
    }
  }

  /**
   * Add event listener for portfolio updates
   */
  addListener(callback) {
    this.listeners.add(callback);
  }

  /**
   * Remove event listener
   */
  removeListener(callback) {
    this.listeners.delete(callback);
  }

  /**
   * Notify all listeners of portfolio changes
   */
  notifyListeners() {
    this.listeners.forEach(callback => {
      try {
        callback(this.getPortfolioSummary());
      } catch (error) {
        console.error('Error in portfolio listener:', error);
      }
    });
  }

  /**
   * Check if user has holdings in a specific stock
   */
  hasHoldings(symbol) {
    const position = this.portfolio.get(symbol);
    return position && position.quantity > 0;
  }

  /**
   * Get current position for a stock
   */
  getPosition(symbol) {
    return this.portfolio.get(symbol) || {
      symbol,
      quantity: 0,
      avgPrice: 0,
      totalInvested: 0,
      currentValue: 0,
      pnl: 0,
      pnlPercentage: 0,
      lastUpdated: new Date()
    };
  }

  /**
   * Calculate perfect trading metrics
   */
  calculateTradeMetrics(symbol, quantity, price, action) {
    const currentPosition = this.getPosition(symbol);
    const tradeValue = quantity * price;
    const brokerage = this.calculateBrokerage(tradeValue);
    const taxes = this.calculateTaxes(tradeValue, action);
    const totalCost = tradeValue + brokerage + taxes;

    let newPosition = { ...currentPosition };

    if (action === 'BUY') {
      // Calculate new average price using weighted average
      const totalQuantity = currentPosition.quantity + quantity;
      const totalInvestment = currentPosition.totalInvested + totalCost;
      
      newPosition = {
        ...currentPosition,
        quantity: totalQuantity,
        avgPrice: totalInvestment / totalQuantity,
        totalInvested: totalInvestment,
        lastUpdated: new Date()
      };
    } else if (action === 'SELL') {
      // Validate sufficient quantity
      if (currentPosition.quantity < quantity) {
        throw new Error(`Insufficient holdings. You have ${currentPosition.quantity} shares, trying to sell ${quantity}`);
      }

      const remainingQuantity = currentPosition.quantity - quantity;
      const soldValue = tradeValue - brokerage - taxes;
      const soldCost = (quantity / currentPosition.quantity) * currentPosition.totalInvested;
      const realizedPnL = soldValue - soldCost;

      newPosition = {
        ...currentPosition,
        quantity: remainingQuantity,
        totalInvested: remainingQuantity > 0 ? currentPosition.totalInvested - soldCost : 0,
        avgPrice: remainingQuantity > 0 ? currentPosition.avgPrice : 0,
        lastUpdated: new Date(),
        realizedPnL: (currentPosition.realizedPnL || 0) + realizedPnL
      };
    }

    return {
      newPosition,
      tradeValue,
      brokerage,
      taxes,
      totalCost: action === 'BUY' ? totalCost : tradeValue - brokerage - taxes,
      realizedPnL: action === 'SELL' ? (tradeValue - brokerage - taxes) - ((quantity / currentPosition.quantity) * currentPosition.totalInvested) : 0
    };
  }

  /**
   * Calculate brokerage (0.1% or ₹20, whichever is lower)
   */
  calculateBrokerage(tradeValue) {
    return Math.min(tradeValue * 0.001, 20);
  }

  /**
   * Calculate taxes and charges
   */
  calculateTaxes(tradeValue, action) {
    const stt = action === 'SELL' ? tradeValue * 0.00025 : 0; // STT on sell side
    const exchangeCharges = tradeValue * 0.0000345; // NSE charges
    const gst = (this.calculateBrokerage(tradeValue) + exchangeCharges) * 0.18; // 18% GST
    const sebiCharges = tradeValue * 0.000001; // SEBI charges
    const stampDuty = action === 'BUY' ? tradeValue * 0.00003 : 0; // Stamp duty on buy side

    return stt + exchangeCharges + gst + sebiCharges + stampDuty;
  }

  /**
   * Execute a trade
   */
  async executeTrade(symbol, quantity, price, action, orderType = 'MARKET') {
    try {
      // Validate inputs
      if (!symbol || !quantity || !price || !action) {
        throw new Error('Missing required trade parameters');
      }

      if (quantity <= 0 || price <= 0) {
        throw new Error('Quantity and price must be positive');
      }

      // Calculate trade metrics
      const metrics = this.calculateTradeMetrics(symbol, quantity, price, action);

      // Validate balance for buy orders
      if (action === 'BUY' && this.virtualBalance < metrics.totalCost) {
        throw new Error(`Insufficient balance. Required: ₹${metrics.totalCost.toFixed(2)}, Available: ₹${this.virtualBalance.toFixed(2)}`);
      }

      // Update portfolio
      this.portfolio.set(symbol, metrics.newPosition);

      // Update virtual balance
      if (action === 'BUY') {
        this.virtualBalance -= metrics.totalCost;
      } else {
        this.virtualBalance += metrics.totalCost;
      }

      // Add to trading history
      const trade = {
        id: Date.now().toString(),
        symbol,
        quantity,
        price,
        action,
        orderType,
        tradeValue: metrics.tradeValue,
        brokerage: metrics.brokerage,
        taxes: metrics.taxes,
        totalCost: metrics.totalCost,
        realizedPnL: metrics.realizedPnL,
        timestamp: new Date(),
        status: 'EXECUTED'
      };

      this.tradingHistory.unshift(trade);

      // Keep only last 1000 trades
      if (this.tradingHistory.length > 1000) {
        this.tradingHistory = this.tradingHistory.slice(0, 1000);
      }

      // Save to storage
      this.savePortfolioToStorage();

      // Notify listeners
      this.notifyListeners();

      console.log(`✅ Trade executed: ${action} ${quantity} ${symbol} @ ₹${price}`);

      return {
        success: true,
        trade,
        newPosition: metrics.newPosition,
        newBalance: this.virtualBalance
      };

    } catch (error) {
      console.error('❌ Trade execution failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get portfolio summary with perfect calculations
   */
  getPortfolioSummary() {
    let totalInvested = 0;
    let totalCurrentValue = 0;
    let totalRealizedPnL = 0;
    let totalUnrealizedPnL = 0;
    const positions = [];

    for (const [symbol, position] of this.portfolio) {
      if (position.quantity > 0) {
        totalInvested += position.totalInvested;
        totalRealizedPnL += position.realizedPnL || 0;
        
        // Current value will be updated with live prices
        const currentValue = position.currentValue || position.totalInvested;
        totalCurrentValue += currentValue;
        
        const unrealizedPnL = currentValue - position.totalInvested;
        totalUnrealizedPnL += unrealizedPnL;

        positions.push({
          ...position,
          currentValue,
          unrealizedPnL,
          unrealizedPnLPercentage: position.totalInvested > 0 ? (unrealizedPnL / position.totalInvested) * 100 : 0
        });
      }
    }

    const totalPnL = totalRealizedPnL + totalUnrealizedPnL;
    const totalPnLPercentage = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;
    const totalPortfolioValue = this.virtualBalance + totalCurrentValue;

    return {
      virtualBalance: this.virtualBalance,
      totalInvested,
      totalCurrentValue,
      totalRealizedPnL,
      totalUnrealizedPnL,
      totalPnL,
      totalPnLPercentage,
      totalPortfolioValue,
      positions,
      positionCount: positions.length,
      lastUpdated: new Date()
    };
  }

  /**
   * Update position with current market price
   */
  updatePositionPrice(symbol, currentPrice) {
    const position = this.portfolio.get(symbol);
    if (position && position.quantity > 0) {
      const currentValue = position.quantity * currentPrice;
      const updatedPosition = {
        ...position,
        currentPrice,
        currentValue,
        pnl: currentValue - position.totalInvested,
        pnlPercentage: position.totalInvested > 0 ? ((currentValue - position.totalInvested) / position.totalInvested) * 100 : 0,
        lastUpdated: new Date()
      };

      this.portfolio.set(symbol, updatedPosition);
      this.notifyListeners();
    }
  }

  /**
   * Get trading history
   */
  getTradingHistory(limit = 50) {
    return this.tradingHistory.slice(0, limit);
  }

  /**
   * Clear all positions (for demo reset)
   */
  clearPortfolio() {
    this.portfolio.clear();
    this.tradingHistory = [];
    this.virtualBalance = 1000000;
    this.savePortfolioToStorage();
    this.notifyListeners();
  }

  /**
   * Get available trading actions for a stock
   */
  getAvailableActions(symbol) {
    const hasPosition = this.hasHoldings(symbol);
    const position = this.getPosition(symbol);
    
    return {
      canBuy: this.virtualBalance > 0,
      canSell: hasPosition && position.quantity > 0,
      maxSellQuantity: hasPosition ? position.quantity : 0,
      currentHoldings: position.quantity,
      avgPrice: position.avgPrice
    };
  }
}

// Export singleton instance
export default new TradingEngine();
