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
 * Validate stock symbol format
 * @param {string} symbol - Stock symbol to validate
 * @returns {Object} Validation result with isValid and normalizedSymbol
 */
const validateStockSymbol = (symbol) => {
  try {
    if (!symbol || typeof symbol !== 'string') {
      return { isValid: false, error: 'Symbol must be a non-empty string', normalizedSymbol: null };
    }

    const trimmedSymbol = symbol.trim().toUpperCase();

    if (trimmedSymbol.length === 0) {
      return { isValid: false, error: 'Symbol cannot be empty', normalizedSymbol: null };
    }

    if (trimmedSymbol.length > 10) {
      return { isValid: false, error: 'Symbol too long (max 10 characters)', normalizedSymbol: null };
    }

    // Allow alphanumeric characters, dots, and hyphens
    if (!/^[A-Z0-9.-]+$/.test(trimmedSymbol)) {
      return { isValid: false, error: 'Symbol contains invalid characters', normalizedSymbol: null };
    }

    return { isValid: true, error: null, normalizedSymbol: trimmedSymbol };
  } catch (error) {
    return { isValid: false, error: 'Symbol validation failed', normalizedSymbol: null };
  }
};

/**
 * Get stock quote from FMP API with fallback to Twelve Data
 * @param {string} symbol - Stock symbol
 * @param {Object} options - Request options
 * @returns {Object} Stock quote data or null
 */
const getStockQuote = async (symbol, options = {}) => {
  const startTime = Date.now();

  try {
    // Validate input symbol
    const validation = validateStockSymbol(symbol);
    if (!validation.isValid) {
      throw new Error(`Invalid stock symbol: ${validation.error}`);
    }

    const normalizedSymbol = validation.normalizedSymbol;
    console.log(`🔍 Fetching stock data for: ${normalizedSymbol}`);

    // Try FMP API first
    if (CONFIG.FMP_API_KEY) {
      try {
        const fmpData = await getStockQuoteFromFMP(normalizedSymbol, options);
        if (fmpData) {
          console.log(`✅ FMP API success for ${normalizedSymbol} (${Date.now() - startTime}ms)`);
          return fmpData;
        }
      } catch (fmpError) {
        console.warn(`⚠️ FMP API failed for ${normalizedSymbol}:`, fmpError.message);
      }
    }

    // Fallback to Twelve Data API
    if (CONFIG.TWELVE_DATA_API_KEY) {
      try {
        const twelveDataResult = await getStockQuoteFromTwelveData(normalizedSymbol, options);
        if (twelveDataResult) {
          console.log(`✅ Twelve Data API success for ${normalizedSymbol} (${Date.now() - startTime}ms)`);
          return twelveDataResult;
        }
      } catch (twelveDataError) {
        console.warn(`⚠️ Twelve Data API failed for ${normalizedSymbol}:`, twelveDataError.message);
      }
    }

    // Generate fallback data if enabled
    if (CONFIG.FALLBACK_ENABLED) {
      console.log(`🔄 Generating fallback data for ${normalizedSymbol}`);
      return generateFallbackStockData(normalizedSymbol);
    }

    throw new Error('All stock data sources failed and fallback is disabled');

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ Stock quote failed for ${symbol} (${duration}ms):`, {
      message: error.message,
      symbol,
      duration,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
    return null;
  }
};

/**
 * Get stock quote from FMP API
 * @param {string} symbol - Normalized stock symbol
 * @param {Object} options - Request options
 * @returns {Object|null} Stock data or null
 */
const getStockQuoteFromFMP = async (symbol, options = {}) => {
  const timeout = options.timeout || CONFIG.API_TIMEOUT;

  try {
    const url = `https://financialmodelingprep.com/api/v3/quote/${symbol}?apikey=${CONFIG.FMP_API_KEY}`;
    const response = await axios.get(url, { timeout });

    if (!response.data || !Array.isArray(response.data) || response.data.length === 0) {
      throw new Error('No data returned from FMP API');
    }

    const stockData = response.data[0];
    return {
      symbol: stockData.symbol,
      name: stockData.name || symbol,
      price: stockData.price,
      change: stockData.change,
      changesPercentage: stockData.changesPercentage,
      dayHigh: stockData.dayHigh,
      dayLow: stockData.dayLow,
      volume: stockData.volume,
      marketCap: stockData.marketCap,
      previousClose: stockData.previousClose,
      open: stockData.open,
      source: 'FMP'
    };
  } catch (error) {
    throw new Error(`FMP API error: ${error.message}`);
  }
};

