/**
 * Utility functions for managing search history
 */

// Maximum number of search history items to store
const MAX_HISTORY_ITEMS = 20;

// Key for storing search history in session storage
const SEARCH_HISTORY_KEY = 'stockSearchHistory';

/**
 * Get search history from session storage
 * @returns {Array} Array of search history items
 */
export const getSearchHistory = () => {
  try {
    const history = sessionStorage.getItem(SEARCH_HISTORY_KEY);
    return history ? JSON.parse(history) : [];
  } catch (error) {
    console.error('Error retrieving search history:', error);
    return [];
  }
};

/**
 * Add a stock to search history
 * @param {Object} stock Stock object to add to history
 */
export const addToSearchHistory = (stock) => {
  try {
    if (!stock || !stock.symbol) return;
    
    const history = getSearchHistory();
    
    // Check if stock already exists in history
    const existingIndex = history.findIndex(item => item.symbol === stock.symbol);
    
    // If it exists, remove it (we'll add it to the top)
    if (existingIndex !== -1) {
      history.splice(existingIndex, 1);
    }
    
    // Add stock to the beginning of the array
    history.unshift({
      ...stock,
      lastSearched: new Date().toISOString()
    });
    
    // Limit history size
    const limitedHistory = history.slice(0, MAX_HISTORY_ITEMS);
    
    // Save back to session storage
    sessionStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(limitedHistory));
    
    return limitedHistory;
  } catch (error) {
    console.error('Error adding to search history:', error);
    return [];
  }
};

/**
 * Clear search history
 */
export const clearSearchHistory = () => {
  try {
    sessionStorage.removeItem(SEARCH_HISTORY_KEY);
  } catch (error) {
    console.error('Error clearing search history:', error);
  }
};

/**
 * Get recent searches
 * @param {number} limit Maximum number of recent searches to return
 * @returns {Array} Array of recent search items
 */
export const getRecentSearches = (limit = 5) => {
  const history = getSearchHistory();
  return history.slice(0, limit);
};

/**
 * Check if a stock exists in search history
 * @param {string} symbol Stock symbol to check
 * @returns {boolean} True if stock exists in history
 */
export const isInSearchHistory = (symbol) => {
  const history = getSearchHistory();
  return history.some(item => item.symbol === symbol);
};
