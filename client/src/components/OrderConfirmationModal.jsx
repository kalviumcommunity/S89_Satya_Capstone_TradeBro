import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiX,
  FiCheckCircle,
  FiAlertTriangle,
  FiTrendingUp,
  FiTrendingDown,
  FiDollarSign,
  FiClock,
  FiShield,
  FiInfo,
  FiZap,
  FiTarget,
  FiBarChart3,
  FiActivity,
  FiArrowRight,
  FiChevronRight
} from 'react-icons/fi';
import { formatCurrency, formatPercentage } from '../hooks/useOrderValidation';
import { formatStockPrice } from '../hooks/useStockValidation';
import { usePortfolio } from '../contexts/PortfolioContext';

/**
 * Enhanced Full-Page Order Confirmation Modal
 * Complete share details with slide-to-confirm action
 */
const OrderConfirmationModal = ({
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
  const [processingProgress, setProcessingProgress] = useState(0);
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
      // Generate sample chart data from buy price to current price
      const points = 20;
      const priceRange = holdingData.currentPrice - holdingData.buyPrice;
      const data = [];

      for (let i = 0; i <= points; i++) {
        const progress = i / points;
        const price = holdingData.buyPrice + (priceRange * progress);
        const value = price * holdingData.quantity;
        data.push({
          time: Date.now() - (points - i) * 24 * 60 * 60 * 1000, // Days ago
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
      setProcessingProgress(0);
      setSlideProgress(0);
      setIsSliding(false);
    }
  }, [isOpen]);

  // Handle processing animation
  useEffect(() => {
    if (isProcessing && confirmationStep === 'review') {
      setConfirmationStep('processing');

      // Simulate processing progress
      const interval = setInterval(() => {
        setProcessingProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            setConfirmationStep('success');
            return 100;
          }
          return prev + 10;
        });
      }, 150);

      return () => clearInterval(interval);
    }
  }, [isProcessing, confirmationStep]);

  // Handle slide-to-confirm
  const handleSlideStart = (e) => {
    setIsSliding(true);
    const startX = e.touches ? e.touches[0].clientX : e.clientX;
    const slider = slideRef.current;
    if (!slider) return;

    const sliderRect = slider.getBoundingClientRect();
    const maxSlide = sliderRect.width - 60; // 60px for button width

    const handleMove = (moveEvent) => {
      const currentX = moveEvent.touches ? moveEvent.touches[0].clientX : moveEvent.clientX;
      const deltaX = Math.max(0, Math.min(maxSlide, currentX - startX));
      const progress = (deltaX / maxSlide) * 100;
      setSlideProgress(progress);
    };

    const handleEnd = () => {
      if (slideProgress > 80) {
        // Trigger confirmation
        setConfirmationStep('processing');
        onConfirm();
      } else {
        // Reset slide
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

  const {
    orderType,
    orderMethod,
    quantity,
    limitPrice
  } = orderData;

  const currentPrice = orderMethod === 'market' ? stockData.price : parseFloat(limitPrice);
  const isMarketOrder = orderMethod === 'market';
  const isBuyOrder = orderType === 'buy';

  // Enhanced animations based on confirmation step
  const modalVariants = {
    hidden: {
      opacity: 0,
      scale: 0.9,
      y: 50,
      filter: "blur(10px)"
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      filter: "blur(0px)",
      transition: {
        type: "spring",
        damping: 25,
        stiffness: 300,
        duration: 0.5
      }
    },
    processing: {
      scale: 1.02,
      transition: {
        type: "spring",
        damping: 20,
        stiffness: 400
      }
    },
    success: {
      scale: 1,
      transition: {
        type: "spring",
        damping: 25,
        stiffness: 300
      }
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      y: 20,
      filter: "blur(5px)",
      transition: { duration: 0.3 }
    }
  };

  const overlayVariants = {
    hidden: { opacity: 0, backdropFilter: "blur(0px)" },
    visible: {
      opacity: 1,
      backdropFilter: "blur(12px)",
      transition: { duration: 0.3 }
    },
    exit: {
      opacity: 0,
      backdropFilter: "blur(0px)",
      transition: { duration: 0.3 }
    }
  };

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <motion.div
          className="confirmation-modal-overlay app-level-modal"
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={(e) => e.target === e.currentTarget && !isProcessing && onClose()}
          data-modal-level="app"
        >
        <motion.div
          className="enhanced-confirmation-modal"
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          {/* Enhanced Modal Header */}
          <div className="confirmation-modal-header">
            <div className="confirmation-title-section">
              <motion.div
                className={`confirmation-icon-wrapper ${isBuyOrder ? 'buy-icon' : 'sell-icon'}`}
                animate={confirmationStep === 'processing' ? { rotate: 360 } : {}}
                transition={{ duration: 2, repeat: confirmationStep === 'processing' ? Infinity : 0, ease: "linear" }}
              >
                {confirmationStep === 'success' ? (
                  <FiCheckCircle className="confirmation-icon success" />
                ) : confirmationStep === 'processing' ? (
                  <FiZap className="confirmation-icon processing" />
                ) : (
                  <FiShield className="confirmation-icon" />
                )}
              </motion.div>
              <div className="title-content">
                <h2 className="confirmation-modal-title">
                  {confirmationStep === 'success' ? 'Order Confirmed!' :
                   confirmationStep === 'processing' ? 'Processing Order...' :
                   `Confirm ${isBuyOrder ? 'Buy' : 'Sell'} Order`}
                </h2>
                <p className="confirmation-modal-subtitle">
                  {confirmationStep === 'success' ? 'Your order has been successfully placed' :
                   confirmationStep === 'processing' ? 'Please wait while we process your order' :
                   'Review your order details carefully before confirming'}
                </p>
              </div>
            </div>
            {!isProcessing && confirmationStep === 'review' && (
              <motion.button
                className="confirmation-modal-close"
                onClick={onClose}
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <FiX size={20} />
              </motion.button>
            )}
          </div>

          <div className="confirmation-modal-body">
            {/* Processing Progress Bar */}
            {confirmationStep === 'processing' && (
              <motion.div
                className="processing-progress"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="progress-bar">
                  <motion.div
                    className="progress-fill"
                    initial={{ width: 0 }}
                    animate={{ width: `${processingProgress}%` }}
                    transition={{ duration: 0.2 }}
                  />
                </div>
                <p className="progress-text">{processingProgress}% Complete</p>
              </motion.div>
            )}

            {/* Success Message */}
            {confirmationStep === 'success' && (
              <motion.div
                className="success-message"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
              >
                <FiCheckCircle className="success-icon" />
                <h3>Order Successfully Placed!</h3>
                <p>Your {isBuyOrder ? 'buy' : 'sell'} order for {quantity} shares of {stockData.symbol} has been confirmed.</p>
              </motion.div>
            )}

            {/* Order Type Alert - Only show in review step */}
            {confirmationStep === 'review' && (
              <motion.div
                className={`order-type-alert ${isBuyOrder ? 'buy-alert' : 'sell-alert'}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                <motion.div
                  animate={isMarketOrder ? { scale: [1, 1.1, 1] } : {}}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                >
                  {isBuyOrder ? <FiTrendingUp /> : <FiTrendingDown />}
                </motion.div>
                <div>
                  <div className="alert-title">
                    {isBuyOrder ? 'Purchase Order' : 'Sale Order'}
                    {isMarketOrder && <span className="market-badge">MARKET</span>}
                  </div>
                  <div className="alert-subtitle">
                    {isMarketOrder ? (
                      <>
                        <FiZap size={14} style={{ marginRight: '4px' }} />
                        Market order will execute immediately at best available price
                      </>
                    ) : (
                      <>
                        <FiTarget size={14} style={{ marginRight: '4px' }} />
                        Limit order will execute when price reaches ₹{formatStockPrice(currentPrice)}
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Stock Information - Only show in review step */}
            {confirmationStep === 'review' && (
              <motion.div
                className="confirmation-stock-info"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div className="stock-header">
                  <div className="stock-title-section">
                    <h3>{stockData.symbol}</h3>
                    <span className="stock-exchange">NSE</span>
                  </div>
                  <div className="current-price-display">
                    <motion.span
                      key={stockData.price}
                      initial={{ scale: 1.1, color: "#10B981" }}
                      animate={{ scale: 1, color: "#111827" }}
                      transition={{ duration: 0.3 }}
                    >
                      ₹{formatStockPrice(stockData.price)}
                    </motion.span>
                    <span className={`price-change ${stockData.change >= 0 ? 'positive' : 'negative'}`}>
                      {stockData.change >= 0 ? '+' : ''}{stockData.change?.toFixed(2) || '0.00'} ({stockData.changePercent?.toFixed(2) || '0.00'}%)
                    </span>
                  </div>
                </div>
                <p className="stock-name">{stockData.name || stockData.symbol}</p>
                <div className="stock-meta">
                  <span className="last-updated">
                    <FiClock size={12} />
                    Last updated: {new Date().toLocaleTimeString()}
                  </span>
                </div>
              </motion.div>
            )}

            {/* Order Details - Only show in review step */}
            {confirmationStep === 'review' && (
              <motion.div
                className="confirmation-details-grid"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
              >
              <div className="detail-card">
                <div className="detail-label">Order Type</div>
                <div className="detail-value">
                  {orderMethod.toUpperCase()} {orderType.toUpperCase()}
                </div>
              </div>

              <div className="detail-card">
                <div className="detail-label">Quantity</div>
                <div className="detail-value">{quantity} shares</div>
              </div>

              <div className="detail-card">
                <div className="detail-label">Price per Share</div>
                <div className="detail-value">
                  {isMarketOrder ? (
                    <span>
                      {formatStockPrice(currentPrice)}
                      <span className="market-price-note">(Market Price)</span>
                    </span>
                  ) : (
                    formatStockPrice(currentPrice)
                  )}
                </div>
              </div>

              <div className="detail-card">
                <div className="detail-label">Execution</div>
                <div className="detail-value">
                  {isMarketOrder ? (
                    <span className="immediate-execution">
                      <FiClock size={14} />
                      Immediate
                    </span>
                  ) : (
                    <span className="limit-execution">
                      When price reaches {formatStockPrice(currentPrice)}
                    </span>
                  )}
                </div>
              </div>
              </motion.div>
            )}

            {/* Financial Summary - Only show in review step */}
            {confirmationStep === 'review' && (
              <motion.div
                className="confirmation-financial-summary"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
              <h4 className="summary-title">
                <FiDollarSign />
                Financial Summary
              </h4>
              
              <div className="summary-rows">
                <div className="summary-row">
                  <span>Gross Amount:</span>
                  <span>{formatCurrency(orderSummary.grossAmount)}</span>
                </div>
                <div className="summary-row">
                  <span>Brokerage & Fees:</span>
                  <span>{formatCurrency(orderSummary.fees.total)}</span>
                </div>
                <div className="summary-row total-row">
                  <span>Net Amount:</span>
                  <span className="net-amount">{formatCurrency(orderSummary.netAmount)}</span>
                </div>
              </div>

              {/* Profit/Loss Estimate for Sell Orders */}
              {!isBuyOrder && profitLossEstimate && (
                <div className={`profit-loss-estimate ${profitLossEstimate.isProfit ? 'profit' : 'loss'}`}>
                  {profitLossEstimate.isProfit ? <FiTrendingUp /> : <FiTrendingDown />}
                  <div>
                    <div className="estimate-label">
                      Estimated {profitLossEstimate.isProfit ? 'Profit' : 'Loss'}
                    </div>
                    <div className="estimate-value">
                      {formatCurrency(Math.abs(profitLossEstimate.amount))} 
                      ({formatPercentage(profitLossEstimate.percentage)})
                    </div>
                  </div>
                </div>
              )}
              </motion.div>
            )}

            {/* Risk Warnings - Only show in review step */}
            {confirmationStep === 'review' && (
              <>
            {!isMarketOrder && (
              <div className="risk-warning">
                <FiAlertTriangle />
                <div>
                  <div className="warning-title">Limit Order Notice</div>
                  <div className="warning-text">
                    Your order will only execute if the market price reaches your limit price. 
                    There's no guarantee of execution.
                  </div>
                </div>
              </div>
            )}

            {isMarketOrder && (
              <div className="risk-warning market-warning">
                <FiAlertTriangle />
                <div>
                  <div className="warning-title">Market Order Notice</div>
                  <div className="warning-text">
                    Market orders execute immediately at the best available price, 
                    which may differ from the displayed price.
                  </div>
                </div>
              </div>
            )}
            </>
            )}

            {/* Enhanced Action Buttons */}
            <motion.div
              className="confirmation-actions"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              {confirmationStep === 'review' && (
                <>
                  <motion.button
                    className="confirmation-btn cancel-btn"
                    onClick={onClose}
                    disabled={isProcessing}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  >
                    <FiX size={16} />
                    Cancel
                  </motion.button>
                  <motion.button
                    className={`confirmation-btn confirm-btn ${isBuyOrder ? 'buy-confirm' : 'sell-confirm'}`}
                    onClick={onConfirm}
                    disabled={isProcessing}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  >
                    <FiCheckCircle size={16} />
                    Confirm {isBuyOrder ? 'Purchase' : 'Sale'}
                    <span className="btn-amount">₹{formatStockPrice(orderSummary?.netAmount || 0)}</span>
                  </motion.button>
                </>
              )}

              {confirmationStep === 'processing' && (
                <motion.div
                  className="processing-status"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <div className="processing-spinner">
                    <motion.div
                      className="spinner-ring"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                  </div>
                  <div className="processing-text">
                    <h4>Processing Your Order</h4>
                    <p>Please don't close this window...</p>
                  </div>
                </motion.div>
              )}

              {confirmationStep === 'success' && (
                <motion.button
                  className="confirmation-btn success-btn"
                  onClick={onClose}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5, type: "spring", stiffness: 300 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <FiCheckCircle size={16} />
                  Done
                </motion.button>
              )}
            </motion.div>
          </div>
        </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default OrderConfirmationModal;
