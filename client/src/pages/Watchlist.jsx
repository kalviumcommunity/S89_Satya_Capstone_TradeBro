import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiPlus, FiTrash2, FiRefreshCw, FiTrendingUp, FiTrendingDown, FiSearch, FiAlertCircle, FiX, FiMaximize2 } from "react-icons/fi";
import PageLayout from "../components/PageLayout";
import WatchlistSearch from "../components/WatchlistSearch";
import { useToast } from "../hooks/useToast";
import { useAuth } from "../context/AuthContext";
import { useOfflineMode } from "../context/OfflineContext";
import FullScreenStockDetail from "../components/FullScreenStockDetail";
import axios from "axios";
import API_ENDPOINTS from "../config/apiConfig";
import "./Watchlist.css";

// Add some additional styles for the clickable rows
const additionalStyles = `
  .stock-row {
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .stock-row:hover {
    background-color: rgba(34, 184, 176, 0.05) !important;
  }

  .action-buttons {
    display: flex;
    gap: 8px;
    justify-content: flex-end;
  }

  .view-detail-btn {
    background-color: rgba(34, 184, 176, 0.1);
    color: #22b8b0;
    border: none;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .view-detail-btn:hover {
    background-color: rgba(34, 184, 176, 0.2);
    transform: scale(1.1);
  }
`;

