import React, { useState, useEffect, useContext } from 'react';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiTrendingUp, FiTrendingDown, FiCalendar, FiShoppingCart, FiBarChart2 } from 'react-icons/fi';
import axios from 'axios';
import { ThemeContext } from '../context/ThemeContext';
import { useVirtualMoney } from '../context/VirtualMoneyContext';
import { useToast } from '../context/ToastContext';
import StockChart from './StockChart';
import BuySellModal from './BuySellModal';
import API_ENDPOINTS from '../config/apiConfig';
import { formatPrice } from '../utils/chartUtils';
import '../styles/components/FullPageStockChart.css';
import '../styles/components/BuySellButtons.css';

const FullPageStockChart = ({ symbol, onClose, onTransactionSuccess }) => {
  const [stockData, setStockData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState('1day');
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

    if (onTransactionSuccess) {
      onTransactionSuccess();
    }
  };

  // Handle sell success
  const handleSellSuccess = (data) => {
    updateVirtualMoney(data);
    setShowSellModal(false);
    toast.success('Stock sold successfully!');

    if (onTransactionSuccess) {
      onTransactionSuccess();
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
      className="fullpage-chart-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="fullpage-chart-container">
        <button className="close-fullpage-btn" onClick={onClose}>
          <FiX />
        </button>

        <div className="chart-time-display">
          <FiCalendar className="calendar-icon" />
          <span>{formatDate()}</span>
        </div>

        {loading ? (
          <div className="fullpage-loading">
            <div className="loading-spinner"></div>
            <p>Loading stock data...</p>
          </div>
        ) : error ? (
          <div className="fullpage-error">
            <p>{error}</p>
          </div>
        ) : stockData && (
          <>
            <div className="fullpage-stock-header">
              <div className="fullpage-stock-info">
                <h1>{stockData.name} ({stockData.symbol})</h1>
                <div className="fullpage-price-container">
                  <h2>{formatPrice(stockData.price)}</h2>
                  <div className={`price-change ${stockData.change >= 0 ? 'positive' : 'negative'}`}>
                    {stockData.change >= 0 ? <FiTrendingUp /> : <FiTrendingDown />}
                    <span>{stockData.change >= 0 ? '+' : ''}{stockData.change.toFixed(2)}</span>
                    <span className="percentage">({stockData.changesPercentage.toFixed(2)}%)</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="fullpage-chart-wrapper">
              <div className="chart-controls">
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
                timeRange={selectedTimeRange}
                height={window.innerHeight - 200}
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

FullPageStockChart.propTypes = {
  symbol: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
  onTransactionSuccess: PropTypes.func
};

export default FullPageStockChart;