/**
 * Get stock quote from Twelve Data API
 * @param {string} symbol - Normalized stock symbol
 * @param {Object} options - Request options
 * @returns {Object|null} Stock data or null
 */
const getStockQuoteFromTwelveData = async (symbol, options = {}) => {
  const timeout = options.timeout || CONFIG.API_TIMEOUT;

  try {
    const url = `https://api.twelvedata.com/quote?symbol=${symbol}&apikey=${CONFIG.TWELVE_DATA_API_KEY}`;
    const response = await axios.get(url, { timeout });

    if (!response.data || response.data.status === 'error') {
      throw new Error(response.data?.message || 'No data returned from Twelve Data API');
    }

    const data = response.data;
    return {
      symbol: data.symbol,
      name: data.name || symbol,
      price: parseFloat(data.close),
      change: parseFloat(data.close) - parseFloat(data.previous_close),
      changesPercentage: ((parseFloat(data.close) - parseFloat(data.previous_close)) / parseFloat(data.previous_close)) * 100,
      dayHigh: parseFloat(data.high),
      dayLow: parseFloat(data.low),
      volume: parseInt(data.volume),
      marketCap: null, // Not provided by Twelve Data
      previousClose: parseFloat(data.previous_close),
      open: parseFloat(data.open),
      source: 'TwelveData'
    };
  } catch (error) {
    throw new Error(`Twelve Data API error: ${error.message}`);
  }
};

/**
 * Generate realistic fallback stock data
 * @param {string} symbol - Stock symbol
 * @returns {Object} Mock stock data
 */
const generateFallbackStockData = (symbol) => {
  const basePrice = Math.random() * 500 + 50; // Random price between 50 and 550
  const changePercent = (Math.random() - 0.5) * 10; // Random change between -5% and +5%
  const change = (basePrice * changePercent) / 100;

  return {
    symbol: symbol,
    name: `${symbol} Corporation`,
    price: parseFloat(basePrice.toFixed(2)),
    change: parseFloat(change.toFixed(2)),
    changesPercentage: parseFloat(changePercent.toFixed(2)),
    dayHigh: parseFloat((basePrice * 1.05).toFixed(2)),
    dayLow: parseFloat((basePrice * 0.95).toFixed(2)),
    volume: Math.floor(Math.random() * 10000000) + 500000,
    marketCap: parseFloat((basePrice * (Math.random() * 100 + 10) * 1000000).toFixed(2)),
    previousClose: parseFloat((basePrice - change).toFixed(2)),
    open: parseFloat((basePrice + (Math.random() - 0.5) * 10).toFixed(2)),
    source: 'Fallback',
    isMock: true
  };
};

/**
 * Enhanced text cleaning with better formatting and fallback logic
 * @param {string} text - Raw response text
 * @param {Object} options - Cleaning options
 * @returns {string} Cleaned and formatted text
 */
