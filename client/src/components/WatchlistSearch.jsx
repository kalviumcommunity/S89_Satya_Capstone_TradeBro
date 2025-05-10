import React, { useState, useEffect, useRef, Fragment } from "react";
import { FiSearch, FiPlus, FiCheck, FiClock, FiTrash2, FiX } from "react-icons/fi";
import axios from "axios";
import { useToast } from "../hooks/useToast";
import { useOfflineMode } from "../context/OfflineContext";
import { addToSearchHistory, getRecentSearches, clearSearchHistory } from "../utils/searchHistoryUtils";
import API_ENDPOINTS from "../config/apiConfig";
import "../styles/WatchlistSearch.css";

const WatchlistSearch = ({ onAddStock, watchlistSymbols = [] }) => {
  const toast = useToast();
  const { isOffline } = useOfflineMode();
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const [showRecentSearches, setShowRecentSearches] = useState(false);
  const searchRef = useRef(null);

  // Mock data for offline mode
  const mockSearchResults = [
    { symbol: "AAPL", name: "Apple Inc.", exchange: "NASDAQ", type: "stock", inWatchlist: false },
    { symbol: "MSFT", name: "Microsoft Corporation", exchange: "NASDAQ", type: "stock", inWatchlist: false },
    { symbol: "GOOGL", name: "Alphabet Inc.", exchange: "NASDAQ", type: "stock", inWatchlist: false },
    { symbol: "AMZN", name: "Amazon.com Inc.", exchange: "NASDAQ", type: "stock", inWatchlist: false },
    { symbol: "META", name: "Meta Platforms Inc.", exchange: "NASDAQ", type: "stock", inWatchlist: false },
    { symbol: "TSLA", name: "Tesla, Inc.", exchange: "NASDAQ", type: "stock", inWatchlist: false },
    { symbol: "NFLX", name: "Netflix, Inc.", exchange: "NASDAQ", type: "stock", inWatchlist: false },
    { symbol: "NVDA", name: "NVIDIA Corporation", exchange: "NASDAQ", type: "stock", inWatchlist: false }
  ];

  // Load recent searches
  useEffect(() => {
    const loadRecentSearches = () => {
      const recent = getRecentSearches();
      setRecentSearches(recent);
    };

    loadRecentSearches();
  }, []);

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false);
        setShowRecentSearches(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Update inWatchlist property based on watchlistSymbols
  useEffect(() => {
    if (searchResults.length > 0 && watchlistSymbols.length > 0) {
      const updatedResults = searchResults.map(result => ({
        ...result,
        inWatchlist: watchlistSymbols.includes(result.symbol)
      }));
      setSearchResults(updatedResults);
    }
  }, [watchlistSymbols]);

  // Search for stocks
  const searchStocks = async () => {
    if (!searchTerm.trim()) return;

    setLoading(true);
    setShowResults(true);

    try {
      if (isOffline) {
        // Use mock data in offline mode
        const filteredResults = mockSearchResults
          .filter(stock =>
            stock.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
            stock.name.toLowerCase().includes(searchTerm.toLowerCase())
          )
          .map(stock => ({
            ...stock,
            inWatchlist: watchlistSymbols.includes(stock.symbol)
          }));

        setSearchResults(filteredResults);
        setLoading(false);
        return;
      }

      // Call API to search for stocks (using the watchlist search endpoint)
      const response = await axios.get(`${API_ENDPOINTS.WATCHLIST.SEARCH}?query=${searchTerm}`);

      if (response.data && response.data.success) {
        // Add inWatchlist property to each result
        const results = response.data.data.map(stock => ({
          ...stock,
          inWatchlist: watchlistSymbols.includes(stock.symbol)
        }));
        setSearchResults(results);
      } else {
        toast.error("Failed to search for stocks");
        // Use mock data as fallback
        const filteredResults = mockSearchResults
          .filter(stock =>
            stock.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
            stock.name.toLowerCase().includes(searchTerm.toLowerCase())
          )
          .map(stock => ({
            ...stock,
            inWatchlist: watchlistSymbols.includes(stock.symbol)
          }));

        setSearchResults(filteredResults);
      }
    } catch (error) {
      console.error("Error searching for stocks:", error);
      toast.error("Failed to search for stocks");

      // Use mock data as fallback
      const filteredResults = mockSearchResults
        .filter(stock =>
          stock.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
          stock.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .map(stock => ({
          ...stock,
          inWatchlist: watchlistSymbols.includes(stock.symbol)
        }));

      setSearchResults(filteredResults);
    } finally {
      setLoading(false);
    }
  };

  // Handle search input change with debounce
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);

    if (value.trim() === "") {
      setShowRecentSearches(true);
    } else {
      setShowRecentSearches(false);
    }
  };

  // Clear search
  const clearSearch = () => {
    setSearchTerm("");
    setSearchResults([]);
    setShowResults(false);
    setShowRecentSearches(false);
  };

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm.trim().length > 1) {
        searchStocks();
      } else {
        setSearchResults([]);
        setShowResults(false);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Add stock to watchlist
  const handleAddStock = (symbol, name, exchange = "") => {
    try {
      // Add to search history
      const stockData = {
        symbol,
        name,
        exchange
      };

      addToSearchHistory(stockData);

      // Update recent searches
      setRecentSearches(getRecentSearches());

      // Call the parent component's onAddStock function
      onAddStock(symbol, name);

      // Update the search results to show the stock as added
      const updatedResults = searchResults.map(result =>
        result.symbol === symbol ? { ...result, inWatchlist: true } : result
      );
      setSearchResults(updatedResults);

      // Clear search after adding
      setTimeout(() => {
        setSearchTerm("");
        setShowResults(false);
      }, 1000);
    } catch (error) {
      console.error("Error adding stock to watchlist:", error);
      toast.error("Failed to add stock to watchlist");
    }
  };

  return (
    <div className="watchlist-search" ref={searchRef}>
      <div className="search-input-container">
        <FiSearch className="search-icon" />
        <input
          type="text"
          placeholder="Search for stocks to add..."
          value={searchTerm}
          onChange={handleSearchChange}
          className="search-input"
          onFocus={() => {
            if (searchTerm.trim().length > 1) {
              setShowResults(true);
              setShowRecentSearches(false);
            } else {
              setShowRecentSearches(true);
            }
          }}
        />
        {searchTerm && (
          <button className="clear-search-btn" onClick={clearSearch}>
            <FiX />
          </button>
        )}
      </div>

      {(showResults || showRecentSearches) && (
        <div className="search-results">
          {loading ? (
            <div className="search-loading" key="search-loading">
              <div className="search-spinner"></div>
              <p key="loading-message">Searching...</p>
            </div>
          ) : searchResults.length > 0 ? (
            <Fragment key="search-results-section">
              <div className="search-results-header" key="search-results-header">
                <span>Search Results</span>
              </div>
              <ul className="results-list">
                {searchResults.map((stock) => (
                  <li key={stock.symbol} className="result-item">
                    <div className="stock-info">
                      <span className="stock-symbol">{stock.symbol}</span>
                      <span className="stock-name">{stock.name}</span>
                      {stock.exchange && <span className="stock-exchange">{stock.exchange}</span>}
                    </div>
                    <button
                      className={`add-stock-btn ${stock.inWatchlist ? 'added' : ''}`}
                      onClick={() => handleAddStock(stock.symbol, stock.name, stock.exchange)}
                      disabled={stock.inWatchlist}
                      title={stock.inWatchlist ? "Already in watchlist" : "Add to watchlist"}
                    >
                      {stock.inWatchlist ? <FiCheck /> : <FiPlus />}
                    </button>
                  </li>
                ))}
              </ul>
            </Fragment>
          ) : searchTerm.trim().length > 0 ? (
            <div className="no-results">
              <p key="no-results-message">No stocks found matching your search. Try a different search term.</p>
            </div>
          ) : showRecentSearches && recentSearches.length > 0 ? (
            <Fragment key="recent-searches-section">
              <div className="search-results-header" key="recent-searches-header">
                <span>Recent Searches</span>
                <button
                  className="clear-history-btn"
                  onClick={() => {
                    clearSearchHistory();
                    setRecentSearches([]);
                    setShowRecentSearches(false);
                  }}
                  title="Clear History"
                >
                  <FiTrash2 />
                </button>
              </div>
              <ul className="results-list">
                {recentSearches.map((stock) => (
                  <li key={stock.symbol + "-" + stock.lastSearched} className="result-item recent-search-item">
                    <div className="stock-info">
                      <span className="stock-symbol">{stock.symbol}</span>
                      <span className="stock-name">{stock.name}</span>
                      <span className="result-timestamp">
                        <FiClock size={12} />
                        {new Date(stock.lastSearched).toLocaleDateString()}
                      </span>
                    </div>
                    <button
                      className={`add-stock-btn ${watchlistSymbols.includes(stock.symbol) ? 'added' : ''}`}
                      onClick={() => handleAddStock(stock.symbol, stock.name, stock.exchange)}
                      disabled={watchlistSymbols.includes(stock.symbol)}
                      title={watchlistSymbols.includes(stock.symbol) ? "Already in watchlist" : "Add to watchlist"}
                    >
                      {watchlistSymbols.includes(stock.symbol) ? <FiCheck /> : <FiPlus />}
                    </button>
                  </li>
                ))}
              </ul>
            </Fragment>
          ) : (
            <div className="no-results">
              <p key="empty-search-message">Type to search for stocks or view recent searches.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default WatchlistSearch;
