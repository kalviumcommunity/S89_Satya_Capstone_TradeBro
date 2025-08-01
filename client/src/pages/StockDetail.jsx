import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiArrowLeft,
  FiStar,
  FiTrendingUp,
  FiTrendingDown,
  FiBarChart2,
  FiActivity,
  FiDollarSign,
  FiClock,
  FiUsers,
  FiPieChart,
  FiRefreshCw,
  FiShoppingCart,
  FiArrowRight,
  FiCheckCircle,
  FiAlertCircle
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import StockPrice from '../components/StockPrice';
import WatchlistButton from '../components/trading/WatchlistButton';
import { usePortfolio } from '../contexts/PortfolioContext';
import { useAuth } from '../contexts/AuthContext';
import { formatCurrency, formatNumber } from '../utils/formatters';
import '../styles/stock-detail.css';

const StockDetail = () => {
  const { symbol } = useParams();
  const navigate = useNavigate();
  const { portfolioData, buyStock, isLoading: portfolioLoading } = usePortfolio();
  const { user } = useAuth();

  // State management
  const [stockData, setStockData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [isSliding, setIsSliding] = useState(false);
  const [slideProgress, setSlideProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch stock data
  useEffect(() => {
    if (symbol) {
      fetchStockData();
    }
  }, [symbol]);

  const fetchStockData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Mock stock data - replace with actual API call
      const mockData = {
        symbol: symbol.toUpperCase(),
        name: `${symbol.toUpperCase()} Corporation`,
        price: 2500 + Math.random() * 1000,
        change: (Math.random() - 0.5) * 100,
        changePercent: (Math.random() - 0.5) * 10,
        volume: Math.floor(Math.random() * 1000000) + 100000,
        marketCap: Math.floor(Math.random() * 100000000000) + 10000000000,
        pe: Math.floor(Math.random() * 30) + 10,
        high52w: 3500,
        low52w: 1800,
        dayHigh: 2600,
        dayLow: 2400,
        avgVolume: 500000,
        beta: 1.2,
        eps: 125.50,
        dividend: 2.5,
        sector: 'Technology',
        industry: 'Software',
        description: `${symbol.toUpperCase()} Corporation is a leading technology company specializing in innovative software solutions and digital transformation services.`,
        lastUpdated: new Date().toISOString()
      };

      mockData.changePercent = (mockData.change / (mockData.price - mockData.change)) * 100;
      
      setStockData(mockData);
    } catch (err) {
      setError('Failed to fetch stock data');
      console.error('Error fetching stock data:', err);
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    await fetchStockData();
    setRefreshing(false);
    toast.success('Stock data refreshed');
  };

  // Slide to buy functionality
  const handleSlideStart = (e) => {
    if (!canAfford || isProcessing) return;

    e.preventDefault();
    e.stopPropagation();

    const slideContainer = e.currentTarget.closest('.slide-to-buy');
    if (!slideContainer) return;

    const containerRect = slideContainer.getBoundingClientRect();
    const buttonWidth = 52; // Fixed button width
    const maxSlide = containerRect.width - buttonWidth - 8; // Account for padding

    let isDragging = true;

    const handleMove = (moveEvent) => {
      if (!isDragging) return;

      moveEvent.preventDefault();
      const clientX = moveEvent.touches ? moveEvent.touches[0].clientX : moveEvent.clientX;
      const relativeX = clientX - containerRect.left - (buttonWidth / 2);
      const progress = Math.min(Math.max((relativeX / maxSlide) * 100, 0), 100);

      setSlideProgress(progress);
    };

    const handleEnd = async () => {
      isDragging = false;

      if (slideProgress > 80) {
        setSlideProgress(100);
        await handleBuyStock();
      } else {
        // Animate back to start
        setSlideProgress(0);
      }

      // Clean up event listeners
      document.removeEventListener('mousemove', handleMove, { passive: false });
      document.removeEventListener('mouseup', handleEnd);
      document.removeEventListener('touchmove', handleMove, { passive: false });
      document.removeEventListener('touchend', handleEnd);
    };

    // Add event listeners
    document.addEventListener('mousemove', handleMove, { passive: false });
    document.addEventListener('mouseup', handleEnd);
    document.addEventListener('touchmove', handleMove, { passive: false });
    document.addEventListener('touchend', handleEnd);
  };

  const handleBuyStock = async () => {
    if (!stockData || !quantity || isProcessing) return;

    setIsProcessing(true);

    try {
      const result = await buyStock(stockData.symbol, quantity, stockData.price, stockData);

      if (result.success) {
        toast.success(`Successfully bought ${quantity} shares of ${stockData.symbol}!`);
        setSlideProgress(100);

        // Navigate to portfolio with purchase data after a short delay
        setTimeout(() => {
          navigate('/portfolio', {
            state: {
              purchasedStock: {
                symbol: stockData.symbol,
                name: stockData.name,
                quantity: quantity,
                price: stockData.price,
                totalCost: quantity * stockData.price
              },
              showPurchaseSuccess: true
            }
          });
        }, 1500);
      } else {
        toast.error(result.message || 'Failed to buy stock');
        setSlideProgress(0);
      }
    } catch (error) {
      console.error('Error buying stock:', error);
      toast.error('Failed to buy stock');
      setSlideProgress(0);
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleWatchlist = () => {
    setIsInWatchlist(!isInWatchlist);
    toast.success(isInWatchlist ? 'Removed from watchlist' : 'Added to watchlist');
  };

  if (loading) {
    return (
      <div className="stock-detail-loading">
        <div className="loading-spinner"></div>
        <p>Loading stock details...</p>
      </div>
    );
  }

  if (error || !stockData) {
    return (
      <div className="stock-detail-error">
        <FiAlertCircle size={48} />
        <h2>Error Loading Stock</h2>
        <p>{error || 'Stock not found'}</p>
        <button onClick={() => navigate(-1)} className="back-btn">
          Go Back
        </button>
      </div>
    );
  }

  const totalCost = quantity * stockData.price;
  const canAfford = portfolioData.availableCash >= totalCost;
  const isPositive = stockData.change >= 0;

  return (
    <div className="stock-detail-page">
      {/* Header */}
      <div className="stock-detail-header">
        <button onClick={() => navigate(-1)} className="back-button">
          <FiArrowLeft />
        </button>
        <div className="header-info">
          <h1>{stockData.symbol}</h1>
          <p>{stockData.name}</p>
        </div>
        <div className="header-actions">
          <button
            onClick={refreshData}
            className={`refresh-btn ${refreshing ? 'spinning' : ''}`}
            disabled={refreshing}
          >
            <FiRefreshCw />
          </button>
          <WatchlistButton
            stockData={stockData}
            size="small"
            variant="icon"
            showText={false}
          />
        </div>
      </div>

      {/* Price Section */}
      <div className="price-section">
        <div className="current-price">
          <span className="price-value">{formatCurrency(stockData.price)}</span>
          <div className={`price-change ${isPositive ? 'positive' : 'negative'}`}>
            {isPositive ? <FiTrendingUp /> : <FiTrendingDown />}
            <span>{formatCurrency(stockData.change)} ({stockData.changePercent.toFixed(2)}%)</span>
          </div>
        </div>
        <div className="price-range">
          <div className="range-item">
            <span className="label">Day Range</span>
            <span className="value">{formatCurrency(stockData.dayLow)} - {formatCurrency(stockData.dayHigh)}</span>
          </div>
          <div className="range-item">
            <span className="label">52W Range</span>
            <span className="value">{formatCurrency(stockData.low52w)} - {formatCurrency(stockData.high52w)}</span>
          </div>
        </div>
      </div>

      {/* Key Stats */}
      <div className="key-stats">
        <div className="stat-item">
          <FiActivity className="stat-icon" />
          <div className="stat-info">
            <span className="stat-label">Volume</span>
            <span className="stat-value">{formatNumber(stockData.volume)}</span>
          </div>
        </div>
        <div className="stat-item">
          <FiPieChart className="stat-icon" />
          <div className="stat-info">
            <span className="stat-label">Market Cap</span>
            <span className="stat-value">{formatCurrency(stockData.marketCap)}</span>
          </div>
        </div>
        <div className="stat-item">
          <FiBarChart2 className="stat-icon" />
          <div className="stat-info">
            <span className="stat-label">P/E Ratio</span>
            <span className="stat-value">{stockData.pe}</span>
          </div>
        </div>
        <div className="stat-item">
          <FiDollarSign className="stat-icon" />
          <div className="stat-info">
            <span className="stat-label">EPS</span>
            <span className="stat-value">{formatCurrency(stockData.eps)}</span>
          </div>
        </div>
      </div>

      {/* Trading Section */}
      <div className="trading-section">
        <h3>Buy {stockData.symbol}</h3>
        
        {/* Quantity Input */}
        <div className="quantity-section">
          <label>Quantity</label>
          <div className="quantity-controls">
            <button 
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="quantity-btn"
            >
              -
            </button>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              className="quantity-input"
              min="1"
            />
            <button 
              onClick={() => setQuantity(quantity + 1)}
              className="quantity-btn"
            >
              +
            </button>
          </div>
        </div>

        {/* Order Summary */}
        <div className="order-summary">
          <div className="summary-row">
            <span>Price per share</span>
            <span>{formatCurrency(stockData.price)}</span>
          </div>
          <div className="summary-row">
            <span>Quantity</span>
            <span>{quantity} shares</span>
          </div>
          <div className="summary-row total">
            <span>Total Cost</span>
            <span>{formatCurrency(totalCost)}</span>
          </div>
          <div className="summary-row">
            <span>Available Cash</span>
            <span className={canAfford ? 'positive' : 'negative'}>
              {formatCurrency(portfolioData.availableCash)}
            </span>
          </div>
        </div>

        {/* Slide to Buy */}
        <div className="slide-to-buy-container">
          {!canAfford && (
            <div className="insufficient-funds-warning">
              <FiAlertCircle />
              <span>Insufficient funds</span>
            </div>
          )}
          
          <div 
            className={`slide-to-buy ${!canAfford ? 'disabled' : ''} ${isProcessing ? 'processing' : ''}`}
          >
            <div 
              className="slide-track"
              style={{ 
                background: `linear-gradient(to right, #10B981 ${slideProgress}%, #E5E7EB ${slideProgress}%)`
              }}
            >
              <motion.div
                className="slide-button"
                style={{
                  left: `${Math.min(slideProgress, 85)}%`,
                }}
                onMouseDown={canAfford ? handleSlideStart : undefined}
                onTouchStart={canAfford ? handleSlideStart : undefined}
                whileHover={canAfford ? { scale: 1.05 } : {}}
                whileTap={canAfford ? { scale: 0.95 } : {}}
                animate={{
                  left: `${Math.min(slideProgress, 85)}%`
                }}
                transition={{
                  type: slideProgress === 0 ? "spring" : "tween",
                  stiffness: 300,
                  damping: 30,
                  duration: slideProgress === 0 ? 0.5 : 0.1
                }}
              >
                {isProcessing ? (
                  <div className="loading-spinner small" />
                ) : slideProgress > 80 ? (
                  <FiCheckCircle />
                ) : (
                  <FiArrowRight />
                )}
              </motion.div>
            </div>
            <span className="slide-text">
              {isProcessing ? 'Processing...' : slideProgress > 80 ? 'Release to Buy!' : 'Slide to Buy'}
            </span>
          </div>
        </div>
      </div>

      {/* Company Info */}
      <div className="company-info">
        <h3>About {stockData.name}</h3>
        <div className="company-details">
          <div className="detail-row">
            <span className="label">Sector</span>
            <span className="value">{stockData.sector}</span>
          </div>
          <div className="detail-row">
            <span className="label">Industry</span>
            <span className="value">{stockData.industry}</span>
          </div>
          <div className="detail-row">
            <span className="label">Beta</span>
            <span className="value">{stockData.beta}</span>
          </div>
          <div className="detail-row">
            <span className="label">Dividend Yield</span>
            <span className="value">{stockData.dividend}%</span>
          </div>
        </div>
        <p className="company-description">{stockData.description}</p>
      </div>
    </div>
  );
};

export default StockDetail;
