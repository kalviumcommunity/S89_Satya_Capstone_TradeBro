import React from 'react';
import { motion } from 'framer-motion';
import {
  FiTrendingUp,
  FiTrendingDown,
  FiDollarSign,
  FiBarChart2,
  FiHome,
  FiAlertTriangle,
  FiShoppingCart,
  FiArrowUpRight,
  FiArrowDownRight,
  FiInfo,
  FiCheckCircle,
  FiXCircle
} from 'react-icons/fi';

// Stock Price Card Component
export const StockPriceCard = ({ stockData, onBuyClick, onSellClick }) => {
  const isPositive = stockData.change >= 0;
  const changeIcon = isPositive ? FiTrendingUp : FiTrendingDown;
  const ChangeIcon = changeIcon;

  return (
    <motion.div
      className="saytrix-card stock-price-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="card-header">
        <div className="stock-symbol">
          <FiDollarSign className="symbol-icon" />
          <span>{stockData.symbol}</span>
        </div>
        <div className={`stock-change ${isPositive ? 'positive' : 'negative'}`}>
          <ChangeIcon size={16} />
          <span>{stockData.changePercent}%</span>
        </div>
      </div>
      
      <div className="card-content">
        <div className="stock-price">
          <span className="currency">₹</span>
          <span className="price">{stockData.price}</span>
        </div>
        <div className="stock-details">
          <div className="detail-item">
            <span className="label">Change:</span>
            <span className={`value ${isPositive ? 'positive' : 'negative'}`}>
              ₹{Math.abs(stockData.change)}
            </span>
          </div>
          <div className="detail-item">
            <span className="label">Volume:</span>
            <span className="value">{stockData.volume || 'N/A'}</span>
          </div>
        </div>
      </div>

      <div className="card-actions">
        <button className="action-btn buy-btn" onClick={() => onBuyClick(stockData)}>
          <FiArrowUpRight size={16} />
          Buy Stock
        </button>
        <button className="action-btn sell-btn" onClick={() => onSellClick(stockData)}>
          <FiArrowDownRight size={16} />
          Sell Stock
        </button>
      </div>
    </motion.div>
  );
};

