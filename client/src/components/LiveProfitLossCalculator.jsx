import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  FiTrendingUp,
  FiTrendingDown,
  FiActivity,
  FiDollarSign,
  FiPercent,
  FiClock,
  FiRefreshCw
} from 'react-icons/fi';
import { useRealTimeUpdates, formatPriceChange, getPriceColor } from '../hooks/useRealTimeUpdates';
import { formatCurrency, formatPercentage } from '../hooks/useOrderValidation';

/**
 * Live Profit/Loss Calculator Component
 * Shows real-time P&L calculations during order placement
 */
const LiveProfitLossCalculator = ({
  stockData,
  orderType,
  quantity,
  orderPrice,
  averagePrice = null, // For sell orders
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [animationKey, setAnimationKey] = useState(0);

  // Get real-time price updates
  const { getPrice, isConnected, lastUpdate } = useRealTimeUpdates(
    stockData ? [stockData.symbol] : [],
    true
  );

  // Get current live price
  const livePrice = getPrice(stockData?.symbol);
  const currentPrice = livePrice?.price || stockData?.price || 0;

  // Calculate live P&L
  const calculations = useMemo(() => {
    if (!stockData || !quantity || !orderPrice) {
      return null;
    }

    const qty = parseInt(quantity);
    const price = parseFloat(orderPrice);
    const live = parseFloat(currentPrice);

    if (orderType === 'buy') {
      // For buy orders, show potential profit/loss if sold at current market price
      const investmentValue = qty * price;
      const currentValue = qty * live;
      const unrealizedPnL = currentValue - investmentValue;
      const unrealizedPnLPercent = investmentValue > 0 ? (unrealizedPnL / investmentValue) * 100 : 0;

      // Price difference analysis
      const priceDiff = live - price;
      const priceDiffPercent = price > 0 ? (priceDiff / price) * 100 : 0;

      return {
        type: 'buy',
        orderValue: investmentValue,
        currentValue,
        unrealizedPnL,
        unrealizedPnLPercent,
        priceDiff,
        priceDiffPercent,
        breakEvenPrice: price,
        isProfit: unrealizedPnL >= 0,
        recommendation: priceDiff > 0 ? 'favorable' : priceDiff < 0 ? 'unfavorable' : 'neutral'
      };
    } else {
      // For sell orders, show actual profit/loss
      const avgPrice = parseFloat(averagePrice || price);
      const sellValue = qty * price;
      const investedValue = qty * avgPrice;
      const realizedPnL = sellValue - investedValue;
      const realizedPnLPercent = investedValue > 0 ? (realizedPnL / investedValue) * 100 : 0;

      // Compare with current market price
      const marketValue = qty * live;
      const opportunityCost = marketValue - sellValue;

      return {
        type: 'sell',
        investedValue,
        sellValue,
        marketValue,
        realizedPnL,
        realizedPnLPercent,
        opportunityCost,
        opportunityCostPercent: sellValue > 0 ? (opportunityCost / sellValue) * 100 : 0,
        breakEvenPrice: avgPrice,
        isProfit: realizedPnL >= 0,
        recommendation: opportunityCost < 0 ? 'good_timing' : opportunityCost > 0 ? 'consider_waiting' : 'neutral'
      };
    }
  }, [stockData, orderType, quantity, orderPrice, currentPrice, averagePrice]);

  // Show/hide calculator based on data availability
  useEffect(() => {
    setIsVisible(!!calculations);
    if (calculations) {
      setAnimationKey(prev => prev + 1);
    }
  }, [calculations]);

  // Animate on price changes
  useEffect(() => {
    if (livePrice && lastUpdate) {
      setAnimationKey(prev => prev + 1);
    }
  }, [livePrice, lastUpdate]);

  if (!isVisible || !calculations) {
    return null;
  }

  const getRecommendationColor = (recommendation) => {
    switch (recommendation) {
      case 'favorable':
      case 'good_timing':
        return '#10B981';
      case 'unfavorable':
      case 'consider_waiting':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  const getRecommendationText = (recommendation, type) => {
    if (type === 'buy') {
      switch (recommendation) {
        case 'favorable':
          return 'Good entry point - price below market';
        case 'unfavorable':
          return 'Consider waiting - price above market';
        default:
          return 'Price aligned with market';
      }
    } else {
      switch (recommendation) {
        case 'good_timing':
          return 'Good timing - selling above market';
        case 'consider_waiting':
          return 'Consider waiting - market price higher';
        default:
          return 'Price aligned with market';
      }
    }
  };

  return (
    <motion.div
      key={animationKey}
      className={`live-pnl-calculator ${className}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      {/* Header */}
      <div className="pnl-header">
        <div className="pnl-title">
          <FiActivity className="pnl-icon" />
          <span>Live P&L Calculator</span>
        </div>
        <div className="connection-status">
          <div className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`} />
          <span className="status-text">
            {isConnected ? 'Live' : 'Delayed'}
          </span>
        </div>
      </div>

      {/* Current Price Display */}
      <div className="current-price-section">
        <div className="price-label">Current Market Price</div>
        <div className="price-display">
          <span className="price-value">{formatCurrency(currentPrice)}</span>
          {livePrice && (
            <motion.div
              className={`price-change ${livePrice.priceDirection}`}
              initial={{ scale: 1 }}
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 0.3 }}
            >
              {livePrice.priceDirection === 'up' && <FiTrendingUp size={14} />}
              {livePrice.priceDirection === 'down' && <FiTrendingDown size={14} />}
              <span>{formatPriceChange(livePrice.change, livePrice.changePercent).percent}</span>
            </motion.div>
          )}
        </div>
      </div>

      {/* P&L Calculations */}
      <div className="pnl-calculations">
        {calculations.type === 'buy' ? (
          <>
            {/* Buy Order Calculations */}
            <div className="calc-row">
              <span className="calc-label">Investment Value:</span>
              <span className="calc-value">{formatCurrency(calculations.orderValue)}</span>
            </div>
            <div className="calc-row">
              <span className="calc-label">Current Value:</span>
              <span className="calc-value">{formatCurrency(calculations.currentValue)}</span>
            </div>
            <div className="calc-row highlight">
              <span className="calc-label">Unrealized P&L:</span>
              <span className={`calc-value ${calculations.isProfit ? 'profit' : 'loss'}`}>
                {calculations.isProfit ? <FiTrendingUp size={14} /> : <FiTrendingDown size={14} />}
                {formatCurrency(Math.abs(calculations.unrealizedPnL))}
                <span className="percent">({formatPercentage(calculations.unrealizedPnLPercent)})</span>
              </span>
            </div>
            <div className="calc-row">
              <span className="calc-label">Price Difference:</span>
              <span className={`calc-value ${calculations.priceDiff >= 0 ? 'profit' : 'loss'}`}>
                {formatCurrency(Math.abs(calculations.priceDiff))}
                <span className="percent">({formatPercentage(calculations.priceDiffPercent)})</span>
              </span>
            </div>
          </>
        ) : (
          <>
            {/* Sell Order Calculations */}
            <div className="calc-row">
              <span className="calc-label">Invested Value:</span>
              <span className="calc-value">{formatCurrency(calculations.investedValue)}</span>
            </div>
            <div className="calc-row">
              <span className="calc-label">Sale Value:</span>
              <span className="calc-value">{formatCurrency(calculations.sellValue)}</span>
            </div>
            <div className="calc-row highlight">
              <span className="calc-label">Realized P&L:</span>
              <span className={`calc-value ${calculations.isProfit ? 'profit' : 'loss'}`}>
                {calculations.isProfit ? <FiTrendingUp size={14} /> : <FiTrendingDown size={14} />}
                {formatCurrency(Math.abs(calculations.realizedPnL))}
                <span className="percent">({formatPercentage(calculations.realizedPnLPercent)})</span>
              </span>
            </div>
            <div className="calc-row">
              <span className="calc-label">Opportunity Cost:</span>
              <span className={`calc-value ${calculations.opportunityCost <= 0 ? 'profit' : 'loss'}`}>
                {formatCurrency(Math.abs(calculations.opportunityCost))}
                <span className="percent">({formatPercentage(calculations.opportunityCostPercent)})</span>
              </span>
            </div>
          </>
        )}
      </div>

      {/* Recommendation */}
      <div className="pnl-recommendation">
        <div 
          className="recommendation-indicator"
          style={{ color: getRecommendationColor(calculations.recommendation) }}
        >
          <FiDollarSign size={16} />
          <span>{getRecommendationText(calculations.recommendation, calculations.type)}</span>
        </div>
      </div>

      {/* Break-even Info */}
      <div className="break-even-info">
        <FiPercent size={14} />
        <span>Break-even: {formatCurrency(calculations.breakEvenPrice)}</span>
      </div>

      {/* Last Update */}
      {lastUpdate && (
        <div className="last-update">
          <FiClock size={12} />
          <span>Updated: {new Date(lastUpdate).toLocaleTimeString()}</span>
        </div>
      )}
    </motion.div>
  );
};

export default LiveProfitLossCalculator;
