import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiX,
  FiShoppingCart,
  FiTrendingUp,
  FiTrendingDown,
  FiDollarSign,
  FiActivity,
  FiPlus,
  FiMinus,
  FiCheckCircle,
  FiAlertTriangle,
  FiClock
} from 'react-icons/fi';
import { usePortfolio } from '../contexts/PortfolioContext';
import { useSelector } from 'react-redux';
import StockPrice from './StockPrice';
import tradingService from '../services/tradingService';
import { useOrderValidation, formatCurrency, formatPercentage } from '../hooks/useOrderValidation';
import { useStockValidation, formatStockPrice } from '../hooks/useStockValidation';
import { showOrderToast, dismissToast } from './notifications/NotificationToast';
// OrderConfirmationModal moved to App level for proper overlay positioning
import LiveProfitLossCalculator from './LiveProfitLossCalculator';
import SmartQuantitySuggestions from './SmartQuantitySuggestions';

const OrderModal = ({
  isOpen,
  onClose,
  stockData = null,
  initialOrderType = 'buy',
  onOrderPlaced,
  onShowConfirmation // New prop to trigger confirmation modal at App level
}) => {
  const [orderType, setOrderType] = useState(initialOrderType);
  const [orderMethod, setOrderMethod] = useState('market');
  const [quantity, setQuantity] = useState(1);
  const [limitPrice, setLimitPrice] = useState('');
  const [confirmBeforePlace, setConfirmBeforePlace] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  // Removed local confirmation modal - now handled at App level

  const { portfolioData, buyStock, sellStock } = usePortfolio();
  const { user } = useSelector(state => state.auth);
  const toastTheme = document.documentElement.getAttribute('data-theme') || 'light';

  // Use validation hooks
  const {
    validationErrors,
    profitLossEstimate,
    isValidating,
    isValid,
    getOrderSummary
  } = useOrderValidation(stockData, orderType, quantity, limitPrice, orderMethod);

  // Use stock validation for real-time updates
  const {
    stockData: liveStockData,
    isLoading: stockLoading,
    refreshStockData,
    isMarketOpen
  } = useStockValidation(stockData?.symbol, isOpen);

  // Use live stock data if available, fallback to initial data
  const currentStockData = liveStockData || stockData;

  // Auto-fill stock data when modal opens
  useEffect(() => {
    if (isOpen && currentStockData) {
      setLimitPrice(currentStockData.price?.toString() || '');
      setQuantity(1);
    }
  }, [isOpen, currentStockData]);

  // Refresh stock data periodically when modal is open
  useEffect(() => {
    if (isOpen && currentStockData?.symbol) {
      const interval = setInterval(() => {
        refreshStockData();
      }, 30000); // Refresh every 30 seconds

      return () => clearInterval(interval);
    }
  }, [isOpen, currentStockData?.symbol, refreshStockData]);

  // Get order summary from validation hook
  const orderSummary = getOrderSummary();

  const handleQuantityChange = (delta) => {
    const newQuantity = Math.max(1, quantity + delta);
    setQuantity(newQuantity);
  };

  // Generate smart quantity options based on order type and available funds/shares
  const getQuantityOptions = () => {
    if (!currentStockData) return [];

    const currentPrice = orderMethod === 'market' ? currentStockData.price : parseFloat(limitPrice) || currentStockData.price;

    if (orderType === 'buy') {
      // For buy orders, suggest quantities based on available cash
      const availableCash = portfolioData.availableCash;
      const options = [];

      // Small investment options
      const smallAmounts = [1000, 2500, 5000, 10000];
      smallAmounts.forEach(amount => {
        const qty = Math.floor(amount / currentPrice);
        if (qty > 0 && amount <= availableCash) {
          options.push({
            value: qty,
            label: `${qty} shares`,
            amount: qty * currentPrice,
            disabled: false
          });
        }
      });

      // Percentage-based options
      const percentages = [25, 50, 75, 100];
      percentages.forEach(percent => {
        const amount = (availableCash * percent) / 100;
        const qty = Math.floor(amount / currentPrice);
        if (qty > 0 && !options.find(opt => opt.value === qty)) {
          options.push({
            value: qty,
            label: `${percent}% (${qty})`,
            amount: qty * currentPrice,
            disabled: false
          });
        }
      });

      // Sort by quantity and take top 6 options
      return options
        .sort((a, b) => a.value - b.value)
        .slice(0, 6)
        .map(opt => ({
          ...opt,
          disabled: opt.amount > availableCash
        }));

    } else {
      // For sell orders, suggest quantities based on holdings
      const holding = portfolioData.holdings.find(h => h.symbol === currentStockData.symbol);
      if (!holding || holding.quantity === 0) return [];

      const maxQuantity = holding.quantity;
      const options = [];

      // Fixed quantity options
      const fixedQties = [1, 5, 10, 25, 50, 100];
      fixedQties.forEach(qty => {
        if (qty <= maxQuantity) {
          options.push({
            value: qty,
            label: `${qty} shares`,
            amount: qty * currentPrice,
            disabled: false
          });
        }
      });

      // Percentage-based options
      const percentages = [25, 50, 75, 100];
      percentages.forEach(percent => {
        const qty = Math.floor((maxQuantity * percent) / 100);
        if (qty > 0 && !options.find(opt => opt.value === qty)) {
          options.push({
            value: qty,
            label: `${percent}% (${qty})`,
            amount: qty * currentPrice,
            disabled: false
          });
        }
      });

      // Add "All shares" option
      if (!options.find(opt => opt.value === maxQuantity)) {
        options.push({
          value: maxQuantity,
          label: `All (${maxQuantity})`,
          amount: maxQuantity * currentPrice,
          disabled: false
        });
      }

      // Sort by quantity and take top 6 options
      return options
        .sort((a, b) => a.value - b.value)
        .slice(0, 6);
    }
  };

  const handlePlaceOrder = () => {
    if (!isValid || (confirmBeforePlace && !document.getElementById('confirm-checkbox').checked)) {
      return;
    }

    // Trigger confirmation modal at App level with order data
    if (onShowConfirmation) {
      onShowConfirmation({
        orderData: {
          orderType,
          orderMethod,
          quantity,
          limitPrice
        },
        stockData: currentStockData,
        orderSummary,
        profitLossEstimate,
        onConfirm: handleConfirmOrder
      });
    } else {
      // No fallback - confirmation modal should be handled at App level
      console.warn('OrderModal: onShowConfirmation prop not provided. Order confirmation disabled.');
    }
  };

  const handleConfirmOrder = async () => {
    setIsPlacingOrder(true);
    // Confirmation modal is now handled at App level

    try {
      const orderPrice = orderMethod === 'market' ? currentStockData.price : parseFloat(limitPrice);

      console.log('🚀 Placing order:', {
        orderType,
        symbol: currentStockData.symbol,
        quantity,
        orderPrice,
        orderMethod
      });

      // Show pending toast
      const pendingToast = showOrderToast.pending(orderType, currentStockData.symbol, quantity, toastTheme);

      let result;
      if (orderType === 'buy') {
        // Use portfolio context buyStock which handles watchlist removal
        result = await buyStock(currentStockData.symbol, quantity, orderPrice, currentStockData);
      } else {
        // Use portfolio context sellStock which handles watchlist addition
        result = await sellStock(currentStockData.symbol, quantity, orderPrice, currentStockData);
      }

      dismissToast(pendingToast);

      if (result.success) {
        console.log('✅ Order successful:', result);

        if (orderType === 'buy') {
          showOrderToast.buySuccess(currentStockData.symbol, quantity, orderPrice, toastTheme);
        } else {
          // Calculate profit/loss for sell notification
          const profitLoss = profitLossEstimate ? profitLossEstimate.amount : 0;
          showOrderToast.sellSuccess(currentStockData.symbol, quantity, orderPrice, profitLoss, toastTheme);
        }

        // Refresh portfolio data
        if (portfolioData?.refreshPortfolio) {
          portfolioData.refreshPortfolio();
        }

        onOrderPlaced?.();
        onClose();
      } else {
        console.error('❌ Order failed:', result);
        throw new Error(result.error || 'Order failed');
      }
    } catch (error) {
      console.error('❌ Order error:', error);
      showOrderToast.error(
        'Order failed',
        error.message || 'An unexpected error occurred',
        toastTheme
      );
    } finally {
      setIsPlacingOrder(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="order-modal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          className="order-modal"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        >
          {/* Modal Header */}
          <div className="order-modal-header">
            <h2 className="order-modal-title">
              <FiShoppingCart />
              {orderType === 'buy' ? 'Buy Order' : 'Sell Order'}
            </h2>
            <button className="order-modal-close" onClick={onClose}>
              <FiX size={20} />
            </button>
          </div>

          <div className="order-modal-body">
            {/* Stock Information */}
            {currentStockData && (
              <div className="order-stock-info">
                <div className="order-stock-details">
                  <h3>{currentStockData.symbol}</h3>
                  <p>{currentStockData.name || currentStockData.symbol}</p>
                  {!isMarketOpen && (
                    <span className="market-closed-indicator">
                      <FiClock size={12} />
                      Market Closed
                    </span>
                  )}
                </div>
                <div className="order-stock-price">
                  <StockPrice
                    price={currentStockData.price}
                    change={currentStockData.change}
                    changePercent={currentStockData.changePercent}
                    size="large"
                  />
                  {stockLoading && (
                    <div className="price-loading">
                      <div className="loading-spinner" />
                      Updating...
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Order Type Selection */}
            <div className="order-form-section">
              <h3 className="section-title">
                <FiActivity />
                Order Type
              </h3>
              <div className="order-type-toggle">
                <button
                  className={`order-type-btn ${orderType === 'buy' ? 'active buy' : ''}`}
                  onClick={() => setOrderType('buy')}
                >
                  <FiTrendingUp />
                  Buy
                </button>
                <button
                  className={`order-type-btn ${orderType === 'sell' ? 'active sell' : ''}`}
                  onClick={() => setOrderType('sell')}
                >
                  <FiTrendingDown />
                  Sell
                </button>
              </div>
            </div>

            {/* Order Method */}
            <div className="order-form-section">
              <div className="order-method-select">
                <label htmlFor="order-method">Order Method</label>
                <select
                  id="order-method"
                  value={orderMethod}
                  onChange={(e) => setOrderMethod(e.target.value)}
                >
                  <option value="market">Market Order</option>
                  <option value="limit">Limit Order</option>
                </select>
              </div>
            </div>

            {/* Quantity and Price Inputs */}
            <div className="order-form-section">
              <div className="order-inputs-grid">
                <div className="order-input-group full-width">
                  <label>Quantity</label>

                  {/* Smart Quantity Suggestions */}
                  <SmartQuantitySuggestions
                    stockData={currentStockData}
                    orderType={orderType}
                    portfolioData={portfolioData}
                    currentPrice={orderMethod === 'market' ? currentStockData?.price || 0 : parseFloat(limitPrice) || 0}
                    onQuantitySelect={setQuantity}
                    selectedQuantity={quantity}
                  />

                  {/* Quick Quantity Options */}
                  <div className="quantity-options">
                    {getQuantityOptions().map((option) => (
                      <button
                        key={option.value}
                        className={`quantity-option-btn ${quantity === option.value ? 'active' : ''}`}
                        onClick={() => setQuantity(option.value)}
                        disabled={option.disabled}
                      >
                        <span className="option-value">{option.label}</span>
                        <span className="option-amount">₹{(option.value * (orderMethod === 'market' ? currentStockData?.price || 0 : parseFloat(limitPrice) || 0)).toLocaleString('en-IN')}</span>
                      </button>
                    ))}
                  </div>

                  {/* Manual Quantity Control */}
                  <div className="order-quantity-control">
                    <button
                      className="qty-control-btn"
                      onClick={() => handleQuantityChange(-1)}
                      disabled={quantity <= 1}
                    >
                      <FiMinus />
                    </button>
                    <input
                      type="number"
                      className="qty-control-input"
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      min="1"
                      placeholder="Enter quantity"
                    />
                    <button
                      className="qty-control-btn"
                      onClick={() => handleQuantityChange(1)}
                    >
                      <FiPlus />
                    </button>
                  </div>

                  {/* Investment Amount Display */}
                  <div className="investment-amount-display">
                    <span className="investment-label">Investment Amount:</span>
                    <span className="investment-value">
                      ₹{(quantity * (orderMethod === 'market' ? currentStockData?.price || 0 : parseFloat(limitPrice) || 0)).toLocaleString('en-IN')}
                    </span>
                  </div>

                  {validationErrors.quantity && (
                    <span className="error-text">{validationErrors.quantity}</span>
                  )}
                </div>

                {orderMethod === 'limit' && (
                  <div className="order-input-group">
                    <label>Limit Price (₹)</label>
                    <input
                      type="number"
                      className="order-price-input"
                      value={limitPrice}
                      onChange={(e) => setLimitPrice(e.target.value)}
                      placeholder="Enter limit price"
                      step="0.01"
                    />
                    {validationErrors.price && (
                      <span className="error-text">{validationErrors.price}</span>
                    )}
                  </div>
                )}
              </div>

              {/* Validation Errors */}
              {validationErrors.funds && (
                <div className="error-message">
                  <FiAlertTriangle />
                  {validationErrors.funds}
                </div>
              )}
              {validationErrors.shares && (
                <div className="error-message">
                  <FiAlertTriangle />
                  {validationErrors.shares}
                </div>
              )}
            </div>

            {/* Live P&L Calculator */}
            {currentStockData && quantity > 0 && (orderMethod === 'market' || limitPrice) && (
              <div className="order-form-section">
                <LiveProfitLossCalculator
                  stockData={currentStockData}
                  orderType={orderType}
                  quantity={quantity}
                  orderPrice={orderMethod === 'market' ? currentStockData.price : parseFloat(limitPrice) || 0}
                  averagePrice={
                    orderType === 'sell'
                      ? portfolioData.holdings.find(h => h.symbol === currentStockData.symbol)?.averagePrice
                      : null
                  }
                />
              </div>
            )}

            {/* Order Summary */}
            <div className="order-form-section">
              <div className="order-summary-card">
                <h3 className="order-summary-title">
                  <FiDollarSign />
                  Order Summary
                </h3>
                <div className="summary-row">
                  <span className="summary-label">Quantity:</span>
                  <span className="summary-value">{quantity} shares</span>
                </div>
                <div className="summary-row">
                  <span className="summary-label">Price per share:</span>
                  <span className="summary-value">
                    {formatStockPrice(orderSummary.pricePerShare)}
                  </span>
                </div>
                <div className="summary-row">
                  <span className="summary-label">Gross amount:</span>
                  <span className="summary-value">{formatCurrency(orderSummary.grossAmount)}</span>
                </div>
                <div className="summary-row">
                  <span className="summary-label">Fees & charges:</span>
                  <span className="summary-value">{formatCurrency(orderSummary.fees.total)}</span>
                </div>
                <div className="summary-row total">
                  <span className="summary-label">Net amount:</span>
                  <span className="summary-value">{formatCurrency(orderSummary.netAmount)}</span>
                </div>

                {/* Profit/Loss Estimate */}
                {profitLossEstimate && (
                  <div className={`profit-loss-indicator ${profitLossEstimate.isProfit ? 'profit' : 'loss'}`}>
                    {profitLossEstimate.isProfit ? <FiTrendingUp /> : <FiTrendingDown />}
                    Estimated {profitLossEstimate.isProfit ? 'Profit' : 'Loss'}:
                    {formatCurrency(Math.abs(profitLossEstimate.amount))}
                    ({formatPercentage(profitLossEstimate.percentage)})
                  </div>
                )}
              </div>
            </div>

            {/* Confirmation Checkbox */}
            <div className="confirm-checkbox">
              <input
                type="checkbox"
                id="confirm-checkbox"
                checked={confirmBeforePlace}
                onChange={(e) => setConfirmBeforePlace(e.target.checked)}
              />
              <label htmlFor="confirm-checkbox">
                I confirm that I want to place this {orderType} order
              </label>
            </div>

            {/* Action Buttons */}
            <div className="order-modal-actions">
              <button
                className="order-action-btn cancel"
                onClick={onClose}
                disabled={isPlacingOrder}
              >
                Cancel
              </button>
              <button
                className={`order-action-btn ${orderType === 'buy' ? 'place-buy' : 'place-sell'}`}
                onClick={handlePlaceOrder}
                disabled={
                  isPlacingOrder ||
                  !isValid ||
                  isValidating ||
                  (confirmBeforePlace && !document.getElementById('confirm-checkbox')?.checked)
                }
              >
                {isPlacingOrder ? (
                  <>
                    <div className="loading-spinner" />
                    Placing Order...
                  </>
                ) : (
                  `Place ${orderType === 'buy' ? 'Buy' : 'Sell'} Order`
                )}
              </button>
            </div>
          </div>
        </motion.div>

        {/* Confirmation Modal moved to App level for proper overlay positioning */}
      </motion.div>
    </AnimatePresence>
  );
};

export default OrderModal;
