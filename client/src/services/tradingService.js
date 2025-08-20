/**
 * TradeBro Trading Engine
 * Handles all trading operations, portfolio calculations, and position management
 */
class TradingEngine {
  
  /**
   * Create notification for trade execution
   */
  createTradeNotification(symbol, quantity, price, action, totalCost) {
    try {
      // Create notification object
      const notification = {
        id: `trade_${Date.now()}`,
        title: 'Trade Executed Successfully',
        message: `Your ${action.toLowerCase()} order for ${quantity} shares of ${symbol} has been executed at ₹${price.toFixed(2)}`,
        type: 'success',
        read: false,
        createdAt: new Date().toISOString(),
        data: { symbol, quantity, price, action, totalCost }
      };
      
      // Store notification locally
      const existingNotifications = JSON.parse(localStorage.getItem('tradebro_notifications') || '[]');
      existingNotifications.unshift(notification);
      
      // Keep only last 50 notifications
      if (existingNotifications.length > 50) {
        existingNotifications.splice(50);
      }
      
      localStorage.setItem('tradebro_notifications', JSON.stringify(existingNotifications));
      
      // Dispatch custom event for notification components
      window.dispatchEvent(new CustomEvent('newNotification', {
        detail: notification
      }));
      
      console.log('📢 Trade notification created:', notification.message);
    } catch (error) {
      console.error('Failed to create trade notification:', error);
    }
  }
  
  /**
   * Create notification for daily reward
   */
  createRewardNotification(amount, streak) {
    try {
      const notification = {
        id: `reward_${Date.now()}`,
        title: 'Daily Reward Claimed!',
        message: `You've earned ₹${amount} daily bonus! Login streak: ${streak} days`,
        type: 'success',
        read: false,
        createdAt: new Date().toISOString(),
        data: { amount, streak, type: 'DAILY_REWARD' }
      };
      
      // Store notification locally
      const existingNotifications = JSON.parse(localStorage.getItem('tradebro_notifications') || '[]');
      existingNotifications.unshift(notification);
      
      // Keep only last 50 notifications
      if (existingNotifications.length > 50) {
        existingNotifications.splice(50);
      }
      
      localStorage.setItem('tradebro_notifications', JSON.stringify(existingNotifications));
      
      // Dispatch custom event for notification components
      window.dispatchEvent(new CustomEvent('newNotification', {
        detail: notification
      }));
      
      console.log('🎁 Daily reward notification created:', notification.message);
    } catch (error) {
      console.error('Failed to create reward notification:', error);
    }
  }
  constructor() {
    this.portfolio = new Map(); // symbol -> position data
    this.tradingHistory = [];
    this.virtualBalance = 10000; // ₹10,000 starting balance
    this.listeners = new Set();
    this.dailyRewards = {
      lastLoginDate: null,
      lastClaimDate: null,
      totalRewards: 0,
      loginStreak: 0
    };
    this.loadPortfolioFromStorage();
    this.checkDailyLogin();
  }

