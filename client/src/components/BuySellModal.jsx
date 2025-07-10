import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiDollarSign, FiAlertCircle, FiInfo, FiCheck } from 'react-icons/fi';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { useVirtualMoney } from '../context/VirtualMoneyContext';
import Loading from './Loading';
import { API_ENDPOINTS } from '../config/apiConfig';
import '../styles/components/BuySellModal.css';

const BuySellModal = ({
  isOpen,
  onClose,
  type,
  stockData,
  onSuccess,
  virtualMoney: propVirtualMoney
}) => {
  const { success, error } = useToast();
  const navigate = useNavigate();
  const { virtualMoney: contextVirtualMoney, updateVirtualMoney } = useVirtualMoney();
  // Use prop virtualMoney if provided, otherwise use context
  const virtualMoney = propVirtualMoney || contextVirtualMoney;
  const [quantity, setQuantity] = useState(1);
  const [orderType, setOrderType] = useState('MARKET');
  const [limitPrice, setLimitPrice] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [confirmation, setConfirmation] = useState(false);
  const [estimatedTotal, setEstimatedTotal] = useState(0);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setQuantity(1);
      setOrderType('MARKET');
      setLimitPrice('');
      setError('');
      setConfirmation(false);

      // Set limit price to current price by default
      if (stockData && stockData.price) {
        setLimitPrice(stockData.price.toFixed(2));
      }
    }
  }, [isOpen, stockData]);

  // Calculate estimated total
  useEffect(() => {
    if (stockData && stockData.price) {
      const price = orderType === 'LIMIT' ? parseFloat(limitPrice) || stockData.price : stockData.price;
      setEstimatedTotal(price * quantity);
    }
  }, [quantity, orderType, limitPrice, stockData]);

  // Handle quantity change
  const handleQuantityChange = (e) => {
    const value = parseInt(e.target.value);
    if (value > 0) {
      setQuantity(value);
    }
  };

  // Handle limit price change
  const handleLimitPriceChange = (e) => {
    const value = e.target.value;
    if (value === '' || (/^\d*\.?\d*$/.test(value) && parseFloat(value) >= 0)) {
      setLimitPrice(value);
    }
  };

  // Validate order with improved precision and edge case handling
  const validateOrder = () => {
    if (quantity <= 0) {
      setError('Quantity must be greater than 0');
      return false;
    }

    if (orderType === 'LIMIT' && (!limitPrice || parseFloat(limitPrice) <= 0)) {
      setError('Please enter a valid limit price');
      return false;
    }

    if (type === 'BUY') {
      // Calculate total cost with proper precision
      const price = orderType === 'LIMIT' ? parseFloat(limitPrice) : stockData.price;
      const totalCost = parseFloat((price * quantity).toFixed(2));
      const availableBalance = parseFloat(virtualMoney.balance.toFixed(2));

      // Check if user has enough balance with proper precision handling
      if (totalCost > availableBalance) {
        setError(`Insufficient funds. You need ₹${totalCost.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})} but have ₹${availableBalance.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`);
        return false;
      }

      // Handle exact balance match
      if (totalCost === availableBalance) {
        console.log('Exact balance match for purchase');
        // We'll allow this but might want to show a warning
      }
    } else if (type === 'SELL') {
      // Check if user owns enough shares - improved matching logic
      const ownedStock = virtualMoney.portfolio.find(item => {
        // Normalize symbols for comparison by removing any spaces and converting to uppercase
        const itemSymbol = (item.symbol || item.stockSymbol || '').replace(/\s+/g, '').toUpperCase();
        const dataSymbol = (stockData.symbol || '').replace(/\s+/g, '').toUpperCase();

        return itemSymbol === dataSymbol;
      });

      // Handle case where user has no holdings
      if (!ownedStock || ownedStock.quantity === 0) {
        setError(`You don't own any shares of ${stockData.symbol}`);
        return false;
      }

      // Handle case where user doesn't have enough shares
      if (ownedStock.quantity < quantity) {
        setError(`You only own ${ownedStock.quantity} shares of ${stockData.symbol}`);
        return false;
      }

      // Handle case where user is selling all shares
      if (ownedStock.quantity === quantity) {
        console.log('Selling all shares of this stock');
        // We'll allow this but might want to show a confirmation
      }
    }

    return true;
  };

  // Handle order submission with improved error handling and notifications
  const handleSubmit = async () => {
    if (!validateOrder()) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Create transaction data with proper precision
      const price = orderType === 'LIMIT' ? parseFloat(limitPrice) : stockData.price;
      const transactionData = {
        stockSymbol: stockData.symbol,
        quantity: parseInt(quantity),
        price: parseFloat(price.toFixed(2)) // Ensure price has 2 decimal places
      };

      // Call the API directly instead of using Redux
      const endpoint = type === 'BUY'
        ? API_ENDPOINTS.VIRTUAL_MONEY.BUY
        : API_ENDPOINTS.VIRTUAL_MONEY.SELL;

      const response = await axios.post(endpoint, transactionData);

      if (response.data.success) {
        // Update virtual money state with the new data
        updateVirtualMoney(response.data.data);

        // Format price with proper currency formatting
        const formattedPrice = price.toLocaleString('en-IN', {
          style: 'currency',
          currency: 'INR',
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        });

        // Show success toast with detailed information
        success(`You successfully ${type === 'BUY' ? 'bought' : 'sold'} ${quantity} shares of ${stockData.symbol} at ${formattedPrice} each!`);

        if (onSuccess) {
          onSuccess(response.data.data);
        }

        // Close the modal
        onClose();

        // Redirect to portfolio page after a short delay to allow the toast to be seen
        setTimeout(() => {
          console.log(`Redirecting to portfolio page after ${type} transaction`);
          navigate('/portfolio?transactionSuccess=true', { replace: true });
        }, 1000);
      } else {
        setError(response.data.message || 'Transaction failed');

        // Show error toast
        error(response.data.message || `Failed to ${type === 'BUY' ? 'buy' : 'sell'} ${stockData.symbol}`);
      }
    } catch (err) {
      console.error(`Error ${type === 'BUY' ? 'buying' : 'selling'} stock:`, err);

      // Handle offline mode or API errors
      if (err.response) {
        const errorMessage = err.response.data?.message || 'Transaction failed. Please try again.';
        setError(errorMessage);

        // Show error toast
        error(errorMessage);
      } else {
        // Simulate a successful transaction for offline mode
        const transactionPrice = parseFloat(price.toFixed(2));
        const updatedVirtualMoney = simulateTransaction(type, {
          ...transactionData,
          price: transactionPrice
        });
        updateVirtualMoney(updatedVirtualMoney);

        // Format price with proper currency formatting
        const formattedPrice = transactionPrice.toLocaleString('en-IN', {
          style: 'currency',
          currency: 'INR',
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        });

        // Show success toast with detailed information
        success(`You successfully ${type === 'BUY' ? 'bought' : 'sold'} ${quantity} shares of ${stockData.symbol} at ${formattedPrice} each! (offline mode)`);

        if (onSuccess) {
          onSuccess(updatedVirtualMoney);
        }

        // Close the modal
        onClose();

        // Redirect to portfolio page
        setTimeout(() => {
          console.log(`Redirecting to portfolio page after ${type} transaction (offline mode)`);
          navigate('/portfolio?transactionSuccess=true', { replace: true });
        }, 1000);
      }
    } finally {
      setLoading(false);
    }
  };

  // Helper function to simulate a transaction in offline mode with improved precision
  const simulateTransaction = (type, transactionData) => {
    const { stockSymbol, quantity, price } = transactionData;
    // Calculate total with proper precision (2 decimal places)
    const totalAmount = parseFloat((quantity * price).toFixed(2));

    if (type === 'BUY') {
      // Create a copy of the virtual money object with precise balance calculation
      const updatedVirtualMoney = {
        ...virtualMoney,
        balance: parseFloat((virtualMoney.balance - totalAmount).toFixed(2)),
        portfolio: [...(virtualMoney.portfolio || [])]
      };

      // Check if the stock already exists in the portfolio with improved symbol matching
      const existingStockIndex = updatedVirtualMoney.portfolio.findIndex(item => {
        const itemSymbol = (item.symbol || item.stockSymbol || '').replace(/\s+/g, '').toUpperCase();
        const dataSymbol = stockSymbol.replace(/\s+/g, '').toUpperCase();
        return itemSymbol === dataSymbol;
      });

      if (existingStockIndex >= 0) {
        // Update existing stock with precise average price calculation
        const existingStock = updatedVirtualMoney.portfolio[existingStockIndex];
        const totalShares = existingStock.quantity + quantity;
        const totalCost = parseFloat(((existingStock.averageBuyPrice * existingStock.quantity) + (price * quantity)).toFixed(2));
        const newAveragePrice = parseFloat((totalCost / totalShares).toFixed(2));

        updatedVirtualMoney.portfolio[existingStockIndex] = {
          ...existingStock,
          quantity: totalShares,
          averageBuyPrice: newAveragePrice,
          lastUpdated: new Date()
        };
      } else {
        // Add new stock to portfolio
        updatedVirtualMoney.portfolio.push({
          stockSymbol: stockSymbol,
          symbol: stockSymbol, // Add both for compatibility
          quantity: quantity,
          averageBuyPrice: parseFloat(price.toFixed(2)),
          lastUpdated: new Date()
        });
      }

      return updatedVirtualMoney;
    } else {
      // SELL transaction with precise balance calculation
      const updatedVirtualMoney = {
        ...virtualMoney,
        balance: parseFloat((virtualMoney.balance + totalAmount).toFixed(2)),
        portfolio: [...(virtualMoney.portfolio || [])]
      };

      // Find the stock in the portfolio with improved symbol matching
      const existingStockIndex = updatedVirtualMoney.portfolio.findIndex(item => {
        const itemSymbol = (item.symbol || item.stockSymbol || '').replace(/\s+/g, '').toUpperCase();
        const dataSymbol = stockSymbol.replace(/\s+/g, '').toUpperCase();
        return itemSymbol === dataSymbol;
      });

      if (existingStockIndex >= 0) {
        const existingStock = updatedVirtualMoney.portfolio[existingStockIndex];
        const remainingShares = existingStock.quantity - quantity;

        if (remainingShares > 0) {
          // Update with remaining shares
          updatedVirtualMoney.portfolio[existingStockIndex] = {
            ...existingStock,
            quantity: remainingShares,
            lastUpdated: new Date()
          };
        } else {
          // Remove stock from portfolio
          updatedVirtualMoney.portfolio.splice(existingStockIndex, 1);
        }
      }

      return updatedVirtualMoney;
    }
  };

  // Handle confirmation
  const handleConfirmation = () => {
    if (validateOrder()) {
      setConfirmation(true);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="modal-container"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 20 }}
          >
            <div className="modal-header">
              <h2>{type === 'BUY' ? 'Buy' : 'Sell'} {stockData?.symbol}</h2>
              <button className="close-modal-btn" onClick={onClose}>
                <FiX />
              </button>
            </div>

            <div className="modal-content">
              {loading ? (
                <div className="modal-loading">
                  <Loading size="medium" text={`Processing ${type === 'BUY' ? 'purchase' : 'sale'}...`} />
                </div>
              ) : confirmation ? (
                <div className="confirmation-screen">
                  <div className={`confirmation-icon ${type === 'BUY' ? 'buy' : 'sell'}`}>
                    {type === 'BUY' ? <FiCheck /> : <FiInfo />}
                  </div>
                  <h3>Confirm {type === 'BUY' ? 'Purchase' : 'Sale'}</h3>
                  <div className="confirmation-details">
                    <p>
                      <strong>Stock:</strong>
                      <span>{stockData?.name} ({stockData?.symbol})</span>
                    </p>
                    <p>
                      <strong>Quantity:</strong>
                      <span>{quantity} shares</span>
                    </p>
                    <p>
                      <strong>Price:</strong>
                      <span>₹{orderType === 'LIMIT' ? parseFloat(limitPrice).toFixed(2) : stockData?.price.toFixed(2)} per share</span>
                    </p>
                    <p>
                      <strong>Total:</strong>
                      <span className={type === 'BUY' ? 'negative-amount' : 'positive-amount'}>
                        {type === 'BUY' ? '-' : '+'}₹{estimatedTotal.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                      </span>
                    </p>
                    <p>
                      <strong>Order Type:</strong>
                      <span>{orderType}</span>
                    </p>
                    {type === 'BUY' && (
                      <p>
                        <strong>Remaining Balance:</strong>
                        <span>₹{(virtualMoney.balance - estimatedTotal).toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                      </p>
                    )}
                  </div>

                  <div className="confirmation-buttons">
                    <button
                      className="cancel-btn"
                      onClick={() => setConfirmation(false)}
                      disabled={loading}
                    >
                      Cancel
                    </button>
                    <button
                      className={`confirm-btn ${type === 'BUY' ? 'buy' : 'sell'}`}
                      onClick={handleSubmit}
                      disabled={loading}
                    >
                      {loading ? (
                        <span className="loading-spinner"></span>
                      ) : (
                        <>Confirm {type === 'BUY' ? 'Purchase' : 'Sale'}</>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="stock-info-row">
                    <div className="stock-info-label">Current Price:</div>
                    <div className="stock-info-value">₹{stockData?.price.toFixed(2)}</div>
                  </div>

                  {type === 'BUY' && (
                    <div className="stock-info-row">
                      <div className="stock-info-label">Available Balance:</div>
                      <div className="stock-info-value">₹{virtualMoney?.balance.toFixed(2)}</div>
                    </div>
                  )}

                  {type === 'SELL' && (
                    <div className="stock-info-row">
                      <div className="stock-info-label">Shares Owned:</div>
                      <div className="stock-info-value">
                        {virtualMoney?.portfolio.find(item => {
                          // Normalize symbols for comparison
                          const itemSymbol = (item.symbol || item.stockSymbol || '').replace(/\s+/g, '').toUpperCase();
                          const dataSymbol = (stockData?.symbol || '').replace(/\s+/g, '').toUpperCase();
                          return itemSymbol === dataSymbol;
                        })?.quantity || 0}
                      </div>
                    </div>
                  )}

                  <div className="form-group">
                    <label>Quantity</label>
                    <input
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={handleQuantityChange}
                      className="form-control"
                    />
                  </div>

                  <div className="form-group">
                    <label>Order Type</label>
                    <div className="order-type-buttons">
                      <button
                        className={orderType === 'MARKET' ? 'active' : ''}
                        onClick={() => setOrderType('MARKET')}
                      >
                        Market
                      </button>
                      <button
                        className={orderType === 'LIMIT' ? 'active' : ''}
                        onClick={() => setOrderType('LIMIT')}
                      >
                        Limit
                      </button>
                    </div>
                  </div>

                  {orderType === 'LIMIT' && (
                    <div className="form-group">
                      <label>Limit Price (₹)</label>
                      <input
                        type="text"
                        value={limitPrice}
                        onChange={handleLimitPriceChange}
                        className="form-control"
                        placeholder="Enter limit price"
                      />
                    </div>
                  )}

                  <div className="estimated-total">
                    <div className="estimated-total-label">Estimated Total:</div>
                    <div className="estimated-total-value">₹{estimatedTotal.toFixed(2)}</div>
                  </div>

                  {error && (
                    <div className="error-message">
                      <FiAlertCircle />
                      <span>{error}</span>
                    </div>
                  )}

                  <button
                    className={`submit-btn ${type === 'BUY' ? 'buy' : 'sell'}`}
                    onClick={handleConfirmation}
                    disabled={loading}
                  >
                    {loading ? (
                      <span className="loading-spinner"></span>
                    ) : (
                      <>{type === 'BUY' ? 'Buy' : 'Sell'} {stockData?.symbol}</>
                    )}
                  </button>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default BuySellModal;
