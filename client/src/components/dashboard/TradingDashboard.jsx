import React, { useState, useEffect, useContext } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiTrendingUp, FiTrendingDown, FiDollarSign, FiShoppingCart,
         FiActivity, FiInfo, FiClock, FiCalendar } from "react-icons/fi";
import { useToast } from "../../context/ToastContext";
import { useVirtualMoney } from "../../context/VirtualMoneyContext";
import { ThemeContext } from "../../context/ThemeContext";
import BuySellModal from "../trading/BuySellModal";
import { useNavigate } from "react-router-dom";
import "../../styles/components/dashboard/TradingDashboard.css";

const TradingDashboard = ({ stockData: propStockData }) => {
  // Context hooks
  const { addToast: showToast } = useToast();
  const { virtualMoney } = useVirtualMoney();
  const { darkMode: theme } = useContext(ThemeContext);
  const navigate = useNavigate();

  // State variables
  const [stockData, setStockData] = useState(propStockData || {
    name: "Affimed N.V.",
    symbol: "AFMD",
    price: 0.26,
    change: 0.18,
    changePercent: 224.62,
    open: 0.08,
    high: 0.28,
    low: 0.08,
    volume: 385000,
    marketCap: "39.2M",
    pe: "N/A",
    dividend: "0.00",
    yield: "0.00%"
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState("BUY");
  const [loading, setLoading] = useState(false);

  // Handle buy button click
  const handleBuy = () => {
    setModalType("BUY");
    setIsModalOpen(true);
  };

  // Handle sell button click
  const handleSell = () => {
    setModalType("SELL");
    setIsModalOpen(true);
  };

  // Handle modal close
  const handleModalClose = () => {
    setIsModalOpen(false);
  };

  // Format price with proper currency
  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(price);
  };

  // Determine if price change is positive
  const isPositive = stockData.change >= 0;

  return (
    <div className="trading-dashboard">
      <AnimatePresence>
        {isModalOpen && (
          <BuySellModal
            isOpen={isModalOpen}
            onClose={handleModalClose}
            type={modalType}
            stockData={stockData}
          />
        )}
      </AnimatePresence>

      {/* Stock Header Section */}
      <motion.div
        className="stock-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="stock-info">
          <h1 className="stock-name">{stockData.name}</h1>
          <div className="stock-symbol">
            <FiActivity className="icon" />
            <span>{stockData.symbol}</span>
          </div>
        </div>

        <div className="price-container">
          <h2 className="current-price">{formatPrice(stockData.price)}</h2>
          <motion.div
            className={`price-change ${isPositive ? 'positive' : 'negative'}`}
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            {isPositive ? (
              <FiTrendingUp className="trend-icon" />
            ) : (
              <FiTrendingDown className="trend-icon" />
            )}
            <span>
              {isPositive ? '+' : ''}{formatPrice(stockData.change)}
              ({isPositive ? '+' : ''}{stockData.changePercent.toFixed(2)}%)
            </span>
          </motion.div>
        </div>
      </motion.div>

      {/* Stock Information Section */}
      <motion.div
        className="stock-info-section"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <div className="info-card">
          <h3>Stock Information</h3>
          <p>This section displays key information about the selected stock.</p>
          <p>For more detailed analysis, please refer to the stock details section below.</p>
        </div>
      </motion.div>

      {/* Action Buttons */}
      <motion.div
        className="action-buttons"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <motion.button
          className="buy-button"
          onClick={handleBuy}
          whileHover={{ scale: 1.05, boxShadow: "0 10px 15px rgba(0, 0, 0, 0.2)" }}
          whileTap={{ scale: 0.95 }}
          disabled={loading}
        >
          <FiDollarSign className="button-icon" />
          <span>Buy</span>
        </motion.button>

        <motion.button
          className="sell-button"
          onClick={handleSell}
          whileHover={{ scale: 1.05, boxShadow: "0 10px 15px rgba(0, 0, 0, 0.2)" }}
          whileTap={{ scale: 0.95 }}
          disabled={loading}
        >
          <FiShoppingCart className="button-icon" />
          <span>Sell</span>
        </motion.button>
      </motion.div>

      {/* Stock Details */}
      <motion.div
        className="stock-details"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
      >
        <div className="details-card">
          <div className="detail-item">
            <span className="detail-label">Open</span>
            <span className="detail-value">{formatPrice(stockData.open)}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">High</span>
            <span className="detail-value">{formatPrice(stockData.high)}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Low</span>
            <span className="detail-value">{formatPrice(stockData.low)}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Volume</span>
            <span className="detail-value">{stockData.volume.toLocaleString()}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Market Cap</span>
            <span className="detail-value">{stockData.marketCap}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">P/E Ratio</span>
            <span className="detail-value">{stockData.pe}</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default TradingDashboard;