/**
 * Search History Utility
 * Manages search history in localStorage with different categories
 */

const STORAGE_KEYS = {
  STOCK_SEARCH: 'tradebro_stock_search_history',
  NEWS_SEARCH: 'tradebro_news_search_history',
  ORDER_SEARCH: 'tradebro_order_search_history',
  GLOBAL_SEARCH: 'tradebro_global_search_history'
};

const MAX_HISTORY_ITEMS = 10;

/**
 * Get search history for a specific type
 * @param {string} type - Search type (stocks, news, orders, global)
 * @returns {Array} Array of search history items
 */
export const getSearchHistory = (type) => {
  try {
    const key = STORAGE_KEYS[`${type.toUpperCase()}_SEARCH`] || STORAGE_KEYS.GLOBAL_SEARCH;
    const history = localStorage.getItem(key);
    return history ? JSON.parse(history) : [];
  } catch (error) {
    console.warn('Failed to get search history:', error);
    return [];
  }
};

/**
 * Add a search query to history
 * @param {string} type - Search type
 * @param {string} query - Search query
 * @param {Object} metadata - Additional metadata (results count, timestamp, etc.)
 */
export const addToSearchHistory = (type, query, metadata = {}) => {
  if (!query || query.trim().length < 2) return;

  try {
    const key = STORAGE_KEYS[`${type.toUpperCase()}_SEARCH`] || STORAGE_KEYS.GLOBAL_SEARCH;
    const history = getSearchHistory(type);
    
    const searchItem = {
      query: query.trim(),
      timestamp: Date.now(),
      type,
      ...metadata
    };

    // Remove existing entry if it exists
    const filteredHistory = history.filter(item => 
      item.query.toLowerCase() !== query.toLowerCase()
    );

    // Add new item to the beginning
    const newHistory = [searchItem, ...filteredHistory].slice(0, MAX_HISTORY_ITEMS);

    localStorage.setItem(key, JSON.stringify(newHistory));
  } catch (error) {
    console.warn('Failed to add to search history:', error);
  }
};

/**
 * Clear search history for a specific type
 * @param {string} type - Search type
 */
export const clearSearchHistory = (type) => {
  try {
    const key = STORAGE_KEYS[`${type.toUpperCase()}_SEARCH`] || STORAGE_KEYS.GLOBAL_SEARCH;
    localStorage.removeItem(key);
  } catch (error) {
    console.warn('Failed to clear search history:', error);
  }
};

/**
 * Remove a specific item from search history
 * @param {string} type - Search type
 * @param {string} query - Query to remove
 */
export const removeFromSearchHistory = (type, query) => {
  try {
    const key = STORAGE_KEYS[`${type.toUpperCase()}_SEARCH`] || STORAGE_KEYS.GLOBAL_SEARCH;
    const history = getSearchHistory(type);
    const filteredHistory = history.filter(item => 
      item.query.toLowerCase() !== query.toLowerCase()
    );
    localStorage.setItem(key, JSON.stringify(filteredHistory));
  } catch (error) {
    console.warn('Failed to remove from search history:', error);
  }
};

/**
 * Get recent searches (last 5 items)
 * @param {string} type - Search type
 * @returns {Array} Recent search items
 */
export const getRecentSearches = (type) => {
  return getSearchHistory(type).slice(0, 5);
};

/**
 * Get popular searches (most frequently searched)
 * @param {string} type - Search type
 * @returns {Array} Popular search items
 */
export const getPopularSearches = (type) => {
  const history = getSearchHistory(type);
  const queryCount = {};

  // Count frequency of each query
  history.forEach(item => {
    const query = item.query.toLowerCase();
    queryCount[query] = (queryCount[query] || 0) + 1;
  });

  // Sort by frequency and return top 5
  return Object.entries(queryCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([query, count]) => ({
      query,
      count,
      type
    }));
};

/**
 * Search within history
 * @param {string} type - Search type
 * @param {string} searchTerm - Term to search for
 * @returns {Array} Matching history items
 */
export const searchHistory = (type, searchTerm) => {
  if (!searchTerm) return [];
  
  const history = getSearchHistory(type);
  const lowerSearchTerm = searchTerm.toLowerCase();
  
  return history.filter(item =>
    item.query.toLowerCase().includes(lowerSearchTerm)
  ).slice(0, 5);
};

/**
 * Get search statistics
 * @param {string} type - Search type
 * @returns {Object} Search statistics
 */
export const getSearchStats = (type) => {
  const history = getSearchHistory(type);
  
  if (history.length === 0) {
    return {
      totalSearches: 0,
      uniqueQueries: 0,
      averageQueryLength: 0,
      lastSearchTime: null
    };
  }

  const uniqueQueries = new Set(history.map(item => item.query.toLowerCase())).size;
  const totalLength = history.reduce((sum, item) => sum + item.query.length, 0);
  const lastSearchTime = Math.max(...history.map(item => item.timestamp));

  return {
    totalSearches: history.length,
    uniqueQueries,
    averageQueryLength: Math.round(totalLength / history.length),
    lastSearchTime
  };
};

/**
 * Export search history (for backup/sync)
 * @returns {Object} All search history data
 */
export const exportSearchHistory = () => {
  const allHistory = {};
  
  Object.keys(STORAGE_KEYS).forEach(key => {
    const type = key.replace('_SEARCH', '').toLowerCase();
    allHistory[type] = getSearchHistory(type);
  });

  return {
    exportDate: new Date().toISOString(),
    version: '1.0',
    data: allHistory
  };
};

/**
 * Import search history (from backup/sync)
 * @param {Object} historyData - Exported history data
 */
export const importSearchHistory = (historyData) => {
  try {
    if (!historyData.data) throw new Error('Invalid history data format');

    Object.entries(historyData.data).forEach(([type, history]) => {
      if (Array.isArray(history)) {
        const key = STORAGE_KEYS[`${type.toUpperCase()}_SEARCH`];
        if (key) {
          localStorage.setItem(key, JSON.stringify(history.slice(0, MAX_HISTORY_ITEMS)));
        }
      }
    });

    return true;
  } catch (error) {
    console.error('Failed to import search history:', error);
    return false;
  }
};

export default {
  getSearchHistory,
  addToSearchHistory,
  clearSearchHistory,
  removeFromSearchHistory,
  getRecentSearches,
  getPopularSearches,
  searchHistory,
  getSearchStats,
  exportSearchHistory,
  importSearchHistory
};