const cleanResponseText = (text, options = {}) => {
  try {
    if (!text || typeof text !== 'string') {
      return options.fallback || "Response not available";
    }

    let cleaned = text.trim();

    if (cleaned.length === 0) {
      return options.fallback || "Empty response";
    }

    // Remove excessive whitespace
    cleaned = cleaned.replace(/\s+/g, ' ');

    // Fix common formatting issues
    if (!options.preserveMarkdown) {
      cleaned = cleaned.replace(/\*\*(.*?)\*\*/g, '$1'); // Remove bold markdown
      cleaned = cleaned.replace(/\*(.*?)\*/g, '$1'); // Remove italic markdown
      cleaned = cleaned.replace(/`(.*?)`/g, '$1'); // Remove code markdown
    }

    // Remove HTML tags if present
    cleaned = cleaned.replace(/<[^>]*>/g, '');

    // Fix multiple punctuation
    cleaned = cleaned.replace(/[.]{3,}/g, '...');
    cleaned = cleaned.replace(/[!]{2,}/g, '!');
    cleaned = cleaned.replace(/[?]{2,}/g, '?');

    // Ensure proper sentence spacing
    cleaned = cleaned.replace(/([.!?])\s*([A-Z])/g, '$1 $2');

    // Truncate if too long
    const maxLength = options.maxLength || 2000;
    if (cleaned.length > maxLength) {
      cleaned = cleaned.substring(0, maxLength - 3) + '...';
    }

    return cleaned;

  } catch (error) {
    console.error('Error cleaning response text:', {
      error: error.message,
      textLength: text ? text.length : 0
    });
    return options.fallback || "Unable to process response";
  }
};

/**
 * Generate secure session ID using crypto.randomUUID
 * @param {string} prefix - Optional prefix for the session ID
 * @returns {string} Cryptographically secure unique session ID
 */
const generateSessionId = (prefix = 'chat') => {
  try {
    // Use crypto.randomUUID for secure session ID generation
    const uuid = crypto.randomUUID();
    const timestamp = Date.now();
    return `${prefix}_${timestamp}_${uuid}`;
  } catch (error) {
    // Fallback to less secure but functional method if crypto.randomUUID fails
    console.warn('crypto.randomUUID not available, using fallback method');
    const timestamp = Date.now();
    const randomPart = Math.random().toString(36).substring(2, 15);
    return `${prefix}_${timestamp}_${randomPart}`;
  }
};

/**
 * Enhanced message validation with detailed error reporting
 * @param {string} message - User message to validate
 * @param {Object} options - Validation options
 * @returns {Object} Validation result with isValid, error, and sanitizedMessage
 */
const validateMessage = (message, options = {}) => {
  const maxLength = options.maxLength || CONFIG.MAX_MESSAGE_LENGTH;
  const minLength = options.minLength || 1;
  const allowEmptyTrim = options.allowEmptyTrim || false;

  try {
    // Type check
    if (message === null || message === undefined) {
      return { isValid: false, error: 'Message cannot be null or undefined', sanitizedMessage: null };
    }

    if (typeof message !== 'string') {
      return { isValid: false, error: 'Message must be a string', sanitizedMessage: null };
    }

    // Length checks
    if (message.length === 0) {
      return { isValid: false, error: 'Message cannot be empty', sanitizedMessage: null };
    }

    if (message.length > maxLength) {
      return { isValid: false, error: `Message too long (max ${maxLength} characters)`, sanitizedMessage: null };
    }

    // Trim and check again
    const trimmedMessage = message.trim();

    if (!allowEmptyTrim && trimmedMessage.length === 0) {
      return { isValid: false, error: 'Message cannot be only whitespace', sanitizedMessage: null };
    }

    if (trimmedMessage.length < minLength) {
      return { isValid: false, error: `Message too short (min ${minLength} characters)`, sanitizedMessage: null };
    }

    // Check for potentially harmful content
    const suspiciousPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, // Script tags
      /javascript:/gi, // JavaScript protocol
      /on\w+\s*=/gi, // Event handlers
      /data:text\/html/gi // Data URLs
    ];

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(message)) {
        return { isValid: false, error: 'Message contains potentially harmful content', sanitizedMessage: null };
      }
    }

    // Basic sanitization
    let sanitizedMessage = trimmedMessage
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove control characters
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();

    return {
      isValid: true,
      error: null,
      sanitizedMessage,
      originalLength: message.length,
      sanitizedLength: sanitizedMessage.length
    };

  } catch (error) {
    console.error('Error validating message:', {
      error: error.message,
      messageType: typeof message,
      messageLength: message ? message.length : 0
    });

    return {
      isValid: false,
      error: 'Message validation failed due to internal error',
      sanitizedMessage: null
    };
  }
};

