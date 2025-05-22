import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiX, FiInfo, FiAlertCircle, FiCheck, FiDollarSign } from "react-icons/fi";
import axios from "axios";
import { useToast } from "../../context/ToastContext";
import { useAuth } from "../../context/AuthContext";
import { useVirtualMoney } from "../../context/VirtualMoneyContext";
import Loading from "../common/Loading";
import API_ENDPOINTS from "../../config/apiConfig";
import "../../styles/components/buy-sell-modal.css";

const BuySellModal = ({ symbol, stockData, type = "buy", onClose, onSuccess }) => {
  const [quantity, setQuantity] = useState(1);
  const [orderType, setOrderType] = useState("MARKET");
  const [limitPrice, setLimitPrice] = useState(stockData?.price || 0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [confirmation, setConfirmation] = useState(false);
  const [success, setSuccess] = useState(false);
  const [transactionDetails, setTransactionDetails] = useState(null);
  
  const { showToast } = useToast();
  const { user } = useAuth();
  const { virtualMoney, updateVirtualMoney } = useVirtualMoney();

  // Set initial limit price when stock data changes
  useEffect(() => {
    if (stockData?.price) {
      setLimitPrice(stockData.price);
    }
  }, [stockData]);

  // Calculate estimated total
  const estimatedTotal = orderType === "MARKET" 
    ? quantity * stockData?.price 
    : quantity * limitPrice;

  // Check if user has enough virtual money for the purchase
  const canAfford = type.toLowerCase() === "buy" 
    ? virtualMoney.balance >= estimatedTotal 
    : true;

  // Handle quantity change
  const handleQuantityChange = (e) => {
    const value = parseInt(e.target.value);
    if (value > 0) {
      setQuantity(value);
    }
  };

  // Handle limit price change
  const handleLimitPriceChange = (e) => {
    const value = parseFloat(e.target.value);
    if (value > 0) {
      setLimitPrice(value);
    }
  };

  // Handle order type change
  const handleOrderTypeChange = (e) => {
    setOrderType(e.target.value);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (confirmation) {
      // Process the transaction
      setLoading(true);
      setError(null);
      
      try {
        const payload = {
          symbol,
          quantity,
          price: orderType === "MARKET" ? stockData.price : limitPrice,
          orderType,
          transactionType: type.toUpperCase()
        };
        
        const response = await axios.post(
          API_ENDPOINTS.TRANSACTIONS.CREATE,
          payload,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`
            }
          }
        );
        
        if (response.data.success) {
          // Update virtual money
          const newBalance = response.data.transaction.newBalance;
          const newInvested = response.data.transaction.newInvested;
          
          updateVirtualMoney({
            balance: newBalance,
            invested: newInvested
          });
          
          // Set success state
          setSuccess(true);
          setTransactionDetails(response.data.transaction);
          
          // Call success callback
          if (onSuccess) {
            onSuccess(response.data.transaction);
          }
        } else {
          throw new Error(response.data.message || "Transaction failed");
        }
      } catch (err) {
        console.error("Transaction error:", err);
        setError(err.response?.data?.message || err.message || "Transaction failed");
        
        // Show error toast
        showToast(
          err.response?.data?.message || err.message || "Transaction failed",
          "error"
        );
      } finally {
        setLoading(false);
      }
    } else {
      // Show confirmation screen
      setConfirmation(true);
    }
  };

  // Handle back button click
  const handleBack = () => {
    setConfirmation(false);
    setError(null);
  };

  // Modal animations
  const modalVariants = {
    hidden: { opacity: 0, y: 50, scale: 0.95 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.3, ease: "easeOut" } },
    exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2, ease: "easeIn" } }
  };

  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.3 } },
    exit: { opacity: 0, transition: { duration: 0.2 } }
  };

  return (
    <AnimatePresence>
      <motion.div
        className="modal-overlay"
        variants={overlayVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        onClick={onClose}
      >
        <motion.div
          className="modal-container"
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-header">
            <h2>{type === "buy" ? "Buy" : "Sell"} {symbol}</h2>
            <button className="close-button" onClick={onClose}>
              <FiX />
            </button>
          </div>

          <div className="modal-content">
            {loading ? (
              <div className="modal-loading">
                <Loading size="medium" text={`Processing ${type === 'buy' ? 'purchase' : 'sale'}...`} />
              </div>
            ) : confirmation ? (
              <div className="confirmation-screen">
                <div className="confirmation-icon">
                  <FiInfo />
                </div>
                <h3>Confirm {type === 'buy' ? 'Purchase' : 'Sale'}</h3>
                <div className="confirmation-details">
                  <p><strong>Stock:</strong> {stockData?.name} ({stockData?.symbol})</p>
                  <p><strong>Quantity:</strong> {quantity} shares</p>
                  <p><strong>Price:</strong> ₹{orderType === 'LIMIT' ? limitPrice : stockData?.price.toFixed(2)} per share</p>
                  <p><strong>Total:</strong> ₹{estimatedTotal.toFixed(2)}</p>
                  <p><strong>Order Type:</strong> {orderType}</p>
                </div>
                
                {error && (
                  <div className="error-message">
                    <FiAlertCircle />
                    <span>{error}</span>
                  </div>
                )}
                
                <div className="confirmation-actions">
                  <button className="back-button" onClick={handleBack}>
                    Back
                  </button>
                  <button 
                    className="confirm-button" 
                    onClick={handleSubmit}
                    disabled={type === 'buy' && !canAfford}
                  >
                    Confirm
                  </button>
                </div>
                
                {type === 'buy' && !canAfford && (
                  <div className="insufficient-funds">
                    <FiAlertCircle />
                    <span>Insufficient funds. Available: ₹{virtualMoney.balance.toFixed(2)}</span>
                  </div>
                )}
              </div>
            ) : success ? (
              <div className="success-screen">
                <div className="success-icon">
                  <FiCheck />
                </div>
                <h3>Transaction Successful!</h3>
                <div className="success-details">
                  <p><strong>Stock:</strong> {stockData?.name} ({stockData?.symbol})</p>
                  <p><strong>Quantity:</strong> {transactionDetails?.quantity} shares</p>
                  <p><strong>Price:</strong> ₹{transactionDetails?.price.toFixed(2)} per share</p>
                  <p><strong>Total:</strong> ₹{transactionDetails?.totalAmount.toFixed(2)}</p>
                  <p><strong>New Balance:</strong> ₹{transactionDetails?.newBalance.toFixed(2)}</p>
                </div>
                
                <button className="close-button-success" onClick={onClose}>
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Current Price</label>
                  <div className="price-display">
                    <FiDollarSign />
                    <span>₹{stockData?.price.toFixed(2)}</span>
                  </div>
                </div>
                
                <div className="form-group">
                  <label htmlFor="quantity">Quantity</label>
                  <input
                    type="number"
                    id="quantity"
                    value={quantity}
                    onChange={handleQuantityChange}
                    min="1"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="orderType">Order Type</label>
                  <select
                    id="orderType"
                    value={orderType}
                    onChange={handleOrderTypeChange}
                  >
                    <option value="MARKET">Market Order</option>
                    <option value="LIMIT">Limit Order</option>
                  </select>
                </div>
                
                {orderType === "LIMIT" && (
                  <div className="form-group">
                    <label htmlFor="limitPrice">Limit Price</label>
                    <input
                      type="number"
                      id="limitPrice"
                      value={limitPrice}
                      onChange={handleLimitPriceChange}
                      min="0.01"
                      step="0.01"
                      required
                    />
                  </div>
                )}
                
                <div className="form-group">
                  <label>Estimated Total</label>
                  <div className="total-display">
                    <span>₹{estimatedTotal.toFixed(2)}</span>
                  </div>
                </div>
                
                {type === 'buy' && (
                  <div className="form-group">
                    <label>Available Balance</label>
                    <div className="balance-display">
                      <span>₹{virtualMoney.balance.toFixed(2)}</span>
                    </div>
                  </div>
                )}
                
                {error && (
                  <div className="error-message">
                    <FiAlertCircle />
                    <span>{error}</span>
                  </div>
                )}
                
                <button 
                  type="submit" 
                  className="submit-button"
                  disabled={type === 'buy' && !canAfford}
                >
                  {type === 'buy' ? 'Buy' : 'Sell'} {symbol}
                </button>
                
                {type === 'buy' && !canAfford && (
                  <div className="insufficient-funds">
                    <FiAlertCircle />
                    <span>Insufficient funds. Available: ₹{virtualMoney.balance.toFixed(2)}</span>
                  </div>
                )}
              </form>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default BuySellModal;
