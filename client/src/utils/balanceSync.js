/**
 * Balance Synchronization Utility
 * Ensures consistent balance display across all components
 */

import React from 'react';
import tradingService from '../services/tradingService';

class BalanceSyncManager {
  constructor() {
    this.listeners = new Set();
    this.currentBalance = 10000;
    this.isInitialized = false;
  }

  /**
   * Initialize the balance sync manager
   */
  async initialize() {
    if (this.isInitialized) return;

    try {
      // Get balance from trading service
      const summary = tradingService.getPortfolioSummary();
      this.currentBalance = summary.availableCash;

      // Listen for trading service updates
      tradingService.addListener(this.handleTradingServiceUpdate.bind(this));

      // Listen for custom balance update events
      window.addEventListener('balanceUpdated', this.handleBalanceUpdate.bind(this));

      this.isInitialized = true;
      console.log('✅ Balance sync manager initialized with balance:', this.currentBalance);
    } catch (error) {
      console.error('❌ Failed to initialize balance sync manager:', error);
    }
  }

  /**
   * Handle updates from trading service
   */
  handleTradingServiceUpdate(summary) {
    const newBalance = summary.availableCash;
    if (newBalance !== this.currentBalance) {
      this.currentBalance = newBalance;
      this.notifyListeners();
    }
  }

  /**
   * Handle custom balance update events
   */
  handleBalanceUpdate(event) {
    const { newBalance } = event.detail;
    if (newBalance !== this.currentBalance) {
      this.currentBalance = newBalance;
      this.notifyListeners();
    }
  }

  /**
   * Get current balance
   */
  getCurrentBalance() {
    return this.currentBalance;
  }

  /**
   * Get formatted balance
   */
  getFormattedBalance() {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(this.currentBalance);
  }

  /**
   * Update balance and sync everywhere
   */
  async updateBalance(newBalance, source = 'manual') {
    const oldBalance = this.currentBalance;
    this.currentBalance = newBalance;

    console.log(`💰 Balance updated from ${source}: ₹${oldBalance} → ₹${newBalance}`);

    // Update trading service
    tradingService.virtualBalance = newBalance;
    tradingService.savePortfolioToStorage();

    // Notify trading service listeners so Portfolio context updates
    tradingService.notifyListeners();

    // Sync with server
    await this.syncWithServer();

    // Notify all listeners
    this.notifyListeners();

    // Dispatch custom event
    window.dispatchEvent(new CustomEvent('balanceUpdated', {
      detail: {
        newBalance,
        oldBalance,
        change: newBalance - oldBalance,
        source
      }
    }));
  }

  /**
   * Sync with server
   */
  async syncWithServer() {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('http://localhost:5001/api/virtual-money/sync-balance', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          balance: this.currentBalance,
          totalRewards: tradingService.dailyRewards.totalRewards,
          loginStreak: tradingService.dailyRewards.loginStreak,
          lastClaimDate: tradingService.dailyRewards.lastClaimDate
        })
      });

      if (response.ok) {
        console.log('✅ Balance synced with server successfully');
      } else {
        console.warn('⚠️ Failed to sync balance with server');
      }
    } catch (error) {
      console.warn('⚠️ Server sync error:', error.message);
    }
  }

  /**
   * Add listener for balance changes
   */
  addListener(callback) {
    this.listeners.add(callback);
    
    // Immediately call with current balance
    callback({
      balance: this.currentBalance,
      formattedBalance: this.getFormattedBalance()
    });

    return () => this.listeners.delete(callback);
  }

  /**
   * Remove listener
   */
  removeListener(callback) {
    this.listeners.delete(callback);
  }

  /**
   * Notify all listeners
   */
  notifyListeners() {
    const balanceData = {
      balance: this.currentBalance,
      formattedBalance: this.getFormattedBalance()
    };

    this.listeners.forEach(callback => {
      try {
        callback(balanceData);
      } catch (error) {
        console.error('Error in balance listener:', error);
      }
    });
  }

  /**
   * Force refresh from all sources
   */
  async forceRefresh() {
    try {
      // Get latest from trading service
      const summary = tradingService.getPortfolioSummary();
      
      // Get latest from server
      const token = localStorage.getItem('token');
      if (token) {
        const response = await fetch('http://localhost:5001/api/virtual-money/account', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          const serverBalance = data.data.balance;
          
          // Use the most recent balance (server is source of truth)
          this.currentBalance = serverBalance;
          
          // Update trading service to match
          tradingService.virtualBalance = serverBalance;
          tradingService.savePortfolioToStorage();
        }
      }

      this.notifyListeners();
      console.log('🔄 Balance force refreshed:', this.currentBalance);
    } catch (error) {
      console.error('❌ Error force refreshing balance:', error);
    }
  }

  /**
   * Cleanup
   */
  cleanup() {
    this.listeners.clear();
    window.removeEventListener('balanceUpdated', this.handleBalanceUpdate.bind(this));
    this.isInitialized = false;
  }
}

// Create singleton instance
const balanceSyncManager = new BalanceSyncManager();

/**
 * Hook for using balance sync in React components
 */
export const useBalanceSync = () => {
  const [balance, setBalance] = React.useState(balanceSyncManager.getCurrentBalance());
  const [formattedBalance, setFormattedBalance] = React.useState(balanceSyncManager.getFormattedBalance());

  React.useEffect(() => {
    // Initialize if not already done
    balanceSyncManager.initialize();

    // Add listener
    const unsubscribe = balanceSyncManager.addListener(({ balance, formattedBalance }) => {
      setBalance(balance);
      setFormattedBalance(formattedBalance);
    });

    return unsubscribe;
  }, []);

  return {
    balance,
    formattedBalance,
    updateBalance: balanceSyncManager.updateBalance.bind(balanceSyncManager),
    forceRefresh: balanceSyncManager.forceRefresh.bind(balanceSyncManager)
  };
};

export default balanceSyncManager;