const Watchlist = () => {
  const toast = useToast();
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
  const [selectedStock, setSelectedStock] = useState(null);
  const [showFullScreenDetail, setShowFullScreenDetail] = useState(false);

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
          ? `${API_ENDPOINTS.WATCHLIST.STOCKS}?search=${encodeURIComponent(searchTerm)}`
          : API_ENDPOINTS.WATCHLIST.STOCKS;

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

  // Handle stock selection for full-screen detail view
  const handleStockSelect = (symbol) => {
    setSelectedStock(symbol);
    setShowFullScreenDetail(true);
  };

  // Handle closing the full-screen detail view
  const handleCloseFullScreenDetail = () => {
    setShowFullScreenDetail(false);
    setSelectedStock(null);
  };

  // Add stock to watchlist directly from search
  const addStockToWatchlist = async (symbol, name) => {
    if (!isAuthenticated) {
      toast.error("Please log in to add stocks to your watchlist");
      return;
    }

    if (!symbol.trim()) {
      toast.error("Please enter a stock symbol");
      return;
    }

    // Check if stock already exists in watchlist
    if (watchlist.some((stock) => stock.symbol === symbol.toUpperCase())) {
      toast.info(`${symbol.toUpperCase()} is already in your watchlist`);
      return;
    }

    try {
      if (isOffline) {
        // Offline mode - use mock data
        const newStockData = {
          id: watchlist.length + 1,
          symbol: symbol.toUpperCase(),
          name: name || `${symbol.toUpperCase()} Corp`,
          price: (Math.random() * 200 + 50).toFixed(2),
          change: (Math.random() * 10 - 5).toFixed(2),
          changePercent: (Math.random() * 5 - 2.5).toFixed(2),
          marketCap: `${(Math.random() * 500 + 10).toFixed(1)}B`,
          volume: `${(Math.random() * 50 + 5).toFixed(1)}M`
        };

        setWatchlist([...watchlist, newStockData]);
        toast.success(`${newStockData.symbol} added to watchlist (offline mode)`);
        return;
      }

      // Online mode - call API with proper data structure
      const response = await axios.post(API_ENDPOINTS.WATCHLIST.ADD, {
        symbol: symbol.toUpperCase(),
        name: name || `${symbol.toUpperCase()}`
      });

      // Check if the response is successful
      if (response.data && (response.data.success || response.data.data)) {
        // Create a proper stock object from the response or with temporary data
        const stockData = response.data.data || {
          id: Date.now(), // Use timestamp as temporary ID
          symbol: symbol.toUpperCase(),
          name: name || `${symbol.toUpperCase()}`,
          price: "Loading...",
          change: "0.00",
          changePercent: "0.00",
          marketCap: "Loading...",
          volume: "Loading..."
        };

        // Add to watchlist
        setWatchlist([...watchlist, stockData]);

        // Store in localStorage as backup
        try {
          const storedWatchlist = localStorage.getItem('watchlist') || '[]';
          const parsedWatchlist = JSON.parse(storedWatchlist);
          parsedWatchlist.push(stockData);
          localStorage.setItem('watchlist', JSON.stringify(parsedWatchlist));
        } catch (storageError) {
          console.error("Error updating localStorage:", storageError);
        }

        // Then refresh to get the actual data
        refreshWatchlist();
        toast.success(`${symbol.toUpperCase()} added to watchlist`);
      } else {
        toast.error(response.data?.message || "Failed to add stock to watchlist");
      }
    } catch (err) {
      console.error("Error adding stock to watchlist:", err);
      toast.error("Failed to add stock to watchlist");

      // Fallback to local implementation
      const newStockData = {
        id: watchlist.length + 1,
        symbol: symbol.toUpperCase(),
        name: name || `${symbol.toUpperCase()} Corp`,
        price: (Math.random() * 200 + 50).toFixed(2),
        change: (Math.random() * 10 - 5).toFixed(2),
        changePercent: (Math.random() * 5 - 2.5).toFixed(2),
        marketCap: `${(Math.random() * 500 + 10).toFixed(1)}B`,
        volume: `${(Math.random() * 50 + 5).toFixed(1)}M`
      };

      setWatchlist([...watchlist, newStockData]);

      // Store in localStorage as backup
      try {
        const storedWatchlist = localStorage.getItem('watchlist') || '[]';
        const parsedWatchlist = JSON.parse(storedWatchlist);
        parsedWatchlist.push(newStockData);
        localStorage.setItem('watchlist', JSON.stringify(parsedWatchlist));
      } catch (storageError) {
        console.error("Error updating localStorage:", storageError);
      }

      toast.info(`${newStockData.symbol} added to watchlist (local only)`);
    }
  };

  // Add stock to watchlist from input field
  const addToWatchlist = async () => {
    if (!isAuthenticated) {
      toast.error("Please log in to add stocks to your watchlist");
      return;
    }

    if (!newStock.trim()) {
      toast.error("Please enter a stock symbol");
      return;
    }

    // Check if stock already exists in watchlist
    if (watchlist.some((stock) => stock.symbol === newStock.toUpperCase())) {
      toast.info(`${newStock.toUpperCase()} is already in your watchlist`);
      return;
    }

    // Use the addStockToWatchlist function with the newStock value
    await addStockToWatchlist(newStock, null);

    // Clear the input field
    setNewStock("");
  };

  // Remove stock from watchlist
  const removeFromWatchlist = async (id) => {
    if (!isAuthenticated) {
      toast.error("Please log in to manage your watchlist");
      return;
    }

    const stockToRemove = watchlist.find((stock) => stock.id === id);
    if (!stockToRemove) return;

    try {
      if (isOffline) {
        // Offline mode - just update local state
        setWatchlist(watchlist.filter((stock) => stock.id !== id));
        toast.info(`${stockToRemove.symbol} removed from watchlist (offline mode)`);
        return;
      }

      // Online mode - call API
      const response = await axios.delete(API_ENDPOINTS.WATCHLIST.REMOVE(stockToRemove.symbol));

      if (response.data.success) {
        setWatchlist(watchlist.filter((stock) => stock.id !== id));
        toast.info(`${stockToRemove.symbol} removed from watchlist`);
      } else {
        toast.error(response.data.message || "Failed to remove stock from watchlist");
      }
    } catch (err) {
      console.error("Error removing stock from watchlist:", err);
      toast.error("Failed to remove stock from watchlist");

      // Fallback to local implementation
      setWatchlist(watchlist.filter((stock) => stock.id !== id));
      toast.info(`${stockToRemove.symbol} removed from watchlist (local only)`);
    }
  };

  // Refresh watchlist data
  const refreshWatchlist = async () => {
    if (!isAuthenticated) {
      toast.error("Please log in to refresh your watchlist");
      return;
    }

    setRefreshing(true);
    setError(null);

    try {
      if (isOffline) {
        // Offline mode - simulate refresh with random price changes
        const updatedWatchlist = watchlist.map((stock) => {
          // Handle "Loading..." values
          if (stock.price === "Loading..." || isNaN(parseFloat(stock.price))) {
            return {
              ...stock,
              price: (Math.random() * 200 + 50).toFixed(2),
              change: (Math.random() * 10 - 5).toFixed(2),
              changePercent: (Math.random() * 5 - 2.5).toFixed(2),
              marketCap: stock.marketCap === "Loading..." ? `${(Math.random() * 500 + 10).toFixed(1)}B` : stock.marketCap,
              volume: stock.volume === "Loading..." ? `${(Math.random() * 50 + 5).toFixed(1)}M` : stock.volume
            };
          }

          // Normal price update for existing stocks
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
        toast.success("Watchlist refreshed (offline mode)");
        return;
      }

      // Online mode - call API
      const response = await axios.get(API_ENDPOINTS.WATCHLIST.STOCKS);

      if (response.data.success) {
        // If we get data from the API, update the watchlist
        if (response.data.data && Array.isArray(response.data.data)) {
          setWatchlist(response.data.data);
          toast.success("Watchlist refreshed");
        } else if (response.data.stocks && Array.isArray(response.data.stocks)) {
          // Alternative data structure
          setWatchlist(response.data.stocks);
          toast.success("Watchlist refreshed");
        } else {
          // Handle empty or invalid data
          setError("Invalid watchlist data received");
          toast.error("Failed to refresh watchlist: Invalid data format");

          // Update any "Loading..." data with random values
          const updatedWatchlist = watchlist.map((stock) => {
            if (stock.price === "Loading..." || stock.marketCap === "Loading..." || stock.volume === "Loading...") {
              return {
                ...stock,
                price: (Math.random() * 200 + 50).toFixed(2),
                change: (Math.random() * 10 - 5).toFixed(2),
                changePercent: (Math.random() * 5 - 2.5).toFixed(2),
                marketCap: stock.marketCap === "Loading..." ? `${(Math.random() * 500 + 10).toFixed(1)}B` : stock.marketCap,
                volume: stock.volume === "Loading..." ? `${(Math.random() * 50 + 5).toFixed(1)}M` : stock.volume
              };
            }
            return stock;
          });
          setWatchlist(updatedWatchlist);
        }
      } else {
        setError("Failed to refresh watchlist");
        toast.error("Failed to refresh watchlist");

        // Update any "Loading..." data with random values
        const updatedWatchlist = watchlist.map((stock) => {
          if (stock.price === "Loading..." || stock.marketCap === "Loading..." || stock.volume === "Loading...") {
            return {
              ...stock,
              price: (Math.random() * 200 + 50).toFixed(2),
              change: (Math.random() * 10 - 5).toFixed(2),
              changePercent: (Math.random() * 5 - 2.5).toFixed(2),
              marketCap: stock.marketCap === "Loading..." ? `${(Math.random() * 500 + 10).toFixed(1)}B` : stock.marketCap,
              volume: stock.volume === "Loading..." ? `${(Math.random() * 50 + 5).toFixed(1)}M` : stock.volume
            };
          }
          return stock;
        });
        setWatchlist(updatedWatchlist);
      }
    } catch (err) {
      console.error("Error refreshing watchlist:", err);
      setError("Failed to refresh watchlist");
      toast.error("Failed to refresh watchlist");

      // Fallback to local implementation
      const updatedWatchlist = watchlist.map((stock) => {
        // Handle "Loading..." values
        if (stock.price === "Loading..." || isNaN(parseFloat(stock.price))) {
          return {
            ...stock,
            price: (Math.random() * 200 + 50).toFixed(2),
            change: (Math.random() * 10 - 5).toFixed(2),
            changePercent: (Math.random() * 5 - 2.5).toFixed(2),
            marketCap: stock.marketCap === "Loading..." ? `${(Math.random() * 500 + 10).toFixed(1)}B` : stock.marketCap,
            volume: stock.volume === "Loading..." ? `${(Math.random() * 50 + 5).toFixed(1)}M` : stock.volume
          };
        }

        // Normal price update for existing stocks
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
      toast.info("Watchlist refreshed (local only)");
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <PageLayout>
      <style>{additionalStyles}</style>
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
                // Directly call addToWatchlist with the symbol and name
                addStockToWatchlist(symbol, name);
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
              <div>
                <p>No stocks found matching "{searchTerm}"</p>
                <p>Try a different search term or clear the filter.</p>
                {totalStocks > 0 && (
                  <p className="total-stocks-info">
                    You have {totalStocks} stock{totalStocks !== 1 ? 's' : ''} in your watchlist.
                  </p>
                )}
              </div>
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
                    className="stock-row"
                    onClick={() => handleStockSelect(stock.symbol)}
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
                    <td onClick={(e) => e.stopPropagation()}>
                      <div className="action-buttons">
                        <button
                          className="view-detail-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStockSelect(stock.symbol);
                          }}
                          title="View details"
                        >
                          <FiMaximize2 />
                        </button>
                        <button
                          className="remove-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFromWatchlist(stock.id);
                          }}
                          title="Remove from watchlist"
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        )}
      </div>

      {/* Full-screen stock detail */}
      <AnimatePresence>
        {showFullScreenDetail && selectedStock && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <FullScreenStockDetail
              symbol={selectedStock}
              onClose={handleCloseFullScreenDetail}
              onBuySuccess={() => {
                handleCloseFullScreenDetail();
                refreshWatchlist();
              }}
              onSellSuccess={() => {
                handleCloseFullScreenDetail();
                refreshWatchlist();
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </PageLayout>
  );
};

export default Watchlist;
