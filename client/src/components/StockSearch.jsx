import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiSearch, FiX, FiTrendingUp, FiTrendingDown } from "react-icons/fi";
import axios from "axios";
import StockDetail from "./StockDetail";
import Loading from "./Loading";
import "../styles/StockSearch.css";

const StockSearch = ({ onStockSelect, placeholder = "Search for stocks..." }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedStock, setSelectedStock] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const searchRef = useRef(null);

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

      // Use the FMP API to search for stocks
      const apiKey = "VCMjfaz3k5CjRqbLvtpMALKTks5YVLxx";
      const response = await axios.get(
        `https://financialmodelingprep.com/api/v3/search?query=${searchQuery}&limit=10&apikey=${apiKey}`
      );

      if (response.data && response.data.length > 0) {
        setSearchResults(response.data);
      } else {
        setSearchResults([]);
        setError("No stocks found matching your search");
      }
    } catch (err) {
      console.error("Error searching for stocks:", err);
      setError("Failed to search for stocks. Please try again later.");
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
