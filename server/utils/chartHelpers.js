/**
 * Chart Helper Utilities
 * Functions for generating mock chart data and chart-related operations
 */

/**
 * Convert interval string to milliseconds
 * @param {string} interval - Interval string (e.g., '5min', '1h', '1D')
 * @returns {number} Interval in milliseconds
 */
function getIntervalMs(interval) {
  const intervalMap = {
    '1min': 60 * 1000,
    '5min': 5 * 60 * 1000,
    '15min': 15 * 60 * 1000,
    '30min': 30 * 60 * 1000,
    '1h': 60 * 60 * 1000,
    '4h': 4 * 60 * 60 * 1000,
    '1D': 24 * 60 * 60 * 1000,
    '1W': 7 * 24 * 60 * 60 * 1000,
    '1M': 30 * 24 * 60 * 60 * 1000 // Approximation for a month
  };
  
  return intervalMap[interval] || intervalMap['5min'];
}

/**
 * Generate realistic mock chart data for testing and fallback
 * @param {string} symbol - Stock symbol
 * @param {Object} options - Configuration options
 * @param {string} options.interval - Time interval for candles (e.g., '5min', '1D')
 * @param {number} options.count - Number of data points
 * @param {number} options.basePrice - Starting price for mock data
 * @param {number} options.volatility - Price volatility factor
 * @returns {Array} Array of OHLCV data points
 */
function generateMockChartData(symbol, options = {}) {
  const {
    interval = '5min',
    count = 100,
    basePrice = null,
    volatility = 0.002 // 0.2% default volatility
  } = options;

  const data = [];
  const now = new Date();
  
  // Set to a reasonable market close time (e.g., 4 PM local time)
  // This helps ensure mock data timestamps are consistent
  now.setHours(16, 0, 0, 0); 

  // Generate a realistic starting price based on symbol hash for consistency
  let startPrice = basePrice;
  if (!startPrice) {
    // Generate price based on symbol hash for consistency
    const symbolHash = symbol.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    startPrice = 50 + (symbolHash % 950); // Price between 50-1000
  }

  const intervalMs = getIntervalMs(interval);
  let currentPrice = startPrice;
  
  // Generate candles going backward in time, then sort ascending
  const tempData = [];
  for (let i = 0; i < count; i++) {
    const time = new Date(now.getTime() - (i * intervalMs));
    
    // Generate realistic price movements with trend
    const trendFactor = Math.sin(i / 20) * 0.001; // Subtle trend
    const randomChange = (Math.random() - 0.5) * volatility * 2;
    const totalChange = trendFactor + randomChange;
    
    const open = currentPrice;
    const close = open * (1 + totalChange);
    
    // Generate high and low with realistic spreads
    const spread = Math.abs(close - open);
    const extraSpread = Math.random() * volatility * currentPrice * 0.5; // Smaller extra spread
    
    const high = Math.max(open, close) + extraSpread;
    const low = Math.min(open, close) - extraSpread;
    
    // Generate realistic volume (higher volume on bigger moves)
    const volumeBase = 1000 + Math.random() * 9000;
    const volumeMultiplier = 1 + Math.abs(totalChange) * 50;
    const volume = Math.floor(volumeBase * volumeMultiplier);

    tempData.push({
      // Using UNIX timestamp in seconds for TradingView Lightweight Charts compatibility
      time: Math.floor(time.getTime() / 1000), 
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(close.toFixed(2)),
      volume
    });
    
    currentPrice = close;
  }

  // Sort by time ascending (oldest first)
  return tempData.sort((a, b) => a.time - b.time);
}


/**
 * Get data count based on range
 * @param {string} range - Range string (1D, 5D, 1M, etc.)
 * @param {string} interval - Interval string
 * @returns {number} Number of data points to fetch
 */
function getDataCountForRange(range, interval = '5min') {
  const rangeMappings = {
    '1D': { '1min': 390, '5min': 78, '15min': 26, '30min': 13, '1h': 7 }, // Assuming typical market hours
    '5D': { '1min': 1950, '5min': 390, '15min': 130, '30min': 65, '1h': 35 },
    '1M': { '5min': 1560, '15min': 520, '30min': 260, '1h': 130, '4h': 32, '1D': 22 },
    '3M': { '15min': 1560, '30min': 780, '1h': 390, '4h': 97, '1D': 65 },
    '6M': { '1h': 780, '4h': 195, '1D': 130, '1W': 26 },
    '1Y': { '4h': 390, '1D': 260, '1W': 52, '1M': 12 },
    '5Y': { '1D': 1300, '1W': 260, '1M': 60 }
  };
  
  return rangeMappings[range]?.[interval] || 100; // Default to 100 if no specific mapping
}

/**
 * Validate chart parameters
 * @param {string} symbol - Stock symbol
 * @param {string} range - Time range
 * @param {string} interval - Time interval
 * @returns {Object} Validation result
 */
function validateChartParams(symbol, range = '1D', interval = '5min') {
  const errors = [];
  
  // Validate symbol
  if (!symbol || typeof symbol !== 'string') {
    errors.push('Symbol is required');
  } else if (!/^[A-Z0-9]{1,10}(\.[A-Z]{1,3})?$/.test(symbol)) { // Allow numbers and longer symbols
    errors.push('Invalid symbol format');
  }
  
  // Validate range
  const validRanges = ['1D', '5D', '1M', '3M', '6M', '1Y', '5Y'];
  if (!validRanges.includes(range)) {
    errors.push(`Invalid range. Must be one of: ${validRanges.join(', ')}`);
  }
  
  // Validate interval
  const validIntervals = ['1min', '5min', '15min', '30min', '1h', '4h', '1D', '1W', '1M'];
  if (!validIntervals.includes(interval)) {
    errors.push(`Invalid interval. Must be one of: ${validIntervals.join(', ')}`);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    normalizedSymbol: symbol?.toUpperCase(),
    dataCount: errors.length === 0 ? getDataCountForRange(range, interval) : 0
  };
}

/**
 * Format chart data for consistent API response
 * @param {Array} rawData - Raw chart data from API
 * @param {string} source - Data source (fmp, twelvedata, mock)
 * @param {Object} metadata - Additional metadata
 * @returns {Object} Formatted response
 */
function formatChartResponse(rawData, source, metadata = {}) {
  return {
    success: true,
    source,
    live: source !== 'mock',
    symbol: metadata.symbol,
    interval: metadata.interval,
    range: metadata.range,
    count: rawData.length,
    data: rawData,
    timestamp: new Date().toISOString(),
    ...metadata
  };
}

module.exports = {
  getIntervalMs,
  generateMockChartData,
  getDataCountForRange,
  validateChartParams,
  formatChartResponse
};
