import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiX, FiShoppingCart, FiBarChart2, FiTrendingUp, FiTrendingDown, FiCalendar } from "react-icons/fi";
import axios from "axios";
import { useToast } from "../../context/ToastContext";
import { useAuth } from "../../context/AuthContext";
import { useVirtualMoney } from "../../context/VirtualMoneyContext";
import { useNavigate } from "react-router-dom";
import StockChart from "./StockChart";
import BuySellModal from "../forms/BuySellModal";
import API_ENDPOINTS from "../../config/apiConfig";
import "../../styles/components/full-page-stock-chart.css";

const FullPageStockChart = ({ symbol, onClose }) => {
  const [stockData, setStockData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState("1day");
  const [showBuySellModal, setShowBuySellModal] = useState(false);
  const [modalType, setModalType] = useState("buy");

  const { showToast } = useToast();
  const { isAuthenticated } = useAuth();
  const { virtualMoney, updateVirtualMoney } = useVirtualMoney();
  const navigate = useNavigate();

  // Fetch stock data
  useEffect(() => {
    const fetchStockData = async () => {
      if (!symbol) {
        setError("No symbol provided");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await axios.get(`${API_ENDPOINTS.PROXY.FMP}/quote/${symbol}`);

        if (response.data && response.data.length > 0) {
          setStockData(response.data[0]);
          setError(null);
        } else {
          throw new Error("No data available for this symbol");
        }
      } catch (err) {
        console.error("Error fetching stock data:", err);
        setError("Failed to fetch stock data");

        // Generate mock data as fallback
        const mockData = generateMockStockData(symbol);
        setStockData(mockData);
      } finally {
        setLoading(false);
      }
    };

    fetchStockData();
  }, [symbol]);

  // Generate mock stock data for fallback
  const generateMockStockData = (symbol) => {
    const basePrice = Math.floor(Math.random() * 1000) + 100;
    const change = (Math.random() * 20) - 10;
    const changesPercentage = (change / basePrice) * 100;

    return {
      symbol: symbol,
      name: `${symbol} Inc.`,
      price: basePrice,
      change: change,
      changesPercentage: changesPercentage,
      dayLow: basePrice - Math.random() * 20,
      dayHigh: basePrice + Math.random() * 20,
      yearLow: basePrice - Math.random() * 100,
      yearHigh: basePrice + Math.random() * 100,
      marketCap: basePrice * 1000000,
      volume: Math.floor(Math.random() * 1000000) + 100000,
      avgVolume: Math.floor(Math.random() * 1000000) + 100000,
      open: basePrice - Math.random() * 10,
      previousClose: basePrice - Math.random() * 5,
      eps: Math.random() * 10,
      pe: Math.random() * 20 + 5,
      sharesOutstanding: Math.floor(Math.random() * 1000000000) + 10000000,
    };
  };

  // Handle time range change
  const handleTimeRangeChange = (range) => {
    setTimeRange(range);
  };

  // Handle buy/sell button click
  const handleBuySellClick = (type) => {
    if (!isAuthenticated) {
      showToast("Please log in to trade stocks", "warning");
      navigate("/login");
      return;
    }

    setModalType(type);
    setShowBuySellModal(true);
  };

  // Handle modal close
  const handleModalClose = () => {
    setShowBuySellModal(false);
  };

  // Handle successful transaction
  const handleTransactionSuccess = (transaction) => {
    // Update virtual money
    updateVirtualMoney({
      balance: transaction.newBalance,
      invested: transaction.newInvested
    });

    // Show success toast
    showToast(
      `Successfully ${modalType === "buy" ? "bought" : "sold"} ${transaction.quantity} shares of ${symbol} for ₹${transaction.totalAmount}`,
      "success"
    );

    // Close modal
    setShowBuySellModal(false);
  };

  // Get current date and time
  const getCurrentDateTime = () => {
    const now = new Date();
    return now.toLocaleString();
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
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
      >
        <div className="fullpage-chart-header">
          <div className="fullpage-chart-title">
            <h2>{symbol}</h2>
            {stockData && <p>{stockData.name}</p>}
          </div>

          <div className="fullpage-chart-actions">
            <motion.button
              className="buy-button"
              onClick={() => handleBuySellClick("buy")}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <FiShoppingCart /> Buy
            </motion.button>

            <motion.button
              className="sell-button"
              onClick={() => handleBuySellClick("sell")}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <FiShoppingCart /> Sell
            </motion.button>

            <motion.button
              className="close-button"
              onClick={onClose}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <FiX />
            </motion.button>
          </div>
        </div>

        {stockData && (
          <motion.div
            className="fullpage-chart-info"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="price-info">
              <h3>₹{stockData.price.toFixed(2)}</h3>

              <motion.div
                className={`price-change ${stockData.change >= 0 ? "positive" : "negative"}`}
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3 }}
                whileHover={{ y: -5, boxShadow: "0 8px 20px rgba(0, 0, 0, 0.3)" }}
              >
                {stockData.change >= 0 ? <FiTrendingUp /> : <FiTrendingDown />}
                <span>{stockData.change >= 0 ? "+" : ""}{stockData.change.toFixed(2)}</span>
                <span className="percentage">({stockData.change >= 0 ? "+" : ""}{stockData.changesPercentage.toFixed(2)}%)</span>
              </motion.div>
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

        {/* Time range selector */}
        <div className="time-range-selector-container">
          <div className="time-range-selector">
            <button
              className={timeRange === "5min" ? "active" : ""}
              onClick={() => handleTimeRangeChange("5min")}
            >
              5M
            </button>
            <button
              className={timeRange === "1day" ? "active" : ""}
              onClick={() => handleTimeRangeChange("1day")}
            >
              1D
            </button>
            <button
              className={timeRange === "1week" ? "active" : ""}
              onClick={() => handleTimeRangeChange("1week")}
            >
              1W
            </button>
            <button
              className={timeRange === "1month" ? "active" : ""}
              onClick={() => handleTimeRangeChange("1month")}
            >
              1M
            </button>
            <button
              className={timeRange === "3months" ? "active" : ""}
              onClick={() => handleTimeRangeChange("3months")}
            >
              3M
            </button>
            <button
              className={timeRange === "1year" ? "active" : ""}
              onClick={() => handleTimeRangeChange("1year")}
            >
              1Y
            </button>
            <button
              className={timeRange === "5years" ? "active" : ""}
              onClick={() => handleTimeRangeChange("5years")}
            >
              5Y
            </button>
          </div>
        </div>
      </motion.div>

      {/* Buy/Sell Modal */}
      <AnimatePresence>
        {showBuySellModal && (
          <BuySellModal
            symbol={symbol}
            stockData={stockData}
            type={modalType}
            onClose={handleModalClose}
            onSuccess={handleTransactionSuccess}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default FullPageStockChart;
