import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSearch, FiX, FiTrendingUp, FiTrendingDown } from 'react-icons/fi';
import chartApi from '../../services/chartApi';
import './StockSelector.css';

const StockSelector = ({
  selectedSymbol = '',
  onSymbolSelect = () => {},
  placeholder = 'Search stocks (e.g., TCS, INFY, RELIANCE)',
  className = ''
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [popularStocks, setPopularStocks] = useState([]);
  const [marketMovers, setMarketMovers] = useState({ gainers: [], losers: [] });
  
  const searchInputRef = useRef();
  const dropdownRef = useRef();
  const searchTimeoutRef = useRef();

  // Popular Indian stocks
  const defaultPopularStocks = [
    { symbol: 'TCS', name: 'Tata Consultancy Services', exchange: 'NSE' },
    { symbol: 'INFY', name: 'Infosys Limited', exchange: 'NSE' },
    { symbol: 'RELIANCE', name: 'Reliance Industries', exchange: 'NSE' },
    { symbol: 'HDFCBANK', name: 'HDFC Bank Limited', exchange: 'NSE' },
    { symbol: 'ICICIBANK', name: 'ICICI Bank Limited', exchange: 'NSE' },
    { symbol: 'SBIN', name: 'State Bank of India', exchange: 'NSE' },
    { symbol: 'BHARTIARTL', name: 'Bharti Airtel Limited', exchange: 'NSE' },
    { symbol: 'ITC', name: 'ITC Limited', exchange: 'NSE' },
    { symbol: 'KOTAKBANK', name: 'Kotak Mahindra Bank', exchange: 'NSE' },
    { symbol: 'LT', name: 'Larsen & Toubro Limited', exchange: 'NSE' }
  ];

  // Load market movers on component mount
  useEffect(() => {
    loadMarketMovers();
    setPopularStocks(defaultPopularStocks);
  }, []);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadMarketMovers = async () => {
    try {
      const [gainers, losers] = await Promise.all([
        chartApi.getMarketMovers('gainers'),
        chartApi.getMarketMovers('losers')
      ]);
      
      setMarketMovers({ gainers: gainers.slice(0, 5), losers: losers.slice(0, 5) });
    } catch (error) {
      console.error('Error loading market movers:', error);
    }
  };

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    setShowDropdown(true);

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Debounce search
    if (query.length >= 2) {
      setIsSearching(true);
      searchTimeoutRef.current = setTimeout(async () => {
        try {
          const results = await chartApi.searchStocks(query);
          setSearchResults(results);
        } catch (error) {
          console.error('Search error:', error);
          setSearchResults([]);
        } finally {
          setIsSearching(false);
        }
      }, 300);
    } else {
      setSearchResults([]);
      setIsSearching(false);
    }
  };

  const handleSymbolSelect = (symbol, name = '') => {
    onSymbolSelect(symbol, name);
    setSearchQuery('');
    setShowDropdown(false);
    setSearchResults([]);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setShowDropdown(false);
    searchInputRef.current?.focus();
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price);
  };

  const formatPercentage = (percentage) => {
    const sign = percentage >= 0 ? '+' : '';
    return `${sign}${percentage.toFixed(2)}%`;
  };

  return (
    <div className={`stock-selector ${className}`} ref={dropdownRef}>
      {/* Search Input */}
      <div className="search-input-container">
        <div className="search-input-wrapper">
          <FiSearch className="search-icon" size={20} />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            onFocus={() => setShowDropdown(true)}
            placeholder={placeholder}
            className="search-input"
          />
          {searchQuery && (
            <button onClick={clearSearch} className="clear-search-btn">
              <FiX size={16} />
            </button>
          )}
        </div>
        
        {selectedSymbol && (
          <div className="selected-symbol">
            <span className="symbol-badge">{selectedSymbol}</span>
          </div>
        )}
      </div>

      {/* Dropdown */}
      <AnimatePresence>
        {showDropdown && (
          <motion.div
            className="search-dropdown"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {/* Search Results */}
            {searchQuery.length >= 2 && (
              <div className="dropdown-section">
                <h4 className="section-title">
                  Search Results
                  {isSearching && <div className="inline-spinner" />}
                </h4>
                
                {searchResults.length > 0 ? (
                  <div className="results-list">
                    {searchResults.map((stock, index) => (
                      <motion.button
                        key={`${stock.symbol}-${index}`}
                        className="result-item"
                        onClick={() => handleSymbolSelect(stock.symbol, stock.name)}
                        whileHover={{ backgroundColor: 'rgba(59, 130, 246, 0.1)' }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="stock-info">
                          <span className="stock-symbol">{stock.symbol}</span>
                          <span className="stock-name">{stock.name}</span>
                        </div>
                        <div className="stock-meta">
                          <span className="stock-exchange">{stock.exchangeShortName}</span>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                ) : !isSearching ? (
                  <div className="no-results">
                    <p>No stocks found for "{searchQuery}"</p>
                  </div>
                ) : null}
              </div>
            )}

            {/* Popular Stocks */}
            {searchQuery.length < 2 && (
              <div className="dropdown-section">
                <h4 className="section-title">Popular Stocks</h4>
                <div className="results-list">
                  {popularStocks.map((stock) => (
                    <motion.button
                      key={stock.symbol}
                      className="result-item popular-item"
                      onClick={() => handleSymbolSelect(stock.symbol, stock.name)}
                      whileHover={{ backgroundColor: 'rgba(59, 130, 246, 0.1)' }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="stock-info">
                        <span className="stock-symbol">{stock.symbol}</span>
                        <span className="stock-name">{stock.name}</span>
                      </div>
                      <div className="stock-meta">
                        <span className="stock-exchange">{stock.exchange}</span>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {/* Market Movers */}
            {searchQuery.length < 2 && marketMovers.gainers.length > 0 && (
              <div className="dropdown-section">
                <h4 className="section-title">Market Movers</h4>
                
                {/* Top Gainers */}
                <div className="movers-subsection">
                  <h5 className="subsection-title">
                    <FiTrendingUp className="trend-icon positive" />
                    Top Gainers
                  </h5>
                  <div className="movers-list">
                    {marketMovers.gainers.map((stock) => (
                      <motion.button
                        key={`gainer-${stock.symbol}`}
                        className="mover-item positive"
                        onClick={() => handleSymbolSelect(stock.symbol, stock.name)}
                        whileHover={{ backgroundColor: 'rgba(16, 185, 129, 0.1)' }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="stock-info">
                          <span className="stock-symbol">{stock.symbol}</span>
                          <span className="stock-price">{formatPrice(stock.price)}</span>
                        </div>
                        <div className="stock-change positive">
                          {formatPercentage(stock.changesPercentage)}
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Top Losers */}
                <div className="movers-subsection">
                  <h5 className="subsection-title">
                    <FiTrendingDown className="trend-icon negative" />
                    Top Losers
                  </h5>
                  <div className="movers-list">
                    {marketMovers.losers.map((stock) => (
                      <motion.button
                        key={`loser-${stock.symbol}`}
                        className="mover-item negative"
                        onClick={() => handleSymbolSelect(stock.symbol, stock.name)}
                        whileHover={{ backgroundColor: 'rgba(239, 68, 68, 0.1)' }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="stock-info">
                          <span className="stock-symbol">{stock.symbol}</span>
                          <span className="stock-price">{formatPrice(stock.price)}</span>
                        </div>
                        <div className="stock-change negative">
                          {formatPercentage(stock.changesPercentage)}
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StockSelector;
