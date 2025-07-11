const axios = require('axios');
require('dotenv').config();

const FMP_API = process.env.FMP_API_KEY;

/**
 * Utility functions for watchlist operations
 */

/**
 * Fetch stock data from FMP API with fallback handling
 * @param {string|Array} symbols - Single symbol or array of symbols
 * @returns {Promise<Object>} - API response or fallback data
 */
const fetchStockData = async (symbols) => {
  try {
    const symbolString = Array.isArray(symbols) ? symbols.join(',') : symbols;
    
    const response = await axios.get(
      `https://financialmodelingprep.com/api/v3/quote/${symbolString}?apikey=${FMP_API}`,
      { timeout: 10000 } // 10 second timeout
    );

    return {
      success: true,
      data: response.data,
      source: 'api'
    };
  } catch (error) {
    console.error('Error fetching stock data:', error.message);
    
    // Return fallback structure
    const symbolArray = Array.isArray(symbols) ? symbols : [symbols];
    const fallbackData = symbolArray.map(symbol => ({
      symbol: symbol,
      name: symbol,
      price: null,
      change: null,
      changesPercentage: null,
      marketCap: null,
      volume: null
    }));

    return {
      success: false,
      data: fallbackData,
      source: 'fallback',
      error: error.message
    };
  }
};

/**
 * Validate stock symbol format
 * @param {string} symbol - Stock symbol to validate
 * @returns {Object} - Validation result
 */
const validateSymbol = (symbol) => {
  if (!symbol || typeof symbol !== 'string') {
    return { valid: false, message: 'Symbol must be a non-empty string' };
  }

  // Remove whitespace and convert to uppercase
  const cleanSymbol = symbol.trim().toUpperCase();

  // Basic symbol validation (1-10 characters, alphanumeric with dots and hyphens)
  const symbolRegex = /^[A-Z0-9.-]{1,10}$/;
  
  if (!symbolRegex.test(cleanSymbol)) {
    return { 
      valid: false, 
      message: 'Symbol must be 1-10 characters long and contain only letters, numbers, dots, and hyphens' 
    };
  }

  return { valid: true, symbol: cleanSymbol };
};

/**
 * Validate target price
 * @param {number} targetPrice - Target price to validate
 * @returns {Object} - Validation result
 */
const validateTargetPrice = (targetPrice) => {
  if (targetPrice === null || targetPrice === undefined) {
    return { valid: true, targetPrice: null };
  }

  const price = parseFloat(targetPrice);
  
  if (isNaN(price)) {
    return { valid: false, message: 'Target price must be a valid number' };
  }

  if (price < 0) {
    return { valid: false, message: 'Target price cannot be negative' };
  }

  if (price > 1000000) {
    return { valid: false, message: 'Target price cannot exceed $1,000,000' };
  }

  return { valid: true, targetPrice: price };
};

/**
 * Validate notes field
 * @param {string} notes - Notes to validate
 * @returns {Object} - Validation result
 */
const validateNotes = (notes) => {
  if (!notes) {
    return { valid: true, notes: '' };
  }

  if (typeof notes !== 'string') {
    return { valid: false, message: 'Notes must be a string' };
  }

  if (notes.length > 500) {
    return { valid: false, message: 'Notes cannot exceed 500 characters' };
  }

  return { valid: true, notes: notes.trim() };
};

/**
 * Sort watchlist data by specified field and order
 * @param {Array} data - Array of watchlist items
 * @param {string} sortBy - Field to sort by
 * @param {string} order - Sort order ('asc' or 'desc')
 * @returns {Array} - Sorted array
 */