// Company Info Card Component
export const CompanyInfoCard = ({ companyData }) => {
  return (
    <motion.div
      className="saytrix-card company-info-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="card-header">
        <div className="company-name">
          <FiHome className="company-icon" />
          <span>{companyData.name}</span>
        </div>
        <div className="company-sector">
          {companyData.sector}
        </div>
      </div>
      
      <div className="card-content">
        <div className="company-metrics">
          <div className="metric-item">
            <span className="metric-label">Market Cap</span>
            <span className="metric-value">₹{companyData.marketCap}</span>
          </div>
          <div className="metric-item">
            <span className="metric-label">P/E Ratio</span>
            <span className="metric-value">{companyData.peRatio}</span>
          </div>
          <div className="metric-item">
            <span className="metric-label">52W High</span>
            <span className="metric-value">₹{companyData.high52w}</span>
          </div>
          <div className="metric-item">
            <span className="metric-label">52W Low</span>
            <span className="metric-value">₹{companyData.low52w}</span>
          </div>
        </div>
        {companyData.description && (
          <div className="company-description">
            <p>{companyData.description}</p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

// Chart Card Component
export const ChartCard = ({ chartData, symbol }) => {
  return (
    <motion.div
      className="saytrix-card chart-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="card-header">
        <div className="chart-title">
          <FiBarChart2 className="chart-icon" />
          <span>{symbol} Price Chart</span>
        </div>
        <div className="chart-period">
          {chartData.period || '1D'}
        </div>
      </div>

      <div className="card-content">
        <div className="chart-container">
          {/* Placeholder for actual chart implementation */}
          <div className="chart-placeholder">
            <FiBarChart2 size={48} />
            <p>Chart will be rendered here</p>
            <small>Integration with TradingView Lightweight Charts</small>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Alert/Notification Card Component
export const AlertCard = ({ alertData, onDismiss }) => {
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
    <motion.div
      className={`saytrix-card alert-card alert-${alertData.type}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="card-header">
        <div className="alert-title">
          <AlertIcon className="alert-icon" />
          <span>{alertData.title}</span>
        </div>
        {onDismiss && (
          <button className="dismiss-btn" onClick={onDismiss}>
            <FiXCircle size={16} />
          </button>
        )}
      </div>
      
      <div className="card-content">
        <p className="alert-message">{alertData.message}</p>
        {alertData.action && (
          <button className="alert-action-btn" onClick={alertData.action.onClick}>
            {alertData.action.label}
          </button>
        )}
      </div>
    </motion.div>
  );
};

// Recommendation Card Component
export const RecommendationCard = ({ recommendation, onBuyClick, onSellClick }) => {
  const isPositiveRecommendation = recommendation.type === 'buy';
  const RecommendationIcon = isPositiveRecommendation ? FiTrendingUp : FiTrendingDown;

  return (
    <motion.div
      className={`saytrix-card recommendation-card recommendation-${recommendation.type}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="card-header">
        <div className="recommendation-title">
          <RecommendationIcon className="recommendation-icon" />
          <span>{recommendation.type.toUpperCase()} Recommendation</span>
        </div>
        <div className="confidence-badge">
          {recommendation.confidence} Confidence
        </div>
      </div>
      
      <div className="card-content">
        <div className="recommendation-stock">
          <span className="stock-symbol">{recommendation.symbol}</span>
          <span className="target-price">Target: ₹{recommendation.targetPrice}</span>
        </div>
        <p className="recommendation-reason">{recommendation.reason}</p>
        
        {recommendation.metrics && (
          <div className="recommendation-metrics">
            {recommendation.metrics.map((metric, index) => (
              <div key={index} className="metric-item">
                <span className="metric-label">{metric.label}:</span>
                <span className="metric-value">{metric.value}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card-actions">
        {recommendation.type === 'buy' ? (
          <button className="action-btn buy-btn" onClick={() => onBuyClick(recommendation)}>
            <FiShoppingCart size={16} />
            Buy Now
          </button>
        ) : (
          <button className="action-btn sell-btn" onClick={() => onSellClick(recommendation)}>
            <FiArrowDownRight size={16} />
            Sell Now
          </button>
        )}
      </div>
    </motion.div>
  );
};

// Welcome Card Component
export const WelcomeCard = ({ message, suggestions, onSuggestionClick }) => {
  return (
    <motion.div
      className="saytrix-card welcome-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="card-content">
        <div className="welcome-message">
          <p>{message}</p>
        </div>
        
        {suggestions && suggestions.length > 0 && (
          <div className="welcome-suggestions">
            <h4>Quick Actions:</h4>
            <div className="suggestion-chips">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  className="suggestion-chip"
                  onClick={() => onSuggestionClick(suggestion)}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

// Text Card Component (Default)
export const TextCard = ({ content, suggestions, onSuggestionClick }) => {
  // Enhanced text formatting function
  const formatText = (text) => {
    if (!text) return null;

    // Split text into paragraphs
    const paragraphs = text.split('\n\n').filter(p => p.trim());

    return paragraphs.map((paragraph, pIndex) => {
      const lines = paragraph.split('\n').filter(line => line.trim());

      return (
        <div key={pIndex} className="text-paragraph">
          {lines.map((line, lIndex) => {
            const trimmedLine = line.trim();

            // Headers (lines ending with colon)
            if (trimmedLine.endsWith(':') && !trimmedLine.startsWith('•') && !trimmedLine.startsWith('-')) {
              return (
                <h4 key={lIndex} className="text-header">
                  {trimmedLine.replace(':', '')}
                </h4>
              );
            }

            // Bullet points
            if (trimmedLine.startsWith('•') || trimmedLine.startsWith('-')) {
              return (
                <div key={lIndex} className="text-bullet">
                  <span className="bullet-icon">•</span>
                  <span className="bullet-text">{trimmedLine.replace(/^[•-]\s*/, '')}</span>
                </div>
              );
            }

            // Numbers/steps
            if (/^\d+\./.test(trimmedLine)) {
              const match = trimmedLine.match(/^(\d+)\.\s*(.+)/);
              if (match) {
                return (
                  <div key={lIndex} className="text-step">
                    <span className="step-number">{match[1]}</span>
                    <span className="step-text">{match[2]}</span>
                  </div>
                );
              }
            }

            // Bold text (text between ** or __)
            const formatInlineStyles = (text) => {
              return text
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/__(.*?)__/g, '<strong>$1</strong>')
                .replace(/\*(.*?)\*/g, '<em>$1</em>')
                .replace(/_(.*?)_/g, '<em>$1</em>');
            };

            // Regular paragraph text
            if (trimmedLine) {
              return (
                <p
                  key={lIndex}
                  className="text-line"
                  dangerouslySetInnerHTML={{ __html: formatInlineStyles(trimmedLine) }}
                />
              );
            }

            return null;
          })}
        </div>
      );
    });
  };

  return (
    <motion.div
      className="saytrix-card text-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="card-content">
        <div className="text-content">
          {formatText(content)}
        </div>

        {suggestions && suggestions.length > 0 && (
          <div className="text-suggestions">
            <h5 className="suggestions-title">Quick Actions</h5>
            <div className="suggestion-chips">
              {suggestions.map((suggestion, index) => (
                <motion.button
                  key={index}
                  className="suggestion-chip"
                  onClick={() => onSuggestionClick(suggestion)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {suggestion}
                </motion.button>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};
