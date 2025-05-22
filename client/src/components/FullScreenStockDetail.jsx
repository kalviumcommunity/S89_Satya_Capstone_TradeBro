import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiTrendingUp, FiTrendingDown, FiX, FiDollarSign,
  FiBarChart2, FiShoppingCart, FiAlertCircle, FiMaximize2,
  FiMinimize2, FiClock, FiInfo, FiActivity
} from "react-icons/fi";
import axios from "axios";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";
import { useVirtualMoney } from "../context/VirtualMoneyContext";
import Loading from "./common/Loading";
import StockChart from "./charts/StockChart";
import FixedHeader from "./FixedHeader";
import BuySellModal from "./forms/BuySellModal";
import { API_ENDPOINTS } from "../config/apiConfig";
import { formatIndianRupees, formatLargeIndianRupees } from '../utils/currencyUtils';
import "../styles/FullScreenStockDetail.css";

const FullScreenStockDetail = ({ symbol, onClose, onBuySuccess, onSellSuccess }) => {
  const { isAuthenticated } = useAuth();
  const toast = useToast();
  const { virtualMoney, updateVirtualMoney } = useVirtualMoney();
  const [stockData, setStockData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [showSellModal, setShowSellModal] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [orderType, setOrderType] = useState("MARKET");
  const [limitPrice, setLimitPrice] = useState("");
  const [processingTransaction, setProcessingTransaction] = useState(false);
  const [chartTimeRange, setChartTimeRange] = useState("1week");
  const [chartType, setChartType] = useState("line");

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

        // No need to fetch virtual money data here as it's handled by the VirtualMoneyContext
      } catch (err) {
        console.error("Error fetching stock data:", err);
        setError("Failed to fetch stock data. Please try again later.");

        // Try to use mock data as fallback
        const mockData = {
          [symbol]: {
            symbol: symbol,
            name: `${symbol} Inc.`,
            price: 150 + Math.random() * 50,
            change: Math.random() * 10 - 5,
            changesPercentage: Math.random() * 5 - 2.5,
            open: 145 + Math.random() * 10,
            dayHigh: 155 + Math.random() * 10,
            dayLow: 140 + Math.random() * 10,
            volume: Math.floor(1000000 + Math.random() * 5000000),
            marketCap: Math.floor(10000000000 + Math.random() * 50000000000),
            pe: 15 + Math.random() * 10,
            eps: 5 + Math.random() * 3
          }
        };

        if (mockData[symbol]) {
          setStockData(mockData[symbol]);
          setError(null);
          toast.info("Using offline data for this stock", 3000);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchStockData();
  }, [symbol, isAuthenticated, toast]);

  // Format large numbers
  const formatLargeNumber = (num) => {
    if (num >= 1000000000000) {
      return `₹${(num / 1000000000000).toFixed(2)}T`;
    } else if (num >= 1000000000) {
      return `₹${(num / 1000000000).toFixed(2)}B`;
    } else if (num >= 1000000) {
      return `₹${(num / 1000000).toFixed(2)}M`;
    } else if (num >= 1000) {
      return `₹${(num / 1000).toFixed(2)}K`;
    } else {
      return `₹${num.toFixed(2)}`;
    }
  };

  return (
    <div className="fullscreen-stock-detail">
      {/* Fixed header that stays visible when scrolling */}
      <FixedHeader
        title={stockData?.name || symbol}
        symbol={symbol}
        timeRange={chartTimeRange}
        setTimeRange={setChartTimeRange}
        chartType={chartType}
        setChartType={setChartType}
        showTimeControls={true}
      />

      {/* Close button */}
      <button className="close-fullscreen-btn" onClick={onClose}>
        <FiX />
      </button>

      {/* Stock price info */}
      <div className="stock-price-info">
        {loading ? (
          <div className="loading-placeholder">Loading...</div>
        ) : (
          <div className="stock-price-container">
            <div className="current-price">₹{stockData?.price.toFixed(2)}</div>
            <div className={`price-change ${stockData?.changesPercentage >= 0 ? 'positive' : 'negative'}`}>
              {stockData?.changesPercentage >= 0 ? <FiTrendingUp /> : <FiTrendingDown />}
              {stockData?.change.toFixed(2)} ({stockData?.changesPercentage.toFixed(2)}%)
            </div>
          </div>
        )}
      </div>

      <div className="fullscreen-content">
        {loading ? (
          <div className="loading-container">
            <Loading size="large" text="Loading stock data..." />
          </div>
        ) : error ? (
          <div className="error-container">
            <FiAlertCircle className="error-icon" />
            <p>{error}</p>
          </div>
        ) : (
          <>
            <div className="stock-details-grid">
              <div className="detail-card">
                <div className="detail-icon"><FiDollarSign /></div>
                <div className="detail-info">
                  <div className="detail-label">Open</div>
                  <div className="detail-value">₹{stockData.open.toFixed(2)}</div>
                </div>
              </div>
              <div className="detail-card">
                <div className="detail-icon"><FiTrendingUp /></div>
                <div className="detail-info">
                  <div className="detail-label">High</div>
                  <div className="detail-value">₹{stockData.dayHigh.toFixed(2)}</div>
                </div>
              </div>
              <div className="detail-card">
                <div className="detail-icon"><FiTrendingDown /></div>
                <div className="detail-info">
                  <div className="detail-label">Low</div>
                  <div className="detail-value">₹{stockData.dayLow.toFixed(2)}</div>
                </div>
              </div>
              <div className="detail-card">
                <div className="detail-icon"><FiActivity /></div>
                <div className="detail-info">
                  <div className="detail-label">Volume</div>
                  <div className="detail-value">{stockData.volume.toLocaleString()}</div>
                </div>
              </div>
              <div className="detail-card">
                <div className="detail-icon"><FiInfo /></div>
                <div className="detail-info">
                  <div className="detail-label">Market Cap</div>
                  <div className="detail-value">{formatLargeNumber(stockData.marketCap)}</div>
                </div>
              </div>
            </div>

            <div className="fullscreen-chart-container">
              <StockChart
                symbol={symbol}
                timeRange={chartTimeRange}
                chartType={chartType}
                fullscreen={true}
              />
            </div>

            <div className="action-buttons">
              <button className="buy-btn" onClick={() => setShowBuyModal(true)}>
                <FiShoppingCart /> Buy
              </button>
              <button className="sell-btn" onClick={() => setShowSellModal(true)}>
                <FiBarChart2 /> Sell
              </button>
            </div>

            {/* Buy Modal */}
            <BuySellModal
              isOpen={showBuyModal}
              onClose={() => setShowBuyModal(false)}
              type="BUY"
              stockData={stockData}
              onSuccess={(data) => {
                updateVirtualMoney(data);
                if (onBuySuccess) onBuySuccess(data);
              }}
              virtualMoney={virtualMoney}
            />

            {/* Sell Modal */}
            <BuySellModal
              isOpen={showSellModal}
              onClose={() => setShowSellModal(false)}
              type="SELL"
              stockData={stockData}
              onSuccess={(data) => {
                updateVirtualMoney(data);
                if (onSellSuccess) onSellSuccess(data);
              }}
              virtualMoney={virtualMoney}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default FullScreenStockDetail;
