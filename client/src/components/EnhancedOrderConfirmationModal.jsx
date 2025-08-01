import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiX,
  FiTrendingUp,
  FiTrendingDown,
  FiDollarSign,
  FiBarChart2,
  FiActivity,
  FiArrowRight,
  FiChevronRight,
  FiCheckCircle
} from 'react-icons/fi';
import { formatCurrency, formatPercentage } from '../hooks/useOrderValidation';
import { usePortfolio } from '../contexts/PortfolioContext';

/**
 * Enhanced Full-Page Order Confirmation Modal
 * Complete share details with slide-to-confirm action
 */
const EnhancedOrderConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  orderData,
  stockData,
  orderSummary,
  profitLossEstimate,
  isProcessing = false
}) => {
  const [confirmationStep, setConfirmationStep] = useState('details'); // 'details', 'processing', 'success'
  const [slideProgress, setSlideProgress] = useState(0);
  const [isSliding, setIsSliding] = useState(false);
  const slideRef = useRef(null);
  const { portfolioData } = usePortfolio();

  // Calculate holding data for sell orders
  const holdingData = React.useMemo(() => {
    if (orderData?.orderType === 'sell' && stockData && portfolioData?.holdings) {
      const holding = portfolioData.holdings.find(h => h.symbol === stockData.symbol);
      if (holding) {
        const currentPrice = stockData.price || 0;
        const buyPrice = holding.averagePrice || 0;
        const quantity = holding.quantity || 0;
        const totalInvested = buyPrice * quantity;
        const currentValue = currentPrice * quantity;
        const totalGainLoss = currentValue - totalInvested;
        const gainLossPercentage = totalInvested > 0 ? (totalGainLoss / totalInvested) * 100 : 0;

        return {
          ...holding,
          currentPrice,
          buyPrice,
          totalInvested,
          currentValue,
          totalGainLoss,
          gainLossPercentage,
          isProfit: totalGainLoss >= 0
        };
      }
    }
    return null;
  }, [orderData, stockData, portfolioData]);

  // Generate chart data for sell orders (from buy point to current)
  const chartData = React.useMemo(() => {
    if (holdingData) {
      const points = 20;
      const priceRange = holdingData.currentPrice - holdingData.buyPrice;
      const data = [];
      
      for (let i = 0; i <= points; i++) {
        const progress = i / points;
        const price = holdingData.buyPrice + (priceRange * progress);
        const value = price * holdingData.quantity;
        data.push({
          time: Date.now() - (points - i) * 24 * 60 * 60 * 1000,
          price: price,
          value: value
        });
      }
      return data;
    }
    return [];
  }, [holdingData]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setConfirmationStep('details');
      setSlideProgress(0);
      setIsSliding(false);
    }
  }, [isOpen]);

  // Handle slide-to-confirm
  const handleSlideStart = (e) => {
    setIsSliding(true);
    const startX = e.touches ? e.touches[0].clientX : e.clientX;
    const slider = slideRef.current;
    if (!slider) return;

    const sliderRect = slider.getBoundingClientRect();
    const maxSlide = sliderRect.width - 60;

    const handleMove = (moveEvent) => {
      const currentX = moveEvent.touches ? moveEvent.touches[0].clientX : moveEvent.clientX;
      const deltaX = Math.max(0, Math.min(maxSlide, currentX - startX));
      const progress = (deltaX / maxSlide) * 100;
      setSlideProgress(progress);
    };

    const handleEnd = () => {
      if (slideProgress > 80) {
        setConfirmationStep('processing');
        onConfirm();
      } else {
        setSlideProgress(0);
      }
      setIsSliding(false);
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleEnd);
      document.removeEventListener('touchmove', handleMove);
      document.removeEventListener('touchend', handleEnd);
    };

    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleEnd);
    document.addEventListener('touchmove', handleMove);
    document.addEventListener('touchend', handleEnd);
  };

  if (!isOpen || !orderData || !stockData) return null;

  const { orderType, orderMethod, quantity, limitPrice } = orderData;
  const currentPrice = orderMethod === 'market' ? stockData.price : parseFloat(limitPrice);
  const isBuyOrder = orderType === 'buy';

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <motion.div
          className="enhanced-confirmation-overlay app-level-modal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={(e) => e.target === e.currentTarget && onClose()}
          data-modal-level="app"
        >
          <motion.div
            className="enhanced-confirmation-modal"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          >
            {/* Close Button */}
            <motion.button
              className="enhanced-modal-close"
              onClick={onClose}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <FiX size={24} />
            </motion.button>

            {confirmationStep === 'details' && (
              <motion.div
                className="modal-content"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                {/* Stock Header */}
                <div className="stock-header">
                  <div className="stock-info">
                    <h1 className="stock-symbol">{stockData.symbol}</h1>
                    <p className="stock-name">{stockData.name}</p>
                    <div className="stock-exchange-badge">NSE</div>
                  </div>
                  <div className="stock-price">
                    <span className="current-price">{formatCurrency(currentPrice)}</span>
                    <div className={`price-change ${stockData.change >= 0 ? 'positive' : 'negative'}`}>
                      {stockData.change >= 0 ? <FiTrendingUp /> : <FiTrendingDown />}
                      <span>{formatCurrency(Math.abs(stockData.change))} ({formatPercentage(Math.abs(stockData.changePercent))})</span>
                    </div>
                  </div>
                </div>

                {/* Order Details */}
                <div className="order-details">
                  <h3 className="section-title">
                    <FiDollarSign />
                    Order Details
                  </h3>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <span className="label">Order Type:</span>
                      <span className={`value ${isBuyOrder ? 'buy' : 'sell'}`}>
                        {isBuyOrder ? 'BUY' : 'SELL'}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Quantity:</span>
                      <span className="value">{quantity} shares</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Price:</span>
                      <span className="value">{formatCurrency(currentPrice)}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Total Amount:</span>
                      <span className="value total">{formatCurrency(currentPrice * quantity)}</span>
                    </div>
                  </div>
                </div>

                {/* Profit/Loss Analysis for Sell Orders */}
                {!isBuyOrder && holdingData && (
                  <div className="profit-loss-analysis">
                    <h3 className="section-title">
                      <FiBarChart2 />
                      Profit & Loss Analysis
                    </h3>
                    <div className="pnl-summary">
                      <div className="pnl-item">
                        <span className="label">Buy Price:</span>
                        <span className="value">{formatCurrency(holdingData.buyPrice)}</span>
                      </div>
                      <div className="pnl-item">
                        <span className="label">Current Price:</span>
                        <span className="value">{formatCurrency(holdingData.currentPrice)}</span>
                      </div>
                      <div className="pnl-item">
                        <span className="label">Total Invested:</span>
                        <span className="value">{formatCurrency(holdingData.totalInvested)}</span>
                      </div>
                      <div className="pnl-item total">
                        <span className="label">Total {holdingData.isProfit ? 'Profit' : 'Loss'}:</span>
                        <span className={`value ${holdingData.isProfit ? 'profit' : 'loss'}`}>
                          {holdingData.isProfit ? '+' : ''}{formatCurrency(holdingData.totalGainLoss)}
                          ({holdingData.isProfit ? '+' : ''}{formatPercentage(holdingData.gainLossPercentage)})
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Slide to Confirm */}
                <div className="slide-to-confirm">
                  <div 
                    ref={slideRef}
                    className="slide-container"
                  >
                    <div 
                      className="slide-track"
                      style={{ 
                        background: `linear-gradient(to right, ${isBuyOrder ? '#10B981' : '#EF4444'} ${slideProgress}%, #E5E7EB ${slideProgress}%)`
                      }}
                    >
                      <motion.div
                        className="slide-button"
                        style={{ left: `${slideProgress}%` }}
                        onMouseDown={handleSlideStart}
                        onTouchStart={handleSlideStart}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <FiArrowRight />
                      </motion.div>
                    </div>
                    <span className="slide-text">
                      Slide to {isBuyOrder ? 'Buy' : 'Sell'}
                    </span>
                  </div>
                </div>
              </motion.div>
            )}

            {confirmationStep === 'processing' && (
              <motion.div
                className="processing-content"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div className="processing-animation">
                  <motion.div
                    className="spinner"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  />
                </div>
                <h2>Processing Order...</h2>
                <p>Please wait while we execute your {isBuyOrder ? 'buy' : 'sell'} order</p>
              </motion.div>
            )}

            {confirmationStep === 'success' && (
              <motion.div
                className="success-content"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <motion.div
                  className="success-icon"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
                >
                  <FiCheckCircle />
                </motion.div>
                <h2>Order Confirmed!</h2>
                <p>Your {isBuyOrder ? 'buy' : 'sell'} order has been successfully placed</p>
                <motion.button
                  className="success-button"
                  onClick={onClose}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Done
                </motion.button>
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default EnhancedOrderConfirmationModal;
