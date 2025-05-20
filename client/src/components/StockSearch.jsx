import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiSearch, FiX, FiTrendingUp, FiTrendingDown, FiAlertCircle } from "react-icons/fi";
import axios from "axios";
import FullPageStockChart from "./FullPageStockChart";
import Loading from "./Loading";
import { useOfflineMode } from "../context/OfflineContext";
import { API_ENDPOINTS } from "../config/apiConfig";
import "../styles/components/StockSearch.css";

const StockSearch = ({ onStockSelect, placeholder = "Search for stocks..." }) => {
  const { isOffline } = useOfflineMode();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedStock, setSelectedStock] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const searchRef = useRef(null);

  // Mock data for offline mode
  const mockSearchResults = [
    { symbol: "AAPL", name: "Apple Inc.", exchange: "NASDAQ", exchangeShortName: "NASDAQ", type: "stock" },
    { symbol: "MSFT", name: "Microsoft Corporation", exchange: "NASDAQ", exchangeShortName: "NASDAQ", type: "stock" },
    { symbol: "GOOGL", name: "Alphabet Inc.", exchange: "NASDAQ", exchangeShortName: "NASDAQ", type: "stock" },
    { symbol: "AMZN", name: "Amazon.com Inc.", exchange: "NASDAQ", exchangeShortName: "NASDAQ", type: "stock" },
    { symbol: "META", name: "Meta Platforms Inc.", exchange: "NASDAQ", exchangeShortName: "NASDAQ", type: "stock" },
    { symbol: "TSLA", name: "Tesla, Inc.", exchange: "NASDAQ", exchangeShortName: "NASDAQ", type: "stock" },
    { symbol: "NFLX", name: "Netflix, Inc.", exchange: "NASDAQ", exchangeShortName: "NASDAQ", type: "stock" },
    { symbol: "NVDA", name: "NVIDIA Corporation", exchange: "NASDAQ", exchangeShortName: "NASDAQ", type: "stock" },
    { symbol: "RELIANCE.BSE", name: "Reliance Industries", exchange: "BSE", exchangeShortName: "BSE", type: "stock" },
    { symbol: "TCS.BSE", name: "Tata Consultancy Services", exchange: "BSE", exchangeShortName: "BSE", type: "stock" },
    { symbol: "INFY.BSE", name: "Infosys Ltd", exchange: "BSE", exchangeShortName: "BSE", type: "stock" },
    { symbol: "HDFCBANK.BSE", name: "HDFC Bank Ltd", exchange: "BSE", exchangeShortName: "BSE", type: "stock" }
  ];

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  // Handle search submission
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      console.log(`Searching for stocks with query: "${searchQuery}"`);

      // Check if we're in offline mode
      if (isOffline) {
        console.log("Using mock data for stock search in offline mode");
        // Filter mock data based on search query
        const filteredResults = mockSearchResults.filter(stock =>
          stock.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
          stock.name.toLowerCase().includes(searchQuery.toLowerCase())
        );

        if (filteredResults.length > 0) {
          setSearchResults(filteredResults);
          console.log(`Found ${filteredResults.length} stocks in offline mode`);
        } else {
          setSearchResults([]);
          setError("No stocks found matching your search");
        }
        setLoading(false);
        return;
      }

      // Try the first API endpoint (SEARCH_DIRECT)
      try {
        console.log(`Trying primary endpoint: ${API_ENDPOINTS.STOCK_SEARCH.SEARCH_DIRECT}`);
        const response = await axios.get(
          `${API_ENDPOINTS.STOCK_SEARCH.SEARCH_DIRECT}?query=${searchQuery}`,
          { timeout: 15000 } // Increase timeout to 15 seconds
        );

        if (response.data && response.data.success) {
          // Direct endpoint uses 'results'
          const stockData = response.data.results;

          if (stockData && stockData.length > 0) {
            console.log(`Found ${stockData.length} stocks from primary endpoint`);
            setSearchResults(stockData);
            setLoading(false);
            return;
          }
        }
        // If we get here, the first endpoint didn't return valid results
        throw new Error("Primary endpoint returned no results");
      } catch (primaryError) {
        console.log("Primary endpoint failed, trying secondary endpoint", primaryError);

        // Try the second API endpoint (SEARCH)
        try {
          console.log(`Trying secondary endpoint: ${API_ENDPOINTS.STOCK_SEARCH.SEARCH}`);
          const fallbackResponse = await axios.get(
            `${API_ENDPOINTS.STOCK_SEARCH.SEARCH}?query=${searchQuery}`,
            { timeout: 15000 }
          );

          if (fallbackResponse.data && fallbackResponse.data.success) {
            // Secondary endpoint uses 'data'
            const stockData = fallbackResponse.data.data;

            if (stockData && stockData.length > 0) {
              console.log(`Found ${stockData.length} stocks from secondary endpoint`);
              setSearchResults(stockData);
              setLoading(false);
              return;
            }
          }
          // If we get here, both endpoints failed to return valid results
          throw new Error("Both endpoints returned no results");
        } catch (secondaryError) {
          console.error("Both API endpoints failed:", secondaryError);
          throw new Error("Failed to fetch search results from both endpoints");
        }
      }
    } catch (err) {
      console.error("Error searching for stocks:", err);

      // If there's an error, try to use mock data as fallback
      const filteredResults = mockSearchResults.filter(stock =>
        stock.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        stock.name.toLowerCase().includes(searchQuery.toLowerCase())
      );

      if (filteredResults.length > 0) {
        console.log(`Using mock data as fallback after API error. Found ${filteredResults.length} matches.`);
        setSearchResults(filteredResults);
        setError(null);
      } else {
        console.log("No matches found in mock data");
        setSearchResults([]);
        setError("Failed to search for stocks. Please try again later.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch stock data when search query changes (with debounce)
  useEffect(() => {
    // Only search if query has at least 2 characters
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      return () => {};
    }

    // Set loading state immediately for better UX
    setLoading(true);

    // Use a longer debounce time to reduce API calls
    const timer = setTimeout(() => {
      handleSearch();
    }, 600); // 600ms debounce

    // Clean up function to clear the timeout if component unmounts or searchQuery changes again
    return () => {
      clearTimeout(timer);
      // Don't clear loading state here as it would cause flickering
    };
  }, [searchQuery]);

  // Handle stock selection
  const handleStockSelect = (symbol) => {
    console.log(`Stock selected: ${symbol}`);

    // Always set the selected stock and show popup
    setSelectedStock(symbol);
    setShowPopup(true);

    // If onStockSelect prop is provided, call it as well
    if (onStockSelect) {
      onStockSelect(symbol);
    }

    // Hide search results
    setIsSearchVisible(false);

    // Clear search input
    setSearchQuery("");

    try {
      // Add to recent searches
      const recentSearches = JSON.parse(localStorage.getItem('recentSearches') || '[]');
      const existingIndex = recentSearches.findIndex(item => item.symbol === symbol);

      if (existingIndex !== -1) {
        // Move to top if already exists
        recentSearches.splice(existingIndex, 1);
      }

      // Add to beginning of array with more information
      const selectedStock = searchResults.find(stock => stock.symbol === symbol) || { symbol };

      recentSearches.unshift({
        symbol,
        name: selectedStock.name || symbol,
        exchange: selectedStock.exchange || selectedStock.exchangeShortName || 'Unknown',
        timestamp: new Date().toISOString()
      });

      // Keep only the 10 most recent searches
      const updatedSearches = recentSearches.slice(0, 10);
      localStorage.setItem('recentSearches', JSON.stringify(updatedSearches));
      console.log('Recent searches updated successfully');
    } catch (error) {
      console.error('Error updating recent searches:', error);
      // Continue even if localStorage fails
    }
  };

  // Close popup
  const handleClosePopup = () => {
    setShowPopup(false);
    setSelectedStock(null);
  };

  // State to control search results visibility
  const [isSearchVisible, setIsSearchVisible] = useState(false);

  // Handle click outside of search results
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        // Don't clear search results, just hide them visually
        // This allows results to persist when the user clicks back on the search input
        setIsSearchVisible(false);
      }
    };

    // Add event listener
    document.addEventListener("mousedown", handleClickOutside);

    // Clean up function
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Effect to show search results when there are results and the search is active
  useEffect(() => {
    if (searchResults.length > 0 && searchQuery.trim().length >= 2) {
      setIsSearchVisible(true);
    }
  }, [searchResults, searchQuery]);

  return (
    <div className="stock-search-container">
      <div className="search-wrapper" ref={searchRef}>
        <div className="search-input-container">
          <FiSearch className="search-icon" />
          <input
            type="text"
            placeholder={placeholder}
            value={searchQuery}
            onChange={handleSearchChange}
            className="search-input"
            onFocus={() => {
              // Only show results if we have a query or results
              if (searchResults.length > 0 || searchQuery.trim().length >= 2) {
                setIsSearchVisible(true);
              }
            }}
            // Add keyboard event handling
            onKeyDown={(e) => {
              if (e.key === 'Enter' && searchQuery.trim()) {
                handleSearch();
                setIsSearchVisible(true);
              } else if (e.key === 'Escape') {
                setIsSearchVisible(false);
              }
            }}
          />
          {searchQuery && (
            <button
              className="clear-search"
              onClick={() => {
                setSearchQuery("");
                setSearchResults([]);
                setError(null);
              }}
              title="Clear search"
            >
              <FiX />
            </button>
          )}
        </div>

        <AnimatePresence>
          {/* Search results */}
          {isSearchVisible && searchResults.length > 0 && (
            <motion.div
              className="search-results"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <div className="search-results-header">
                <span>Search Results</span>
                <button
                  className="clear-search-btn"
                  onClick={() => setIsSearchVisible(false)}
                  title="Close Results"
                >
                  <FiX />
                </button>
              </div>
              {searchResults.map((stock) => (
                <motion.div
                  key={stock.symbol}
                  className="search-result-item"
                  whileHover={{ backgroundColor: "rgba(0,0,0,0.05)" }}
                  onClick={() => handleStockSelect(stock.symbol)}
                >
                  <div className="stock-info">
                    <span className="stock-symbol">{stock.symbol}</span>
                    <span className="stock-name">{stock.name}</span>
                  </div>
                  <div className="stock-exchange">{stock.exchangeShortName || stock.exchange}</div>
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* Loading indicator */}
          {isSearchVisible && loading && searchQuery.trim().length >= 2 && (
            <motion.div
              className="search-loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Loading size="small" text="Searching..." />
            </motion.div>
          )}

          {/* Error message */}
          {isSearchVisible && error && searchQuery && !loading && (
            <motion.div
              className="search-error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="search-results-header">
                <span>Search Results</span>
                <button
                  className="clear-search-btn"
                  onClick={() => setIsSearchVisible(false)}
                  title="Close Results"
                >
                  <FiX />
                </button>
              </div>
              <div className="error-content">
                <FiAlertCircle className="error-icon" />
                {error}
              </div>
            </motion.div>
          )}

          {/* Offline notice */}
          {isSearchVisible && isOffline && searchQuery.trim().length >= 2 && (
            <motion.div
              className="search-offline-notice"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              Using offline mode - showing mock data
            </motion.div>
          )}

          {/* No results message */}
          {isSearchVisible && searchQuery.trim().length >= 2 && !loading && searchResults.length === 0 && !error && (
            <motion.div
              className="search-results"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <div className="search-results-header">
                <span>Search Results</span>
                <button
                  className="clear-search-btn"
                  onClick={() => setIsSearchVisible(false)}
                  title="Close Results"
                >
                  <FiX />
                </button>
              </div>
              <div className="no-results">
                No stocks found matching "{searchQuery}"
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {showPopup && selectedStock && (
          <FullPageStockChart
            symbol={selectedStock}
            onClose={handleClosePopup}
            onTransactionSuccess={() => {
              // This will be handled by the BuySellModal component
              // which will navigate to the portfolio page
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default StockSearch;
