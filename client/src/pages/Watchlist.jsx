import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FiPlus, FiTrash2, FiRefreshCw, FiTrendingUp, FiTrendingDown, FiSearch, FiAlertCircle } from "react-icons/fi";
import PageLayout from "../components/PageLayout";
import WatchlistSearch from "../components/WatchlistSearch";
import { useToast } from "../hooks/useToast";
import { useAuth } from "../context/AuthContext";
import { useOfflineMode } from "../context/OfflineContext";
import axios from "axios";
import "./Watchlist.css";

const Watchlist = () => {
  const { showToast } = useToast();
  const { isAuthenticated } = useAuth();
  const { isOffline } = useOfflineMode();
  const [watchlist, setWatchlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [newStock, setNewStock] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [totalStocks, setTotalStocks] = useState(0);
  const [isFiltered, setIsFiltered] = useState(false);

  // Mock data for demonstration
  const mockWatchlist = [
    {
      id: 1,
      symbol: "AAPL",
      name: "Apple Inc.",
      price: 178.72,
      change: 2.34,
      changePercent: 1.32,
      marketCap: "2.87T",
      volume: "58.9M"
    },
    {
      id: 2,
      symbol: "MSFT",
      name: "Microsoft Corporation",
      price: 337.50,
      change: -1.25,
      changePercent: -0.37,
      marketCap: "2.51T",
      volume: "23.4M"
    },
    {
      id: 3,
      symbol: "GOOGL",
      name: "Alphabet Inc.",
      price: 131.86,
      change: 0.76,
      changePercent: 0.58,
      marketCap: "1.67T",
      volume: "19.2M"
    },
    {
      id: 4,
      symbol: "AMZN",
      name: "Amazon.com Inc.",
      price: 127.74,
      change: 1.45,
      changePercent: 1.15,
      marketCap: "1.32T",
      volume: "42.1M"
    },
    {
      id: 5,
      symbol: "TSLA",
      name: "Tesla, Inc.",
      price: 237.49,
      change: -3.21,
      changePercent: -1.33,
      marketCap: "753.4B",
      volume: "108.2M"
    }
  ];

  // Load watchlist data
  useEffect(() => {
    const fetchWatchlist = async () => {
      if (!isAuthenticated) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        if (isOffline) {
          // Use mock data in offline mode
          const filteredData = searchTerm
            ? mockWatchlist.filter(stock =>
                stock.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
                stock.name.toLowerCase().includes(searchTerm.toLowerCase())
              )
            : mockWatchlist;

          setWatchlist(filteredData);
          setTotalStocks(mockWatchlist.length);
          setIsFiltered(searchTerm.trim() !== '');
          setLoading(false);
          return;
        }

        // Add search parameter if there's a search term
        const url = searchTerm
          ? `http://localhost:5000/api/watchlist/stocks?search=${encodeURIComponent(searchTerm)}`
          : "http://localhost:5000/api/watchlist/stocks";

        const response = await axios.get(url);

        if (response.data.success) {
          setWatchlist(response.data.data);
          setTotalStocks(response.data.total || response.data.data.length);
          setIsFiltered(response.data.filtered || false);
        } else {
          setError("Failed to load watchlist");
          // Use mock data as fallback
          const filteredData = searchTerm
            ? mockWatchlist.filter(stock =>
                stock.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
                stock.name.toLowerCase().includes(searchTerm.toLowerCase())
              )
            : mockWatchlist;

          setWatchlist(filteredData);
          setTotalStocks(mockWatchlist.length);
          setIsFiltered(searchTerm.trim() !== '');
        }
      } catch (err) {
        console.error("Error fetching watchlist:", err);
        setError("Failed to load watchlist. Using sample data instead.");
        // Use mock data as fallback
        const filteredData = searchTerm
          ? mockWatchlist.filter(stock =>
              stock.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
              stock.name.toLowerCase().includes(searchTerm.toLowerCase())
            )
          : mockWatchlist;

        setWatchlist(filteredData);
        setTotalStocks(mockWatchlist.length);
        setIsFiltered(searchTerm.trim() !== '');
      } finally {
        setLoading(false);
      }
    };

    fetchWatchlist();
  }, [isAuthenticated, isOffline, searchTerm]);

  // We're now filtering on the server side or in the fetchWatchlist function
  const filteredWatchlist = watchlist;

  // Add stock to watchlist
  const addToWatchlist = async () => {
    if (!isAuthenticated) {
      showToast("Please log in to add stocks to your watchlist", "error");
      return;
    }

    if (!newStock.trim()) {
      showToast("Please enter a stock symbol", "error");
      return;
    }

    // Check if stock already exists in watchlist
    if (watchlist.some((stock) => stock.symbol === newStock.toUpperCase())) {
      showToast(`${newStock.toUpperCase()} is already in your watchlist`, "warning");
      return;
    }

    try {
      if (isOffline) {
        // Offline mode - use mock data
        const newStockData = {
          id: watchlist.length + 1,
          symbol: newStock.toUpperCase(),
          name: `${newStock.toUpperCase()} Corp`,
          price: (Math.random() * 200 + 50).toFixed(2),
          change: (Math.random() * 10 - 5).toFixed(2),
          changePercent: (Math.random() * 5 - 2.5).toFixed(2),
          marketCap: `${(Math.random() * 500 + 10).toFixed(1)}B`,
          volume: `${(Math.random() * 50 + 5).toFixed(1)}M`
        };

        setWatchlist([...watchlist, newStockData]);
        setNewStock("");
        showToast(`${newStockData.symbol} added to watchlist (offline mode)`, "success");
        return;
      }

      // Online mode - call API
      const response = await axios.post("http://localhost:5000/api/watchlist/add", {
        symbol: newStock.toUpperCase(),
        name: `${newStock.toUpperCase()}`
      });

      if (response.data.success) {
        // Refresh watchlist to get updated data with prices
        refreshWatchlist();
        setNewStock("");
        showToast(`${newStock.toUpperCase()} added to watchlist`, "success");
      } else {
        showToast(response.data.message || "Failed to add stock to watchlist", "error");
      }
    } catch (err) {
      console.error("Error adding stock to watchlist:", err);
      showToast("Failed to add stock to watchlist", "error");

      // Fallback to local implementation
      const newStockData = {
        id: watchlist.length + 1,
        symbol: newStock.toUpperCase(),
        name: `${newStock.toUpperCase()} Corp`,
        price: (Math.random() * 200 + 50).toFixed(2),
        change: (Math.random() * 10 - 5).toFixed(2),
        changePercent: (Math.random() * 5 - 2.5).toFixed(2),
        marketCap: `${(Math.random() * 500 + 10).toFixed(1)}B`,
        volume: `${(Math.random() * 50 + 5).toFixed(1)}M`
      };

      setWatchlist([...watchlist, newStockData]);
      setNewStock("");
      showToast(`${newStockData.symbol} added to watchlist (local only)`, "warning");
    }
  };

  // Remove stock from watchlist
  const removeFromWatchlist = async (id) => {
    if (!isAuthenticated) {
      showToast("Please log in to manage your watchlist", "error");
      return;
    }

    const stockToRemove = watchlist.find((stock) => stock.id === id);
    if (!stockToRemove) return;

    try {
      if (isOffline) {
        // Offline mode - just update local state
        setWatchlist(watchlist.filter((stock) => stock.id !== id));
        showToast(`${stockToRemove.symbol} removed from watchlist (offline mode)`, "info");
        return;
      }

      // Online mode - call API
      const response = await axios.delete(`http://localhost:5000/api/watchlist/remove/${stockToRemove.symbol}`);

      if (response.data.success) {
        setWatchlist(watchlist.filter((stock) => stock.id !== id));
        showToast(`${stockToRemove.symbol} removed from watchlist`, "info");
      } else {
        showToast(response.data.message || "Failed to remove stock from watchlist", "error");
      }
    } catch (err) {
      console.error("Error removing stock from watchlist:", err);
      showToast("Failed to remove stock from watchlist", "error");

      // Fallback to local implementation
      setWatchlist(watchlist.filter((stock) => stock.id !== id));
      showToast(`${stockToRemove.symbol} removed from watchlist (local only)`, "warning");
    }
  };

  // Refresh watchlist data
  const refreshWatchlist = async () => {
    if (!isAuthenticated) {
      showToast("Please log in to refresh your watchlist", "error");
      return;
    }

    setRefreshing(true);
    setError(null);

    try {
      if (isOffline) {
        // Offline mode - simulate refresh with random price changes
        const updatedWatchlist = watchlist.map((stock) => {
          const priceChange = (Math.random() * 4 - 2).toFixed(2);
          const newPrice = (parseFloat(stock.price) + parseFloat(priceChange)).toFixed(2);
          const changePercent = ((priceChange / stock.price) * 100).toFixed(2);

          return {
            ...stock,
            price: newPrice,
            change: priceChange,
            changePercent: changePercent
          };
        });

        setWatchlist(updatedWatchlist);
        showToast("Watchlist refreshed (offline mode)", "success");
        return;
      }

      // Online mode - call API
      const response = await axios.get("http://localhost:5000/api/watchlist/stocks");

      if (response.data.success) {
        setWatchlist(response.data.data);
        showToast("Watchlist refreshed", "success");
      } else {
        setError("Failed to refresh watchlist");
        showToast("Failed to refresh watchlist", "error");
      }
    } catch (err) {
      console.error("Error refreshing watchlist:", err);
      setError("Failed to refresh watchlist");
      showToast("Failed to refresh watchlist", "error");

      // Fallback to local implementation
      const updatedWatchlist = watchlist.map((stock) => {
        const priceChange = (Math.random() * 4 - 2).toFixed(2);
        const newPrice = (parseFloat(stock.price) + parseFloat(priceChange)).toFixed(2);
        const changePercent = ((priceChange / stock.price) * 100).toFixed(2);

        return {
          ...stock,
          price: newPrice,
          change: priceChange,
          changePercent: changePercent
        };
      });

      setWatchlist(updatedWatchlist);
      showToast("Watchlist refreshed (local only)", "warning");
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <PageLayout>
      <div className="watchlist-container">
        <motion.div
          className="watchlist-header-container"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="watchlist-header">My Watchlist</h1>
          {isFiltered && filteredWatchlist.length > 0 && (
            <div className="filter-status">
              Showing {filteredWatchlist.length} of {totalStocks} stocks
              {searchTerm && <span> matching "{searchTerm}"</span>}
            </div>
          )}
        </motion.div>

        <motion.div
          className="watchlist-actions"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="search-filter-container">
            <FiSearch className="search-icon" />
            <input
              type="text"
              placeholder="Filter watchlist..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            {searchTerm && (
              <button
                className="clear-search-btn"
                onClick={() => setSearchTerm('')}
                title="Clear filter"
              >
                ×
              </button>
            )}
          </div>

          <div className="watchlist-controls">
            <WatchlistSearch
              onAddStock={(symbol, name) => {
                setNewStock(symbol);
                setTimeout(() => addToWatchlist(), 100);
              }}
              watchlistSymbols={watchlist.map(stock => stock.symbol)}
            />

            <button
              className={`refresh-btn ${refreshing ? 'refreshing' : ''}`}
              onClick={refreshWatchlist}
              disabled={refreshing}
            >
              <FiRefreshCw className={refreshing ? 'spin' : ''} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </motion.div>

        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading watchlist...</p>
          </div>
        ) : error ? (
          <div className="error-container">
            <FiAlertCircle className="error-icon" />
            <p>{error}</p>
          </div>
        ) : !isAuthenticated ? (
          <div className="empty-watchlist">
            <p>Please log in to view your watchlist.</p>
          </div>
        ) : filteredWatchlist.length === 0 ? (
          <div className="empty-watchlist">
            {isFiltered ? (
              <>
                <p>No stocks found matching "{searchTerm}"</p>
                <p>Try a different search term or clear the filter.</p>
                {totalStocks > 0 && (
                  <p className="total-stocks-info">
                    You have {totalStocks} stock{totalStocks !== 1 ? 's' : ''} in your watchlist.
                  </p>
                )}
              </>
            ) : (
              <p>No stocks found in your watchlist. Use the search above to find and add stocks.</p>
            )}
          </div>
        ) : (
          <motion.div
            className="watchlist-table-container"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <table className="watchlist-table">
              <thead>
                <tr>
                  <th>Symbol</th>
                  <th>Name</th>
                  <th>Price</th>
                  <th>Change</th>
                  <th>Market Cap</th>
                  <th>Volume</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredWatchlist.map((stock) => (
                  <motion.tr
                    key={stock.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    whileHover={{ backgroundColor: "rgba(0,0,0,0.02)" }}
                  >
                    <td className="symbol-cell">{stock.symbol}</td>
                    <td>{stock.name}</td>
                    <td className="price-cell">${stock.price}</td>
                    <td className={`change-cell ${parseFloat(stock.change) >= 0 ? 'positive' : 'negative'}`}>
                      {parseFloat(stock.change) >= 0 ? (
                        <FiTrendingUp className="trend-icon" />
                      ) : (
                        <FiTrendingDown className="trend-icon" />
                      )}
                      {parseFloat(stock.change) >= 0 ? '+' : ''}{stock.change} ({stock.changePercent}%)
                    </td>
                    <td>{stock.marketCap}</td>
                    <td>{stock.volume}</td>
                    <td>
                      <button
                        className="remove-btn"
                        onClick={() => removeFromWatchlist(stock.id)}
                        title="Remove from watchlist"
                      >
                        <FiTrash2 />
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        )}
      </div>
    </PageLayout>
  );
};

export default Watchlist;