const sortWatchlistData = (data, sortBy = 'addedAt', order = 'desc') => {
  const validSortFields = ['symbol', 'name', 'addedAt', 'price', 'change', 'changePercent', 'marketCap', 'volume', 'targetPrice'];
  const validOrders = ['asc', 'desc'];

  if (!validSortFields.includes(sortBy)) {
    throw new Error(`Invalid sort field: ${sortBy}`);
  }

  if (!validOrders.includes(order)) {
    throw new Error(`Invalid sort order: ${order}`);
  }

  return [...data].sort((a, b) => {
    let aValue = a[sortBy];
    let bValue = b[sortBy];
    
    // Handle null/undefined values
    if (aValue === null || aValue === undefined) {
      aValue = order === 'asc' ? Number.MAX_VALUE : Number.MIN_VALUE;
    }
    if (bValue === null || bValue === undefined) {
      bValue = order === 'asc' ? Number.MAX_VALUE : Number.MIN_VALUE;
    }
    
    // Handle different data types
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    }
    
    if (aValue < bValue) return order === 'asc' ? -1 : 1;
    if (aValue > bValue) return order === 'asc' ? 1 : -1;
    return 0;
  });
};

/**
 * Filter watchlist data by search query
 * @param {Array} data - Array of watchlist items
 * @param {string} searchQuery - Search query
 * @returns {Array} - Filtered array
 */
const filterWatchlistData = (data, searchQuery) => {
  if (!searchQuery || typeof searchQuery !== 'string') {
    return data;
  }

  const searchTermLower = searchQuery.toLowerCase().trim();
  
  if (!searchTermLower) {
    return data;
  }

  return data.filter(item => {
    return (
      (item.symbol && item.symbol.toLowerCase().includes(searchTermLower)) ||
      (item.name && item.name.toLowerCase().includes(searchTermLower)) ||
      (item.notes && item.notes.toLowerCase().includes(searchTermLower))
    );
  });
};

/**
 * Generate CSV content from watchlist data
 * @param {Array} watchlistData - Array of watchlist items with market data
 * @returns {string} - CSV content
 */
const generateCSV = (watchlistData) => {
  // CSV headers
  const headers = [
    'Symbol',
    'Name', 
    'Current Price',
    'Change',
    'Change %',
    'Market Cap',
    'Volume',
    'Added Date',
    'Notes',
    'Target Price',
    'Alert Enabled'
  ];

  let csvContent = headers.join(',') + '\n';

  watchlistData.forEach(stock => {
    const row = [
      stock.symbol || '',
      stock.name || stock.symbol || '',
      stock.price || 'N/A',
      stock.change || 'N/A',
      stock.changePercent || 'N/A',
      stock.marketCap || 'N/A',
      stock.volume || 'N/A',
      stock.addedAt ? new Date(stock.addedAt).toISOString().split('T')[0] : '',
      stock.notes ? `"${stock.notes.replace(/"/g, '""')}"` : '', // Escape quotes for CSV
      stock.targetPrice || '',
      stock.alertEnabled || false
    ];

    csvContent += row.join(',') + '\n';
  });

  return csvContent;
};

/**
 * Check if target price alert should be triggered
 * @param {number} currentPrice - Current stock price
 * @param {number} targetPrice - Target price
 * @param {boolean} alertEnabled - Whether alert is enabled
 * @returns {Object} - Alert status
 */
const checkPriceAlert = (currentPrice, targetPrice, alertEnabled) => {
  if (!alertEnabled || !targetPrice || !currentPrice) {
    return { shouldAlert: false };
  }

  const priceDifference = Math.abs(currentPrice - targetPrice);
  const percentageDifference = (priceDifference / targetPrice) * 100;

  // Trigger alert if price is within 2% of target price
  const shouldAlert = percentageDifference <= 2;

  return {
    shouldAlert,
    currentPrice,
    targetPrice,
    difference: currentPrice - targetPrice,
    percentageDifference: percentageDifference.toFixed(2)
  };
};

module.exports = {
  fetchStockData,
  validateSymbol,
  validateTargetPrice,
  validateNotes,
  sortWatchlistData,
  filterWatchlistData,
  generateCSV,
  checkPriceAlert
};
