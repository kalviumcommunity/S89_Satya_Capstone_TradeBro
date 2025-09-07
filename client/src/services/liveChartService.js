/**
 * Live Chart Service for Real-time Data Updates
 * Handles live candlestick chart updates using backend API
 */

import axios from 'axios';
import { formatInTimeZone } from 'date-fns-tz'; // Recommended for robust timezone handling
// You might need to install date-fns-tz: npm install date-fns-tz date-fns

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://s89-satya-capstone-tradebro.onrender.com'; // Use VITE_API_URL for consistency

class LiveChartService {
  constructor() {
    this.intervals = new Map(); // Store active intervals
    this.subscribers = new Map(); // Store chart subscribers (symbol -> onUpdate callback)
    this.lastUpdateTimes = new Map(); // Track last update times for each symbol
    console.log("LiveChartService initialized.");
  }

  /**
   * Start live updates for a symbol with smart polling intervals
   * @param {string} symbol - Stock symbol (e.g., 'RELIANCE.NS')
   * @param {Function} onUpdate - Callback function for updates (receives { type, data, marketOpen, exchange, timestamp })
   * @returns {string} A unique ID for the subscription, useful for stopping specific updates
   */
  startLiveUpdates(symbol, onUpdate) {
    // Stop existing updates for this symbol first
    this.stopLiveUpdates(symbol);

    // Store the subscriber
    this.subscribers.set(symbol, onUpdate);

    // Immediately fetch the latest candle
    this.fetchLatestCandle(symbol);

    // Determine smart polling interval
    const smartInterval = this.getSmartInterval(symbol);

    // Set up interval for live updates
    const intervalId = setInterval(() => {
      this.fetchLatestCandle(symbol);
    }, smartInterval);

    this.intervals.set(symbol, intervalId);

    console.log(`📊 Live updates for ${symbol} set to ${smartInterval / 1000}s intervals.`);

    return symbol; // Return symbol as ID for single stock updates
  }

  /**
   * Get smart polling interval based on market hours and symbol type
   * @param {string} symbol - Stock symbol
   * @returns {number} Interval in milliseconds
   */
  getSmartInterval(symbol) {
    const now = new Date();
    let currentHour;
    let currentMinute;
    let isMarketOpenHours = false;

    const isIndianStock = symbol.endsWith('.NS') || symbol.endsWith('.BO');

    if (isIndianStock) {
      // Indian market hours: 9:15 AM to 3:30 PM IST
      const istTime = formatInTimeZone(now, 'Asia/Kolkata', 'HH:mm');
      currentHour = parseInt(istTime.split(':')[0], 10);
      currentMinute = parseInt(istTime.split(':')[1], 10);

      // 9:15 to 15:30 IST
      if ((currentHour === 9 && currentMinute >= 15) || (currentHour > 9 && currentHour < 15) || (currentHour === 15 && currentMinute <= 30)) {
        isMarketOpenHours = true;
      }
    } else {
      // Assuming US market hours (e.g., EST/EDT) - 9:30 AM to 4:00 PM ET
      const estTime = formatInTimeZone(now, 'America/New_York', 'HH:mm');
      currentHour = parseInt(estTime.split(':')[0], 10);
      currentMinute = parseInt(estTime.split(':')[1], 10);

      // 9:30 to 16:00 ET
      if ((currentHour === 9 && currentMinute >= 30) || (currentHour > 9 && currentHour < 16)) {
        isMarketOpenHours = true;
      }
    }

    if (isMarketOpenHours) {
      return 15000; // 15 seconds during market hours for more frequent updates
    } 
    // Pre/post market (example range)
    else if ((currentHour >= 8 && currentHour < 9) || (currentHour > 16 && currentHour <= 18)) {
      return 60000; // 1 minute pre/post
    }
    // After hours
    else {
      return 300000; // 5 minutes after hours
    }
  }

  /**
   * Stop live updates for a specific symbol
   * @param {string} symbol - Stock symbol
   */
  stopLiveUpdates(symbol) {
    const intervalId = this.intervals.get(symbol);
    if (intervalId) {
      console.log(`⏹️ Stopping live updates for ${symbol}.`);
      clearInterval(intervalId);
      this.intervals.delete(symbol);
      this.subscribers.delete(symbol);
      this.lastUpdateTimes.delete(symbol);
    }
  }

  /**
   * Stop all active live updates
   */
  stopAllUpdates() {
    console.log('⏹️ Stopping all live updates.');
    this.intervals.forEach((intervalId) => {
      clearInterval(intervalId);
    });
    this.intervals.clear();
    this.subscribers.clear();
    this.lastUpdateTimes.clear();
  }

