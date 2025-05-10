import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiX, FiShoppingCart, FiBarChart2, FiTrendingUp, FiTrendingDown, FiCalendar } from "react-icons/fi";
import axios from "axios";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";
import { useVirtualMoney } from "../context/VirtualMoneyContext";
import { useNavigate } from "react-router-dom";
import StockChart from "./StockChart";
import BuySellModal from "./BuySellModal";
import API_ENDPOINTS from "../config/apiConfig";
import "../styles/FullPageStockChart.css";

const FullPageStockChart = ({ symbol, onClose, onTransactionSuccess }) => {
  const { isAuthenticated } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const { virtualMoney, updateVirtualMoney } = useVirtualMoney();
  const [stockData, setStockData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [showSellModal, setShowSellModal] = useState(false);
  const [timeRange, setTimeRange] = useState("5min");

  // Fetch stock data
  useEffect(() => {
    const fetchStockData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get user ID for personalized data if authenticated
        const userId = isAuthenticated ? localStorage.getItem('userId') || localStorage.getItem('authToken') : null;

        // Use our proxy server to get stock data with personalization
        const url = userId
          ? `${API_ENDPOINTS.PROXY.STOCK_BATCH(symbol)}&userId=${userId}`
          : API_ENDPOINTS.PROXY.STOCK_BATCH(symbol);

        const response = await axios.get(url);

        if (response.data && response.data.length > 0) {
          setStockData(response.data[0]);
        } else {
          setError("No data found for this stock symbol");
        }
      } catch (err) {
        console.error("Error fetching stock data:", err);

        // Generate mock data as fallback
        const mockData = {
          symbol: symbol,
          name: symbol.replace(/\.[A-Z]+$/, '').replace(/([A-Z])/g, ' $1').trim(),
          price: 1000 + Math.random() * 2000,
          change: (Math.random() * 100) - 50,
          changesPercentage: (Math.random() * 10) - 5,
          open: 1000 + Math.random() * 2000,
          dayHigh: 1000 + Math.random() * 2000,
          dayLow: 1000 + Math.random() * 2000,
          volume: Math.floor(Math.random() * 10000000),
          marketCap: Math.floor(Math.random() * 1000000000000),
          pe: Math.random() * 30,
          yearHigh: 1000 + Math.random() * 2000,
          yearLow: 1000 + Math.random() * 2000
        };

        setStockData(mockData);
        toast.info("Using simulated data for this stock");
      } finally {
        setLoading(false);
      }
    };

    fetchStockData();
  }, [symbol, isAuthenticated]);

  // Virtual money data is provided by the VirtualMoneyContext

  const handleBuySuccess = (data) => {
    updateVirtualMoney(data);
    toast.success(`Successfully purchased shares of ${symbol}`);
    // Modal will handle navigation to portfolio page
    if (onTransactionSuccess) {
      onTransactionSuccess();
    }
  };

  const handleSellSuccess = (data) => {
    updateVirtualMoney(data);
    toast.success(`Successfully sold shares of ${symbol}`);
    // Modal will handle navigation to portfolio page
    if (onTransactionSuccess) {
      onTransactionSuccess();
    }
  };

  // Get current date and time for display
  const getCurrentDateTime = () => {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = (hours % 12) || 12;

    return `Today (${displayHours}:${minutes} ${ampm} - 04:00 PM)`;
  };

  return (
    <motion.div
      className="fullpage-chart-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="fullpage-chart-container"
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 50, opacity: 0 }}
        transition={{ type: "spring", damping: 20 }}
      >
        <motion.button
          className="close-fullpage-btn"
          onClick={onClose}
          whileHover={{ scale: 1.1, rotate: 90 }}
          whileTap={{ scale: 0.95 }}
        >
          <FiX />
        </motion.button>

        {stockData && (
          <motion.div
            className="fullpage-stock-header"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <div className="fullpage-stock-info">
              <motion.h1
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
              >
                {symbol} ({symbol})
              </motion.h1>
              <div className="fullpage-price-container">
                <motion.h2
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                >
                  ₹{stockData.price.toFixed(2)}
                </motion.h2>
                <motion.div
                  className={`price-change ${stockData.change >= 0 ? "positive" : "negative"}`}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5, duration: 0.5 }}
                  whileHover={{ y: -5, boxShadow: "0 8px 20px rgba(0, 0, 0, 0.3)" }}
                >
                  {stockData.change >= 0 ? <FiTrendingUp /> : <FiTrendingDown />}
                  <span>{stockData.change >= 0 ? "+" : ""}{stockData.change.toFixed(2)}</span>
                  <span className="percentage">({stockData.change >= 0 ? "+" : ""}{stockData.changesPercentage.toFixed(2)}%)</span>
                </motion.div>
              </div>
            </div>

            <div className="chart-time-display">
              <FiCalendar className="calendar-icon" />
              <span>{getCurrentDateTime()}</span>
            </div>
          </motion.div>
        )}

        <div className="fullpage-chart-wrapper">
          <StockChart
            symbol={symbol}
            chartType="line"
            timeRange={timeRange}
            fullscreen={true}
          />
        </div>

        <motion.div
          className="fullpage-action-buttons"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          <motion.button
            className="fullpage-buy-btn"
            onClick={() => setShowBuyModal(true)}
            whileHover={{ y: -5, boxShadow: "0 10px 25px rgba(34, 184, 176, 0.4)" }}
            whileTap={{ y: 0, boxShadow: "0 5px 15px rgba(34, 184, 176, 0.3)" }}
          >
            <FiShoppingCart /> Buy
          </motion.button>
          <motion.button
            className="fullpage-sell-btn"
            onClick={() => setShowSellModal(true)}
            whileHover={{ y: -5, boxShadow: "0 10px 25px rgba(231, 76, 60, 0.4)" }}
            whileTap={{ y: 0, boxShadow: "0 5px 15px rgba(231, 76, 60, 0.3)" }}
          >
            <FiBarChart2 /> Sell
          </motion.button>
        </motion.div>

        {/* Buy Modal */}
        <BuySellModal
          isOpen={showBuyModal}
          onClose={() => setShowBuyModal(false)}
          type="BUY"
          stockData={stockData}
          onSuccess={handleBuySuccess}
          virtualMoney={virtualMoney}
        />

        {/* Sell Modal */}
        <BuySellModal
          isOpen={showSellModal}
          onClose={() => setShowSellModal(false)}
          type="SELL"
          stockData={stockData}
          onSuccess={handleSellSuccess}
          virtualMoney={virtualMoney}
        />
      </motion.div>
    </motion.div>
  );
};

export default FullPageStockChart;