/**
 * Extract stock symbols from message text
 * @param {string} message - User message
 * @returns {Array} Array of potential stock symbols
 */
const extractStockSymbols = (message) => {
  try {
    if (!message || typeof message !== 'string') return [];

    // Common patterns for stock symbols in messages
    const patterns = [
      /\b([A-Z]{1,5})\b/g, // Basic uppercase letters
      /\$([A-Z]{1,5})\b/g, // Dollar sign prefix
      /\b([A-Z]{1,5}\.[A-Z]{1,3})\b/g, // With exchange suffix
    ];

    const symbols = new Set();

    patterns.forEach(pattern => {
      const matches = message.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const symbol = match.replace(/[$\s]/g, '').toUpperCase();
          if (symbol.length >= 1 && symbol.length <= 10) {
            symbols.add(symbol);
          }
        });
      }
    });

    return Array.from(symbols);
  } catch (error) {
    console.error('Error extracting stock symbols:', error.message);
    return [];
  }
};

/**
 * Create error context for better debugging
 * @param {Error} error - The error object
 * @param {Object} context - Additional context information
 * @returns {Object} Enhanced error context
 */
const createErrorContext = (error, context = {}) => {
  return {
    message: error.message,
    name: error.name,
    timestamp: new Date().toISOString(),
    context,
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
  };
};

/**
 * Check if API keys are configured
 * @returns {Object} API availability status
 */
const checkAPIAvailability = () => {
  return {
    fmp: !!CONFIG.FMP_API_KEY,
    twelveData: !!CONFIG.TWELVE_DATA_API_KEY,
    fallbackEnabled: CONFIG.FALLBACK_ENABLED,
    hasAnyAPI: !!(CONFIG.FMP_API_KEY || CONFIG.TWELVE_DATA_API_KEY)
  };
};

/**
 * Format error message for user display
 * @param {Error} error - The error object
 * @param {Object} options - Formatting options
 * @returns {string} User-friendly error message
 */
const formatErrorForUser = (error, options = {}) => {
  const { showDetails = false, fallbackMessage = "Something went wrong. Please try again." } = options;

  if (!error) return fallbackMessage;

  // Map common errors to user-friendly messages
  const errorMappings = {
    'Invalid stock symbol': '❌ Please provide a valid stock symbol (e.g., AAPL, RELIANCE.NS)',
    'No data returned': '📊 Stock data is currently unavailable for this symbol',
    'API error': '🔌 Unable to fetch stock data at the moment',
    'Timeout': '⏱️ Request timed out. Please try again',
    'Network Error': '🌐 Network connection issue. Please check your connection'
  };

  for (const [key, message] of Object.entries(errorMappings)) {
    if (error.message && error.message.includes(key)) {
      return message;
    }
  }

  if (showDetails && process.env.NODE_ENV === 'development') {
    return `🐛 Debug: ${error.message}`;
  }

  return fallbackMessage;
};

// Export all functions
module.exports = {
  // Core functions
  formatStockData,
  getStockQuote,
  cleanResponseText,
  generateSessionId,
  validateMessage,

  // Validation functions
  validateStockSymbol,
  extractStockSymbols,

  // API functions
  getStockQuoteFromFMP,
  getStockQuoteFromTwelveData,
  generateFallbackStockData,

  // Utility functions
  createErrorContext,
  checkAPIAvailability,
  formatErrorForUser,

  // Configuration
  CONFIG
};