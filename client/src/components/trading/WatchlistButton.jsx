import React, { useState, useEffect, useCallback } from 'react';
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
    addToWatchlist,
    removeFromWatchlist,
    watchlists,
    loadingState,
    loading,
    error,
    refreshWatchlists
  } = useWatchlist();

  const [showDropdown, setShowDropdown] = useState(false);

  // Derive state from the useWatchlist hook
  const inWatchlist = isInWatchlist(stockData?.symbol || stockData?.stockSymbol);
  const isLoading = loadingState.action === 'toggle' && loading;
  const isRefreshing = loadingState.action === 'refresh' && loading;

  const handleToggle = useCallback(async (e) => {
    e?.stopPropagation();

    if (!stockData || !stockData.symbol) {
      console.warn('⚠️ WatchlistButton: Missing stockData or symbol.');
      return;
    }

    try {
      if (inWatchlist) {
        await removeFromWatchlist(stockData.symbol);
        onSuccess?.(null, 'removed');
      } else {
        await addToWatchlist(stockData, watchlists.find(w => w.isDefault)?._id);
        onSuccess?.(null, 'added');
      }
    } catch (err) {
      console.error('❌ Error toggling watchlist:', err);
      onError?.(err.message || 'Failed to update watchlist');
    }
  }, [stockData, inWatchlist, addToWatchlist, removeFromWatchlist, onSuccess, onError, watchlists]);

  const handleAddToWatchlist = useCallback(async (e, watchlistId) => {
    e.stopPropagation();
    if (!stockData || !stockData.symbol) return;

    setShowDropdown(false);
    await addToWatchlist(stockData, watchlistId);
    refreshWatchlists();
  }, [stockData, addToWatchlist, refreshWatchlists]);

  const handleRemoveFromWatchlist = useCallback(async (e) => {
    e.stopPropagation();
    if (!stockData || !stockData.symbol) return;

    setShowDropdown(false);
    await removeFromWatchlist(stockData.symbol);
  }, [stockData, removeFromWatchlist]);


  // Effect to close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showDropdown && !event.target.closest('.watchlist-dropdown-container')) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  // Handle simple button variant (just toggle)
  if (variant === 'simple') {
    return (
      <button
        className={`watchlist-btn watchlist-btn-${size} ${inWatchlist ? 'active' : ''} ${isLoading ? 'processing' : ''} ${className}`}
        onClick={handleToggle}
        disabled={isLoading || loading}
        title={inWatchlist ? 'Remove from watchlist' : 'Add to watchlist'}
      >
        {isLoading ? (
          <FiLoader className="animate-spin" />
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
          disabled={isLoading || loading}
          title="Manage watchlist"
        >
          {isLoading ? (
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
                {watchlists.length === 0 && (
                  <div className="dropdown-empty">
                    <span>No watchlists found</span>
                  </div>
                )}
                {watchlists.map((watchlist) => {
                  const hasStock = watchlist.stocks?.some(stock =>
                    stock.symbol === stockData.symbol || stock.stockSymbol === stockData.symbol
                  );
                  return (
                    <button
                      key={watchlist._id}
                      className={`dropdown-item ${hasStock ? 'has-stock' : ''}`}
                      onClick={(e) => handleAddToWatchlist(e, watchlist._id)}
                      disabled={isLoading || hasStock}
                    >
                      {hasStock ? <FiCheck /> : <FiPlus />}
                      <span>{watchlist.name}</span>
                      {watchlist.isDefault && (
                        <span className="default-badge">Default</span>
                      )}
                    </button>
                  );
                })}

                {inWatchlist && (
                  <button
                    className="dropdown-item remove-item"
                    onClick={handleRemoveFromWatchlist}
                    disabled={isLoading}
                  >
                    <FiX />
                    <span>Remove from All Watchlists</span>
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Default icon variant
  return (
    <button
      className={`watchlist-btn watchlist-btn-${size} ${inWatchlist ? 'active' : ''} ${isLoading ? 'processing' : ''} ${className}`}
      onClick={handleToggle}
      disabled={isLoading || loading}
      title={inWatchlist ? 'Remove from watchlist' : 'Add to watchlist'}
    >
      <motion.div
        key={inWatchlist ? 'filled' : 'empty'}
        initial={{ scale: 0.5, opacity: 0, rotate: -180 }}
        animate={{
          scale: 1,
          opacity: 1,
          rotate: 0,
        }}
        transition={{
          duration: 0.4,
          type: "spring",
          stiffness: 300,
          damping: 20
        }}
      >
        {isLoading ? (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            <FiLoader />
          </motion.div>
        ) : (
          <motion.div
            initial={false}
            animate={{
              scale: inWatchlist ? [1, 1.3, 1] : 1,
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