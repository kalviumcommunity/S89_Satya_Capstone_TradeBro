import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { FiTrendingUp, FiTrendingDown, FiX, FiMaximize2 } from 'react-icons/fi';
import StockChart from './StockChart';
import { fetchStockQuote } from '../api/fmp';
import '../styles/components/SimpleStockChart.css';

const SimpleStockChart = ({ symbol, onClose }) => {
  const [stockInfo, setStockInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStockInfo = async () => {
      if (!symbol) return;

      try {
        setLoading(true);
        setError(null);

        const quote = await fetchStockQuote(symbol);
        setStockInfo(quote);
      } catch (err) {
        console.error('Error fetching stock info:', err);
        setError(err.message);

        // Generate mock data as fallback
        setStockInfo({
          symbol: symbol,
          name: `${symbol} Corporation`,
          price: 100 + Math.random() * 400,
          change: (Math.random() - 0.5) * 20,
          changesPercentage: (Math.random() - 0.5) * 10,
          volume: Math.floor(Math.random() * 10000000),
          marketCap: Math.floor(Math.random() * 1000000000000),
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStockInfo();
  }, [symbol]);

  // Use useCallback to prevent function recreation on every render
  const handlePriceChange = useCallback((priceData) => {
    if (priceData && typeof priceData === 'object') {
      setStockInfo(prev => {
        if (!prev) return prev; // Don't update if no previous data

        return {
          ...prev,
          price: priceData.price,
          change: priceData.change,
          changesPercentage: priceData.changePercent,
        };
      });
    }
  }, []); // Empty dependency array since we only use the priceData parameter

  // Memoize the format function to prevent recreation
  const formatLargeNumber = useCallback((num) => {
    if (!num) return 'N/A';

    if (num >= 1e12) {
      return `${(num / 1e12).toFixed(1)}T`;
    } else if (num >= 1e9) {
      return `${(num / 1e9).toFixed(1)}B`;
    } else if (num >= 1e6) {
      return `${(num / 1e6).toFixed(1)}M`;
    } else if (num >= 1e3) {
      return `${(num / 1e3).toFixed(1)}K`;
    }
    return num.toLocaleString();
  }, []);

  // Memoize motion props for loading state
  const loadingMotionProps = useMemo(() => ({
    className: "simple-chart-loading",
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
    transition: { duration: 0.3 }
  }), []);

  // Memoize motion props for main component
  const mainMotionProps = useMemo(() => ({
    className: "simple-stock-chart",
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
    transition: { duration: 0.3 }
  }), []);

  if (loading) {
    return (
      <motion.div {...loadingMotionProps}>
        <div className="loading-spinner">
          <motion.div
            className="spinner"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.6, 1, 0.6]
            }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <span>Loading chart data...</span>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div {...mainMotionProps}>
      {/* Header */}
      <div className="chart-header">
        <div className="stock-info">
          <h2 className="stock-symbol">{stockInfo?.symbol}</h2>
          <p className="stock-name">{stockInfo?.name}</p>
          <div className="price-info">
            <span className="current-price">
              ₹{stockInfo?.price?.toFixed(2) || 'N/A'}
            </span>
            {stockInfo?.change !== undefined && (
              <span className={`price-change ${stockInfo.change >= 0 ? 'positive' : 'negative'}`}>
                {stockInfo.change >= 0 ? <FiTrendingUp /> : <FiTrendingDown />}
                {stockInfo.change >= 0 ? '+' : ''}{stockInfo.change.toFixed(2)} 
                ({stockInfo.change >= 0 ? '+' : ''}{stockInfo.changesPercentage?.toFixed(2) || '0.00'}%)
              </span>
            )}
          </div>
        </div>

        <div className="chart-actions">
          <button 
            className="action-btn maximize-btn"
            title="Maximize chart"
          >
            <FiMaximize2 />
          </button>
          <button 
            className="action-btn close-btn"
            onClick={onClose}
            title="Close chart"
          >
            <FiX />
          </button>
        </div>
      </div>

      {/* Chart */}
      <div className="chart-container">
        {error && (
          <div className="chart-error-banner">
            <span>Using demo data - {error}</span>
          </div>
        )}
        <StockChart
          symbol={symbol}
          chartType="line"
          height={400}
          showControls={false}
          showVolume={false}
          showSMA={true}
          smaLength={14}
          onPriceChange={handlePriceChange}
        />
      </div>

      {/* Stats */}
      <div className="chart-stats">
        <div className="stat-item">
          <span className="stat-label">Volume</span>
          <span className="stat-value">{formatLargeNumber(stockInfo?.volume)}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Market Cap</span>
          <span className="stat-value">${formatLargeNumber(stockInfo?.marketCap)}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Status</span>
          <span className="stat-value">
            {error ? 'Demo Mode' : 'Live Data'}
          </span>
        </div>
      </div>
    </motion.div>
  );
};

export default SimpleStockChart;
