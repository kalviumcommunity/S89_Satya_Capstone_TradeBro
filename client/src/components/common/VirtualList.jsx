/**
 * Virtual List Component
 * High-performance list rendering for large datasets
 */

import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { motion } from 'framer-motion';
import { usePerformanceOptimization } from '../../hooks/usePerformanceOptimization';

const VirtualList = memo(({
  items = [],
  itemHeight = 60,
  containerHeight = 400,
  renderItem,
  className = '',
  overscan = 5,
  onScroll,
  ...props
}) => {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef(null);
  const { throttle, cache } = usePerformanceOptimization('VirtualList');

  // Calculate visible range
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    items.length - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  );

  // Memoized visible items
  const visibleItems = React.useMemo(() => {
    const cacheKey = `${startIndex}-${endIndex}-${items.length}`;
    const cached = cache.get(cacheKey);
    
    if (cached) return cached;

    const result = [];
    for (let i = startIndex; i <= endIndex; i++) {
      if (items[i]) {
        result.push({
          index: i,
          item: items[i],
          top: i * itemHeight
        });
      }
    }

    cache.set(cacheKey, result);
    return result;
  }, [startIndex, endIndex, items, itemHeight, cache]);

  // Throttled scroll handler
  const handleScroll = useCallback(
    throttle((event) => {
      const newScrollTop = event.target.scrollTop;
      setScrollTop(newScrollTop);
      onScroll?.(newScrollTop);
    }, 16), // 60fps
    [onScroll, throttle]
  );

  // Total height for scrollbar
  const totalHeight = items.length * itemHeight;

  return (
    <div
      ref={containerRef}
      className={`virtual-list ${className}`}
      style={{
        height: containerHeight,
        overflow: 'auto',
        position: 'relative'
      }}
      onScroll={handleScroll}
      {...props}
    >
      {/* Spacer for total height */}
      <div style={{ height: totalHeight, position: 'relative' }}>
        {/* Visible items */}
        {visibleItems.map(({ index, item, top }) => (
          <div
            key={index}
            style={{
              position: 'absolute',
              top,
              left: 0,
              right: 0,
              height: itemHeight
            }}
          >
            {renderItem(item, index)}
          </div>
        ))}
      </div>
    </div>
  );
});

VirtualList.displayName = 'VirtualList';

/**
 * Optimized Stock List Component
 */
export const OptimizedStockList = memo(({
  stocks = [],
  onStockClick,
  className = ''
}) => {
  const { shouldAnimate, variants } = usePerformanceOptimization('OptimizedStockList');

  const renderStockItem = useCallback((stock, index) => (
    <motion.div
      className="stock-item"
      variants={shouldAnimate ? variants : undefined}
      initial={shouldAnimate ? "initial" : false}
      animate={shouldAnimate ? "animate" : false}
      onClick={() => onStockClick?.(stock)}
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '12px 16px',
        borderBottom: '1px solid var(--border-color)',
        cursor: 'pointer',
        transition: 'background-color 0.2s ease'
      }}
    >
      <div className="stock-symbol" style={{ fontWeight: 600, minWidth: '80px' }}>
        {stock.symbol}
      </div>
      <div className="stock-name" style={{ flex: 1, marginLeft: '12px' }}>
        {stock.name}
      </div>
      <div className="stock-price" style={{ fontWeight: 600 }}>
        ₹{stock.price?.toLocaleString('en-IN')}
      </div>
      <div 
        className={`stock-change ${stock.change >= 0 ? 'positive' : 'negative'}`}
        style={{ 
          marginLeft: '12px',
          color: stock.change >= 0 ? '#10B981' : '#EF4444'
        }}
      >
        {stock.change >= 0 ? '+' : ''}{stock.change?.toFixed(2)}%
      </div>
    </motion.div>
  ), [onStockClick, shouldAnimate, variants]);

  return (
    <VirtualList
      items={stocks}
      itemHeight={60}
      containerHeight={400}
      renderItem={renderStockItem}
      className={`optimized-stock-list ${className}`}
    />
  );
});

