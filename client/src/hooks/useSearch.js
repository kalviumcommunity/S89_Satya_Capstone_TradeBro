import { useState, useEffect, useCallback, useMemo } from 'react';
import { stockAPI, newsAPI, tradingAPI, watchlistAPI } from '../services/api';
import { fmpStockAPI } from '../services/fmpAPI';
import {
  addToSearchHistory,
  getRecentSearches,
  searchHistory
} from '../utils/searchHistory';

/**
 * Custom hook for handling search functionality across different data types
 * @param {string} searchType - Type of search ('stocks', 'news', 'orders', 'watchlist')
 * @param {Object} options - Search options and filters
 * @returns {Object} Search state and functions
 */
export const useSearch = (searchType, options = {}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [debounceTimer, setDebounceTimer] = useState(null);
  const [recentSearches, setRecentSearches] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  const {
    debounceMs = 300,
    minQueryLength = 2,
    limit = 10,
    enableSuggestions = true,
    enableHistory = true,
    filters = {},
    onResults = null,
    onError = null
  } = options;

  // Load recent searches on mount
  useEffect(() => {
    if (enableHistory) {
      setRecentSearches(getRecentSearches(searchType));
    }
  }, [searchType, enableHistory]);

  // Debounced search function
  const debouncedSearch = useCallback((searchQuery) => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    const timer = setTimeout(async () => {
      if (searchQuery.length >= minQueryLength) {
        await performSearch(searchQuery);
      } else {
        setResults([]);
        setSuggestions([]);
        setError(null);
      }
    }, debounceMs);

    setDebounceTimer(timer);
  }, [debounceTimer, minQueryLength, debounceMs]);

  // Main search function
  const performSearch = useCallback(async (searchQuery) => {
    if (!searchQuery || searchQuery.length < minQueryLength) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let searchResults = [];
      let searchSuggestions = [];

      switch (searchType) {
        case 'stocks':
          // Search stocks using FMP API
          console.log(`🔍 Searching stocks for: "${searchQuery}"`);
          const stockResponse = await fmpStockAPI.searchStocks(searchQuery, limit);
          console.log('📊 Stock search response:', stockResponse);
          searchResults = stockResponse.success ? stockResponse.results : [];
          console.log(`📈 Found ${searchResults.length} search results`);

          // Filter for Indian stocks (NSE/BSE) if needed
          if (searchResults.length > 0) {
            // Prioritize Indian stocks but include all results
            const indianStocks = searchResults.filter(stock =>
              stock.exchange === 'NSE' || stock.exchange === 'BSE' ||
              stock.symbol.endsWith('.NS') || stock.symbol.endsWith('.BO')
            );
            const otherStocks = searchResults.filter(stock =>
              !(stock.exchange === 'NSE' || stock.exchange === 'BSE' ||
                stock.symbol.endsWith('.NS') || stock.symbol.endsWith('.BO'))
            );
            searchResults = [...indianStocks, ...otherStocks];
            console.log(`🇮🇳 Indian stocks: ${indianStocks.length}, Other stocks: ${otherStocks.length}`);
          }

          // Get suggestions if enabled (use same search results as suggestions)
          if (enableSuggestions && searchQuery.length >= 1) {
            searchSuggestions = searchResults.slice(0, 5);
          }
          break;

        case 'news':
          // Search news
          const newsResponse = await newsAPI.searchNews(searchQuery, limit);
          searchResults = newsResponse.success ? newsResponse.data : [];
          break;

        case 'orders':
          // Search orders by stock symbol
          const ordersResponse = await tradingAPI.searchOrders(searchQuery, filters);
          searchResults = ordersResponse.success ? ordersResponse.data : [];
          break;

        case 'watchlist':
          // Search stocks for watchlist
          const watchlistResponse = await watchlistAPI.searchStocks(searchQuery, limit);
          searchResults = watchlistResponse.success ? watchlistResponse.data : [];
          break;

        default:
          throw new Error(`Unsupported search type: ${searchType}`);
      }

      console.log('🎯 Setting search results:', searchResults);
      console.log('💡 Setting search suggestions:', searchSuggestions);
      setResults(searchResults);
      setSuggestions(searchSuggestions);

      // Add to search history if enabled and has results
      if (enableHistory && searchResults.length > 0) {
        addToSearchHistory(searchType, searchQuery, {
          resultsCount: searchResults.length,
          hasResults: true
        });
        setRecentSearches(getRecentSearches(searchType));
      }

      // Call onResults callback if provided
      if (onResults) {
        onResults(searchResults, searchQuery);
      }

    } catch (searchError) {
      console.error(`Search error for ${searchType}:`, searchError);
      setError(searchError.message || 'Search failed');
      setResults([]);
      setSuggestions([]);

      // Call onError callback if provided
      if (onError) {
        onError(searchError, searchQuery);
      }
    } finally {
      setLoading(false);
    }
  }, [searchType, limit, minQueryLength, enableSuggestions, filters, onResults, onError]);

  // Handle query change
  const handleQueryChange = useCallback((newQuery) => {
    setQuery(newQuery);
    debouncedSearch(newQuery);
  }, [debouncedSearch]);

  // Clear search
  const clearSearch = useCallback(() => {
    setQuery('');
    setResults([]);
    setSuggestions([]);
    setError(null);
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
  }, [debounceTimer]);

  // Manual search trigger
  const triggerSearch = useCallback((searchQuery = query) => {
    performSearch(searchQuery);
  }, [performSearch, query]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [debounceTimer]);

  // Handle history item click
  const handleHistoryClick = useCallback((historyItem) => {
    setQuery(historyItem.query);
    setShowHistory(false);
    triggerSearch(historyItem.query);
  }, [triggerSearch]);

  // Memoized return object
  return useMemo(() => ({
    // State
    query,
    results,
    suggestions,
    loading,
    error,
    recentSearches,
    showHistory,

    // Actions
    setQuery: handleQueryChange,
    clearSearch,
    triggerSearch,
    setShowHistory,
    handleHistoryClick,

    // Computed
    hasResults: results.length > 0,
    hasSuggestions: suggestions.length > 0,
    hasRecentSearches: recentSearches.length > 0,
    isEmpty: !loading && results.length === 0 && query.length >= minQueryLength,

    // Config
    searchType,
    minQueryLength,
    enableHistory
  }), [
    query, results, suggestions, loading, error, recentSearches, showHistory,
    handleQueryChange, clearSearch, triggerSearch, handleHistoryClick,
    searchType, minQueryLength, enableHistory
  ]);
};

/**
 * Hook for stock search with additional features
 */
export const useStockSearch = (options = {}) => {
  return useSearch('stocks', {
    enableSuggestions: true,
    limit: 10,
    ...options
  });
};

/**
 * Hook for news search
 */
export const useNewsSearch = (options = {}) => {
  return useSearch('news', {
    enableSuggestions: false,
    limit: 20,
    ...options
  });
};

/**
 * Hook for order search
 */
export const useOrderSearch = (options = {}) => {
  return useSearch('orders', {
    enableSuggestions: false,
    limit: 20,
    minQueryLength: 1,
    ...options
  });
};

/**
 * Hook for watchlist search
 */
export const useWatchlistSearch = (options = {}) => {
  return useSearch('watchlist', {
    enableSuggestions: true,
    limit: 10,
    ...options
  });
};

export default useSearch;
