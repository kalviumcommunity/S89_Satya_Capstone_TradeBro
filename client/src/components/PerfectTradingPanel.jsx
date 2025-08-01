import React, { useState } from 'react';
import { motion } from 'framer-motion';
import StockSearchPanel from './StockSearchPanel';
import TimeframeSelector from './TimeframeSelector';
import OrderModal from './OrderModal';
import { useOrderIntegration } from '../hooks/useOrderIntegration';

/**
 * Perfect Trading Panel Component
 * Complete integration of search, popular stocks, and timeframe selection
 */
const PerfectTradingPanel = ({ 
  onStockSelect,
  selectedStock,
  className = '' 
}) => {
  const [selectedTimeframe, setSelectedTimeframe] = useState('1D');
  
  // Order integration
  const {
    orderModalState,
    openOrderModal,
    closeOrderModal,
    quickBuy,
    quickSell
  } = useOrderIntegration();

  // Handle stock selection from search panel
  const handleStockSelect = (stock) => {
    onStockSelect?.(stock);
  };

  // Handle quick order actions
  const handleQuickOrder = (stock, orderType) => {
    openOrderModal(stock, orderType, 'quick');
  };

  // Handle timeframe changes
  const handleTimeframeChange = (timeframe) => {
    setSelectedTimeframe(timeframe.value);
    // You can emit this to parent component or update charts
    console.log('Timeframe changed to:', timeframe);
  };

  // Handle order completion
  const handleOrderPlaced = () => {
    closeOrderModal();
    // Refresh data or show success message
  };

  return (
    <motion.div
      className={`perfect-trading-panel ${className}`}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      {/* Stock Search and Popular Stocks */}
      <StockSearchPanel
        onStockSelect={handleStockSelect}
        selectedStock={selectedStock}
        onQuickOrder={handleQuickOrder}
      />

      {/* Timeframe Selector */}
      <TimeframeSelector
        selectedTimeframe={selectedTimeframe}
        onTimeframeChange={handleTimeframeChange}
      />

      {/* Order Modal - Confirmation handled at App level */}
      <OrderModal
        isOpen={orderModalState.isOpen}
        onClose={closeOrderModal}
        stockData={orderModalState.stockData}
        initialOrderType={orderModalState.orderType}
        onOrderPlaced={handleOrderPlaced}
        onShowConfirmation={null} // PerfectTradingPanel uses local modal, App level handles global confirmation
      />
    </motion.div>
  );
};

export default PerfectTradingPanel;
