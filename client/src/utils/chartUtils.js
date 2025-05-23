/**
 * Chart Utility Functions
 * 
 * This file contains utility functions for chart data processing and visualization.
 */

/**
 * Generate dummy chart data for testing and fallback
 * @param {string} timeRange - Time range for the chart data
 * @returns {Array} Array of chart data points
 */
export const createDummyChartData = (timeRange = '1day') => {
  const now = new Date();
  const data = [];
  
  let points = 20;
  let startPrice = 100 + Math.random() * 100;
  let volatility = 2;
  
  // Adjust parameters based on time range
  switch (timeRange) {
    case '5min':
      points = 60;
      volatility = 0.5;
      break;
    case '1day':
      points = 24;
      volatility = 1;
      break;
    case '1week':
      points = 7;
      volatility = 2;
      break;
    case '1month':
      points = 30;
      volatility = 3;
      break;
    case '3months':
      points = 90;
      volatility = 5;
      break;
    case '1year':
      points = 365;
      volatility = 10;
      break;
    default:
      points = 30;
      volatility = 3;
  }
  
  // Generate data points
  for (let i = 0; i < points; i++) {
    // Calculate time based on range
    let timestamp;
    switch (timeRange) {
      case '5min':
        timestamp = new Date(now.getTime() - (points - i) * 5 * 60 * 1000);
        break;
      case '1day':
        timestamp = new Date(now.getTime() - (points - i) * 60 * 60 * 1000);
        break;
      case '1week':
        timestamp = new Date(now.getTime() - (points - i) * 24 * 60 * 60 * 1000);
        break;
      case '1month':
        timestamp = new Date(now.getTime() - (points - i) * 24 * 60 * 60 * 1000);
        break;
      case '3months':
        timestamp = new Date(now.getTime() - (points - i) * 24 * 60 * 60 * 1000);
        break;
      case '1year':
        timestamp = new Date(now.getTime() - (points - i) * 24 * 60 * 60 * 1000);
        break;
      default:
        timestamp = new Date(now.getTime() - (points - i) * 24 * 60 * 60 * 1000);
    }
    
    // Generate price movement
    const change = (Math.random() - 0.5) * volatility;
    const newPrice = startPrice + change;
    startPrice = newPrice;
    
    // Generate OHLC data
    const open = newPrice;
    const high = open + Math.random() * volatility;
    const low = open - Math.random() * volatility;
    const close = low + Math.random() * (high - low);
    
    // Generate volume
    const volume = Math.floor(100000 + Math.random() * 900000);
    
    data.push({
      timestamp: timestamp.getTime(),
      open,
      high,
      low,
      close,
      volume
    });
  }
  
  return data;
};

/**
 * Format price with currency symbol
 * @param {number} price - Price to format
 * @param {string} currency - Currency code (default: USD)
 * @returns {string} Formatted price
 */
export const formatPrice = (price, currency = 'USD') => {
  if (price === undefined || price === null) return '$0.00';
  
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  
  return formatter.format(price);
};

/**
 * Format large numbers with abbreviations (K, M, B)
 * @param {number} num - Number to format
 * @returns {string} Formatted number
 */
export const formatLargeNumber = (num) => {
  if (num === undefined || num === null) return '0';
  
  if (num >= 1000000000) {
    return (num / 1000000000).toFixed(1) + 'B';
  }
  
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  
  return num.toString();
};

/**
 * Calculate percentage change between two values
 * @param {number} oldValue - Original value
 * @param {number} newValue - New value
 * @returns {number} Percentage change
 */
export const calculatePercentageChange = (oldValue, newValue) => {
  if (oldValue === 0) return 0;
  return ((newValue - oldValue) / Math.abs(oldValue)) * 100;
};

export default {
  createDummyChartData,
  formatPrice,
  formatLargeNumber,
  calculatePercentageChange
};
