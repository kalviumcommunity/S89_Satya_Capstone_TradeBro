import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiTrendingUp, FiTrendingDown, FiAlertCircle, FiCheck, FiDollarSign } from 'react-icons/fi';
import tradingEngine from '../../services/tradingEngine';
import './TradingModal.css';

const TradingModal = ({ 
  isOpen, 
  onClose, 
  symbol, 
  currentPrice, 
  action, // 'BUY' or 'SELL'
  stockData = {},
  onTradeComplete = null
}) => {
  const [quantity, setQuantity] = useState(1);
  const [orderType, setOrderType] = useState('MARKET');
  const [limitPrice, setLimitPrice] = useState(currentPrice);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [tradePreview, setTradePreview] = useState(null);
  const [availableActions, setAvailableActions] = useState({});

  // Reset form when modal opens/closes or action changes
  useEffect(() => {
    if (isOpen) {
      setQuantity(1);
      setOrderType('MARKET');
      setLimitPrice(currentPrice);
      setError('');
      updateAvailableActions();
      calculateTradePreview();
    }
  }, [isOpen, action, symbol, currentPrice]);

  // Recalculate preview when inputs change
  useEffect(() => {
    if (isOpen) {
      calculateTradePreview();
    }
  }, [quantity, orderType, limitPrice, currentPrice]);

  const updateAvailableActions = () => {
    if (symbol) {
      const actions = tradingEngine.getAvailableActions(symbol);
      setAvailableActions(actions);
    }
  };

  const calculateTradePreview = () => {
    try {
      if (!symbol || !quantity || quantity <= 0) {
        setTradePreview(null);
        return;
      }

      const price = orderType === 'MARKET' ? currentPrice : limitPrice;
      const tradeValue = quantity * price;
      const brokerage = tradingEngine.calculateBrokerage(tradeValue);
      const taxes = tradingEngine.calculateTaxes(tradeValue, action);
      const totalCost = action === 'BUY' ? tradeValue + brokerage + taxes : tradeValue - brokerage - taxes;

      setTradePreview({
        tradeValue,
        brokerage,
        taxes,
        totalCost,
        price,
        quantity: parseInt(quantity)
      });

      setError('');
    } catch (err) {
      setError(err.message);
      setTradePreview(null);
    }
  };

  const validateTrade = () => {
    if (!quantity || quantity <= 0) {
      return 'Please enter a valid quantity';
    }

    if (action === 'SELL' && quantity > availableActions.maxSellQuantity) {
      return `Insufficient holdings. You have ${availableActions.maxSellQuantity} shares`;
    }

    if (action === 'BUY' && tradePreview && tradePreview.totalCost > tradingEngine.virtualBalance) {
      return `Insufficient balance. Required: ₹${tradePreview.totalCost.toFixed(2)}`;
    }

    if (orderType === 'LIMIT' && (!limitPrice || limitPrice <= 0)) {
      return 'Please enter a valid limit price';
    }

    return null;
  };

  const handleTrade = async () => {
    const validationError = validateTrade();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const price = orderType === 'MARKET' ? currentPrice : limitPrice;
      const result = await tradingEngine.executeTrade(
        symbol,
        parseInt(quantity),
        price,
        action,
        orderType
      );

      if (result.success) {
        // Show success notification
        if (window.showNotification) {
          window.showNotification({
            type: 'success',
            title: 'Trade Executed',
            message: `${action} ${quantity} ${symbol} @ ₹${price.toFixed(2)}`,
            duration: 3000
          });
        }

        // Call completion callback
        if (onTradeComplete) {
          onTradeComplete(result);
        }

        // Close modal
        onClose();
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-IN').format(num);
  };

  if (!isOpen) return null;

  const ActionIcon = action === 'BUY' ? FiTrendingUp : FiTrendingDown;
  const actionColor = action === 'BUY' ? '#10B981' : '#EF4444';

  return (
    <AnimatePresence>
      <motion.div
        className="trading-modal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="trading-modal"
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="modal-header">
            <div className="header-content">
              <ActionIcon size={24} color={actionColor} />
              <div className="header-text">
                <h2>{action} {symbol}</h2>
                <p>Current Price: {formatCurrency(currentPrice)}</p>
              </div>
            </div>
            <button className="close-btn" onClick={onClose}>
              <FiX size={24} />
            </button>
          </div>

          {/* Holdings Info for Sell Orders */}
          {action === 'SELL' && availableActions.currentHoldings > 0 && (
            <div className="holdings-display">
              <div className="holdings-item">
                <span className="label">Current Holdings:</span>
                <span className="value">{formatNumber(availableActions.currentHoldings)} shares</span>
              </div>
              <div className="holdings-item">
                <span className="label">Average Price:</span>
                <span className="value">{formatCurrency(availableActions.avgPrice)}</span>
              </div>
            </div>
          )}

          {/* Order Form */}
          <div className="order-form">
            {/* Order Type */}
            <div className="form-group">
              <label>Order Type</label>
              <div className="order-type-buttons">
                <button
                  className={`order-type-btn ${orderType === 'MARKET' ? 'active' : ''}`}
                  onClick={() => setOrderType('MARKET')}
                >
                  Market
                </button>
                <button
                  className={`order-type-btn ${orderType === 'LIMIT' ? 'active' : ''}`}
                  onClick={() => setOrderType('LIMIT')}
                >
                  Limit
                </button>
              </div>
            </div>

            {/* Quantity */}
            <div className="form-group">
              <label>Quantity</label>
              <div className="quantity-input">
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  min="1"
                  max={action === 'SELL' ? availableActions.maxSellQuantity : undefined}
                  placeholder="Enter quantity"
                />
                {action === 'SELL' && (
                  <button
                    className="max-btn"
                    onClick={() => setQuantity(availableActions.maxSellQuantity)}
                  >
                    MAX
                  </button>
                )}
              </div>
            </div>

            {/* Limit Price (if limit order) */}
            {orderType === 'LIMIT' && (
              <div className="form-group">
                <label>Limit Price</label>
                <div className="price-input">
                  <FiDollarSign size={16} />
                  <input
                    type="number"
                    value={limitPrice}
                    onChange={(e) => setLimitPrice(parseFloat(e.target.value))}
                    min="0.01"
                    step="0.01"
                    placeholder="Enter limit price"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Trade Preview */}
          {tradePreview && (
            <div className="trade-preview">
              <h3>Order Summary</h3>
              <div className="preview-grid">
                <div className="preview-item">
                  <span className="label">Quantity:</span>
                  <span className="value">{formatNumber(tradePreview.quantity)} shares</span>
                </div>
                <div className="preview-item">
                  <span className="label">Price:</span>
                  <span className="value">{formatCurrency(tradePreview.price)}</span>
                </div>
                <div className="preview-item">
                  <span className="label">Trade Value:</span>
                  <span className="value">{formatCurrency(tradePreview.tradeValue)}</span>
                </div>
                <div className="preview-item">
                  <span className="label">Brokerage:</span>
                  <span className="value">{formatCurrency(tradePreview.brokerage)}</span>
                </div>
                <div className="preview-item">
                  <span className="label">Taxes & Charges:</span>
                  <span className="value">{formatCurrency(tradePreview.taxes)}</span>
                </div>
                <div className="preview-item total">
                  <span className="label">Total {action === 'BUY' ? 'Cost' : 'Proceeds'}:</span>
                  <span className="value">{formatCurrency(tradePreview.totalCost)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <motion.div
              className="error-message"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <FiAlertCircle size={16} />
              <span>{error}</span>
            </motion.div>
          )}

          {/* Action Buttons */}
          <div className="modal-actions">
            <button
              className="cancel-btn"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </button>
            <motion.button
              className={`confirm-btn ${action.toLowerCase()}`}
              onClick={handleTrade}
              disabled={isLoading || !tradePreview || !!validateTrade()}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isLoading ? (
                <div className="loading-spinner" />
              ) : (
                <>
                  <FiCheck size={16} />
                  {action} {symbol}
                </>
              )}
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default TradingModal;
