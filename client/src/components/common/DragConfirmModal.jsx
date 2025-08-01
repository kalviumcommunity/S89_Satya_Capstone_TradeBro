/**
 * Drag to Confirm Modal Component
 * Interactive confirmation modal with drag slider for order confirmation
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { FiX, FiArrowRight, FiTrendingUp, FiTrendingDown, FiDollarSign, FiShield } from 'react-icons/fi';
import './DragConfirmModal.css';

const DragConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  orderData,
  loading = false
}) => {
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const constraintsRef = useRef(null);
  const dragX = useMotionValue(0);
  
  // Calculate progress (0 to 1)
  const progress = useTransform(dragX, [0, 200], [0, 1]);
  
  // Background color based on progress
  const backgroundColor = useTransform(
    progress,
    [0, 0.3, 0.7, 1],
    orderData?.action === 'BUY'
      ? ['rgba(229, 231, 235, 0.3)', 'rgba(251, 191, 36, 0.4)', 'rgba(16, 185, 129, 0.6)', 'rgba(16, 185, 129, 0.9)']
      : ['rgba(229, 231, 235, 0.3)', 'rgba(251, 191, 36, 0.4)', 'rgba(239, 68, 68, 0.6)', 'rgba(239, 68, 68, 0.9)']
  );

  // Track width based on progress for smoother animation
  const trackWidth = useTransform(progress, [0, 1], ['0%', '100%']);

  // Progress percentage for display
  const [progressPercent, setProgressPercent] = useState(0);
  const [lastMilestone, setLastMilestone] = useState(0);

  // Update progress percentage and handle milestones
  useEffect(() => {
    const unsubscribe = progress.on("change", (value) => {
      const percent = Math.round(value * 100);
      setProgressPercent(percent);

      // Milestone feedback at 25%, 50%, 75%
      const milestones = [25, 50, 75];
      const currentMilestone = milestones.find(m => percent >= m && lastMilestone < m);

      if (currentMilestone && isDragging) {
        setLastMilestone(currentMilestone);
        // Subtle haptic feedback for milestones
        if (navigator.vibrate) {
          navigator.vibrate(30);
        }
      }
    });
    return unsubscribe;
  }, [progress, lastMilestone, isDragging]);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setIsConfirmed(false);
      setIsDragging(false);
      setLastMilestone(0);
      setProgressPercent(0);
      dragX.set(0);
    }
  }, [isOpen, dragX]);

  // Handle drag start
  const handleDragStart = useCallback(() => {
    setIsDragging(true);
    setLastMilestone(0); // Reset milestone tracking
    // Haptic feedback for mobile devices
    if (navigator.vibrate) {
      navigator.vibrate(50); // Short vibration
    }
  }, []);

  // Handle drag end
  const handleDragEnd = useCallback(() => {
    const currentX = dragX.get();
    setIsDragging(false);

    if (currentX >= 180) { // 90% of the way
      setIsConfirmed(true);
      // Success haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate([100, 50, 100]); // Success pattern
      }
      setTimeout(() => {
        onConfirm(orderData);
      }, 300);
    } else {
      // Snap back
      dragX.set(0);
    }
  }, [dragX, onConfirm, orderData]);

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  // Calculate total value
  const totalValue = orderData ? orderData.quantity * orderData.price : 0;

  if (!orderData) {
    return null;
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="drag-confirm-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            className={`drag-confirm-modal ${isConfirmed ? 'confirmed' : ''}`}
            initial={{ opacity: 0, scale: 0.9, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            {/* Header */}
            <div className="modal-header">
              <div className="header-content">
                <div className={`action-icon ${orderData.action.toLowerCase()}`}>
                  {orderData.action === 'BUY' ? <FiTrendingUp /> : <FiTrendingDown />}
                </div>
                <div className="header-text">
                  <h2 className="modal-title">
                    Confirm {orderData.action} Order
                  </h2>
                  <p className="modal-subtitle">
                    Review your order details carefully
                  </p>
                </div>
              </div>
              <button className="close-button" onClick={onClose}>
                <FiX />
              </button>
            </div>

            {/* Order Details */}
            <div className="order-details">
              <div className="stock-info">
                <div className="stock-symbol">{orderData.symbol}</div>
                <div className="stock-name">{orderData.name || orderData.symbol}</div>
              </div>

              <div className="order-summary">
                <div className="summary-row">
                  <span className="label">Action:</span>
                  <span className={`value ${orderData.action.toLowerCase()}`}>
                    {orderData.action}
                  </span>
                </div>
                <div className="summary-row">
                  <span className="label">Quantity:</span>
                  <span className="value">{orderData.quantity} shares</span>
                </div>
                <div className="summary-row">
                  <span className="label">Price per share:</span>
                  <span className="value">{formatCurrency(orderData.price)}</span>
                </div>
                <div className="summary-row total">
                  <span className="label">Total Value:</span>
                  <span className="value">{formatCurrency(totalValue)}</span>
                </div>
              </div>

              {/* Risk Warning */}
              <div className="risk-warning">
                <FiShield className="warning-icon" />
                <div className="warning-text">
                  <strong>Important:</strong> This action cannot be undone. 
                  Please review all details before confirming.
                </div>
              </div>
            </div>

            {/* Drag to Confirm */}
            <div className="drag-confirm-container">
              <div className="drag-instruction">
                {isConfirmed ? (
                  <span className="confirmed-text">✓ Order Confirmed!</span>
                ) : (
                  <span>Drag to confirm {orderData.action.toLowerCase()} order</span>
                )}
              </div>

              <div className="drag-track" ref={constraintsRef}>
                <motion.div
                  className="drag-track-fill"
                  style={{
                    backgroundColor,
                    width: isConfirmed ? '100%' : trackWidth
                  }}
                />
                
                <motion.div
                  className={`drag-handle ${isDragging ? 'dragging' : ''} ${isConfirmed ? 'confirmed' : ''}`}
                  drag="x"
                  dragConstraints={constraintsRef}
                  dragElastic={0.1}
                  dragMomentum={false}
                  style={{ x: dragX }}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                  whileDrag={{ scale: 1.1 }}
                  animate={{
                    x: isConfirmed ? 200 : 0
                  }}
                  transition={{ type: "spring", damping: 20, stiffness: 300 }}
                >
                  {isConfirmed ? (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="check-icon"
                    >
                      ✓
                    </motion.div>
                  ) : (
                    <FiArrowRight />
                  )}
                </motion.div>

                <div className="drag-text">
                  {isConfirmed
                    ? 'Processing...'
                    : isDragging && progressPercent > 5
                      ? `${progressPercent}%`
                      : `Confirm ${orderData.action}`
                  }
                </div>
              </div>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="loading-overlay">
                <div className="loading-spinner" />
                <p>Processing your order...</p>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default DragConfirmModal;
