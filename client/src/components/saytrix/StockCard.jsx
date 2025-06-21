import React from 'react';
import { motion } from 'framer-motion';
import { FiTrendingUp, FiTrendingDown, FiExternalLink } from 'react-icons/fi';

const StockCard = ({ stockData, isCompact = false }) => {
  if (!stockData) return null;

  const {
    symbol,
    name,
    price,
    change,
    changesPercentage,
    marketCap,
    volume,
    pe,
    exchange
  } = stockData;

  const isPositive = change >= 0;

  return (
    <motion.div
      className={`stock-card ${isCompact ? 'compact' : ''}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="stock-header">
        <div className="stock-info">
          <div className="stock-symbol">{symbol}</div>
          <div className="stock-name">{name}</div>
          {exchange && <div className="stock-exchange">{exchange}</div>}
        </div>
        <div className="stock-actions">
          <button className="action-btn" title="View details">
            <FiExternalLink size={14} />
          </button>
        </div>
      </div>

      <div className="stock-price">
        <div className="current-price">₹{price?.toFixed(2) || 'N/A'}</div>
        <div className={`price-change ${isPositive ? 'positive' : 'negative'}`}>
          {isPositive ? <FiTrendingUp size={14} /> : <FiTrendingDown size={14} />}
          <span>{change?.toFixed(2) || 'N/A'} ({changesPercentage?.toFixed(2) || 'N/A'}%)</span>
        </div>
      </div>

      {!isCompact && (
        <div className="stock-metrics">
          {marketCap && (
            <div className="metric">
              <span className="metric-label">Market Cap</span>
              <span className="metric-value">₹{(marketCap / 1e9).toFixed(2)}B</span>
            </div>
          )}
          {volume && (
            <div className="metric">
              <span className="metric-label">Volume</span>
              <span className="metric-value">{(volume / 1e6).toFixed(2)}M</span>
            </div>
          )}
          {pe && (
            <div className="metric">
              <span className="metric-label">P/E Ratio</span>
              <span className="metric-value">{pe.toFixed(2)}</span>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
};

export default StockCard;
