/**
 * Chatbot Helper Functions
 * Enhanced utility functions for the TradeBro chatbot system
 * Features: Real FMP API integration, secure session IDs, input validation, improved error handling
 */

const axios = require('axios');
const crypto = require('crypto');

// Configuration constants
const CONFIG = {
  FMP_API_KEY: process.env.FMP_API_KEY,
  TWELVE_DATA_API_KEY: process.env.TWELVE_DATA_API_KEY,
  API_TIMEOUT: 8000, // 8 seconds
  MAX_MESSAGE_LENGTH: 1000,
  STOCK_SYMBOL_REGEX: /^[A-Z]{1,5}(\.[A-Z]{1,3})?$/,
  CURRENCY_SYMBOL: '₹', // Indian Rupees as per user preference
  FALLBACK_ENABLED: true
};

/**
 * Enhanced stock data formatting with better clarity and fallback logic
 * @param {Object} stockData - Raw stock data from API
 * @param {Object} options - Formatting options
 * @returns {string} Beautifully formatted stock information
 */
const formatStockData = (stockData, options = {}) => {
  try {
    if (!stockData || typeof stockData !== 'object') {
      return "📊 Stock data is currently unavailable. Please try again later.";
    }

    const {
      symbol = 'N/A',
      name = 'Unknown Company',
      price = 0,
      change = 0,
      changesPercentage = 0,
      dayHigh = null,
      dayLow = null,
      volume = null,
      marketCap = null
    } = stockData;

    // Determine change direction and styling
    const isPositive = change >= 0;
    const changeEmoji = isPositive ? "📈" : "📉";
    const changeSymbol = isPositive ? "+" : "";
    const changeDirection = isPositive ? "up" : "down";

    // Format numbers with proper currency and commas
    const formatPrice = (value) => {
      if (value === null || value === undefined || isNaN(value)) return 'N/A';
      return `${CONFIG.CURRENCY_SYMBOL}${Number(value).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const formatVolume = (value) => {
      if (value === null || value === undefined || isNaN(value)) return 'N/A';
      if (value >= 1e7) return `${(value / 1e7).toFixed(1)}Cr`;
      if (value >= 1e5) return `${(value / 1e5).toFixed(1)}L`;
      if (value >= 1e3) return `${(value / 1e3).toFixed(1)}K`;
      return value.toLocaleString('en-IN');
    };

    const formatMarketCap = (value) => {
      if (value === null || value === undefined || isNaN(value)) return 'N/A';
      if (value >= 1e12) return `${CONFIG.CURRENCY_SYMBOL}${(value / 1e12).toFixed(2)}T`;
      if (value >= 1e9) return `${CONFIG.CURRENCY_SYMBOL}${(value / 1e9).toFixed(2)}B`;
      if (value >= 1e7) return `${CONFIG.CURRENCY_SYMBOL}${(value / 1e7).toFixed(2)}Cr`;
      return formatPrice(value);
    };

    // Basic format (compact)
    if (options.compact) {
      return `${changeEmoji} **${name}** (${symbol}): ${formatPrice(price)} ${changeSymbol}${change.toFixed(2)} (${changeSymbol}${changesPercentage.toFixed(2)}%) - trending ${changeDirection}`;
    }

    // Detailed format (default)
    let formatted = `${changeEmoji} **${name} (${symbol})**\n`;
    formatted += `💰 Current Price: ${formatPrice(price)}\n`;
    formatted += `📊 Change: ${changeSymbol}${change.toFixed(2)} (${changeSymbol}${changesPercentage.toFixed(2)}%) - ${changeDirection}\n`;

    if (dayHigh !== null && dayLow !== null) {
      formatted += `📈 Day Range: ${formatPrice(dayLow)} - ${formatPrice(dayHigh)}\n`;
    }

    if (volume !== null) {
      formatted += `📦 Volume: ${formatVolume(volume)}\n`;
    }

    if (marketCap !== null) {
      formatted += `🏢 Market Cap: ${formatMarketCap(marketCap)}`;
    }

    return formatted;

  } catch (error) {
    console.error('Error formatting stock data:', {
      error: error.message,
      stockData: JSON.stringify(stockData, null, 2)
    });
    return "📊 Unable to format stock data. Please try again.";
  }
};

/**
 * Validate user input message
 * @param {string} message - User input message
 * @returns {Object} Validation result with isValid flag and sanitized message
 */
const validateMessage = (message) => {
  try {
    if (!message || typeof message !== 'string') {
      return {
        isValid: false,
        error: 'Message must be a non-empty string',
        sanitizedMessage: ''
      };
    }

    const trimmedMessage = message.trim();
    
    if (trimmedMessage.length === 0) {
      return {
        isValid: false,
        error: 'Message cannot be empty',
        sanitizedMessage: ''
      };
    }

    if (trimmedMessage.length > CONFIG.MAX_MESSAGE_LENGTH) {
      return {
        isValid: false,
        error: `Message too long. Maximum ${CONFIG.MAX_MESSAGE_LENGTH} characters allowed.`,
        sanitizedMessage: trimmedMessage.substring(0, CONFIG.MAX_MESSAGE_LENGTH)
      };
    }

    // Basic sanitization - remove potentially harmful content
    const sanitizedMessage = trimmedMessage
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
      .replace(/javascript:/gi, '') // Remove javascript: protocols
      .replace(/on\w+\s*=/gi, ''); // Remove event handlers

    return {
      isValid: true,
      error: null,
      sanitizedMessage: sanitizedMessage
    };

  } catch (error) {
    console.error('Error validating message:', error);
    return {
      isValid: false,
      error: 'Validation error occurred',
      sanitizedMessage: ''
    };
  }
};

/**
 * Extract stock symbol from user message using multiple patterns
 * @param {string} message - User input message
 * @returns {string|null} Extracted stock symbol or null
 */
const extractStockSymbol = (message) => {
  try {
    if (!message || typeof message !== 'string') return null;

    const upperMessage = message.toUpperCase();
    
    // Pattern 1: Direct symbol mentions (e.g., "TCS", "RELIANCE")
    const directSymbolMatch = upperMessage.match(/\b([A-Z]{2,10})\b/g);
    if (directSymbolMatch) {
      for (const symbol of directSymbolMatch) {
        if (CONFIG.STOCK_SYMBOL_REGEX.test(symbol)) {
          return symbol;
        }
      }
    }

    // Pattern 2: Stock-specific phrases (e.g., "TCS stock", "RELIANCE price")
    const stockPhraseMatch = upperMessage.match(/([A-Z]{2,10})\s+(?:STOCK|SHARE|PRICE|QUOTE|DATA)/);
    if (stockPhraseMatch && CONFIG.STOCK_SYMBOL_REGEX.test(stockPhraseMatch[1])) {
      return stockPhraseMatch[1];
    }

    // Pattern 3: Price queries (e.g., "price of TCS", "TCS current price")
    const priceQueryMatch = upperMessage.match(/(?:PRICE|QUOTE|VALUE|COST|WORTH)\s+(?:OF\s+)?([A-Z]{2,10})/);
    if (priceQueryMatch && CONFIG.STOCK_SYMBOL_REGEX.test(priceQueryMatch[1])) {
      return priceQueryMatch[1];
    }

    return null;

  } catch (error) {
    console.error('Error extracting stock symbol:', error);
    return null;
  }
};

/**
 * Generate secure session ID for user sessions
 * @returns {string} Secure session ID
 */
const generateSessionId = () => {
  try {
    return crypto.randomBytes(16).toString('hex');
  } catch (error) {
    console.error('Error generating session ID:', error);
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }
};

/**
 * Create error context for better debugging
 * @param {Error} error - Error object
 * @param {Object} context - Additional context information
 * @returns {Object} Formatted error context
 */
const createErrorContext = (error, context = {}) => {
  return {
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString(),
    context: context
  };
};

/**
 * Check API availability
 * @returns {Promise<Object>} API status
 */
const checkAPIAvailability = async () => {
  const status = {
    fmp: false,
    twelveData: false,
    timestamp: new Date().toISOString()
  };

  try {
    // Check FMP API
    if (CONFIG.FMP_API_KEY) {
      const fmpResponse = await axios.get(
        `https://financialmodelingprep.com/api/v3/quote/AAPL?apikey=${CONFIG.FMP_API_KEY}`,
        { timeout: CONFIG.API_TIMEOUT }
      );
      status.fmp = fmpResponse.status === 200;
    }
  } catch (error) {
    console.log('FMP API not available:', error.message);
  }

  try {
    // Check Twelve Data API
    if (CONFIG.TWELVE_DATA_API_KEY) {
      const twelveDataResponse = await axios.get(
        `https://api.twelvedata.com/quote?symbol=AAPL&apikey=${CONFIG.TWELVE_DATA_API_KEY}`,
        { timeout: CONFIG.API_TIMEOUT }
      );
      status.twelveData = twelveDataResponse.status === 200;
    }
  } catch (error) {
    console.log('Twelve Data API not available:', error.message);
  }

  return status;
};

/**
 * Format error message for user display
 * @param {Error} error - Error object
 * @returns {string} User-friendly error message
 */
const formatErrorForUser = (error) => {
  const userFriendlyMessages = {
    'ENOTFOUND': '🌐 Network connection issue. Please check your internet connection.',
    'ECONNREFUSED': '🔌 Service temporarily unavailable. Please try again later.',
    'ETIMEDOUT': '⏰ Request timed out. Please try again.',
    'ECONNRESET': '🔄 Connection was reset. Please try again.',
    'RATE_LIMIT': '⏱️ Too many requests. Please wait a moment before trying again.'
  };

  if (error.code && userFriendlyMessages[error.code]) {
    return userFriendlyMessages[error.code];
  }

  if (error.message.includes('timeout')) {
    return userFriendlyMessages.ETIMEDOUT;
  }

  if (error.message.includes('rate limit')) {
    return userFriendlyMessages.RATE_LIMIT;
  }

  return '🔧 Something went wrong. Please try again later.';
};

module.exports = {
  // Core functions
  formatStockData,
  validateMessage,
  extractStockSymbol,
  generateSessionId,

  // Utility functions
  createErrorContext,
  checkAPIAvailability,
  formatErrorForUser,

  // Configuration
  CONFIG
};
