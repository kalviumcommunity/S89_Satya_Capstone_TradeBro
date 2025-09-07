import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  FiArrowRight,
  FiCheckCircle,
  FiAlertCircle,
  FiShoppingCart,
  FiX,
  FiMinus,
  FiPlus
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import { usePortfolio } from '../../contexts/PortfolioContext';
import { formatCurrency } from '../../utils/formatters';
import WatchlistButton from './WatchlistButton';
import '../../styles/slide-to-buy.css';

const SlideToBuy = ({ 
  stockData, 
  isOpen, 
  onClose, 
  showQuantityControls = true,
  defaultQuantity = 1,
  onSuccess,
  compact = false 
}) => {
  const navigate = useNavigate();
  const { portfolioData, buyStock, isLoading: portfolioLoading } = usePortfolio();

  // State management
  const [quantity, setQuantity] = useState(defaultQuantity);
  const [isSliding, setIsSliding] = useState(false);
  const [slideProgress, setSlideProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setQuantity(defaultQuantity);
      setSlideProgress(0);
      setIsProcessing(false);
    }
  }, [isOpen, defaultQuantity]);

  // Calculate costs
  const pricePerShare = stockData?.price || 0;
  const totalCost = quantity * pricePerShare;
  const canAfford = portfolioData.availableCash >= totalCost;

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

      if (result && result.success) {
        toast.success(`Successfully bought ${quantity} shares of ${stockData.symbol}!`);
        setSlideProgress(100);

        // Call success callback if provided
        if (onSuccess) {
          onSuccess(result);
        }

        // Close modal after short delay
        setTimeout(() => {
          onClose();
          setSlideProgress(0);
        }, 1500);

      } else {
        const errorMessage = result?.error || result?.message || 'Failed to buy stock';
        toast.error(errorMessage);
        setSlideProgress(0);
      }
    } catch (error) {
      console.error('Error buying stock:', error);
      toast.error(error.message || 'Failed to buy stock');
      setSlideProgress(0);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleQuickBuy = async () => {
    if (!canAfford || isProcessing) return;
    await handleBuyStock();
  };

  if (!isOpen || !stockData) return null;

  return (
    <motion.div
      className="slide-to-buy-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className={`slide-to-buy-modal ${compact ? 'compact' : ''}`}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header">
          <div className="stock-info">
            <h3>{stockData.symbol}</h3>
            <p>{stockData.name}</p>
          </div>
          <div className="header-actions">
            <WatchlistButton
              stockData={stockData}
              size="medium"
              variant="simple"
              showText={false}
            />
            <button onClick={onClose} className="close-btn">
              <FiX />
            </button>
          </div>
        </div>

        {/* Stock Price */}
        <div className="stock-price-section">
          <div className="current-price">
            <span className="price-value">{formatCurrency(stockData.price)}</span>
            <div className={`price-change ${stockData.change >= 0 ? 'positive' : 'negative'}`}>
              {stockData.change >= 0 ? '+' : ''}{formatCurrency(stockData.change)} 
              ({stockData.changePercent?.toFixed(2) || '0.00'}%)
            </div>
          </div>
        </div>

        {/* Quantity Controls */}
        {showQuantityControls && (
          <div className="quantity-section">
            <label>Quantity</label>
            <div className="quantity-controls">
              <button 
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="quantity-btn"
                disabled={isProcessing}
              >
                <FiMinus />
              </button>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="quantity-input"
                min="1"
                disabled={isProcessing}
              />
              <button 
                onClick={() => setQuantity(quantity + 1)}
                className="quantity-btn"
                disabled={isProcessing}
              >
                <FiPlus />
              </button>
            </div>
          </div>
        )}

        {/* Order Summary */}
        <div className="order-summary">
          <div className="summary-row">
            <span>Price per share</span>
            <span>{formatCurrency(pricePerShare)}</span>
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

        {/* Insufficient Funds Warning */}
        {!canAfford && (
          <div className="insufficient-funds-warning">
            <FiAlertCircle />
            <span>Insufficient funds to complete this purchase</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="action-buttons">
          {/* Quick Buy Button */}
          <button
            onClick={handleQuickBuy}
            disabled={!canAfford || isProcessing}
            className={`quick-buy-btn ${!canAfford ? 'disabled' : ''}`}
          >
            <FiShoppingCart />
            {isProcessing ? 'Processing...' : 'Quick Buy'}
          </button>

          {/* Slide to Buy */}
          <div className="slide-to-buy-container">
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

        {/* Additional Actions */}
        <div className="additional-actions">
          <button
            onClick={() => {
              onClose();
              navigate(`/stock/${stockData.symbol}`);
            }}
            className="view-details-btn"
          >
            View Full Details
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default SlideToBuy;
