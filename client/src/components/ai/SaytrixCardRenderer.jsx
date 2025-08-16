import React from 'react';
import { motion } from 'framer-motion';
import {
  FiTrendingUp,
  FiTrendingDown,
  FiDollarSign,
  FiBarChart3,
  FiBuilding,
  FiInfo,
  FiAlertTriangle,
  FiCheckCircle,
  FiShoppingCart,
  FiArrowUpRight,
  FiArrowDownRight
} from 'react-icons/fi';

const SaytrixCardRenderer = ({ 
  message, 
  onSuggestionClick, 
  onBuyClick, 
  onSellClick,
  onAlertDismiss 
}) => {
  const { cardType, content, stockData, suggestions } = message;

  const renderStockCard = () => {
    if (!stockData) return renderTextCard();
    
    const isPositive = stockData.change >= 0;
    
    return (
      <motion.div 
        className="saytrix-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="card-header">
          <div className="stock-symbol">
            <FiBarChart3 className="symbol-icon" />
            <span>{stockData.symbol}</span>
          </div>
          <div className={`stock-change ${isPositive ? 'positive' : 'negative'}`}>
            {isPositive ? <FiTrendingUp /> : <FiTrendingDown />}
            {stockData.changesPercentage?.toFixed(2)}%
          </div>
        </div>
        
        <div className="stock-price">
          <span className="currency">₹</span>
          <span className="price">{stockData.price?.toFixed(2)}</span>
        </div>
        
        <div className="stock-details">
          <div className="detail-item">
            <span className="label">Change</span>
            <span className={`value ${isPositive ? 'positive' : 'negative'}`}>
              {isPositive ? '+' : ''}{stockData.change?.toFixed(2)}
            </span>
          </div>
          <div className="detail-item">
            <span className="label">Volume</span>
            <span className="value">{stockData.volume?.toLocaleString()}</span>
          </div>
          <div className="detail-item">
            <span className="label">Day High</span>
            <span className="value">{stockData.dayHigh?.toFixed(2)}</span>
          </div>
          <div className="detail-item">
            <span className="label">Day Low</span>
            <span className="value">{stockData.dayLow?.toFixed(2)}</span>
          </div>
        </div>
        
        <div className="card-actions">
          <button className="action-btn buy-btn" onClick={() => onBuyClick?.(stockData)}>
            <FiArrowUpRight />
            Buy
          </button>
          <button className="action-btn sell-btn" onClick={() => onSellClick?.(stockData)}>
            <FiArrowDownRight />
            Sell
          </button>
        </div>
        
        {suggestions && renderSuggestions()}
      </motion.div>
    );
  };

  const renderTextCard = () => {
    return (
      <motion.div 
        className="saytrix-card text-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="text-content">
          {formatTextContent(content)}
        </div>
        {suggestions && renderSuggestions()}
      </motion.div>
    );
  };

  const formatTextContent = (text) => {
    if (!text) return null;
    
    return text.split('\n').map((line, index) => {
      if (line.trim() === '') return <br key={index} />;
      
      // Headers (lines starting with **)
      if (line.startsWith('**') && line.endsWith('**')) {
        return (
          <div key={index} className="text-header">
            {line.replace(/\*\*/g, '')}
          </div>
        );
      }
      
      // Bullet points
      if (line.startsWith('•') || line.startsWith('-')) {
        return (
          <div key={index} className="text-bullet">
            <span className="bullet-icon">•</span>
            <span className="bullet-text">{line.substring(1).trim()}</span>
          </div>
        );
      }
      
      // Regular lines
      return (
        <div key={index} className="text-line">
          {formatInlineText(line)}
        </div>
      );
    });
  };

  const formatInlineText = (text) => {
    // Handle bold text
    return text.split(/\*\*(.*?)\*\*/g).map((part, index) => {
      if (index % 2 === 1) {
        return <strong key={index}>{part}</strong>;
      }
      return part;
    });
  };

  const renderSuggestions = () => {
    if (!suggestions || suggestions.length === 0) return null;
    
    return (
      <div className="text-suggestions">
        <div className="suggestions-title">Quick Actions</div>
        <div className="suggestion-chips">
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
      </div>
    );
  };

  const renderWelcomeCard = () => {
    return (
      <motion.div 
        className="saytrix-card"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="card-header">
          <div className="company-name">
            <FiCheckCircle className="company-icon" />
            <span>Welcome to Saytrix</span>
          </div>
        </div>
        
        <div className="text-content">
          {formatTextContent(content)}
        </div>
        
        {suggestions && renderSuggestions()}
      </motion.div>
    );
  };

  // Handle different card types
  switch (cardType) {
    case 'stock-price':
    case 'stock_data':
      return renderStockCard();
      
    case 'welcome':
      return renderWelcomeCard();
      
    case 'error':
      return (
        <motion.div 
          className="saytrix-card"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="card-header">
            <div className="company-name">
              <FiAlertTriangle className="company-icon" style={{ color: '#EF4444' }} />
              <span>Error</span>
            </div>
          </div>
          <div className="text-content">
            {formatTextContent(content)}
          </div>
        </motion.div>
      );
      
    default:
      return renderTextCard();
  }
};

export default SaytrixCardRenderer;
