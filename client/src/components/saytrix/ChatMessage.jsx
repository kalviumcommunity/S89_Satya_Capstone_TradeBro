import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  FiThumbsUp, 
  FiThumbsDown, 
  FiCopy, 
  FiRefreshCw,
  FiTrendingUp,
  FiTrendingDown,
  FiDollarSign,
  FiBarChart2,
  FiExternalLink
} from 'react-icons/fi';
import ReactMarkdown from 'react-markdown';
import StockCard from './StockCard';
import NewsCard from './NewsCard';

const ChatMessage = ({ message, isCompact = false, onRegenerate }) => {
  const [feedback, setFeedback] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleFeedback = (type) => {
    setFeedback(type);
    // Here you could send feedback to analytics
    console.log(`Feedback: ${type} for message ${message.id}`);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderStockData = () => {
    if (!message.stockData || Object.keys(message.stockData).length === 0) {
      return null;
    }

    return (
      <div className="stock-data-container">
        {Object.entries(message.stockData).map(([symbol, data]) => (
          <StockCard key={symbol} stockData={data} isCompact={isCompact} />
        ))}
      </div>
    );
  };

  const renderAdditionalData = () => {
    if (!message.additionalData) return null;

    const { topGainers, topLosers, news } = message.additionalData;

    return (
      <div className="additional-data-container">
        {topGainers && topGainers.length > 0 && (
          <div className="market-movers gainers">
            <h4>
              <FiTrendingUp className="icon" />
              Top Gainers
            </h4>
            <div className="movers-list">
              {topGainers.slice(0, isCompact ? 3 : 5).map((stock, index) => (
                <div key={stock.symbol} className="mover-item gainer">
                  <div className="mover-info">
                    <span className="symbol">{stock.symbol}</span>
                    <span className="name">{stock.name}</span>
                  </div>
                  <div className="mover-stats">
                    <span className="price">₹{stock.price}</span>
                    <span className="change positive">+{stock.changesPercentage}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {topLosers && topLosers.length > 0 && (
          <div className="market-movers losers">
            <h4>
              <FiTrendingDown className="icon" />
              Top Losers
            </h4>
            <div className="movers-list">
              {topLosers.slice(0, isCompact ? 3 : 5).map((stock, index) => (
                <div key={stock.symbol} className="mover-item loser">
                  <div className="mover-info">
                    <span className="symbol">{stock.symbol}</span>
                    <span className="name">{stock.name}</span>
                  </div>
                  <div className="mover-stats">
                    <span className="price">₹{stock.price}</span>
                    <span className="change negative">{stock.changesPercentage}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {news && news.length > 0 && (
          <div className="news-container">
            <h4>
              <FiExternalLink className="icon" />
              Latest News
            </h4>
            <div className="news-list">
              {news.slice(0, isCompact ? 2 : 3).map((article, index) => (
                <NewsCard key={index} article={article} isCompact={isCompact} />
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <motion.div
      className={`chat-message ${message.role || message.type} ${isCompact ? 'compact' : ''}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="message-content">
        {(message.role === 'assistant' || message.type === 'assistant') && (
          <div className="bot-avatar">
            <FiBarChart2 size={16} />
          </div>
        )}
        
        <div className="message-bubble">
          <div className="message-text">
            <ReactMarkdown
              components={{
                // Custom renderers for markdown
                p: ({ children }) => <p className="markdown-p">{children}</p>,
                strong: ({ children }) => <strong className="markdown-strong">{children}</strong>,
                em: ({ children }) => <em className="markdown-em">{children}</em>,
                ul: ({ children }) => <ul className="markdown-ul">{children}</ul>,
                ol: ({ children }) => <ol className="markdown-ol">{children}</ol>,
                li: ({ children }) => <li className="markdown-li">{children}</li>,
                code: ({ children }) => <code className="markdown-code">{children}</code>,
                pre: ({ children }) => <pre className="markdown-pre">{children}</pre>,
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>

          {renderStockData()}
          {renderAdditionalData()}

          <div className="message-meta">
            <span className="timestamp">{formatTimestamp(message.timestamp)}</span>
            
            {(message.role === 'assistant' || message.type === 'assistant') && !isCompact && (
              <div className="message-actions">
                <button
                  className={`action-btn copy-btn ${copied ? 'copied' : ''}`}
                  onClick={copyToClipboard}
                  title={copied ? 'Copied!' : 'Copy message'}
                >
                  <FiCopy size={14} />
                </button>
                
                {onRegenerate && (
                  <button
                    className="action-btn regenerate-btn"
                    onClick={() => onRegenerate(message)}
                    title="Regenerate response"
                  >
                    <FiRefreshCw size={14} />
                  </button>
                )}
                
                <div className="feedback-buttons">
                  <button
                    className={`action-btn feedback-btn ${feedback === 'up' ? 'active' : ''}`}
                    onClick={() => handleFeedback('up')}
                    title="Good response"
                  >
                    <FiThumbsUp size={14} />
                  </button>
                  <button
                    className={`action-btn feedback-btn ${feedback === 'down' ? 'active' : ''}`}
                    onClick={() => handleFeedback('down')}
                    title="Poor response"
                  >
                    <FiThumbsDown size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ChatMessage;
