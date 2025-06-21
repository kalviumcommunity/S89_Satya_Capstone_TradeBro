/**
 * Chatbot Helper Functions
 * Utility functions for the TradeBro chatbot system
 */

const axios = require('axios');

/**
 * Format stock data for chatbot responses
 * @param {Object} stockData - Raw stock data
 * @returns {string} Formatted stock information
 */
const formatStockData = (stockData) => {
  if (!stockData) return "Stock data not available";
  
  const { symbol, name, price, change, changePercent } = stockData;
  const changeDirection = change >= 0 ? "up" : "down";
  const changeSymbol = change >= 0 ? "+" : "";
  
  return `${name} (${symbol}): $${price} ${changeSymbol}${change} (${changeSymbol}${changePercent}%) - ${changeDirection}`;
};

/**
 * Get stock quote from API
 * @param {string} symbol - Stock symbol
 * @returns {Object} Stock quote data
 */
const getStockQuote = async (symbol) => {
  try {
    const response = await axios.get(`https://api.example.com/quote/${symbol}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching stock quote:', error);
    return null;
  }
};

/**
 * Clean and format chatbot response text
 * @param {string} text - Raw response text
 * @returns {string} Cleaned text
 */
const cleanResponseText = (text) => {
  if (!text) return "";
  
  // Remove excessive whitespace
  let cleaned = text.replace(/\s+/g, ' ').trim();
  
  // Fix common formatting issues
  cleaned = cleaned.replace(/\*\*(.*?)\*\*/g, '$1'); // Remove bold markdown
  cleaned = cleaned.replace(/\*(.*?)\*/g, '$1'); // Remove italic markdown
  
  return cleaned;
};

/**
 * Generate session ID for chat
 * @returns {string} Unique session ID
 */
const generateSessionId = () => {
  return 'chat_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
};

/**
 * Validate user message
 * @param {string} message - User message
 * @returns {boolean} Is valid message
 */
const validateMessage = (message) => {
  if (!message || typeof message !== 'string') return false;
  if (message.trim().length === 0) return false;
  if (message.length > 1000) return false; // Max message length
  return true;
};

module.exports = {
  formatStockData,
  getStockQuote,
  cleanResponseText,
  generateSessionId,
  validateMessage
};
