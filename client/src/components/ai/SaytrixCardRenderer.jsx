import React from 'react';
import { motion } from 'framer-motion';
import {
  FiTrendingUp,
  FiTrendingDown,
  FiBarChart2,
  FiAlertTriangle,
  FiCheckCircle,
  FiArrowUpRight,
  FiArrowDownRight,
} from 'react-icons/fi';
import ReactMarkdown from 'react-markdown';

const SaytrixCardRenderer = ({
  message,
  onSuggestionClick,
  onBuyClick,
  onSellClick,
}) => {
  const { cardType, content, stockData, suggestions } = message;

  const renderStockCard = () => {
    if (!stockData) return renderTextCard();

    const isPositive = stockData.change >= 0;

    return (
      <div className="saytrix-card stock-card-content">
        <div className="card-header">
          <div className="stock-symbol">
            <FiBarChart2 className="symbol-icon" />
            <span>{stockData.symbol}</span>
          </div>
          <div className={`stock-change ${isPositive ? 'positive' : 'negative'}`}>
            {isPositive ? <FiTrendingUp /> : <FiTrendingDown />}
            {stockData.changesPercentage?.toFixed(2) || 'N/A'}%
          </div>
        </div>

        <div className="stock-price">
          <span className="currency">₹</span>
          <span className="price">{stockData.price?.toFixed(2) || 'N/A'}</span>
        </div>

        <div className="stock-details">
          <div className="detail-item">
            <span className="label">Change</span>
            <span className={`value ${isPositive ? 'positive' : 'negative'}`}>
              {isPositive ? '+' : ''}
              {stockData.change?.toFixed(2) || 'N/A'}
            </span>
          </div>
          <div className="detail-item">
            <span className="label">Volume</span>
            <span className="value">{stockData.volume?.toLocaleString() || 'N/A'}</span>
          </div>
          <div className="detail-item">
            <span className="label">Day High</span>
            <span className="value">{stockData.dayHigh?.toFixed(2) || 'N/A'}</span>
          </div>
          <div className="detail-item">
            <span className="label">Day Low</span>
            <span className="value">{stockData.dayLow?.toFixed(2) || 'N/A'}</span>
          </div>
        </div>

        <div className="card-actions">
          <button className="action-btn buy-btn" onClick={() => onBuyClick?.(stockData)}>
            <FiArrowUpRight /> Buy
          </button>
          <button className="action-btn sell-btn" onClick={() => onSellClick?.(stockData)}>
            <FiArrowDownRight /> Sell
          </button>
        </div>
      </div>
    );
  };

  const renderTextCard = () => (
    <div className="saytrix-card text-card-content">
      <div className="markdown-content">
        <ReactMarkdown>{content}</ReactMarkdown>
      </div>
    </div>
  );

  const renderWelcomeCard = () => (
    <div className="saytrix-card welcome-card-content">
      <div className="card-header">
        <div className="company-name">
          <FiCheckCircle className="company-icon" />
          <span>Welcome to Saytrix</span>
        </div>
      </div>
      <div className="markdown-content">
        <ReactMarkdown>{content}</ReactMarkdown>
      </div>
    </div>
  );

  const renderErrorCard = () => (
    <div className="saytrix-card error-card-content">
      <div className="card-header">
        <div className="company-name">
          <FiAlertTriangle className="company-icon error-icon" />
          <span>Error</span>
        </div>
      </div>
      <div className="markdown-content">
        <ReactMarkdown>{content}</ReactMarkdown>
      </div>
    </div>
  );

  const renderSuggestions = () => {
    if (!suggestions || suggestions.length === 0) return null;
    return (
      <div className="suggestions-container">
        {suggestions.map((suggestion, index) => (
          <button
            key={index}
            className="suggestion-chip"
            onClick={() => onSuggestionClick?.(suggestion)}
          >
            {suggestion}
          </button>
        ))}
      </div>
    );
  };

  // Main rendering logic with Framer Motion
  const cardContent = (() => {
    switch (cardType) {
      case 'stock-price':
      case 'stock_data':
        return renderStockCard();
      case 'welcome':
        return renderWelcomeCard();
      case 'error':
        return renderErrorCard();
      default:
        return renderTextCard();
    }
  })();

  return (
    <motion.div
      className="saytrix-card-wrapper"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {cardContent}
      {renderSuggestions()}
    </motion.div>
  );
};

export default SaytrixCardRenderer;