  /**
   * Fetch latest candle data for a symbol and notify subscribers
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
        
        const lastUpdateTime = this.lastUpdateTimes.get(symbol);
        const currentTime = latestCandle.time; // Assuming 'time' is a timestamp

        if (!lastUpdateTime || currentTime > lastUpdateTime) {
          console.log(`📈 New candle for ${symbol}:`, {
            time: new Date(currentTime * 1000).toLocaleTimeString(),
            close: latestCandle.close,
            volume: latestCandle.volume
          });
          this.lastUpdateTimes.set(symbol, currentTime);
          if (onUpdate) {
            onUpdate({
              type: 'update', // Indicates a new candle or significant update
              data: latestCandle,
              marketOpen: response.data.marketOpen,
              exchange: response.data.exchange,
              timestamp: response.data.timestamp,
              symbol: symbol // Pass symbol back for context
            });
          }
        } else {
          // Same candle, but potentially updated price/volume within the minute
          if (onUpdate) {
            onUpdate({
              type: 'price_update', // Indicates an in-candle price update
              data: latestCandle,
              marketOpen: response.data.marketOpen,
              exchange: response.data.exchange,
              timestamp: response.data.timestamp,
              symbol: symbol // Pass symbol back for context
            });
          }
        }
      } else if (!response.data.success) {
        throw new Error(response.data.message || `API error for ${symbol}`);
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
   * Fetch initial historical chart data for a symbol
   * @param {string} symbol - Stock symbol
   * @param {string} period - Timeframe (e.g., '1D', '5D', '1M')
   * @returns {Promise<Object>} Object with success status and data/error
   */
  async fetchInitialData(symbol, period) {
    try {
      console.log(`📊 Fetching initial historical chart data for ${symbol} (${period})`);
      
      const response = await axios.get(`${API_BASE_URL}/api/live-charts/historical/${symbol}`, {
        params: { period },
        timeout: 15000
      });

      if (response.data.success) {
        console.log(`✅ Initial historical data loaded for ${symbol}: ${response.data.data.length} candles`);
        return {
          success: true,
          data: response.data.data,
          latest: response.data.latest, // Assuming latest is also returned
          marketOpen: response.data.marketOpen,
          exchange: response.data.exchange,
          count: response.data.data.length
        };
      } else {
        throw new Error(response.data.message || 'Failed to fetch initial historical data');
      }
    } catch (error) {
      console.error(`❌ Error fetching initial historical data for ${symbol}:`, error.message);
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
   * @returns {Promise<Object>} Object with market status
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
   * @returns {string[]} Array of symbols being tracked
   */
  getActiveSymbols() {
    return Array.from(this.subscribers.keys());
  }

  /**
   * Check if a symbol is being tracked
   * @param {string} symbol - Stock symbol
   * @returns {boolean}
   */
  isTracking(symbol) {
    return this.subscribers.has(symbol);
  }

  /**
   * Get update interval ID for a symbol
   * @param {string} symbol - Stock symbol
   * @returns {NodeJS.Timeout | undefined}
   */
  getUpdateIntervalId(symbol) {
    return this.intervals.get(symbol);
  }

  /**
   * Start live updates for multiple symbols using batch requests
   * @param {string[]} symbols - Array of stock symbols
   * @param {Function} onUpdate - Callback function for updates (receives { type, data, marketOpen, exchange, timestamp, symbol })
   * @param {number} intervalMs - Update interval in milliseconds (default: 60000ms)
   * @returns {string} A unique ID for the batch subscription
   */
  startBatchLiveUpdates(symbols, onUpdate, intervalMs = 60000) {
    const batchKey = `batch_${symbols.sort().join('_')}`; // Consistent key for batch
    console.log(`🔄 Starting batch live updates for ${symbols.length} symbols every ${intervalMs}ms (Key: ${batchKey})`);

    // Stop existing updates for this batch key
    this.stopLiveUpdates(batchKey); // Using batchKey for stopping

    // Store the subscriber for the batch
    this.subscribers.set(batchKey, onUpdate);

    // Initial batch fetch
    this.fetchBatchCandles(symbols).then(result => {
      if (result.success) {
        onUpdate({
          type: 'batch_update',
          data: result.results,
          timestamp: result.timestamp,
          marketOpen: result.marketOpen, // Assuming batch returns overall market status
          exchange: result.exchange,
          symbols: symbols
        });
      } else {
        onUpdate({
          type: 'error',
          error: result.error,
          symbols: symbols
        });
      }
    });

    // Set up interval for batch updates
    const intervalId = setInterval(() => {
      this.fetchBatchCandles(symbols).then(result => {
        if (result.success) {
          onUpdate({
            type: 'batch_update',
            data: result.results,
            timestamp: result.timestamp,
            marketOpen: result.marketOpen,
            exchange: result.exchange,
            symbols: symbols
          });
        } else {
          onUpdate({
            type: 'error',
            error: result.error,
            symbols: symbols
          });
        }
      });
    }, intervalMs);

    this.intervals.set(batchKey, intervalId);

    return batchKey; // Return batch key as ID for batch updates
  }

  /**
   * Batch fetch latest candles for multiple symbols
   * @param {string[]} symbols - Array of stock symbols
   * @returns {Promise<Object>} Object with success status and results/error
   */
  async fetchBatchCandles(symbols) {
    try {
      if (symbols.length === 0) return { success: true, results: [], count: 0 };

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
          timestamp: response.data.timestamp,
          marketOpen: response.data.marketOpen, // Assuming batch endpoint returns this
          exchange: response.data.exchange // Assuming batch endpoint returns this
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
