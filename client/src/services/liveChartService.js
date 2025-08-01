/**
 * Live Chart Service for Real-time Data Updates
 * Handles live candlestick chart updates using backend API
 */

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';

class LiveChartService {
  constructor() {
    this.intervals = new Map(); // Store active intervals
    this.subscribers = new Map(); // Store chart subscribers
    this.lastUpdateTimes = new Map(); // Track last update times
  }

  /**
   * Start live updates for a symbol with smart polling intervals
   * @param {string} symbol - Stock symbol (e.g., 'RELIANCE.NS')
   * @param {Function} onUpdate - Callback function for updates
   * @param {number} intervalMs - Update interval in milliseconds (default: 60000ms)
   */
  startLiveUpdates(symbol, onUpdate, intervalMs = 60000) {
    console.log(`🔄 Starting live updates for ${symbol} every ${intervalMs}ms`);

    // Stop existing updates for this symbol
    this.stopLiveUpdates(symbol);

    // Store the subscriber
    this.subscribers.set(symbol, onUpdate);

    // Initial data fetch
    this.fetchLatestCandle(symbol);

    // Use smart polling intervals based on market hours
    const smartInterval = this.getSmartInterval(symbol);

    // Set up interval for live updates
    const intervalId = setInterval(() => {
      this.fetchLatestCandle(symbol);
    }, smartInterval);

    this.intervals.set(symbol, intervalId);

    console.log(`📊 Live updates for ${symbol} set to ${smartInterval / 1000}s intervals`);

    return intervalId;
  }

  /**
   * Get smart polling interval based on market hours and symbol type
   * @param {string} symbol - Stock symbol
   * @returns {number} Interval in milliseconds
   */
  getSmartInterval(symbol) {
    const now = new Date();
    const hour = now.getHours();

    // Determine if it's an Indian stock
    const isIndianStock = symbol.endsWith('.NS') || symbol.endsWith('.BO');

    if (isIndianStock) {
      // Indian market hours: 9:15 AM to 3:30 PM IST
      const istHour = new Date().toLocaleString("en-US", {timeZone: "Asia/Kolkata"});
      const istTime = new Date(istHour);
      const istHours = istTime.getHours();

      // During market hours: 60 seconds
      if (istHours >= 9 && istHours <= 15) {
        return 60000; // 1 minute
      }
      // Pre/post market: 5 minutes
      else if ((istHours >= 8 && istHours < 9) || (istHours > 15 && istHours <= 17)) {
        return 300000; // 5 minutes
      }
      // After hours: 15 minutes
      else {
        return 900000; // 15 minutes
      }
    } else {
      // US stocks - adjust for EST/EDT
      // During US market hours: 60 seconds
      if (hour >= 9 && hour <= 16) {
        return 60000; // 1 minute
      }
      // Pre/post market: 5 minutes
      else if ((hour >= 7 && hour < 9) || (hour > 16 && hour <= 20)) {
        return 300000; // 5 minutes
      }
      // After hours: 15 minutes
      else {
        return 900000; // 15 minutes
      }
    }
  }

  /**
   * Stop live updates for a symbol
   * @param {string} symbol - Stock symbol
   */
  stopLiveUpdates(symbol) {
    const intervalId = this.intervals.get(symbol);
    if (intervalId) {
      console.log(`⏹️ Stopping live updates for ${symbol}`);
      clearInterval(intervalId);
      this.intervals.delete(symbol);
      this.subscribers.delete(symbol);
      this.lastUpdateTimes.delete(symbol);
    }
  }

  /**
   * Stop all live updates
   */
  stopAllUpdates() {
    console.log('⏹️ Stopping all live updates');
    this.intervals.forEach((intervalId, symbol) => {
      clearInterval(intervalId);
    });
    this.intervals.clear();
    this.subscribers.clear();
    this.lastUpdateTimes.clear();
  }

