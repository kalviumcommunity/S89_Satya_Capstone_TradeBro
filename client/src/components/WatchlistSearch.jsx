import React, { useState, useEffect, useRef } from "react";
import { FiSearch, FiPlus, FiCheck } from "react-icons/fi";
import axios from "axios";
import { useToast } from "../hooks/useToast";
import { useOfflineMode } from "../context/OfflineContext";
import "../styles/WatchlistSearch.css";

const WatchlistSearch = ({ onAddStock, watchlistSymbols = [] }) => {
  const { showToast } = useToast();
  const { isOffline } = useOfflineMode();
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
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

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false);
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

      // Call API to search for stocks (using the public endpoint)
      const response = await axios.get(`http://localhost:5000/api/stocks/search?query=${searchTerm}`);

      if (response.data.success) {
        // Add inWatchlist property to each result
        const results = response.data.data.map(stock => ({
          ...stock,
          inWatchlist: watchlistSymbols.includes(stock.symbol)
        }));
        setSearchResults(results);
      } else {
        showToast("Failed to search for stocks", "error");
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
      showToast("Failed to search for stocks", "error");

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
    setSearchTerm(e.target.value);
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
  const handleAddStock = (symbol, name) => {
    onAddStock(symbol, name);

    // Update the search results to show the stock as added
    const updatedResults = searchResults.map(result =>
      result.symbol === symbol ? { ...result, inWatchlist: true } : result
    );
    setSearchResults(updatedResults);
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
          onFocus={() => searchTerm.trim().length > 1 && setShowResults(true)}
        />
      </div>

      {showResults && (
        <div className="search-results">
          {loading ? (
            <div className="search-loading">
              <div className="search-spinner"></div>
              <p>Searching...</p>
            </div>
          ) : searchResults.length === 0 ? (
            <div className="no-results">
              <p>No stocks found. Try a different search term.</p>
            </div>
          ) : (
            <ul className="results-list">
              {searchResults.map((stock) => (
                <li key={stock.symbol} className="result-item">
                  <div className="stock-info">
                    <span className="stock-symbol">{stock.symbol}</span>
                    <span className="stock-name">{stock.name}</span>
                    <span className="stock-exchange">{stock.exchange}</span>
                  </div>
                  <button
                    className={`add-stock-btn ${stock.inWatchlist ? 'added' : ''}`}
                    onClick={() => handleAddStock(stock.symbol, stock.name)}
                    disabled={stock.inWatchlist}
                    title={stock.inWatchlist ? "Already in watchlist" : "Add to watchlist"}
                  >
                    {stock.inWatchlist ? <FiCheck /> : <FiPlus />}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default WatchlistSearch;
