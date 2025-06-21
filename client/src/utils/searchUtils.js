/**
 * Search utilities for stock search functionality
 * Provides search history management, trending stocks, and search helpers
 */

const SEARCH_HISTORY_KEY = 'tradebro_search_history';
const MAX_SEARCH_HISTORY = 10;

/**
 * Get search history from localStorage
 * @returns {Array} Array of search history items
 */
export const getSearchHistory = () => {
  try {
    const history = localStorage.getItem(SEARCH_HISTORY_KEY);
    return history ? JSON.parse(history) : [];
  } catch (error) {
    console.warn('Failed to get search history:', error);
    return [];
  }
};

/**
 * Add a stock to search history
 * @param {Object} stock - Stock object with symbol and name
 */
export const addToSearchHistory = (stock) => {
  try {
    if (!stock || !stock.symbol) return;
    
    const history = getSearchHistory();
    
    // Remove existing entry if it exists
    const filteredHistory = history.filter(item => item.symbol !== stock.symbol);
    
    // Add to beginning of array
    const newHistory = [
      {
        symbol: stock.symbol,
        name: stock.name || stock.symbol,
        timestamp: Date.now(),
        searchCount: (stock.searchCount || 0) + 1
      },
      ...filteredHistory
    ].slice(0, MAX_SEARCH_HISTORY);
    
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(newHistory));
  } catch (error) {
    console.warn('Failed to add to search history:', error);
  }
};

/**
 * Clear search history
 */
export const clearSearchHistory = () => {
  try {
    localStorage.removeItem(SEARCH_HISTORY_KEY);
  } catch (error) {
    console.warn('Failed to clear search history:', error);
  }
};

/**
 * Get recent searches
 * @param {number} limit - Maximum number of items to return
 * @returns {Array} Array of recent search items
 */
export const getRecentSearches = (limit = 5) => {
  const history = getSearchHistory();
  return history.slice(0, limit);
};

/**
 * Get trending/popular Indian stocks
 * @returns {Array} Array of trending stock objects
 */
export const getTrendingStocks = () => {
  return [
    { symbol: 'RELIANCE.NS', name: 'Reliance Industries Ltd', sector: 'Energy' },
    { symbol: 'TCS.NS', name: 'Tata Consultancy Services', sector: 'IT' },
    { symbol: 'HDFCBANK.NS', name: 'HDFC Bank Ltd', sector: 'Banking' },
    { symbol: 'INFY.NS', name: 'Infosys Ltd', sector: 'IT' },
    { symbol: 'ICICIBANK.NS', name: 'ICICI Bank Ltd', sector: 'Banking' },
    { symbol: 'SBIN.NS', name: 'State Bank of India', sector: 'Banking' },
    { symbol: 'ITC.NS', name: 'ITC Ltd', sector: 'FMCG' },
    { symbol: 'LT.NS', name: 'Larsen & Toubro Ltd', sector: 'Infrastructure' },
    { symbol: 'BHARTIARTL.NS', name: 'Bharti Airtel Ltd', sector: 'Telecom' },
    { symbol: 'ASIANPAINT.NS', name: 'Asian Paints Ltd', sector: 'Paints' }
  ];
};

/**
 * Get stock suggestions based on query
 * @param {string} query - Search query
 * @returns {Array} Array of suggested stocks
 */
export const getStockSuggestions = (query) => {
  if (!query || query.length < 2) return [];
  
  const trending = getTrendingStocks();
  const lowerQuery = query.toLowerCase();
  
  return trending.filter(stock => 
    stock.symbol.toLowerCase().includes(lowerQuery) ||
    stock.name.toLowerCase().includes(lowerQuery) ||
    stock.sector.toLowerCase().includes(lowerQuery)
  );
};

/**
 * Format stock symbol for display
 * @param {string} symbol - Stock symbol
 * @returns {string} Formatted symbol
 */
export const formatStockSymbol = (symbol) => {
  if (!symbol) return '';
  
  // Remove .NS or .BO suffix for display
  return symbol.replace(/\.(NS|BO)$/, '');
};

/**
 * Get stock exchange from symbol
 * @param {string} symbol - Stock symbol
 * @returns {string} Exchange name
 */
export const getStockExchange = (symbol) => {
  if (!symbol) return '';
  
  if (symbol.endsWith('.NS')) return 'NSE';
  if (symbol.endsWith('.BO')) return 'BSE';
  return 'NSE'; // Default to NSE for Indian stocks
};

/**
 * Validate stock symbol format
 * @param {string} symbol - Stock symbol to validate
 * @returns {boolean} True if valid symbol format
 */
export const isValidStockSymbol = (symbol) => {
  if (!symbol || typeof symbol !== 'string') return false;
  
  // Basic validation for stock symbols
  const symbolRegex = /^[A-Z0-9]{1,20}(\.(NS|BO))?$/;
  return symbolRegex.test(symbol.toUpperCase());
};

/**
 * Debounce function for search input
 * @param {Function} func - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Debounced function
 */
export const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(null, args), delay);
  };
};

/**
 * Highlight search query in text
 * @param {string} text - Text to highlight
 * @param {string} query - Search query
 * @returns {string} Text with highlighted query
 */
export const highlightSearchQuery = (text, query) => {
  if (!text || !query) return text;
  
  const regex = new RegExp(`(${query})`, 'gi');
  return text.replace(regex, '<mark>$1</mark>');
};