  /**
   * Load portfolio from localStorage
   */
  loadPortfolioFromStorage() {
    try {
      const savedPortfolio = localStorage.getItem('tradebro_portfolio');
      const savedBalance = localStorage.getItem('tradebro_balance');
      const savedHistory = localStorage.getItem('tradebro_history');
      const savedRewards = localStorage.getItem('tradebro_daily_rewards');

      if (savedPortfolio) {
        const portfolioData = JSON.parse(savedPortfolio);
        this.portfolio = new Map(Object.entries(portfolioData));
      }

      if (savedBalance) {
        this.virtualBalance = parseFloat(savedBalance);
        console.log('💰 Loaded balance from localStorage:', this.virtualBalance);
      } else {
        // Set initial balance for new users
        this.virtualBalance = 10000;
        console.log('💰 Using default balance for new user:', this.virtualBalance);
      }

      if (savedHistory) {
        this.tradingHistory = JSON.parse(savedHistory);
      }

      if (savedRewards) {
        this.dailyRewards = JSON.parse(savedRewards);
      }
    } catch (error) {
      console.error('Error loading portfolio from storage:', error);
      // Reset to defaults on error
      this.virtualBalance = 10000;
      this.dailyRewards = {
        lastLoginDate: null,
        lastClaimDate: null,
        totalRewards: 0,
        loginStreak: 0
      };
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
      localStorage.setItem('tradebro_daily_rewards', JSON.stringify(this.dailyRewards));
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
      
      // Create notification for successful trade
      this.createTradeNotification(symbol, quantity, price, action, metrics.totalCost);

      return {
        success: true,
        trade,
        newPosition: metrics.newPosition,
        newBalance: this.virtualBalance,
        message: `Successfully ${action.toLowerCase()}ed ${quantity} shares of ${symbol}`
      };
    } catch (error) {
      console.error('❌ Trade execution failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Compatibility methods for existing code
  async buyStock(symbol, quantity, price, orderType = 'market') {
    return this.executeTrade(symbol, quantity, price, 'BUY', orderType);
  }

  async sellStock(symbol, quantity, price, orderType = 'market') {
    return this.executeTrade(symbol, quantity, price, 'SELL', orderType);
  }

  async getPortfolio() {
    return {
      success: true,
      data: this.getPortfolioSummary()
    };
  }

  async getHoldings() {
    const summary = this.getPortfolioSummary();
    return {
      success: true,
      data: summary.positions
    };
  }

  async getVirtualMoneyAccount() {
    return {
      success: true,
      data: {
        balance: this.virtualBalance,
        totalInvested: this.getPortfolioSummary().totalInvested,
        totalReturns: this.getPortfolioSummary().totalPnL
      }
    };
  }

  /**
   * Get portfolio summary with current market values
   */
  getPortfolioSummary() {
    const positions = Array.from(this.portfolio.values()).filter(pos => pos.quantity > 0);

    let totalInvested = 0;
    let totalCurrentValue = 0;
    let totalPnL = 0;
    let totalRealizedPnL = 0;

    positions.forEach(position => {
      totalInvested += position.totalInvested;
      totalCurrentValue += position.currentValue || position.totalInvested;
      totalPnL += (position.currentValue || position.totalInvested) - position.totalInvested;
      totalRealizedPnL += position.realizedPnL || 0;
    });

    const totalPnLPercentage = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;

    const summary = {
      totalValue: this.virtualBalance + totalCurrentValue,
      availableCash: this.virtualBalance,
      totalInvested,
      totalCurrentValue,
      totalPnL,
      totalPnLPercentage,
      totalRealizedPnL,
      positions,
      totalPositions: positions.length,
      lastUpdated: new Date()
    };

    console.log('📊 Trading service getPortfolioSummary returning:', {
      availableCash: summary.availableCash,
      totalValue: summary.totalValue,
      virtualBalance: this.virtualBalance
    });

    return summary;
  }

  /**
   * Get trading history
   */
  getTradingHistory(limit = 100) {
    return this.tradingHistory.slice(0, limit);
  }

  /**
   * Check daily login and award bonus
   */
  checkDailyLogin() {
    try {
      const today = new Date().toDateString();
      const lastLogin = this.dailyRewards.lastLoginDate;
      const lastClaimDate = this.dailyRewards.lastClaimDate;

      // Check if reward was already claimed today
      if (lastClaimDate === today) {
        return {
          awarded: false,
          alreadyClaimed: true,
          streak: this.dailyRewards.loginStreak,
          totalRewards: this.dailyRewards.totalRewards,
          message: "You've already claimed your daily reward today! Come back tomorrow."
        };
      }

      if (lastLogin !== today) {
        // Award daily login bonus
        const dailyBonus = 100;
        const oldBalance = this.virtualBalance;
        this.virtualBalance += dailyBonus;

        // Update login streak
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const isConsecutive = lastLogin === yesterday.toDateString();

        this.dailyRewards = {
          lastLoginDate: today,
          lastClaimDate: today, // Track when reward was claimed
          totalRewards: this.dailyRewards.totalRewards + dailyBonus,
          loginStreak: isConsecutive ? this.dailyRewards.loginStreak + 1 : 1
        };

        // Add transaction record for daily bonus
        this.tradingHistory.unshift({
          id: `daily_${Date.now()}`,
          type: 'BONUS',
          symbol: 'DAILY_REWARD',
          quantity: 1,
          price: dailyBonus,
          total: dailyBonus,
          timestamp: new Date(),
          description: `Daily login bonus - Day ${this.dailyRewards.loginStreak}`,
          balanceBefore: oldBalance,
          balanceAfter: this.virtualBalance
        });

        // Save updated data
        this.savePortfolioToStorage();

        // Notify listeners with updated portfolio summary
        this.notifyListeners();

        console.log(`🎉 Daily login bonus: ₹${dailyBonus} | Streak: ${this.dailyRewards.loginStreak} days | New Balance: ₹${this.virtualBalance}`);

        return {
          awarded: true,
          amount: dailyBonus,
          streak: this.dailyRewards.loginStreak,
          totalRewards: this.dailyRewards.totalRewards,
          newBalance: this.virtualBalance,
          oldBalance: oldBalance
        };
      }

      return {
        awarded: false,
        alreadyClaimed: false,
        streak: this.dailyRewards.loginStreak,
        totalRewards: this.dailyRewards.totalRewards
      };
    } catch (error) {
      console.error('Error checking daily login:', error);
      return { awarded: false, error: error.message };
    }
  }

  /**
   * Get daily rewards info
   */
  getDailyRewardsInfo() {
    const today = new Date().toDateString();
    const lastClaimDate = this.dailyRewards.lastClaimDate;
    const canClaimToday = lastClaimDate !== today;

    return {
      ...this.dailyRewards,
      nextRewardAvailable: canClaimToday,
      canClaimToday: canClaimToday,
      alreadyClaimedToday: lastClaimDate === today,
      timeUntilNextReward: this.getTimeUntilNextReward()
    };
  }

  /**
   * Get time until next reward can be claimed
   */
  getTimeUntilNextReward() {
    const lastClaimDate = this.dailyRewards.lastClaimDate;
    if (!lastClaimDate) return null;

    const lastClaim = new Date(lastClaimDate);
    const nextReward = new Date(lastClaim);
    nextReward.setDate(nextReward.getDate() + 1);
    nextReward.setHours(0, 0, 0, 0); // Reset to start of day

    const now = new Date();
    const timeDiff = nextReward.getTime() - now.getTime();

    if (timeDiff <= 0) return null;

    const hours = Math.floor(timeDiff / (1000 * 60 * 60));
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));

    return {
      hours,
      minutes,
      totalMinutes: Math.floor(timeDiff / (1000 * 60)),
      nextRewardTime: nextReward.toISOString()
    };
  }

  /**
   * Manually claim daily reward with full synchronization
   */
  async claimDailyReward() {
    try {
      const today = new Date().toDateString();
      const lastClaimDate = this.dailyRewards.lastClaimDate;

      // Check if already claimed today
      if (lastClaimDate === today) {
        return {
          success: false,
          alreadyClaimed: true,
          message: "You've already claimed your daily reward today!",
          timeUntilNext: this.getTimeUntilNextReward()
        };
      }

      // Award the reward
      const dailyBonus = 100;
      const oldBalance = this.virtualBalance;
      this.virtualBalance += dailyBonus;

      // Update login streak
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const lastLogin = this.dailyRewards.lastLoginDate;
      const isConsecutive = lastLogin === yesterday.toDateString();

      this.dailyRewards = {
        lastLoginDate: today,
        lastClaimDate: today,
        totalRewards: this.dailyRewards.totalRewards + dailyBonus,
        loginStreak: isConsecutive ? this.dailyRewards.loginStreak + 1 : 1
      };

      // Add transaction record
      this.tradingHistory.unshift({
        id: `daily_${Date.now()}`,
        type: 'BONUS',
        symbol: 'DAILY_REWARD',
        quantity: 1,
        price: dailyBonus,
        total: dailyBonus,
        timestamp: new Date(),
        description: `Daily login bonus - Day ${this.dailyRewards.loginStreak}`,
        balanceBefore: oldBalance,
        balanceAfter: this.virtualBalance
      });

      // Save locally first
      this.savePortfolioToStorage();

      // Sync with server and all contexts
      await this.syncPortfolioData();

      // Create notification for daily reward
      this.createRewardNotification(dailyBonus, this.dailyRewards.loginStreak);
      
      // Force refresh of all components
      setTimeout(() => {
        this.notifyListeners();
        // Trigger custom event for other contexts to refresh
        window.dispatchEvent(new CustomEvent('balanceUpdated', {
          detail: {
            newBalance: this.virtualBalance,
            change: dailyBonus,
            type: 'DAILY_REWARD'
          }
        }));
      }, 100);

      return {
        success: true,
        awarded: true,
        amount: dailyBonus,
        streak: this.dailyRewards.loginStreak,
        totalRewards: this.dailyRewards.totalRewards,
        newBalance: this.virtualBalance,
        oldBalance: oldBalance
      };
    } catch (error) {
      console.error('Error claiming daily reward:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Force daily reward (for testing)
   */
  forceDailyReward() {
    // Reset last login and claim dates to trigger reward
    this.dailyRewards.lastLoginDate = null;
    this.dailyRewards.lastClaimDate = null;
    this.savePortfolioToStorage();
    const result = this.checkDailyLogin();

    // Force refresh of all listeners to ensure UI updates
    setTimeout(() => {
      this.notifyListeners();
    }, 100);

    return result;
  }

  /**
   * Sync portfolio data across all components and server
   */
  async syncPortfolioData() {
    try {
      // Save current state
      this.savePortfolioToStorage();

      // Sync with server if possible
      await this.syncWithServer();

      // Notify all listeners with fresh data
      this.notifyListeners();

      console.log('🔄 Portfolio data synchronized across all components and server');

      return {
        success: true,
        summary: this.getPortfolioSummary(),
        rewards: this.getDailyRewardsInfo()
      };
    } catch (error) {
      console.error('Error syncing portfolio data:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Sync local data with server
   */
  async syncWithServer() {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      // Update server balance
      const response = await fetch('https://s89-satya-capstone-tradebro.onrender.com/api/virtual-money/sync-balance', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          balance: this.virtualBalance,
          totalRewards: this.dailyRewards.totalRewards,
          loginStreak: this.dailyRewards.loginStreak,
          lastClaimDate: this.dailyRewards.lastClaimDate
        })
      });

      if (response.ok) {
        console.log('✅ Successfully synced balance with server');
      }
    } catch (error) {
      console.warn('⚠️ Failed to sync with server:', error.message);
    }
  }

  /**
   * Clear all data (for testing)
   */
  clearAllData() {
    this.portfolio.clear();
    this.tradingHistory = [];
    this.virtualBalance = 10000;
    this.dailyRewards = {
      lastLoginDate: null,
      lastClaimDate: null,
      totalRewards: 0,
      loginStreak: 0
    };
    localStorage.removeItem('tradebro_portfolio');
    localStorage.removeItem('tradebro_balance');
    localStorage.removeItem('tradebro_history');
    localStorage.removeItem('tradebro_daily_rewards');
    this.notifyListeners();
  }
}

// Create and export singleton instance
const tradingService = new TradingEngine();
export default tradingService;
