import React from 'react';
import { motion } from 'framer-motion';
import { FiTrendingUp, FiTrendingDown, FiActivity, FiDollarSign } from 'react-icons/fi';
import './StockInfo.css';

const StockInfo = ({ 
  stockData = null, 
  isLoading = false, 
  error = null,
  className = '' 
}) => {
  if (error) {
    return (
      <div className={`stock-info error ${className}`}>
        <div className="error-message">
          <p>Unable to load stock data</p>
          <span>{error}</span>
        </div>
      </div>
    );
  }

  if (isLoading || !stockData) {
    return (
      <div className={`stock-info loading ${className}`}>
        <div className="loading-skeleton">
          <div className="skeleton-line large"></div>
          <div className="skeleton-line medium"></div>
          <div className="skeleton-grid">
            <div className="skeleton-item"></div>
            <div className="skeleton-item"></div>
            <div className="skeleton-item"></div>
            <div className="skeleton-item"></div>
          </div>
        </div>
      </div>
    );
  }

  const formatCurrency = (value) => {
    if (!value) return '₹0.00';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const formatNumber = (value) => {
    if (!value) return '0';
    return new Intl.NumberFormat('en-IN').format(value);
  };

  const formatMarketCap = (value) => {
    if (!value) return 'N/A';
    
    if (value >= 1e12) {
      return `₹${(value / 1e12).toFixed(2)}T`;
    } else if (value >= 1e9) {
      return `₹${(value / 1e9).toFixed(2)}B`;
    } else if (value >= 1e6) {
      return `₹${(value / 1e6).toFixed(2)}M`;
    } else if (value >= 1e3) {
      return `₹${(value / 1e3).toFixed(2)}K`;
    }
    return formatCurrency(value);
  };

  const formatPercentage = (value) => {
    if (!value) return '0.00%';
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
  };

  const isPositive = stockData.change >= 0;
  const TrendIcon = isPositive ? FiTrendingUp : FiTrendingDown;

  return (
    <motion.div 
      className={`stock-info ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Main Stock Header */}
      <div className="stock-header">
        <div className="stock-title">
          <h2 className="stock-symbol">{stockData.symbol}</h2>
          <p className="stock-name">{stockData.name}</p>
        </div>
        <div className="live-indicator">
          <div className="pulse-dot"></div>
          <span>LIVE</span>
        </div>
        
        <div className={`stock-price-info ${isPositive ? 'positive' : 'negative'}`}>
          <div className="current-price">
            <span className="price-value">{formatCurrency(stockData.price)}</span>
            <div className="price-change">
              <TrendIcon size={16} className="trend-icon" />
              <span className="change-value">{formatCurrency(Math.abs(stockData.change))}</span>
              <span className="change-percentage">({formatPercentage(stockData.changesPercentage)})</span>
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="metrics-grid">
        <div className="metric-item">
          <div className="metric-label">Open</div>
          <div className="metric-value">{formatCurrency(stockData.open)}</div>
        </div>
        
        <div className="metric-item">
          <div className="metric-label">Previous Close</div>
          <div className="metric-value">{formatCurrency(stockData.previousClose)}</div>
        </div>
        
        <div className="metric-item">
          <div className="metric-label">Day Range</div>
          <div className="metric-value">
            {formatCurrency(stockData.dayLow)} - {formatCurrency(stockData.dayHigh)}
          </div>
        </div>
        
        <div className="metric-item">
          <div className="metric-label">52W Range</div>
          <div className="metric-value">
            {formatCurrency(stockData.yearLow)} - {formatCurrency(stockData.yearHigh)}
          </div>
        </div>
        
        <div className="metric-item">
          <div className="metric-label">Volume</div>
          <div className="metric-value">{formatNumber(stockData.volume)}</div>
        </div>
        
        <div className="metric-item">
          <div className="metric-label">Avg Volume</div>
          <div className="metric-value">{formatNumber(stockData.avgVolume)}</div>
        </div>
        
        <div className="metric-item">
          <div className="metric-label">Market Cap</div>
          <div className="metric-value">{formatMarketCap(stockData.marketCap)}</div>
        </div>
        
        <div className="metric-item">
          <div className="metric-label">Last Updated</div>
          <div className="metric-value">
            {new Date(stockData.timestamp).toLocaleTimeString('en-IN', {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="quick-stats">
        <div className="stat-card">
          <div className="stat-icon">
            <FiActivity size={20} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Day Change</div>
            <div className={`stat-value ${isPositive ? 'positive' : 'negative'}`}>
              {formatPercentage(stockData.changesPercentage)}
            </div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">
            <FiDollarSign size={20} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Market Cap</div>
            <div className="stat-value">{formatMarketCap(stockData.marketCap)}</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">
            <FiTrendingUp size={20} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Volume</div>
            <div className="stat-value">{formatNumber(stockData.volume)}</div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default StockInfo;
