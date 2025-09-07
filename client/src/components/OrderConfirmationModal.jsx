import React, { useState, useEffect, useRef, useCallback } from 'react';
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
} from 'react-icons/fi';
import { formatCurrency, formatPercentage } from '../utils/orderUtils';

const OrderConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  orderData,
  stockData,
  orderSummary,
  profitLossEstimate,
  isProcessing = false,
  isSuccess = false
}) => {
  const [confirmationStep, setConfirmationStep] = useState('review');
  const [slideProgress, setSlideProgress] = useState(0);
  const slideRef = useRef(null);

  useEffect(() => {
    if (isSuccess) {
      setConfirmationStep('success');
    } else if (isProcessing) {
      setConfirmationStep('processing');
    } else {
      setConfirmationStep('review');
    }
  }, [isProcessing, isSuccess]);

  useEffect(() => {
    if (!isOpen) {
      setSlideProgress(0);
    }
  }, [isOpen]);

  const handleSlideStart = useCallback((e) => {
    e.preventDefault();
    const startX = e.touches?.[0].clientX || e.clientX;
    const slider = slideRef.current;
    if (!slider) return;

    const sliderRect = slider.getBoundingClientRect();
    const slideBarWidth = sliderRect.width - 60;

    const handleMove = (moveEvent) => {
      const currentX = moveEvent.touches?.[0].clientX || moveEvent.clientX;
      const deltaX = Math.max(0, Math.min(slideBarWidth, currentX - startX));
      const progress = (deltaX / slideBarWidth) * 100;
      setSlideProgress(progress);
    };

    const handleEnd = () => {
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleEnd);
      document.removeEventListener('touchmove', handleMove);
      document.removeEventListener('touchend', handleEnd);

      if (slideProgress > 90) {
        onConfirm();
      } else {
        setSlideProgress(0);
      }
    };

    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleEnd);
    document.addEventListener('touchmove', handleMove);
    document.addEventListener('touchend', handleEnd);
  }, [slideProgress, onConfirm]);

  if (!isOpen || !orderData || !stockData || !orderSummary) {
    return null;
  }

  const { orderType, orderMethod, quantity, pricePerShare } = orderSummary;
  const isMarketOrder = orderMethod === 'market';
  const isBuyOrder = orderType === 'buy';

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <motion.div
          className="confirmation-modal-overlay app-level-modal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={(e) => e.target === e.currentTarget && !isProcessing && onClose()}
        >
          <motion.div
            className="enhanced-confirmation-modal"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3 }}
          >
            <div className="confirmation-modal-header">
              <div className="confirmation-title-section">
                <div className={`confirmation-icon-wrapper ${isBuyOrder ? 'buy-icon' : 'sell-icon'}`}>
                  {confirmationStep === 'success' ? (
                    <FiCheckCircle className="confirmation-icon success" />
                  ) : (
                    <FiShield className="confirmation-icon" />
                  )}
                </div>
                <div className="title-content">
                  <h2 className="confirmation-modal-title">
                    {confirmationStep === 'success' ? 'Order Confirmed!' : `Confirm ${isBuyOrder ? 'Buy' : 'Sell'} Order`}
                  </h2>
                  <p className="confirmation-modal-subtitle">
                    {confirmationStep === 'success' ? 'Your order has been successfully placed' : 'Review your order details carefully before confirming'}
                  </p>
                </div>
              </div>
              {!isProcessing && (
                <button className="confirmation-modal-close" onClick={onClose} >
                  <FiX size={20} />
                </button>
              )}
            </div>

            <div className="confirmation-modal-body">
              {confirmationStep === 'review' && (
                <div className="confirmation-content-wrapper">
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                    <div className="confirmation-stock-info">
                      <div className="stock-header">
                        <div className="stock-title-section">
                          <h3>{stockData.symbol}</h3>
                          <span className="stock-exchange">NSE</span>
                        </div>
                        <div className="current-price-display">
                          <span>₹{formatCurrency(stockData.price)}</span>
                          <span className={`price-change ${stockData.change >= 0 ? 'positive' : 'negative'}`}>
                            {stockData.change >= 0 ? '+' : ''}{stockData.change?.toFixed(2)} ({stockData.changePercent?.toFixed(2)}%)
                          </span>
                        </div>
                      </div>
                      <p className="stock-name">{stockData.name || stockData.symbol}</p>
                    </div>

                    <div className="confirmation-details-grid">
                      <div className="detail-card">
                        <div className="detail-label">Order Type</div>
                        <div className="detail-value">{orderMethod.toUpperCase()} {orderType.toUpperCase()}</div>
                      </div>
                      <div className="detail-card">
                        <div className="detail-label">Quantity</div>
                        <div className="detail-value">{quantity} shares</div>
                      </div>
                      <div className="detail-card">
                        <div className="detail-label">Price per Share</div>
                        <div className="detail-value">
                          {isMarketOrder ? <span>{formatCurrency(pricePerShare)} <span className="market-price-note">(Market Price)</span></span> : formatCurrency(pricePerShare)}
                        </div>
                      </div>
                      <div className="detail-card">
                        <div className="detail-label">Execution</div>
                        <div className="detail-value">
                          {isMarketOrder ? <span className="immediate-execution"><FiZap size={14} /> Immediate</span> : <span className="limit-execution"><FiTarget size={14} /> When price reaches {formatCurrency(pricePerShare)}</span>}
                        </div>
                      </div>
                    </div>

                    <div className="confirmation-financial-summary">
                      <h4 className="summary-title"><FiDollarSign /> Financial Summary</h4>
                      <div className="summary-rows">
                        <div className="summary-row"><span>Gross Amount:</span><span>{formatCurrency(orderSummary.grossAmount)}</span></div>
                        <div className="summary-row"><span>Brokerage & Fees:</span><span>{formatCurrency(orderSummary.fees)}</span></div>
                        <div className="summary-row total-row"><span>Net Amount:</span><span className="net-amount">{formatCurrency(orderSummary.netAmount)}</span></div>
                      </div>
                      {!isBuyOrder && profitLossEstimate && (
                        <div className={`profit-loss-estimate ${profitLossEstimate.isProfit ? 'profit' : 'loss'}`}>
                          {profitLossEstimate.isProfit ? <FiTrendingUp /> : <FiTrendingDown />}
                          <div>
                            <div className="estimate-label">Estimated {profitLossEstimate.isProfit ? 'Profit' : 'Loss'}</div>
                            <div className="estimate-value">{formatCurrency(Math.abs(profitLossEstimate.amount))} ({formatPercentage(profitLossEstimate.percentage)})</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                </div>
              )}

              {confirmationStep === 'processing' && (
                <motion.div className="processing-status" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <motion.div className="processing-spinner" animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} />
                  <div className="processing-text">
                    <h4>Processing Your Order</h4>
                    <p>Please don't close this window...</p>
                  </div>
                </motion.div>
              )}

              {confirmationStep === 'success' && (
                <motion.div className="success-message" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}>
                  <FiCheckCircle className="success-icon" />
                  <h3>Order Successfully Placed!</h3>
                  <p>Your {isBuyOrder ? 'buy' : 'sell'} order for {quantity} shares of {stockData.symbol} has been confirmed.</p>
                </motion.div>
              )}

            </div>
            {confirmationStep === 'review' && (
              <div className="confirmation-modal-footer">
                <div className="slide-to-confirm">
                  <div ref={slideRef} className="slide-container">
                    <div className="slide-track" style={{ background: `linear-gradient(to right, ${isBuyOrder ? '#10B981' : '#EF4444'} ${slideProgress}%, var(--border-color) ${slideProgress}%)` }}>
                      <motion.div className="slide-button" style={{ left: `calc(${slideProgress}% - 30px)` }} onMouseDown={handleSlideStart} onTouchStart={handleSlideStart}>
                        <FiArrowRight />
                      </motion.div>
                    </div>
                    <span className="slide-text">Slide to {isBuyOrder ? 'Buy' : 'Sell'}</span>
                  </div>
                </div>
              </div>
            )}
            {confirmationStep === 'success' && (
              <motion.div className="confirmation-modal-footer">
                <button className="confirmation-btn success-btn" onClick={onClose}>Done</button>
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default OrderConfirmationModal;