import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiSearch,
  FiX,
  FiTrendingUp,
  FiClock,
  FiStar,
  FiPlus,
  FiBarChart2,
  FiLoader
} from 'react-icons/fi';
import { useToast } from '../context/ToastContext';
import {
  addToSearchHistory,
  getRecentSearches,
  getTrendingStocks,
  formatStockSymbol,
  getStockExchange,
  debounce
} from '../utils/searchUtils';
import '../styles/components/StockSearch.css';

const StockSearch = ({
  placeholder = "Search stocks...",
  onStockSelect,
  onAddToWatchlist,
  showWatchlistButton = true,
  showChartButton = true,
  variant = "default", // default, compact, minimal
  className = ""
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('recent'); // recent, trending, results
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  const searchRef = useRef(null);
  const resultsRef = useRef(null);
  const { success, error } = useToast();

  // Handle chart opening by redirecting to charts page
  const openChart = (symbol) => {
    window.location.href = `/charts?symbol=${symbol}`;
  };

  // Get recent searches and trending stocks
  const recentSearches = getRecentSearches(5);
  const trendingStocks = getTrendingStocks();

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (searchQuery) => {
      if (!searchQuery.trim() || searchQuery.length < 2) {
        setResults([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        // Call the search API
        const response = await fetch(`/api/search/stocks?q=${encodeURIComponent(searchQuery)}`);
        const data = await response.json();
        
        if (data.success) {
          setResults(data.results || []);
          setActiveSection('results');
        } else {
          setResults([]);
          error('Failed to search stocks');
        }
      } catch (error) {
        console.error('Search error:', error);
        setResults([]);
        error('Search failed. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }, 300),
    [error]
  );

  // Handle input change
  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    setSelectedIndex(-1);

    if (value.trim().length >= 2) {
      debouncedSearch(value);
    } else {
      setResults([]);
      setActiveSection(recentSearches.length > 0 ? 'recent' : 'trending');
    }
  };

  // Handle input focus
  const handleInputFocus = () => {
    setIsOpen(true);
    if (query.trim().length < 2) {
      setActiveSection(recentSearches.length > 0 ? 'recent' : 'trending');
    }
  };

  // Handle input blur
  const handleInputBlur = (e) => {
    // Delay closing to allow clicks on results
    setTimeout(() => {
      if (!resultsRef.current?.contains(document.activeElement)) {
        setIsOpen(false);
      }
    }, 150);
  };

  // Handle stock selection
  const handleStockClick = (stock) => {
    addToSearchHistory(stock);
    setQuery('');
    setIsOpen(false);
    
    if (onStockSelect) {
      onStockSelect(stock.symbol, stock.name);
    }
    
    success(`Selected ${formatStockSymbol(stock.symbol)}`);
  };

  // Handle add to watchlist
  const handleAddToWatchlist = (stock, e) => {
    e.stopPropagation();
    
    if (onAddToWatchlist) {
      onAddToWatchlist(stock.symbol, stock.name);
    }
    
    success(`Added ${formatStockSymbol(stock.symbol)} to watchlist`);
  };

  // Handle chart view
  const handleViewChart = (stock, e) => {
    e.stopPropagation();
    openChart(stock.symbol, stock.name);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (!isOpen) return;

    const currentItems = getCurrentItems();
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < currentItems.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : currentItems.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && currentItems[selectedIndex]) {
          handleStockClick(currentItems[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        searchRef.current?.blur();
        break;
    }
  };

  // Get current items based on active section
  const getCurrentItems = () => {
    switch (activeSection) {
      case 'recent':
        return recentSearches;
      case 'trending':
        return trendingStocks;
      case 'results':
        return results;
      default:
        return [];
    }
  };

  // Clear search
  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setSelectedIndex(-1);
    setActiveSection(recentSearches.length > 0 ? 'recent' : 'trending');
    searchRef.current?.focus();
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`stock-search ${variant} ${className}`} ref={searchRef}>
      {/* Search Input */}
      <div className="search-input-container">
        <FiSearch className="search-icon" />
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="search-input"
          autoComplete="off"
        />
        {query && (
          <button
            type="button"
            onClick={clearSearch}
            className="clear-button"
            aria-label="Clear search"
          >
            <FiX />
          </button>
        )}
        {isLoading && (
          <div className="loading-indicator">
            <FiLoader className="spin" />
          </div>
        )}
      </div>

      {/* Search Results Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={resultsRef}
            className="search-dropdown"
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            {/* Recent Searches */}
            {activeSection === 'recent' && recentSearches.length > 0 && (
              <div className="search-section">
                <div className="section-header">
                  <FiClock className="section-icon" />
                  <span>Recent Searches</span>
                </div>
                <div className="search-items">
                  {recentSearches.map((stock, index) => (
                    <SearchResultItem
                      key={`recent-${stock.symbol}`}
                      stock={stock}
                      isSelected={selectedIndex === index}
                      onSelect={handleStockClick}
                      onAddToWatchlist={showWatchlistButton ? handleAddToWatchlist : null}
                      onViewChart={showChartButton ? handleViewChart : null}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Trending Stocks */}
            {(activeSection === 'trending' || (activeSection === 'recent' && recentSearches.length === 0)) && (
              <div className="search-section">
                <div className="section-header">
                  <FiTrendingUp className="section-icon" />
                  <span>Trending Stocks</span>
                </div>
                <div className="search-items">
                  {trendingStocks.slice(0, 6).map((stock, index) => (
                    <SearchResultItem
                      key={`trending-${stock.symbol}`}
                      stock={stock}
                      isSelected={selectedIndex === index}
                      onSelect={handleStockClick}
                      onAddToWatchlist={showWatchlistButton ? handleAddToWatchlist : null}
                      onViewChart={showChartButton ? handleViewChart : null}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Search Results */}
            {activeSection === 'results' && (
              <div className="search-section">
                <div className="section-header">
                  <FiSearch className="section-icon" />
                  <span>Search Results</span>
                </div>
                <div className="search-items">
                  {results.length > 0 ? (
                    results.map((stock, index) => (
                      <SearchResultItem
                        key={`result-${stock.symbol}`}
                        stock={stock}
                        isSelected={selectedIndex === index}
                        onSelect={handleStockClick}
                        onAddToWatchlist={showWatchlistButton ? handleAddToWatchlist : null}
                        onViewChart={showChartButton ? handleViewChart : null}
                        highlightQuery={query}
                      />
                    ))
                  ) : (
                    <div className="no-results">
                      <FiSearch className="no-results-icon" />
                      <p>No stocks found for "{query}"</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chart functionality moved to dedicated charts page */}
    </div>
  );
};

// Search Result Item Component
const SearchResultItem = ({ 
  stock, 
  isSelected, 
  onSelect, 
  onAddToWatchlist, 
  onViewChart,
  highlightQuery 
}) => {
  const displaySymbol = formatStockSymbol(stock.symbol);
  const exchange = getStockExchange(stock.symbol);

  return (
    <motion.div
      className={`search-result-item ${isSelected ? 'selected' : ''}`}
      onClick={() => onSelect(stock)}
      whileHover={{ backgroundColor: "rgba(59, 130, 246, 0.05)" }}
      transition={{ duration: 0.15 }}
    >
      <div className="stock-info">
        <div className="stock-symbol">
          {displaySymbol}
          <span className="exchange-badge">{exchange}</span>
        </div>
        <div className="stock-name">{stock.name}</div>
        {stock.sector && (
          <div className="stock-sector">{stock.sector}</div>
        )}
      </div>
      
      <div className="action-buttons">
        {onViewChart && (
          <button
            className="action-btn chart-btn"
            onClick={(e) => onViewChart(stock, e)}
            title="View Chart"
          >
            <FiBarChart2 />
          </button>
        )}
        {onAddToWatchlist && (
          <button
            className="action-btn watchlist-btn"
            onClick={(e) => onAddToWatchlist(stock, e)}
            title="Add to Watchlist"
          >
            <FiPlus />
          </button>
        )}
      </div>
    </motion.div>
  );
};

export default StockSearch;
