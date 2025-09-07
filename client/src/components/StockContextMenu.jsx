import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiTrendingUp,
  FiTrendingDown,
  FiBarChart2,
  FiBookmark,
  FiEye,
  FiShoppingCart,
  FiActivity,
  FiInfo
} from 'react-icons/fi';

/**
 * Stock Context Menu Component
 * Provides quick actions for stocks via right-click or long-press
 */
const StockContextMenu = ({
  isOpen,
  position,
  stockData,
  onClose,
  onQuickBuy,
  onQuickSell,
  onViewChart,
  onAddToWatchlist,
  onViewDetails,
  hasHolding = false,
  isInWatchlist = false
}) => {
  const menuRef = useRef(null);
  const [adjustedPosition, setAdjustedPosition] = useState(position);

  // Adjust menu position to stay within viewport
  useEffect(() => {
    if (isOpen && menuRef.current && position) {
      const menu = menuRef.current;
      const rect = menu.getBoundingClientRect();
      const viewport = {
        width: window.innerWidth,
        height: window.innerHeight
      };

      let { x, y } = position;

      // Adjust horizontal position
      if (x + rect.width > viewport.width) {
        x = viewport.width - rect.width - 10;
      }
      if (x < 10) {
        x = 10;
      }

      // Adjust vertical position
      if (y + rect.height > viewport.height) {
        y = viewport.height - rect.height - 10;
      }
      if (y < 10) {
        y = 10;
      }

      setAdjustedPosition({ x, y });
    }
  }, [isOpen, position]);

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        onClose();
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !stockData) return null;

  const menuItems = [
    // Quick Buy option removed from context menu
    {
      id: 'quick-sell',
      label: 'Quick Sell',
      icon: FiTrendingDown,
      action: () => {
        onQuickSell(stockData);
        onClose();
      },
      color: 'red',
      disabled: !hasHolding,
      shortcut: 'S'
    },
    {
      id: 'enhanced-order',
      label: 'Enhanced Order',
      icon: FiShoppingCart,
      action: () => {
        // This would open the enhanced order modal
        onClose();
      },
      color: 'blue',
      shortcut: 'E'
    },
    {
      id: 'view-chart',
      label: 'View Chart',
      icon: FiBarChart2,
      action: () => {
        onViewChart(stockData);
        onClose();
      },
      color: 'purple',
      shortcut: 'C'
    },
    {
      id: 'watchlist',
      label: isInWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist',
      icon: FiBookmark,
      action: () => {
        onAddToWatchlist(stockData);
        onClose();
      },
      color: 'orange',
      shortcut: 'W'
    },
    {
      id: 'view-details',
      label: 'View Details',
      icon: FiInfo,
      action: () => {
        onViewDetails(stockData);
        onClose();
      },
      color: 'gray',
      shortcut: 'I'
    }
  ];

  return (
    <AnimatePresence>
      <motion.div
        ref={menuRef}
        className="stock-context-menu"
        style={{
          position: 'fixed',
          left: adjustedPosition.x,
          top: adjustedPosition.y,
          zIndex: 1000
        }}
        initial={{ opacity: 0, scale: 0.95, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -10 }}
        transition={{ duration: 0.15, ease: 'easeOut' }}
      >
        {/* Menu Header */}
        <div className="context-menu-header">
          <div className="stock-info">
            <span className="stock-symbol">{stockData.symbol}</span>
            <span className="stock-price">
              ₹{stockData.price?.toLocaleString('en-IN') || '0.00'}
            </span>
          </div>
          <div className={`price-change ${stockData.change >= 0 ? 'positive' : 'negative'}`}>
            {stockData.change >= 0 ? '+' : ''}{stockData.change?.toFixed(2) || '0.00'} 
            ({stockData.changePercent?.toFixed(2) || '0.00'}%)
          </div>
        </div>

        {/* Menu Items */}
        <div className="context-menu-items">
          {menuItems.map((item, index) => (
            <motion.button
              key={item.id}
              className={`context-menu-item ${item.color} ${item.disabled ? 'disabled' : ''}`}
              onClick={item.action}
              disabled={item.disabled}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.1, delay: index * 0.02 }}
              whileHover={{ backgroundColor: 'var(--hover-bg)' }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="menu-item-content">
                <item.icon className="menu-item-icon" size={16} />
                <span className="menu-item-label">{item.label}</span>
              </div>
              <span className="menu-item-shortcut">{item.shortcut}</span>
            </motion.button>
          ))}
        </div>

        {/* Menu Footer */}
        <div className="context-menu-footer">
          <div className="market-status">
            <FiActivity size={12} />
            <span>Market Open</span>
          </div>
          <div className="last-updated">
            Updated: {new Date().toLocaleTimeString()}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

// Hook for using context menu
export const useStockContextMenu = () => {
  const [contextMenu, setContextMenu] = useState({
    isOpen: false,
    position: { x: 0, y: 0 },
    stockData: null
  });

  const openContextMenu = (event, stockData) => {
    event.preventDefault();
    event.stopPropagation();

    setContextMenu({
      isOpen: true,
      position: { x: event.clientX, y: event.clientY },
      stockData
    });
  };

  const closeContextMenu = () => {
    setContextMenu({
      isOpen: false,
      position: { x: 0, y: 0 },
      stockData: null
    });
  };

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (!contextMenu.isOpen) return;

      const { key } = event;
      const stockData = contextMenu.stockData;

      switch (key.toLowerCase()) {
        case 'b':
          // Quick buy
          event.preventDefault();
          closeContextMenu();
          break;
        case 's':
          // Quick sell
          event.preventDefault();
          closeContextMenu();
          break;
        case 'c':
          // View chart
          event.preventDefault();
          closeContextMenu();
          break;
        case 'w':
          // Add to watchlist
          event.preventDefault();
          closeContextMenu();
          break;
        case 'e':
          // Enhanced order
          event.preventDefault();
          closeContextMenu();
          break;
        case 'i':
          // View details
          event.preventDefault();
          closeContextMenu();
          break;
        default:
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [contextMenu]);

  return {
    contextMenu,
    openContextMenu,
    closeContextMenu
  };
};

export default StockContextMenu;