  /**
   * Fetch latest candle data for a symbol
   * @param {string} symbol - Stock symbol
   */
  async fetchLatestCandle(symbol) {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/live-charts/latest/${symbol}`, {
        timeout: 10000
      });

      if (response.data.success && response.data.latest) {
        const latestCandle = response.data.latest;
        const onUpdate = this.subscribers.get(symbol);
        
        // Check if this is a new candle (different timestamp)
        const lastUpdateTime = this.lastUpdateTimes.get(symbol);
        const currentTime = latestCandle.time;
        
        if (!lastUpdateTime || currentTime > lastUpdateTime) {
          console.log(`📈 New candle for ${symbol}:`, {
            time: new Date(currentTime * 1000).toLocaleTimeString(),
            close: latestCandle.close,
            volume: latestCandle.volume
          });
          
          this.lastUpdateTimes.set(symbol, currentTime);
          
          if (onUpdate) {
            onUpdate({
              type: 'update',
              data: latestCandle,
              marketOpen: response.data.marketOpen,
              exchange: response.data.exchange,
              timestamp: response.data.timestamp
            });
          }
        } else {
          // Same candle, but might have updated price
          if (onUpdate) {
            onUpdate({
              type: 'price_update',
              data: latestCandle,
              marketOpen: response.data.marketOpen,
              exchange: response.data.exchange,
              timestamp: response.data.timestamp
            });
          }
        }
      }
    } catch (error) {
      console.warn(`⚠️ Failed to fetch latest candle for ${symbol}:`, error.message);
      
      const onUpdate = this.subscribers.get(symbol);
      if (onUpdate) {
        onUpdate({
          type: 'error',
          error: error.message,
          symbol
        });
      }
    }
  }

  /**
   * Fetch initial chart data for a symbol
   * @param {string} symbol - Stock symbol
   * @param {number} fromTimestamp - Optional: get data from this timestamp
   */
  async fetchInitialData(symbol, fromTimestamp = null) {
    try {
      console.log(`📊 Fetching initial chart data for ${symbol}`);
      
      const params = fromTimestamp ? { from: fromTimestamp } : {};
      const response = await axios.get(`${API_BASE_URL}/api/live-charts/live/${symbol}`, {
        params,
        timeout: 15000
      });

      if (response.data.success) {
        console.log(`✅ Initial data loaded for ${symbol}: ${response.data.count} candles`);
        return {
          success: true,
          data: response.data.data,
          latest: response.data.latest,
          marketOpen: response.data.marketOpen,
          exchange: response.data.exchange,
          count: response.data.count
        };
      } else {
        throw new Error(response.data.message || 'Failed to fetch initial data');
      }
    } catch (error) {
      console.error(`❌ Error fetching initial data for ${symbol}:`, error.message);
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  }

  /**
   * Check market status for an exchange
   * @param {string} exchange - Exchange name (NSE, BSE, NASDAQ, etc.)
   */
  async checkMarketStatus(exchange = 'NSE') {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/live-charts/market-status/${exchange}`, {
        timeout: 5000
      });

      return response.data;
    } catch (error) {
      console.warn(`⚠️ Failed to check market status for ${exchange}:`, error.message);
      return {
        success: false,
        marketOpen: false,
        exchange: exchange.toUpperCase(),
        error: error.message
      };
    }
  }

  /**
   * Get active symbols being tracked
   */
  getActiveSymbols() {
    return Array.from(this.subscribers.keys());
  }

  /**
   * Check if a symbol is being tracked
   * @param {string} symbol - Stock symbol
   */
  isTracking(symbol) {
    return this.subscribers.has(symbol);
  }

  /**
   * Get update interval for a symbol
   * @param {string} symbol - Stock symbol
   */
  getUpdateInterval(symbol) {
    return this.intervals.get(symbol);
  }

  /**
   * Batch fetch latest candles for multiple symbols
   * @param {string[]} symbols - Array of stock symbols
   */
  async fetchBatchCandles(symbols) {
    try {
      console.log(`📊 Batch fetching candles for ${symbols.length} symbols`);

      const response = await axios.post(`${API_BASE_URL}/api/live-charts/batch`, {
        symbols
      }, {
        timeout: 15000
      });

      if (response.data.success) {
        console.log(`✅ Batch fetch successful: ${response.data.count} results`);
        return {
          success: true,
          results: response.data.results,
          timestamp: response.data.timestamp
        };
      } else {
        throw new Error(response.data.message || 'Batch fetch failed');
      }
    } catch (error) {
      console.error('❌ Error in batch fetch:', error.message);
      return {
        success: false,
        error: error.message,
        results: []
      };
    }
  }

  /**
   * Start live updates for multiple symbols using batch requests
   * @param {string[]} symbols - Array of stock symbols
   * @param {Function} onUpdate - Callback function for updates
   * @param {number} intervalMs - Update interval in milliseconds
   */
  startBatchLiveUpdates(symbols, onUpdate, intervalMs = 60000) {
    console.log(`🔄 Starting batch live updates for ${symbols.length} symbols every ${intervalMs}ms`);

    // Stop existing updates for all symbols
    symbols.forEach(symbol => this.stopLiveUpdates(symbol));

    // Store the subscriber for all symbols
    symbols.forEach(symbol => this.subscribers.set(symbol, onUpdate));

    // Initial batch fetch
    this.fetchBatchCandles(symbols).then(result => {
      if (result.success) {
        result.results.forEach(stockData => {
          if (stockData.success) {
            const callback = this.subscribers.get(stockData.symbol);
            if (callback) {
              callback({
                type: 'update',
                data: stockData.latest,
                marketOpen: stockData.marketOpen,
                exchange: stockData.exchange,
                timestamp: stockData.timestamp,
                symbol: stockData.symbol
              });
            }
          }
        });
      }
    });

    // Set up interval for batch updates
    const intervalId = setInterval(() => {
      this.fetchBatchCandles(symbols).then(result => {
        if (result.success) {
          result.results.forEach(stockData => {
            if (stockData.success) {
              const callback = this.subscribers.get(stockData.symbol);
              if (callback) {
                callback({
                  type: 'update',
                  data: stockData.latest,
                  marketOpen: stockData.marketOpen,
                  exchange: stockData.exchange,
                  timestamp: stockData.timestamp,
                  symbol: stockData.symbol
                });
              }
            }
          });
        }
      });
    }, intervalMs);

    // Store interval for cleanup
    const batchKey = `batch_${symbols.join('_')}`;
    this.intervals.set(batchKey, intervalId);

    return intervalId;
  }
}

// Create singleton instance
const liveChartService = new LiveChartService();

// Cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    liveChartService.stopAllUpdates();
  });
}

export default liveChartService;
