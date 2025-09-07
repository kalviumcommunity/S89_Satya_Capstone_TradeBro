import React from 'react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import {
  FiTrendingUp, FiTrendingDown, FiBarChart2, FiHome,
  FiAlertTriangle, FiCheckCircle, FiXCircle,
  FiArrowUpRight, FiArrowDownRight, FiInfo,
  FiDollarSign, FiShoppingCart
} from 'react-icons/fi';

const SaytrixCardRenderer = ({
  message,
  onSuggestionClick,
  onBuyClick,
  onSellClick,
}) => {
  const { cardType, content, stockData, suggestions, alertData, recommendation } = message;

  const renderStockPriceCard = () => {
    if (!stockData) return null;
    const isPositive = stockData.change >= 0;
    const ChangeIcon = isPositive ? FiTrendingUp : FiTrendingDown;

    return (
      <div className="saytrix-card stock-price-card">
        <div className="card-header">
          <div className="stock-symbol">
            <FiDollarSign className="symbol-icon" />
            <span>{stockData.symbol || 'N/A'}</span>
          </div>
          <div className={`stock-change ${isPositive ? 'positive' : 'negative'}`}>
            <ChangeIcon size={16} />
            <span>{stockData.changePercent || 'N/A'}%</span>
          </div>
        </div>
        <div className="card-content">
          <div className="stock-price">
            <span className="currency">₹</span>
            <span className="price">{stockData.price?.toFixed(2) || 'N/A'}</span>
          </div>
          <div className="stock-details">
            <div className="detail-item">
              <span className="label">Change:</span>
              <span className={`value ${isPositive ? 'positive' : 'negative'}`}>
                ₹{Math.abs(stockData.change || 0).toFixed(2)}
              </span>
            </div>
            <div className="detail-item">
              <span className="label">Volume:</span>
              <span className="value">{stockData.volume?.toLocaleString() || 'N/A'}</span>
            </div>
          </div>
        </div>
        <div className="card-actions">
          <button className="action-btn buy-btn" onClick={() => onBuyClick?.(stockData)}>
            <FiArrowUpRight size={16} /> Buy Stock
          </button>
          <button className="action-btn sell-btn" onClick={() => onSellClick?.(stockData)}>
            <FiArrowDownRight size={16} /> Sell Stock
          </button>
        </div>
      </div>
    );
  };

  const renderCompanyInfoCard = () => {
    if (!companyData) return null;
    return (
      <div className="saytrix-card company-info-card">
        <div className="card-header">
          <div className="company-name">
            <FiHome className="company-icon" />
            <span>{companyData.name}</span>
          </div>
          <div className="company-sector">{companyData.sector}</div>
        </div>
        <div className="card-content">
          <div className="company-metrics">
            <div className="metric-item">
              <span className="metric-label">Market Cap</span>
              <span className="metric-value">₹{companyData.marketCap}</span>
            </div>
            {/* ... other company metrics ... */}
          </div>
          <p className="company-description">{companyData.description}</p>
        </div>
      </div>
    );
  };

  const renderChartCard = () => (
    <div className="saytrix-card chart-card">
      <div className="card-header">
        <div className="chart-title">
          <FiBarChart2 className="chart-icon" />
          <span>{message.symbol || 'Price Chart'}</span>
        </div>
      </div>
      <div className="card-content">
        <div className="chart-placeholder">
          <FiBarChart2 size={48} />
          <p>Chart will be rendered here</p>
        </div>
      </div>
    </div>
  );

  const renderAlertCard = () => {
    const getAlertIcon = (type) => {
      switch (type) {
        case 'success': return FiCheckCircle;
        case 'error': return FiXCircle;
        case 'warning': return FiAlertTriangle;
        default: return FiInfo;
      }
    };
    const AlertIcon = getAlertIcon(alertData.type);
    return (
      <div className={`saytrix-card alert-card alert-${alertData.type}`}>
        <div className="card-header">
          <div className="alert-title">
            <AlertIcon className="alert-icon" />
            <span>{alertData.title}</span>
          </div>
        </div>
        <div className="card-content">
          <p className="alert-message">{alertData.message}</p>
        </div>
      </div>
    );
  };

  const renderRecommendationCard = () => {
    if (!recommendation) return null;
    const isPositiveRecommendation = recommendation.type === 'buy';
    const RecommendationIcon = isPositiveRecommendation ? FiTrendingUp : FiTrendingDown;
    return (
      <div className={`saytrix-card recommendation-card recommendation-${recommendation.type}`}>
        <div className="card-header">
          <div className="recommendation-title">
            <RecommendationIcon className="recommendation-icon" />
            <span>{recommendation.type.toUpperCase()} Recommendation</span>
          </div>
          <div className="confidence-badge">{recommendation.confidence} Confidence</div>
        </div>
        <div className="card-content">
          <ReactMarkdown>{`**${recommendation.symbol}** Target: ₹${recommendation.targetPrice}`}</ReactMarkdown>
          <p className="recommendation-reason">{recommendation.reason}</p>
        </div>
        <div className="card-actions">
          {isPositiveRecommendation ? (
            <button className="action-btn buy-btn" onClick={() => onBuyClick?.(recommendation)}>
              <FiShoppingCart size={16} /> Buy Now
            </button>
          ) : (
            <button className="action-btn sell-btn" onClick={() => onSellClick?.(recommendation)}>
              <FiArrowDownRight size={16} /> Sell Now
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderWelcomeCard = () => (
    <div className="saytrix-card welcome-card">
      <div className="card-content">
        <ReactMarkdown>{content}</ReactMarkdown>
      </div>
    </div>
  );

  const renderTextCard = () => (
    <div className="saytrix-card text-card">
      <div className="card-content">
        <ReactMarkdown>{content}</ReactMarkdown>
      </div>
    </div>
  );

  // Main rendering logic with a single `motion` wrapper
  const cardContent = (() => {
    switch (cardType) {
      case 'stock-price':
      case 'stock_data':
        return renderStockPriceCard();
      case 'company-info':
        return renderCompanyInfoCard();
      case 'chart':
        return renderChartCard();
      case 'alert':
        return renderAlertCard();
      case 'recommendation':
        return renderRecommendationCard();
      case 'welcome':
        return renderWelcomeCard();
      default:
        return renderTextCard();
    }
  })();

  const renderSuggestions = () => {
    if (!suggestions || suggestions.length === 0) return null;
    return (
      <div className="suggestions-container">
        {suggestions.map((suggestion, index) => (
          <motion.button
            key={index}
            className="suggestion-chip"
            onClick={() => onSuggestionClick?.(suggestion)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {suggestion}
          </motion.button>
        ))}
      </div>
    );
  };

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