import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiTrendingUp, 
  FiTrendingDown, 
  FiMinus,
  FiVolume2,
  FiEye,
  FiStar
} from 'react-icons/fi';
import StockPrice from './StockPrice';
import '../styles/components/stock-table.css';

const StockTable = ({ 
  stocks = [], 
  priceChanges = {},
  onStockClick,
  onWatchlistToggle,
  showWatchlist = false,
  showVolume = true,
  showDayRange = false,
  sortBy = 'changePercent',
  sortOrder = 'desc',
  className = ''
}) => {
  // Sort stocks based on criteria
  const sortedStocks = useMemo(() => {
    if (!stocks.length) return [];

    return [...stocks].sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      // Handle string values
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  }, [stocks, sortBy, sortOrder]);

  // Format volume
  const formatVolume = (volume) => {
    if (volume >= 10000000) {
      return `${(volume / 10000000).toFixed(1)}Cr`;
    } else if (volume >= 100000) {
      return `${(volume / 100000).toFixed(1)}L`;
    } else if (volume >= 1000) {
      return `${(volume / 1000).toFixed(1)}K`;
    }
    return volume?.toLocaleString() || '0';
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  if (!stocks.length) {
    return (
      <div className={`stock-table empty ${className}`}>
        <div className="empty-state">
          <FiTrendingUp size={48} />
          <h3>No stocks to display</h3>
          <p>Add some stocks to your watchlist to see them here.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`stock-table ${className}`}>
      <div className="table-header">
        <div className="col-stock">Stock</div>
        <div className="col-price">Price</div>
        <div className="col-change">Change</div>
        {showVolume && <div className="col-volume">Volume</div>}
        {showDayRange && <div className="col-range">Day Range</div>}
        {showWatchlist && <div className="col-actions">Actions</div>}
      </div>

      <div className="table-body">
        <AnimatePresence>
          {sortedStocks.map((stock, index) => {
            const priceChange = priceChanges[stock.symbol];
            const isPositive = stock.change >= 0;
            const trendDirection = stock.change > 0 ? 'up' : stock.change < 0 ? 'down' : 'neutral';

            return (
              <motion.div
                key={stock.symbol}
                className={`table-row ${trendDirection} ${priceChange ? 'updating' : ''}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                onClick={() => onStockClick?.(stock)}
                style={{ cursor: 'pointer' }}
              >
                {/* Stock Info */}
                <div className="col-stock">
                  <div className="stock-info">
                    <div className="stock-symbol">{stock.symbol}</div>
                    <div className="stock-name">{stock.name}</div>
                    {stock.sector && (
                      <div className="stock-sector">{stock.sector}</div>
                    )}
                  </div>
                </div>

                {/* Price */}
                <div className="col-price">
                  <StockPrice
                    symbol={stock.symbol}
                    price={stock.price}
                    change={stock.change}
                    changePercent={stock.changePercent}
                    priceChange={priceChange}
                    showSymbol={false}
                    showChange={false}
                    size="medium"
                  />
                </div>

                {/* Change */}
                <div className="col-change">
                  <div className={`change-container ${trendDirection}`}>
                    <div className="change-icon">
                      {trendDirection === 'up' && <FiTrendingUp size={14} />}
                      {trendDirection === 'down' && <FiTrendingDown size={14} />}
                      {trendDirection === 'neutral' && <FiMinus size={14} />}
                    </div>
                    <div className="change-values">
                      <div className="change-amount">
                        {isPositive ? '+' : ''}{formatCurrency(Math.abs(stock.change))}
                      </div>
                      <div className="change-percent">
                        ({isPositive ? '+' : ''}{stock.changePercent.toFixed(2)}%)
                      </div>
                    </div>
                  </div>
                </div>

                {/* Volume */}
                {showVolume && (
                  <div className="col-volume">
                    <div className="volume-container">
                      <FiVolume2 size={14} />
                      <span>{formatVolume(stock.volume)}</span>
                    </div>
                  </div>
                )}

                {/* Day Range */}
                {showDayRange && (
                  <div className="col-range">
                    <div className="range-container">
                      <div className="range-values">
                        <span className="range-low">{formatCurrency(stock.dayLow)}</span>
                        <span className="range-separator">-</span>
                        <span className="range-high">{formatCurrency(stock.dayHigh)}</span>
                      </div>
                      <div className="range-bar">
                        <div 
                          className="range-indicator"
                          style={{
                            left: `${((stock.price - stock.dayLow) / (stock.dayHigh - stock.dayLow)) * 100}%`
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Actions */}
                {showWatchlist && (
                  <div className="col-actions">
                    <button
                      className={`action-btn watchlist-btn ${stock.inWatchlist ? 'active' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onWatchlistToggle?.(stock.symbol);
                      }}
                      title={stock.inWatchlist ? 'Remove from watchlist' : 'Add to watchlist'}
                    >
                      {stock.inWatchlist ? <FiStar /> : <FiEye />}
                    </button>
                  </div>
                )}

                {/* Update indicator */}
                {priceChange && (
                  <motion.div
                    className={`update-indicator ${priceChange.direction}`}
                    initial={{ scale: 0, opacity: 1 }}
                    animate={{ scale: 1.5, opacity: 0 }}
                    transition={{ duration: 1 }}
                  />
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default StockTable;
