import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FiPlus, FiTrash2, FiRefreshCw, FiTrendingUp, FiTrendingDown, FiSearch } from "react-icons/fi";
import PageLayout from "../components/PageLayout";
import { useToast } from "../context/ToastContext";
import "./Watchlist.css";

const Watchlist = () => {
  const { showToast } = useToast();
  const [watchlist, setWatchlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [newStock, setNewStock] = useState("");
  const [refreshing, setRefreshing] = useState(false);

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
    // Simulate API call
    setTimeout(() => {
      setWatchlist(mockWatchlist);
      setLoading(false);
    }, 1000);
  }, []);

  // Filter watchlist based on search term
  const filteredWatchlist = watchlist.filter(
    (stock) =>
      stock.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      stock.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Add stock to watchlist
  const addToWatchlist = () => {
    if (!newStock.trim()) {
      showToast("Please enter a stock symbol", "error");
      return;
    }

    // Check if stock already exists in watchlist
    if (watchlist.some((stock) => stock.symbol === newStock.toUpperCase())) {
      showToast(`${newStock.toUpperCase()} is already in your watchlist`, "warning");
      return;
    }

    // In a real app, you would fetch stock data from an API
    // For demo, we'll add a mock stock
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
    showToast(`${newStockData.symbol} added to watchlist`, "success");
  };

  // Remove stock from watchlist
  const removeFromWatchlist = (id) => {
    const stockToRemove = watchlist.find((stock) => stock.id === id);
    setWatchlist(watchlist.filter((stock) => stock.id !== id));
    showToast(`${stockToRemove.symbol} removed from watchlist`, "info");
  };

  // Refresh watchlist data
  const refreshWatchlist = () => {
    setRefreshing(true);
    // In a real app, you would fetch updated data from an API
    setTimeout(() => {
      // Update with slightly different prices to simulate refresh
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
      setRefreshing(false);
      showToast("Watchlist refreshed", "success");
    }, 1000);
  };

  return (
    <PageLayout>
      <div className="watchlist-container">
        <motion.h1
          className="watchlist-header"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          My Watchlist
        </motion.h1>

        <motion.div
          className="watchlist-actions"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="search-container">
            <FiSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search stocks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="add-stock-container">
            <input
              type="text"
              placeholder="Add stock symbol..."
              value={newStock}
              onChange={(e) => setNewStock(e.target.value)}
              className="add-stock-input"
              onKeyPress={(e) => e.key === "Enter" && addToWatchlist()}
            />
            <button className="add-btn" onClick={addToWatchlist}>
              <FiPlus />
              Add
            </button>
          </div>

          <button
            className={`refresh-btn ${refreshing ? 'refreshing' : ''}`}
            onClick={refreshWatchlist}
            disabled={refreshing}
          >
            <FiRefreshCw className={refreshing ? 'spin' : ''} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </motion.div>

        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading watchlist...</p>
          </div>
        ) : filteredWatchlist.length === 0 ? (
          <div className="empty-watchlist">
            <p>No stocks found in your watchlist.</p>
            {searchTerm && <p>Try a different search term or add new stocks.</p>}
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
