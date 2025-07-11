/**
 * API Helper Utilities
 * Reusable functions for external API calls with error handling and logging
 */

const axios = require('axios');

// Configuration
const CONFIG = {
  FMP_API_KEY: process.env.FMP_API_KEY,
  TWELVE_DATA_API_KEY: process.env.TWELVE_DATA_API_KEY,
  DEFAULT_TIMEOUT: 10000, // 10 seconds
  MAX_RETRIES: 2
};

/**
 * Validate API keys at startup
 * @throws {Error} If required API keys are missing
 */
function validateAPIKeys() {
  const missingKeys = [];
  
  if (!CONFIG.FMP_API_KEY) {
    missingKeys.push('FMP_API_KEY');
  }
  
  if (!CONFIG.TWELVE_DATA_API_KEY) {
    missingKeys.push('TWELVE_DATA_API_KEY');
  }
  
  if (missingKeys.length > 0) {
    throw new Error(`Missing required API keys: ${missingKeys.join(', ')}`);
  }
  
  console.log('✅ API keys validated successfully');
}

/**
 * Validate stock symbol format
 * @param {string} symbol - Stock symbol to validate
 * @returns {Object} Validation result
 */
function validateStockSymbol(symbol) {
  if (!symbol || typeof symbol !== 'string') {
    return { isValid: false, error: 'Symbol must be a non-empty string' };
  }
  
  const normalizedSymbol = symbol.trim().toUpperCase();
  
  // Stock symbols: 1-5 uppercase letters, optionally followed by exchange suffix
  if (!/^[A-Z]{1,5}(\.[A-Z]{1,3})?$/.test(normalizedSymbol)) {
    return { 
      isValid: false, 
      error: 'Invalid symbol format. Must be 1-5 uppercase letters (e.g., AAPL, RELIANCE.NS)' 
    };
  }
  
  return { isValid: true, normalizedSymbol };
}

/**
 * Reusable FMP API fetcher with logging and error handling
 * @param {string} endpoint - FMP API endpoint (without base URL)
 * @param {Object} options - Request options
 * @returns {Promise<Object>} API response data
 */
async function fetchFromFMP(endpoint, options = {}) {
  const startTime = Date.now();
  const { timeout = CONFIG.DEFAULT_TIMEOUT, retries = CONFIG.MAX_RETRIES } = options;
  
  const url = `https://financialmodelingprep.com/api/v3/${endpoint}${endpoint.includes('?') ? '&' : '?'}apikey=${CONFIG.FMP_API_KEY}`;
  
  console.log(`🔍 FMP API Request: ${endpoint}`);
  
  for (let attempt = 1; attempt <= retries + 1; attempt++) {
    try {
      const response = await axios.get(url, { 
        timeout,
        headers: {
          'User-Agent': 'TradeBro/1.0',
          'Accept': 'application/json'
        }
      });
      
      const duration = Date.now() - startTime;
      console.log(`✅ FMP API Success: ${endpoint} (${duration}ms, attempt ${attempt})`);
      
      return {
        data: response.data,
        duration,
        source: 'fmp',
        attempt,
        success: true
      };
      
    } catch (error) {
      const duration = Date.now() - startTime;
      
      if (attempt <= retries) {
        console.warn(`⚠️ FMP API Retry ${attempt}/${retries}: ${endpoint} (${duration}ms) - ${error.message}`);
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        continue;
      }
      
      console.error(`❌ FMP API Failed: ${endpoint} (${duration}ms, ${attempt} attempts) - ${error.message}`);
      
      throw {
        message: error.message,
        duration,
        source: 'fmp',
        attempts: attempt,
        success: false,
        isTimeout: error.code === 'ECONNABORTED',
        isNetworkError: error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED'
      };
    }
  }
}

/**
 * Reusable Twelve Data API fetcher
 * @param {string} endpoint - Twelve Data API endpoint
 * @param {Object} options - Request options
 * @returns {Promise<Object>} API response data
 */
async function fetchFromTwelveData(endpoint, options = {}) {
  const startTime = Date.now();
  const { timeout = CONFIG.DEFAULT_TIMEOUT, retries = CONFIG.MAX_RETRIES } = options;
  
  const url = `https://api.twelvedata.com/${endpoint}${endpoint.includes('?') ? '&' : '?'}apikey=${CONFIG.TWELVE_DATA_API_KEY}`;
  
  console.log(`🔍 Twelve Data API Request: ${endpoint}`);
  
  for (let attempt = 1; attempt <= retries + 1; attempt++) {
    try {
      const response = await axios.get(url, { 
        timeout,
        headers: {
          'User-Agent': 'TradeBro/1.0',
          'Accept': 'application/json'
        }
      });
      
      const duration = Date.now() - startTime;
      
      // Check for Twelve Data specific errors
      if (response.data && response.data.status === 'error') {
        throw new Error(response.data.message || 'Twelve Data API error');
      }
      
      console.log(`✅ Twelve Data API Success: ${endpoint} (${duration}ms, attempt ${attempt})`);
      
      return {
        data: response.data,
        duration,
        source: 'twelvedata',
        attempt,
        success: true
      };
      
    } catch (error) {
      const duration = Date.now() - startTime;
      
      if (attempt <= retries) {
        console.warn(`⚠️ Twelve Data API Retry ${attempt}/${retries}: ${endpoint} (${duration}ms) - ${error.message}`);
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        continue;
      }
      
      console.error(`❌ Twelve Data API Failed: ${endpoint} (${duration}ms, ${attempt} attempts) - ${error.message}`);
      
      throw {
        message: error.message,
        duration,
        source: 'twelvedata',
        attempts: attempt,
        success: false,
        isTimeout: error.code === 'ECONNABORTED',
        isNetworkError: error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED'
      };
    }
  }
}

/**
 * Create standardized API error response
 * @param {Error} error - The error object
 * @param {string} operation - The operation that failed
 * @returns {Object} Standardized error response
 */
function createErrorResponse(error, operation) {
  return {
    success: false,
    error: {
      message: error.message || 'Unknown error occurred',
      operation,
      duration: error.duration || 0,
      source: error.source || 'unknown',
      attempts: error.attempts || 1,
      isTimeout: error.isTimeout || false,
      isNetworkError: error.isNetworkError || false,
      timestamp: new Date().toISOString()
    }
  };
}

/**
 * Create standardized success response
 * @param {any} data - Response data
 * @param {Object} metadata - Additional metadata
 * @returns {Object} Standardized success response
 */
function createSuccessResponse(data, metadata = {}) {
  return {
    success: true,
    data,
    live: metadata.source !== 'mock',
    source: metadata.source || 'unknown',
    duration: metadata.duration || 0,
    timestamp: new Date().toISOString(),
    ...metadata
  };
}

module.exports = {
  validateAPIKeys,
  validateStockSymbol,
  fetchFromFMP,
  fetchFromTwelveData,
  createErrorResponse,
  createSuccessResponse,
  CONFIG
};
