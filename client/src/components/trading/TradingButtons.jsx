import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiTrendingUp, FiTrendingDown, FiDollarSign, FiInfo } from 'react-icons/fi';
import tradingEngine from '../../services/tradingEngine';
import './TradingButtons.css';

const TradingButtons = ({ 
  symbol, 
  currentPrice, 
  stockData = {},
  size = 'medium',
  layout = 'horizontal', // 'horizontal', 'vertical', 'compact'
  showHoldings = true,
  onTradeClick = null
}) => {
  const [availableActions, setAvailableActions] = useState({
    canBuy: true,
    canSell: false,
    maxSellQuantity: 0,
    currentHoldings: 0,
    avgPrice: 0
  });
  const [isLoading, setIsLoading] = useState(false);

  // Update available actions when symbol or portfolio changes
  useEffect(() => {
    if (symbol) {
      updateAvailableActions();
    }
  }, [symbol, currentPrice]);

  // Listen for portfolio updates
  useEffect(() => {
    const handlePortfolioUpdate = () => {
      updateAvailableActions();
    };

    tradingEngine.addListener(handlePortfolioUpdate);
    return () => tradingEngine.removeListener(handlePortfolioUpdate);
  }, [symbol]);

  const updateAvailableActions = () => {
    if (!symbol) return;
    
    const actions = tradingEngine.getAvailableActions(symbol);
    setAvailableActions(actions);
  };

  const handleTradeAction = async (action) => {
    if (onTradeClick) {
      onTradeClick(action, {
        symbol,
        currentPrice,
        availableActions,
        stockData
      });
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

  const calculatePnL = () => {
    if (!availableActions.currentHoldings || !availableActions.avgPrice || !currentPrice) {
      return { pnl: 0, pnlPercentage: 0, isProfit: false };
    }

    const currentValue = availableActions.currentHoldings * currentPrice;
    const investedValue = availableActions.currentHoldings * availableActions.avgPrice;
    const pnl = currentValue - investedValue;
    const pnlPercentage = (pnl / investedValue) * 100;

    return {
      pnl,
      pnlPercentage,
      isProfit: pnl >= 0,
      currentValue,
      investedValue
    };
  };

  const pnlData = calculatePnL();

  const getButtonClass = (action) => {
    let baseClass = `trading-btn ${action.toLowerCase()} ${size}`;
    if (action === 'BUY' && !availableActions.canBuy) baseClass += ' disabled';
    if (action === 'SELL' && !availableActions.canSell) baseClass += ' disabled';
    return baseClass;
  };

  const getButtonText = (action) => {
    if (action === 'BUY') {
      return availableActions.currentHoldings > 0 ? 'Buy More' : 'Buy';
    }
    return 'Sell';
  };

  const getButtonIcon = (action) => {
    return action === 'BUY' ? FiTrendingUp : FiTrendingDown;
  };

  if (!symbol || !currentPrice) {
    return null;
  }

  return (
    <div className={`trading-buttons-container ${layout} ${size}`}>
      {/* Holdings Information */}
      {showHoldings && availableActions.currentHoldings > 0 && (
        <motion.div
          className="holdings-info"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="holdings-summary">
            <div className="holdings-quantity">
              <span className="label">Holdings:</span>
              <span className="value">{formatNumber(availableActions.currentHoldings)} shares</span>
            </div>
            <div className="holdings-avg-price">
              <span className="label">Avg Price:</span>
              <span className="value">{formatCurrency(availableActions.avgPrice)}</span>
            </div>
          </div>
          
          {pnlData.pnl !== 0 && (
            <div className={`pnl-info ${pnlData.isProfit ? 'profit' : 'loss'}`}>
              <div className="pnl-amount">
                {pnlData.isProfit ? '+' : ''}{formatCurrency(pnlData.pnl)}
              </div>
              <div className="pnl-percentage">
                ({pnlData.isProfit ? '+' : ''}{pnlData.pnlPercentage.toFixed(2)}%)
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Trading Buttons */}
      <div className="buttons-row">
        {/* Buy Button */}
        <motion.button
          className={getButtonClass('BUY')}
          onClick={() => handleTradeAction('BUY')}
          disabled={!availableActions.canBuy || isLoading}
          whileHover={availableActions.canBuy ? { scale: 1.02, y: -1 } : {}}
          whileTap={availableActions.canBuy ? { scale: 0.98 } : {}}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
        >
          <span className="button-icon">
            {React.createElement(getButtonIcon('BUY'), { size: size === 'small' ? 16 : 18 })}
          </span>
          <span className="button-text">{getButtonText('BUY')}</span>
          {size !== 'small' && (
            <span className="button-price">{formatCurrency(currentPrice)}</span>
          )}
        </motion.button>

        {/* Sell Button */}
        <AnimatePresence>
          {availableActions.canSell && (
            <motion.button
              className={getButtonClass('SELL')}
              onClick={() => handleTradeAction('SELL')}
              disabled={!availableActions.canSell || isLoading}
              initial={{ opacity: 0, scale: 0.8, x: -20 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.8, x: -20 }}
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <span className="button-icon">
                {React.createElement(getButtonIcon('SELL'), { size: size === 'small' ? 16 : 18 })}
              </span>
              <span className="button-text">{getButtonText('SELL')}</span>
              {size !== 'small' && (
                <span className="button-price">{formatCurrency(currentPrice)}</span>
              )}
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Additional Info for Sell Button */}
      {availableActions.canSell && size !== 'small' && (
        <motion.div
          className="sell-info"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          transition={{ duration: 0.3 }}
        >
          <div className="max-sell-info">
            <FiInfo size={14} />
            <span>Max sellable: {formatNumber(availableActions.maxSellQuantity)} shares</span>
          </div>
        </motion.div>
      )}

      {/* Current Price Display for Compact Layout */}
      {layout === 'compact' && (
        <div className="current-price-display">
          <FiDollarSign size={16} />
          <span className="price-value">{formatCurrency(currentPrice)}</span>
          {stockData.change && (
            <span className={`price-change ${stockData.change >= 0 ? 'positive' : 'negative'}`}>
              {stockData.change >= 0 ? '+' : ''}{stockData.change.toFixed(2)}%
            </span>
          )}
        </div>
      )}

      {/* Loading Overlay */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            className="loading-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="loading-spinner" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TradingButtons;
