import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiSearch, FiX, FiTrendingUp, FiTrendingDown } from "react-icons/fi";
import axios from "axios";
import StockDetail from "./StockDetail";
import Loading from "./Loading";
import { useOfflineMode } from "../context/OfflineContext";
import "../styles/StockSearch.css";

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
        } else {
          setSearchResults([]);
          setError("No stocks found matching your search");
        }
        setLoading(false);
        return;
      }

      // Use the backend proxy to search for stocks
      const response = await axios.get(
        `http://localhost:5000/api/stocks/search?query=${searchQuery}`
      );

      if (response.data && response.data.success && response.data.data && response.data.data.length > 0) {
        setSearchResults(response.data.data);
      } else {
        setSearchResults([]);
        setError("No stocks found matching your search");
      }
    } catch (err) {
      console.error("Error searching for stocks:", err);

      // If there's an error, try to use mock data as fallback
      const filteredResults = mockSearchResults.filter(stock =>
        stock.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        stock.name.toLowerCase().includes(searchQuery.toLowerCase())
      );

      if (filteredResults.length > 0) {
        console.log("Using mock data as fallback after API error");
        setSearchResults(filteredResults);
        setError(null);
      } else {
        setError("Failed to search for stocks. Please try again later.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch stock data when search query changes (with debounce)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim()) {
        handleSearch();
      } else {
        setSearchResults([]);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Handle stock selection
  const handleStockSelect = (symbol) => {
    // If onStockSelect prop is provided, call it
    if (onStockSelect) {
      onStockSelect(symbol);
      setSearchQuery("");
      setSearchResults([]);
    } else {
      // Default behavior if no onStockSelect prop
      setSelectedStock(symbol);
      setShowPopup(true);
      setSearchQuery("");
      setSearchResults([]);
    }
  };

  // Close popup
  const handleClosePopup = () => {
    setShowPopup(false);
    setSelectedStock(null);
  };

  // Handle click outside of search results
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setSearchResults([]);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

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
          />
          {searchQuery && (
            <button className="clear-search" onClick={() => setSearchQuery("")}>
              <FiX />
            </button>
          )}
        </div>

        <AnimatePresence>
          {searchResults.length > 0 && (
            <motion.div
              className="search-results"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
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
                  <div className="stock-exchange">{stock.exchangeShortName}</div>
                </motion.div>
              ))}
            </motion.div>
          )}

          {loading && (
            <motion.div
              className="search-loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Loading size="small" text="Searching..." />
            </motion.div>
          )}

          {error && searchQuery && !loading && (
            <motion.div
              className="search-error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {error}
            </motion.div>
          )}

          {isOffline && (
            <motion.div
              className="search-offline-notice"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              Using offline mode - showing mock data
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {showPopup && selectedStock && (
          <StockDetail
            symbol={selectedStock}
            onClose={handleClosePopup}
            onBuySuccess={() => {}}
            onSellSuccess={() => {}}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default StockSearch;
