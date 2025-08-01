import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiStar,
  FiPlus,
  FiCheck,
  FiLoader,
  FiList,
  FiX
} from 'react-icons/fi';
import { useWatchlist } from '../../hooks/useWatchlist';
import '../../styles/watchlist-button.css';

const WatchlistButton = ({ 
  stockData, 
  size = 'medium', 
  variant = 'icon', 
  showText = false,
  className = '',
  onSuccess,
  onError 
}) => {
  const {
    isInWatchlist,
    toggleWatchlist,
    addToWatchlist,
    removeFromWatchlist,
    watchlists,
    loading
  } = useWatchlist();

  const [showDropdown, setShowDropdown] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  if (!stockData) return null;

  const stockSymbol = stockData.symbol || stockData.stockSymbol;
  const inWatchlist = isInWatchlist(stockSymbol);

  // Handle simple toggle (add to default watchlist or remove)
  const handleToggle = async (e) => {
    e.stopPropagation();
    
    if (isProcessing || loading) return;

    setIsProcessing(true);
    
    try {
      const result = await toggleWatchlist(stockData);
      
      if (result.success) {
        if (onSuccess) {
          onSuccess(result, inWatchlist ? 'removed' : 'added');
        }
        // Add haptic feedback for mobile
        if (navigator.vibrate) {
          navigator.vibrate(50);
        }
        // Show success animation
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 600);
      } else {
        if (onError) {
          onError(result.message);
        }
      }
    } catch (error) {
      console.error('Error toggling watchlist:', error);
      if (onError) {
        onError('Failed to update watchlist');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle adding to specific watchlist
  const handleAddToWatchlist = async (watchlistId) => {
    if (isProcessing || loading) return;

    setIsProcessing(true);
    setShowDropdown(false);
    
    try {
      const result = await addToWatchlist(stockData, watchlistId);
      
      if (result.success && onSuccess) {
        onSuccess(result, 'added');
      } else if (!result.success && onError) {
        onError(result.message);
      }
    } catch (error) {
      console.error('Error adding to watchlist:', error);
      if (onError) {
        onError('Failed to add to watchlist');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle removing from watchlist
  const handleRemoveFromWatchlist = async () => {
    if (isProcessing || loading) return;

    setIsProcessing(true);
    setShowDropdown(false);
    
    try {
      const result = await removeFromWatchlist(stockSymbol);
      
      if (result.success && onSuccess) {
        onSuccess(result, 'removed');
      } else if (!result.success && onError) {
        onError(result.message);
      }
    } catch (error) {
      console.error('Error removing from watchlist:', error);
      if (onError) {
        onError('Failed to remove from watchlist');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // Simple button variant (just toggle)
  if (variant === 'simple') {
    return (
      <button
        className={`watchlist-btn watchlist-btn-${size} ${inWatchlist ? 'active' : ''} ${isProcessing ? 'processing' : ''} ${showSuccess ? 'success' : ''} ${className}`}
        onClick={handleToggle}
        disabled={isProcessing || loading}
        title={inWatchlist ? 'Remove from watchlist' : 'Add to watchlist'}
      >
        {isProcessing ? (
          <FiLoader className="animate-spin" />
        ) : inWatchlist ? (
          <FiCheck />
        ) : (
          <FiStar />
        )}
        {showText && (
          <span className="btn-text">
            {inWatchlist ? 'In Watchlist' : 'Add to Watchlist'}
          </span>
        )}
      </button>
    );
  }

  // Dropdown variant (choose watchlist)
  if (variant === 'dropdown') {
    return (
      <div className={`watchlist-dropdown-container ${className}`}>
        <button
          className={`watchlist-btn watchlist-btn-${size} ${inWatchlist ? 'active' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            setShowDropdown(!showDropdown);
          }}
          disabled={isProcessing || loading}
          title="Manage watchlist"
        >
          {isProcessing ? (
            <FiLoader className="animate-spin" />
          ) : (
            <FiList />
          )}
          {showText && <span className="btn-text">Watchlist</span>}
        </button>

        <AnimatePresence>
          {showDropdown && (
            <motion.div
              className="watchlist-dropdown"
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <div className="dropdown-header">
                <span>Add to Watchlist</span>
                <button
                  className="close-btn"
                  onClick={() => setShowDropdown(false)}
                >
                  <FiX />
                </button>
              </div>

              <div className="dropdown-content">
                {inWatchlist && (
                  <button
                    className="dropdown-item remove-item"
                    onClick={handleRemoveFromWatchlist}
                    disabled={isProcessing}
                  >
                    <FiX />
                    <span>Remove from Watchlist</span>
                  </button>
                )}

                {watchlists.map((watchlist) => {
                  const hasStock = watchlist.stocks.some(stock => 
                    stock.symbol === stockSymbol || stock.stockSymbol === stockSymbol
                  );

                  return (
                    <button
                      key={watchlist._id}
                      className={`dropdown-item ${hasStock ? 'has-stock' : ''}`}
                      onClick={() => handleAddToWatchlist(watchlist._id)}
                      disabled={isProcessing || hasStock}
                    >
                      {hasStock ? <FiCheck /> : <FiPlus />}
                      <span>{watchlist.name}</span>
                      {watchlist.isDefault && (
                        <span className="default-badge">Default</span>
                      )}
                    </button>
                  );
                })}

                {watchlists.length === 0 && (
                  <div className="dropdown-empty">
                    <span>No watchlists found</span>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Backdrop */}
        {showDropdown && (
          <div
            className="watchlist-dropdown-backdrop"
            onClick={() => setShowDropdown(false)}
          />
        )}
      </div>
    );
  }

  // Default icon variant
  return (
    <button
      className={`watchlist-btn watchlist-btn-${size} ${inWatchlist ? 'active' : ''} ${isProcessing ? 'processing' : ''} ${showSuccess ? 'success' : ''} ${className}`}
      onClick={handleToggle}
      disabled={isProcessing || loading}
      title={inWatchlist ? 'Remove from watchlist' : 'Add to watchlist'}
    >
      <motion.div
        key={inWatchlist ? 'filled' : 'empty'}
        initial={{ scale: 0.5, opacity: 0, rotate: -180 }}
        animate={{
          scale: 1,
          opacity: 1,
          rotate: 0,
          y: showSuccess ? [-2, 0] : 0
        }}
        transition={{
          duration: 0.4,
          type: "spring",
          stiffness: 300,
          damping: 20
        }}
      >
        {isProcessing ? (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            <FiLoader />
          </motion.div>
        ) : (
          <motion.div
            animate={{
              scale: showSuccess ? [1, 1.3, 1] : 1,
              rotate: inWatchlist ? [0, 15, -15, 0] : 0
            }}
            transition={{ duration: 0.3 }}
          >
            <FiStar className={inWatchlist ? 'filled' : ''} />
          </motion.div>
        )}
      </motion.div>
      {showText && (
        <span className="btn-text">
          {inWatchlist ? 'In Watchlist' : 'Add to Watchlist'}
        </span>
      )}
    </button>
  );
};

export default WatchlistButton;
