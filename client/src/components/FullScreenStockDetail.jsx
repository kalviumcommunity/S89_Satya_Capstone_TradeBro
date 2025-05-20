import React, { useState, useEffect, useContext } from 'react';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiX, FiTrendingUp, FiTrendingDown, FiDollarSign,
  FiBarChart2, FiShoppingCart, FiInfo, FiClock, FiCalendar
} from 'react-icons/fi';
import axios from 'axios';
import { ThemeContext } from '../context/ThemeContext';
import { useVirtualMoney } from '../context/VirtualMoneyContext';
import { useToast } from '../context/ToastContext';
import StockChart from './StockChart';
import BuySellModal from './BuySellModal';
import API_ENDPOINTS from '../config/apiConfig';
import { formatPrice, formatLargeNumber } from '../utils/chartUtils';
import '../styles/components/FullScreenStockDetail.css';
import '../styles/components/BuySellButtons.css';

const FullScreenStockDetail = ({ symbol, onClose, onBuySuccess, onSellSuccess }) => {
  const [stockData, setStockData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedChartType, setSelectedChartType] = useState('area');
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [showSellModal, setShowSellModal] = useState(false);

  const { theme } = useContext(ThemeContext);
  const { virtualMoney, updateVirtualMoney } = useVirtualMoney();
  const toast = useToast();

  // Chart type options
  const chartTypeOptions = [
    { label: 'Area', value: 'area' },
    { label: 'Line', value: 'line' },
    { label: 'Bar', value: 'bar' }
  ];

  // Fetch stock data
  useEffect(() => {
    const fetchStockData = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await axios.get(API_ENDPOINTS.PROXY.STOCK_BATCH(symbol));

        if (response.data && response.data.length > 0) {
          setStockData(response.data[0]);
        } else {
          setError('No data found for this stock symbol');
        }
      } catch (error) {
        console.error('Error fetching stock data:', error);
        setError('Failed to load stock data');
      } finally {
        setLoading(false);
      }
    };

    fetchStockData();
  }, [symbol]);

  // Handle escape key to close
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscKey);

    return () => {
      window.removeEventListener('keydown', handleEscKey);
    };
  }, [onClose]);

  // Handle buy success
  const handleBuySuccess = (data) => {
    updateVirtualMoney(data);
    setShowBuyModal(false);
    toast.success('Stock purchased successfully!');

    if (onBuySuccess) {
      onBuySuccess(data);
    }
  };

  // Handle sell success
  const handleSellSuccess = (data) => {
    updateVirtualMoney(data);
    setShowSellModal(false);
    toast.success('Stock sold successfully!');

    if (onSellSuccess) {
      onSellSuccess(data);
    }
  };

  // Format date
  const formatDate = () => {
    const date = new Date();
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <motion.div
      className="fullscreen-detail-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="fullscreen-detail-container">
        <button className="close-fullscreen-btn" onClick={onClose}>
          <FiX />
        </button>

        <div className="detail-time-display">
          <FiCalendar className="calendar-icon" />
          <span>{formatDate()}</span>
        </div>

        {loading ? (
          <div className="fullscreen-loading">
            <div className="loading-spinner"></div>
            <p>Loading stock data...</p>
          </div>
        ) : error ? (
          <div className="fullscreen-error">
            <p>{error}</p>
          </div>
        ) : stockData && (
          <>
            <div className="fullscreen-stock-header">
              <div className="fullscreen-stock-info">
                <h1>{stockData.name} ({stockData.symbol})</h1>
                <div className="fullscreen-price-container">
                  <h2>{formatPrice(stockData.price)}</h2>
                  <div className={`price-change ${stockData.change >= 0 ? 'positive' : 'negative'}`}>
                    {stockData.change >= 0 ? <FiTrendingUp /> : <FiTrendingDown />}
                    <span>{stockData.change >= 0 ? '+' : ''}{stockData.change.toFixed(2)}</span>
                    <span className="percentage">({stockData.changesPercentage.toFixed(2)}%)</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="stock-details-grid">
              <div className="detail-card">
                <div className="detail-icon"><FiDollarSign /></div>
                <div className="detail-info">
                  <div className="detail-label">Market Cap</div>
                  <div className="detail-value">{formatLargeNumber(stockData.marketCap)}</div>
                </div>
              </div>

              <div className="detail-card">
                <div className="detail-icon"><FiBarChart2 /></div>
                <div className="detail-info">
                  <div className="detail-label">Volume</div>
                  <div className="detail-value">{formatLargeNumber(stockData.volume)}</div>
                </div>
              </div>

              <div className="detail-card">
                <div className="detail-icon"><FiClock /></div>
                <div className="detail-info">
                  <div className="detail-label">Avg Volume</div>
                  <div className="detail-value">{formatLargeNumber(stockData.avgVolume)}</div>
                </div>
              </div>

              <div className="detail-card">
                <div className="detail-icon"><FiInfo /></div>
                <div className="detail-info">
                  <div className="detail-label">PE Ratio</div>
                  <div className="detail-value">{stockData.pe ? stockData.pe.toFixed(2) : 'N/A'}</div>
                </div>
              </div>
            </div>

            <div className="fullscreen-chart-container">
              <div className="chart-controls">
                <h3 className="chart-section-title">Price Chart</h3>
                <div className="chart-type-selector">
                  {chartTypeOptions.map((option) => (
                    <button
                      key={option.value}
                      className={selectedChartType === option.value ? 'active' : ''}
                      onClick={() => setSelectedChartType(option.value)}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <StockChart
                symbol={symbol}
                chartType={selectedChartType}
                timeRange="1day"
                height={400}
              />
            </div>

            <div className="action-buttons-container">
              <button className="action-button buy-button" onClick={() => setShowBuyModal(true)}>
                <FiShoppingCart /> Buy
              </button>
              <button className="action-button sell-button" onClick={() => setShowSellModal(true)}>
                <FiBarChart2 /> Sell
              </button>
            </div>
          </>
        )}

        {/* Buy Modal */}
        <AnimatePresence>
          {showBuyModal && (
            <BuySellModal
              isOpen={showBuyModal}
              onClose={() => setShowBuyModal(false)}
              type="BUY"
              stockData={stockData}
              onSuccess={handleBuySuccess}
              virtualMoney={virtualMoney}
            />
          )}
        </AnimatePresence>

        {/* Sell Modal */}
        <AnimatePresence>
          {showSellModal && (
            <BuySellModal
              isOpen={showSellModal}
              onClose={() => setShowSellModal(false)}
              type="SELL"
              stockData={stockData}
              onSuccess={handleSellSuccess}
              virtualMoney={virtualMoney}
            />
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

FullScreenStockDetail.propTypes = {
  symbol: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
  onBuySuccess: PropTypes.func,
  onSellSuccess: PropTypes.func
};

export default FullScreenStockDetail;
