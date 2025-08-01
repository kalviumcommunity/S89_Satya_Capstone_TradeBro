import React from 'react';
import { FiShoppingCart, FiTrendingUp, FiTrendingDown, FiDollarSign } from 'react-icons/fi';
import { useOrderIntegration } from '../../hooks/useOrderIntegration';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import useDragConfirm from '../../hooks/useDragConfirm';
import DragConfirmModal from '../common/DragConfirmModal';
import './StockActionButtons.css';

const StockActionButtons = ({
  stockData,
  variant = 'default', // 'default', 'compact', 'minimal', 'icon-only'
  showBoth = true, // Show both buy and sell buttons
  defaultAction = 'buy', // 'buy' or 'sell'
  source = 'general', // Source identifier for analytics
  className = '',
  disabled = false,
  enableDragConfirm = true // Enable drag-to-confirm modal
}) => {
  const { openOrderModal } = useOrderIntegration();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Drag confirmation modal
  const {
    isModalOpen,
    orderData,
    loading,
    closeConfirmation,
    processOrder,
    confirmBuy,
    confirmSell
  } = useDragConfirm();

  // Handle authentication check and action
  const handleAction = (action) => {
    console.log('🔥 Action button clicked!', { action, stockData, isAuthenticated, disabled, enableDragConfirm });

    if (!isAuthenticated) {
      console.log('❌ User not authenticated, redirecting to login');
      navigate('/login');
      return;
    }

    if (disabled || !stockData) {
      console.log('❌ Button disabled or no stock data', { disabled, stockData });
      return;
    }

    if (enableDragConfirm) {
      // Use drag-to-confirm modal
      console.log('✅ Opening drag confirmation modal', { stockData, action, source });

      const orderData = {
        symbol: stockData.symbol,
        name: stockData.name || stockData.symbol,
        price: stockData.price || stockData.currentPrice || 0,
        quantity: 1, // Default quantity
        orderType: 'market',
        source
      };

      if (action === 'buy') {
        confirmBuy(orderData.symbol, orderData.quantity, orderData.price, {
          name: orderData.name,
          orderType: orderData.orderType,
          source: orderData.source
        });
      } else {
        confirmSell(orderData.symbol, orderData.quantity, orderData.price, {
          name: orderData.name,
          orderType: orderData.orderType,
          source: orderData.source
        });
      }
    } else {
      // Use traditional order modal
      console.log('✅ Opening traditional order modal', { stockData, action, source });
      openOrderModal(stockData, action, source);
    }
  };

  // Render based on variant
  const renderButtons = () => {
    switch (variant) {
      case 'icon-only':
        return (
          <div className={`stock-actions icon-only ${className}`}>
            {(showBoth || defaultAction === 'buy') && (
              <button
                className="stock-action-btn buy icon-only"
                onClick={() => handleAction('buy')}
                disabled={disabled}
                title="Buy Stock"
                aria-label={`Buy ${stockData?.symbol || 'stock'}`}
              >
                <FiTrendingUp />
              </button>
            )}
            {(showBoth || defaultAction === 'sell') && (
              <button
                className="stock-action-btn sell icon-only"
                onClick={() => handleAction('sell')}
                disabled={disabled}
                title="Sell Stock"
                aria-label={`Sell ${stockData?.symbol || 'stock'}`}
              >
                <FiTrendingDown />
              </button>
            )}
          </div>
        );

      case 'minimal':
        return (
          <div className={`stock-actions minimal ${className}`}>
            {(showBoth || defaultAction === 'buy') && (
              <button
                className="stock-action-btn buy minimal"
                onClick={() => handleAction('buy')}
                disabled={disabled}
              >
                <FiTrendingUp />
                <span>Buy</span>
              </button>
            )}
            {(showBoth || defaultAction === 'sell') && (
              <button
                className="stock-action-btn sell minimal"
                onClick={() => handleAction('sell')}
                disabled={disabled}
              >
                <FiTrendingDown />
                <span>Sell</span>
              </button>
            )}
          </div>
        );

      case 'compact':
        return (
          <div className={`stock-actions compact ${className}`}>
            {showBoth ? (
              <>
                <button
                  className="stock-action-btn buy compact"
                  onClick={() => handleAction('buy')}
                  disabled={disabled}
                >
                  <FiShoppingCart />
                  <span>Buy</span>
                </button>
                <button
                  className="stock-action-btn sell compact"
                  onClick={() => handleAction('sell')}
                  disabled={disabled}
                >
                  <FiDollarSign />
                  <span>Sell</span>
                </button>
              </>
            ) : (
              <button
                className={`stock-action-btn ${defaultAction} compact`}
                onClick={() => handleAction(defaultAction)}
                disabled={disabled}
              >
                {defaultAction === 'buy' ? <FiShoppingCart /> : <FiDollarSign />}
                <span>{defaultAction === 'buy' ? 'Buy' : 'Sell'}</span>
              </button>
            )}
          </div>
        );

      default:
        return (
          <div className={`stock-actions default ${className}`}>
            {(showBoth || defaultAction === 'buy') && (
              <button
                className="stock-action-btn buy default"
                onClick={() => handleAction('buy')}
                disabled={disabled}
              >
                <FiShoppingCart />
                <span>Buy Now</span>
              </button>
            )}
            {(showBoth || defaultAction === 'sell') && (
              <button
                className="stock-action-btn sell default"
                onClick={() => handleAction('sell')}
                disabled={disabled}
              >
                <FiDollarSign />
                <span>Sell Now</span>
              </button>
            )}
          </div>
        );
    }
  };

  if (!stockData) {
    return null;
  }

  return (
    <>
      {renderButtons()}

      {/* Drag Confirmation Modal */}
      {enableDragConfirm && (
        <DragConfirmModal
          isOpen={isModalOpen}
          onClose={closeConfirmation}
          onConfirm={processOrder}
          orderData={orderData}
          loading={loading}
        />
      )}
    </>
  );
};

// Quick action component for single action
export const QuickBuyButton = ({ stockData, ...props }) => (
  <StockActionButtons 
    stockData={stockData} 
    showBoth={false} 
    defaultAction="buy" 
    {...props} 
  />
);

export const QuickSellButton = ({ stockData, ...props }) => (
  <StockActionButtons 
    stockData={stockData} 
    showBoth={false} 
    defaultAction="sell" 
    {...props} 
  />
);

// Specialized components for different contexts
export const WatchlistActionButtons = ({ stockData }) => (
  <StockActionButtons 
    stockData={stockData} 
    variant="compact" 
    source="watchlist"
    className="watchlist-actions"
  />
);

export const PortfolioActionButtons = ({ stockData }) => (
  <StockActionButtons 
    stockData={stockData} 
    variant="minimal" 
    source="portfolio"
    className="portfolio-actions"
  />
);

export const ChartActionButtons = ({ stockData }) => (
  <StockActionButtons 
    stockData={stockData} 
    variant="default" 
    source="charts"
    className="chart-actions"
  />
);

export const SearchResultActionButtons = ({ stockData }) => (
  <StockActionButtons 
    stockData={stockData} 
    variant="icon-only" 
    source="search"
    className="search-actions"
  />
);

export default StockActionButtons;
