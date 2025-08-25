const axios = require('axios');
const fs = require('fs');
const path = require('path');
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
    if (!symbolString) {
      return { success: true, data: [], source: 'empty' };
    }

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
    console.error('Error fetching stock data from FMP:', error.message);

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

  const cleanSymbol = symbol.trim().toUpperCase();

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
  if (targetPrice === null || targetPrice === undefined || targetPrice === '') {
    return { valid: true, targetPrice: null };
  }

  const price = parseFloat(targetPrice);

  if (isNaN(price) || !isFinite(price)) {
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
 * Check if target price alert should be triggered
 * @param {number} currentPrice - Current stock price
 * @param {number} targetPrice - Target price
 * @param {boolean} alertEnabled - Whether alert is enabled
 * @returns {Object} - Alert status
 */
const checkPriceAlert = (currentPrice, targetPrice, alertEnabled) => {
  if (!alertEnabled || targetPrice === null || currentPrice === null) {
    return { shouldAlert: false };
  }

  const priceDifference = Math.abs(currentPrice - targetPrice);
  const percentageDifference = (priceDifference / targetPrice) * 100;

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
  checkPriceAlert
};