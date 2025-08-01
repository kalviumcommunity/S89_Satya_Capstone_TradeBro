/**
 * Cache Time-To-Live Configuration
 * Centralized cache duration management for different data types
 */

const CACHE_TTL = {
  // Real-time data (30 seconds)
  REAL_TIME: 30 * 1000,
  
  // Quote data (1 minute)
  QUOTE: 60 * 1000,
  
  // Chart data (2 minutes)
  CHART: 2 * 60 * 1000,
  
  // Market indices (1 minute)
  MARKET_INDICES: 60 * 1000,
  
  // Top gainers/losers (2 minutes)
  TOP_MOVERS: 2 * 60 * 1000,
  
  // Stock list (24 hours - rarely changes)
  STOCK_LIST: 24 * 60 * 60 * 1000,
  
  // Historical data (1 hour)
  HISTORICAL: 60 * 60 * 1000,
  
  // Batch quotes (30 seconds)
  BATCH_QUOTES: 30 * 1000,
  
  // Default fallback (5 minutes)
  DEFAULT: 5 * 60 * 1000
};

/**
 * Get cache TTL for a specific data type
 * @param {string} type - Data type key
 * @returns {number} TTL in milliseconds
 */
const getCacheTTL = (type) => {
  return CACHE_TTL[type.toUpperCase()] || CACHE_TTL.DEFAULT;
};

/**
 * Cache configuration for different environments
 */
const CACHE_CONFIG = {
  development: {
    enabled: true,
    maxSize: 1000, // Maximum number of cache entries
    cleanupInterval: 5 * 60 * 1000, // Cleanup every 5 minutes
  },
  production: {
    enabled: true,
    maxSize: 5000,
    cleanupInterval: 10 * 60 * 1000, // Cleanup every 10 minutes
  },
  test: {
    enabled: false,
    maxSize: 100,
    cleanupInterval: 60 * 1000, // Cleanup every minute
  }
};

/**
 * Get cache configuration for current environment
 * @returns {object} Cache configuration
 */
const getCacheConfig = () => {
  const env = process.env.NODE_ENV || 'development';
  return CACHE_CONFIG[env] || CACHE_CONFIG.development;
};

module.exports = {
  CACHE_TTL,
  getCacheTTL,
  getCacheConfig
};
