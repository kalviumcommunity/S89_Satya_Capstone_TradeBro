import axios from 'axios';
import Stock from '../models/Stock';
import API_ENDPOINTS from '../../config/apiConfig';
import { getCachedStockSymbols, cacheStockSymbols } from '../../utils/stockCache';
import { safeApiCall, createDummyData } from '../../utils/apiUtils';
import { addToSearchHistory, getRecentSearches, clearSearchHistory } from '../../utils/searchHistoryUtils';

/**
 * Repository for stock-related API calls
 */
class StockRepository {
  /**
   * Fetch stock symbols
   * @returns {Promise<Array>} Stock symbols
   */
  async fetchStockSymbols() {
    try {
      // Try to get cached symbols first
      const cachedSymbols = getCachedStockSymbols();
      if (cachedSymbols && cachedSymbols.length > 0) {
        return cachedSymbols;
      }

      // If no cached symbols, fetch from API
      const response = await axios.get(API_ENDPOINTS.PROXY.STOCK_SYMBOLS);
      
      if (response.data && response.data.success) {
        const symbols = response.data.data;
        // Cache the symbols
        cacheStockSymbols(symbols);
        return symbols;
      } else {
        throw new Error(response.data?.message || 'Failed to fetch stock symbols');
      }
    } catch (error) {
      console.error('Error fetching stock symbols:', error);
      // Return empty array if error
      return [];
    }
  }

  /**
   * Search stocks
   * @param {string} query - Search query
   * @returns {Promise<Array>} Search results
   */
  async searchStocks(query) {
    try {
      if (!query || query.trim() === '') {
        return [];
      }

      const response = await axios.get(API_ENDPOINTS.PROXY.STOCK_SEARCH(query));
      
      if (response.data && response.data.success) {
        return response.data.data.map(stock => Stock.fromJson(stock));
      } else {
        throw new Error(response.data?.message || 'Failed to search stocks');
      }
    } catch (error) {
      console.error('Error searching stocks:', error);
      // Return empty array if error
      return [];
    }
  }

  /**
   * Fetch stock data
   * @param {string} symbol - Stock symbol
   * @returns {Promise<Stock>} Stock data
   */
  async fetchStockData(symbol) {
    try {
      const response = await axios.get(API_ENDPOINTS.PROXY.STOCK_QUOTE(symbol));
      
      if (response.data && response.data.success) {
        return Stock.fromJson(response.data.data);
      } else {
        throw new Error(response.data?.message || 'Failed to fetch stock data');
      }
    } catch (error) {
      console.error('Error fetching stock data:', error);
      
      // Use fallback data
      const fallbackData = {
        symbol,
        price: 100 + Math.random() * 100,
        change: Math.random() * 10 - 5,
        changesPercentage: Math.random() * 5 - 2.5,
        name: symbol,
      };
      
      return Stock.fromJson(fallbackData);
    }
  }

  /**
   * Fetch chart data
   * @param {string} symbol - Stock symbol
   * @param {string} timeRange - Time range
   * @returns {Promise<Array>} Chart data
   */
  async fetchChartData(symbol, timeRange) {
    try {
      const response = await axios.get(API_ENDPOINTS.PROXY.STOCK_CHART(symbol, timeRange));
      
      if (response.data && response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data?.message || 'Failed to fetch chart data');
      }
    } catch (error) {
      console.error('Error fetching chart data:', error);
      
      // Generate dummy chart data
      return createDummyData(timeRange);
    }
  }

  /**
   * Get recent searches
   * @returns {Array} Recent searches
   */
  getRecentSearches() {
    return getRecentSearches();
  }

  /**
   * Add to recent searches
   * @param {Stock} stock - Stock to add
   * @returns {Array} Updated recent searches
   */
  addToRecentSearches(stock) {
    return addToSearchHistory(stock);
  }

  /**
   * Clear recent searches
   * @returns {Array} Empty array
   */
  clearRecentSearches() {
    return clearSearchHistory();
  }
}

export default new StockRepository();
