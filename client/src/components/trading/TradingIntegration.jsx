import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import TradingButtons from './TradingButtons';
import TradingModal from './TradingModal';
import tradingEngine from '../../services/tradingEngine';
import portfolioCalculator from '../../services/portfolioCalculator';
import './TradingIntegration.css';

const TradingIntegration = ({ 
  symbol, 
  currentPrice, 
  stockData = {},
  layout = 'horizontal',
  size = 'medium',
  showHoldings = true,
  className = ''
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState('BUY');
  const [portfolioData, setPortfolioData] = useState(null);
  const [position, setPosition] = useState(null);

  // Update position and portfolio data
  useEffect(() => {
    if (symbol) {
      updatePositionData();
    }
  }, [symbol, currentPrice]);

  // Listen for portfolio updates
  useEffect(() => {
    const handlePortfolioUpdate = (updatedPortfolio) => {
      setPortfolioData(updatedPortfolio);
      if (symbol) {
        updatePositionData();
      }
    };

    tradingEngine.addListener(handlePortfolioUpdate);
    return () => tradingEngine.removeListener(handlePortfolioUpdate);
  }, [symbol]);

  const updatePositionData = () => {
    if (!symbol || !currentPrice) return;

    // Get current position
    const currentPosition = tradingEngine.getPosition(symbol);
    
    // Calculate enhanced position metrics
    const enhancedPosition = portfolioCalculator.calculatePositionMetrics(
      currentPosition, 
      currentPrice
    );

    setPosition(enhancedPosition);

    // Update trading engine with current price
    tradingEngine.updatePositionPrice(symbol, currentPrice);
  };

  const handleTradeClick = (action, tradeData) => {
    setSelectedAction(action);
    setIsModalOpen(true);
  };

  const handleTradeComplete = (result) => {
    if (result.success) {
      // Update position data after successful trade
      setTimeout(() => {
        updatePositionData();
      }, 100);

      // Show success notification with detailed info
      if (window.showNotification) {
        const trade = result.trade;
        const message = `${trade.action} ${trade.quantity} ${trade.symbol} @ ₹${trade.price.toFixed(2)}`;
        const details = `Total: ₹${trade.totalCost.toFixed(2)} | Balance: ₹${result.newBalance.toFixed(2)}`;
        
        window.showNotification({
          type: 'success',
          title: 'Trade Executed Successfully',
          message: `${message}\n${details}`,
          duration: 5000
        });
      }
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
  };

  // Enhanced stock data with position information
  const enhancedStockData = {
    ...stockData,
    position,
    hasHoldings: position?.quantity > 0,
    avgPrice: position?.avgPrice || 0,
    unrealizedPnL: position?.unrealizedPnL || 0,
    unrealizedPnLPercentage: position?.unrealizedPnLPercentage || 0
  };

  if (!symbol || !currentPrice) {
    return null;
  }

  return (
    <div className={`trading-integration ${className}`}>
      {/* Trading Buttons */}
      <TradingButtons
        symbol={symbol}
        currentPrice={currentPrice}
        stockData={enhancedStockData}
        size={size}
        layout={layout}
        showHoldings={showHoldings}
        onTradeClick={handleTradeClick}
      />

      {/* Trading Modal */}
      <TradingModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        symbol={symbol}
        currentPrice={currentPrice}
        action={selectedAction}
        stockData={enhancedStockData}
        onTradeComplete={handleTradeComplete}
      />

      {/* Position Summary (if holdings exist) */}
      {position && position.quantity > 0 && showHoldings && (
        <motion.div
          className="position-summary"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="summary-grid">
            <div className="summary-item">
              <span className="label">Holdings</span>
              <span className="value">{position.quantity.toLocaleString()} shares</span>
            </div>
            <div className="summary-item">
              <span className="label">Avg Price</span>
              <span className="value">₹{position.avgPrice.toFixed(2)}</span>
            </div>
            <div className="summary-item">
              <span className="label">Current Value</span>
              <span className="value">₹{position.currentValue.toLocaleString()}</span>
            </div>
            <div className="summary-item">
              <span className="label">P&L</span>
              <span className={`value ${position.isProfit ? 'profit' : 'loss'}`}>
                {position.isProfit ? '+' : ''}₹{position.unrealizedPnL.toFixed(2)}
                <span className="percentage">
                  ({position.isProfit ? '+' : ''}{position.unrealizedPnLPercentage.toFixed(2)}%)
                </span>
              </span>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default TradingIntegration;