OptimizedStockList.displayName = 'OptimizedStockList';

/**
 * Optimized Trading History Component
 */
export const OptimizedTradingHistory = memo(({
  trades = [],
  onTradeClick,
  className = ''
}) => {
  const renderTradeItem = useCallback((trade, index) => (
    <div
      className="trade-item"
      onClick={() => onTradeClick?.(trade)}
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '12px 16px',
        borderBottom: '1px solid var(--border-color)',
        cursor: 'pointer'
      }}
    >
      <div className="trade-symbol" style={{ fontWeight: 600, minWidth: '80px' }}>
        {trade.symbol}
      </div>
      <div 
        className={`trade-type ${trade.action?.toLowerCase()}`}
        style={{ 
          padding: '4px 8px',
          borderRadius: '4px',
          fontSize: '0.75rem',
          fontWeight: 600,
          backgroundColor: trade.action === 'BUY' ? '#ECFDF5' : '#FEF2F2',
          color: trade.action === 'BUY' ? '#10B981' : '#EF4444'
        }}
      >
        {trade.action}
      </div>
      <div className="trade-quantity" style={{ marginLeft: '12px' }}>
        {trade.quantity}
      </div>
      <div className="trade-price" style={{ marginLeft: '12px', fontWeight: 600 }}>
        ₹{trade.price?.toLocaleString('en-IN')}
      </div>
      <div className="trade-date" style={{ marginLeft: 'auto', fontSize: '0.875rem', color: '#6B7280' }}>
        {new Date(trade.timestamp).toLocaleDateString('en-IN')}
      </div>
    </div>
  ), [onTradeClick]);

  return (
    <VirtualList
      items={trades}
      itemHeight={60}
      containerHeight={300}
      renderItem={renderTradeItem}
      className={`optimized-trading-history ${className}`}
    />
  );
});

OptimizedTradingHistory.displayName = 'OptimizedTradingHistory';

/**
 * Optimized Watchlist Component
 */
export const OptimizedWatchlist = memo(({
  watchlist = [],
  onStockClick,
  onRemoveStock,
  className = ''
}) => {
  const renderWatchlistItem = useCallback((stock, index) => (
    <div
      className="watchlist-item"
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '12px 16px',
        borderBottom: '1px solid var(--border-color)',
        cursor: 'pointer'
      }}
    >
      <div 
        className="stock-info"
        onClick={() => onStockClick?.(stock)}
        style={{ flex: 1, display: 'flex', alignItems: 'center' }}
      >
        <div className="stock-symbol" style={{ fontWeight: 600, minWidth: '80px' }}>
          {stock.symbol}
        </div>
        <div className="stock-price" style={{ marginLeft: '12px', fontWeight: 600 }}>
          ₹{stock.price?.toLocaleString('en-IN')}
        </div>
        <div 
          className={`stock-change ${stock.change >= 0 ? 'positive' : 'negative'}`}
          style={{ 
            marginLeft: '12px',
            color: stock.change >= 0 ? '#10B981' : '#EF4444'
          }}
        >
          {stock.change >= 0 ? '+' : ''}{stock.change?.toFixed(2)}%
        </div>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemoveStock?.(stock);
        }}
        style={{
          background: 'none',
          border: 'none',
          color: '#EF4444',
          cursor: 'pointer',
          padding: '4px'
        }}
      >
        ×
      </button>
    </div>
  ), [onStockClick, onRemoveStock]);

  return (
    <VirtualList
      items={watchlist}
      itemHeight={60}
      containerHeight={250}
      renderItem={renderWatchlistItem}
      className={`optimized-watchlist ${className}`}
    />
  );
});

OptimizedWatchlist.displayName = 'OptimizedWatchlist';

export default VirtualList;
