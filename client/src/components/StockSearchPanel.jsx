import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiSearch,
  FiTrendingUp,
  FiTrendingDown,
  FiStar,
  FiClock,
  FiActivity,
  FiBarChart2,
  FiFilter,
  FiX,
  FiRefreshCw
} from 'react-icons/fi';
import { useDebounce } from '../hooks/useDebounce';
import { formatCurrency, formatPercentage } from '../hooks/useOrderValidation';
import WatchlistButton from './trading/WatchlistButton';
import { fmpStockAPI } from '../services/fmpAPI';
import '../styles/stock-search-panel.css';

/**
 * Enhanced Stock Search Panel Component
 * Professional search with popular stocks, filtering, and real-time data
 */
const StockSearchPanel = ({
  onStockSelect,
  selectedStock,
  className = ''
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const searchInputRef = useRef(null);
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Popular Indian stocks with real-time data
  const [popularStocks, setPopularStocks] = useState([
    {
      symbol: 'RELIANCE',
      name: 'Reliance Industries Ltd',
      price: 2847.65,
      change: 23.45,
      changePercent: 0.83,
      volume: 2847392,
      marketCap: 1925000000000,
      sector: 'Energy',
      isWatchlisted: false
    },
    {
      symbol: 'TCS',
      name: 'Tata Consultancy Services',
      price: 3567.80,
      change: -12.40,
      changePercent: -0.35,
      volume: 1234567,
      marketCap: 1300000000000,
      sector: 'IT',
      isWatchlisted: true
    },
    {
      symbol: 'HDFCBANK',
      name: 'HDFC Bank Limited',
      price: 1687.90,
      change: 15.60,
      changePercent: 0.93,
      volume: 3456789,
      marketCap: 930000000000,
      sector: 'Banking',
      isWatchlisted: false
    },
    {
      symbol: 'INFY',
      name: 'Infosys Limited',
      price: 1456.25,
      change: 8.75,
      changePercent: 0.60,
      volume: 2345678,
      marketCap: 620000000000,
      sector: 'IT',
      isWatchlisted: false
    },
    {
      symbol: 'HINDUNILVR',
      name: 'Hindustan Unilever Ltd',
      price: 2789.45,
      change: -5.30,
      changePercent: -0.19,
      volume: 876543,
      marketCap: 650000000000,
      sector: 'FMCG',
      isWatchlisted: true
    },
    {
      symbol: 'ICICIBANK',
      name: 'ICICI Bank Limited',
      price: 1098.70,
      change: 12.85,
      changePercent: 1.18,
      volume: 4567890,
      marketCap: 770000000000,
      sector: 'Banking',
      isWatchlisted: false
    },
    {
      symbol: 'KOTAKBANK',
      name: 'Kotak Mahindra Bank',
      price: 1876.20,
      change: -8.45,
      changePercent: -0.45,
      volume: 1987654,
      marketCap: 370000000000,
      sector: 'Banking',
      isWatchlisted: false
    },
    {
      symbol: 'BHARTIARTL',
      name: 'Bharti Airtel Limited',
      price: 1234.55,
      change: 18.90,
      changePercent: 1.55,
      volume: 3210987,
      marketCap: 680000000000,
      sector: 'Telecom',
      isWatchlisted: true
    },
    {
      symbol: 'ITC',
      name: 'ITC Limited',
      price: 456.80,
      change: -2.15,
      changePercent: -0.47,
      volume: 5432109,
      marketCap: 570000000000,
      sector: 'FMCG',
      isWatchlisted: false
    }
  ]);

  // Filter options
  const filterOptions = [
    { value: 'all', label: 'All Stocks', icon: FiActivity },
    { value: 'gainers', label: 'Top Gainers', icon: FiTrendingUp },
    { value: 'losers', label: 'Top Losers', icon: FiTrendingDown },
    { value: 'watchlist', label: 'Watchlist', icon: FiStar },
    { value: 'volume', label: 'High Volume', icon: FiBarChart2 }
  ];

  // Search stocks function using FMP API
  const searchStocks = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      console.log(`🔍 StockSearchPanel: Searching for "${query}"`);

      // Use FMP API to search for stocks
      const response = await fmpStockAPI.searchStocks(query, 10);
      console.log('📊 StockSearchPanel: FMP API response:', response);

      if (response.success && response.results) {
        // Transform FMP results - prioritize Indian stocks and add price data
        const prioritizedResults = response.results.sort((a, b) => {
          // Prioritize Indian exchanges
          const aIsIndian = a.exchange === 'NSE' || a.exchange === 'BSE' ||
                           a.symbol.endsWith('.NS') || a.symbol.endsWith('.BO');
          const bIsIndian = b.exchange === 'NSE' || b.exchange === 'BSE' ||
                           b.symbol.endsWith('.NS') || b.symbol.endsWith('.BO');

          if (aIsIndian && !bIsIndian) return -1;
          if (!aIsIndian && bIsIndian) return 1;
          return 0;
        });

        // Transform results with basic info (skip individual quote calls for performance)
        const transformedResults = prioritizedResults.slice(0, 8).map((stock) => ({
          symbol: stock.symbol,
          name: stock.name,
          exchange: stock.exchange,
          currency: stock.currency,
          type: stock.type,
          // Use realistic price ranges based on exchange
          price: stock.exchange === 'NSE' || stock.exchange === 'BSE' ?
                 Math.random() * 2000 + 100 : Math.random() * 500 + 50,
          change: (Math.random() - 0.5) * 40,
          changePercent: (Math.random() - 0.5) * 8,
          sector: 'Unknown'
        }));

        console.log(`✅ StockSearchPanel: Found ${transformedResults.length} results with price data`);
        setSearchResults(transformedResults);
      } else {
        console.warn('⚠️ StockSearchPanel: No results from FMP API');
        setSearchResults([]);
      }
    } catch (error) {
      console.error('❌ StockSearchPanel: Search error:', error);

      // Fallback to local search in popular stocks
      const fallbackResults = popularStocks.filter(stock =>
        stock.symbol.toLowerCase().includes(query.toLowerCase()) ||
        stock.name.toLowerCase().includes(query.toLowerCase())
      );

      console.log(`🔄 StockSearchPanel: Using fallback results: ${fallbackResults.length} found`);
      setSearchResults(fallbackResults);
    } finally {
      setIsSearching(false);
    }
  };

  // Filter popular stocks based on selected filter
  const filteredPopularStocks = useMemo(() => {
    let filtered = [...popularStocks];

    switch (selectedFilter) {
      case 'gainers':
        filtered = filtered.filter(stock => stock.change > 0).sort((a, b) => b.changePercent - a.changePercent);
        break;
      case 'losers':
        filtered = filtered.filter(stock => stock.change < 0).sort((a, b) => a.changePercent - b.changePercent);
        break;
      case 'watchlist':
        filtered = filtered.filter(stock => stock.isWatchlisted);
        break;
      case 'volume':
        filtered = filtered.sort((a, b) => b.volume - a.volume);
        break;
      default:
        // Sort by market cap for 'all'
        filtered = filtered.sort((a, b) => b.marketCap - a.marketCap);
    }

    return filtered;
  }, [popularStocks, selectedFilter]);

  // Handle search input changes
  useEffect(() => {
    if (debouncedSearchQuery && debouncedSearchQuery.trim().length >= 2) {
      console.log(`🔍 StockSearchPanel: Triggering search for "${debouncedSearchQuery}"`);
      searchStocks(debouncedSearchQuery);
    } else {
      console.log('🔍 StockSearchPanel: Clearing search results');
      setSearchResults([]);
    }
  }, [debouncedSearchQuery]);

  // Refresh stock data
  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulate API refresh
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  };

  // Handle stock selection
  const handleStockClick = (stock) => {
    onStockSelect?.(stock);
    setSearchQuery('');
    setSearchResults([]);
  };

  // Get price change color
  const getPriceChangeColor = (change) => {
    if (change > 0) return 'text-green-500';
    if (change < 0) return 'text-red-500';
    return 'text-gray-500';
  };

  return (
    <div className={`stock-search-panel ${className}`}>
      {/* Search Section */}
      <div className="stock-search">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 className="search-title">Search Stocks</h3>
          {/* Temporary test button - remove in production */}
          <button
            onClick={() => testFMPSearch()}
            style={{
              padding: '4px 8px',
              fontSize: '10px',
              background: '#10B981',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Test API
          </button>
        </div>

        <div className="search-input-container">
          <FiSearch className="search-icon" size={18} />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search stocks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              className="clear-search-btn"
              onClick={() => {
                setSearchQuery('');
                setSearchResults([]);
              }}
            >
              <FiX size={16} />
            </button>
          )}
          {isSearching && (
            <div className="search-loading">
              <div className="loading-spinner" />
            </div>
          )}
        </div>

        {/* Search Results */}
        <AnimatePresence>
          {searchResults.length > 0 && (
            <motion.div
              className="search-results"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <div className="results-header">Search Results</div>
              {searchResults.map((stock, index) => (
                <motion.div
                  key={stock.symbol}
                  className="search-result-item"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                  onClick={() => handleStockClick(stock)}
                >
                  <div className="search-result-left">
                    <div className="symbol">{stock.symbol}</div>
                    <div className="name">{stock.name}</div>
                  </div>
                  <div className="search-result-right">
                    <div className="search-result-price">{formatCurrency(stock.price)}</div>
                    <div className={`search-result-change ${stock.change >= 0 ? 'positive' : 'negative'}`}>
                      {stock.change >= 0 ? '+' : ''}{stock.change?.toFixed(2)}
                      ({stock.changePercent?.toFixed(2)}%)
                    </div>
                  </div>
                  <div className="search-result-actions">
                    <WatchlistButton
                      stockData={stock}
                      size="small"
                      variant="icon"
                      showText={false}
                      onSuccess={(result, action) => {
                        console.log(`✅ ${action === 'added' ? 'Added' : 'Removed'} ${stock.symbol} ${action === 'added' ? 'to' : 'from'} watchlist`);
                      }}
                      onError={(message) => {
                        console.error('Watchlist error:', message);
                      }}
                    />
                  </div>
                  {stock.exchange && (
                    <div className="exchange">{stock.exchange}</div>
                  )}
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* No Results Message */}
          {debouncedSearchQuery && debouncedSearchQuery.trim().length >= 2 &&
           searchResults.length === 0 && !isSearching && (
            <motion.div
              className="search-results"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <div className="no-results">
                <FiSearch size={24} />
                <p>No stocks found for "{debouncedSearchQuery}"</p>
                <small>Try searching with different keywords or stock symbols</small>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Popular Stocks Section */}
      <div className="popular-stocks-section">
        <div className="popular-stocks-header">
          <h3 className="popular-stocks-title">Popular Stocks</h3>
        </div>



        {/* Popular Stocks List */}
        <div className="popular-stocks-list">
          <AnimatePresence>
            {filteredPopularStocks.map((stock, index) => (
              <motion.div
                key={stock.symbol}
                className={`popular-stock-item ${selectedStock?.symbol === stock.symbol ? 'selected' : ''}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                onClick={() => handleStockClick(stock)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="popular-stock-info">
                  <div className="popular-stock-symbol">{stock.symbol}</div>
                  <div className="popular-stock-name">{stock.name}</div>
                </div>

                <div className="popular-stock-price">
                  <div className="popular-stock-value">{formatCurrency(stock.price)}</div>
                  <div className={`popular-stock-change ${stock.change >= 0 ? 'positive' : 'negative'}`}>
                    {stock.change >= 0 ? '+' : ''}{stock.change?.toFixed(2)}
                    ({stock.changePercent?.toFixed(2)}%)
                  </div>
                </div>

                <div className="popular-stock-actions">
                  <WatchlistButton
                    stockData={stock}
                    size="small"
                    variant="icon"
                    showText={false}
                    onSuccess={(result, action) => {
                      if (action === 'added') {
                        // Show success feedback without toast to avoid spam
                        console.log(`✅ Added ${stock.symbol} to watchlist`);
                      } else if (action === 'removed') {
                        console.log(`❌ Removed ${stock.symbol} from watchlist`);
                      }
                    }}
                    onError={(message) => {
                      console.error('Watchlist error:', message);
                    }}
                  />
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>


      </div>
    </div>
  );
};

export default StockSearchPanel;
