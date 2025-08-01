import React, { useEffect, useState, memo, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiTrendingUp, FiTrendingDown, FiMinus } from 'react-icons/fi';
import '../styles/components/stock-price.css';

const StockPrice = memo(({
  symbol,
  price,
  change,
  changePercent,
  priceChange = null,
  showSymbol = true,
  showChange = true,
  size = 'medium',
  className = ''
}) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationDirection, setAnimationDirection] = useState(null);

  // Handle price change animations
  useEffect(() => {
    if (priceChange && priceChange.direction) {
      setAnimationDirection(priceChange.direction);
      setIsAnimating(true);
      
      const timer = setTimeout(() => {
        setIsAnimating(false);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [priceChange]);

  // Memoized currency formatter
  const formatCurrency = useCallback((amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }, []);

  // Memoized percentage formatter
  const formatPercentage = useCallback((value) => {
    if (typeof value !== 'number' || isNaN(value)) return '--';
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
  }, []);

  // Memoized calculations
  const { trendDirection, isPositive, formattedPrice, formattedChange } = useMemo(() => {
    const trend = change > 0 ? 'up' : change < 0 ? 'down' : 'neutral';
    const positive = change >= 0;
    const fPrice = typeof price === 'number' ? formatCurrency(price) : price;
    const fChange = typeof change === 'number' ? formatPercentage(change) : change;

    return {
      trendDirection: trend,
      isPositive: positive,
      formattedPrice: fPrice,
      formattedChange: fChange
    };
  }, [price, change, formatCurrency, formatPercentage]);

  // Animation variants
  const priceVariants = {
    initial: { scale: 1 },
    animate: {
      scale: [1, 1.05, 1],
      transition: {
        duration: 0.6,
        ease: "easeInOut"
      }
    }
  };

  const flashVariants = {
    initial: { opacity: 0 },
    animate: {
      opacity: [0, 0.3, 0],
      transition: {
        duration: 1,
        ease: "easeInOut"
      }
    }
  };

  return (
    <div className={`stock-price ${size} ${className}`}>
      {showSymbol && (
        <div className="stock-symbol">
          {symbol}
        </div>
      )}
      
      <div className="price-container">
        <motion.div
          className={`price-value ${isAnimating ? 'animating' : ''}`}
          variants={priceVariants}
          initial="initial"
          animate={isAnimating ? "animate" : "initial"}
        >
          {formatCurrency(price)}
          
          {/* Flash overlay for price changes */}
          <AnimatePresence>
            {isAnimating && (
              <motion.div
                className={`price-flash ${animationDirection}`}
                variants={flashVariants}
                initial="initial"
                animate="animate"
                exit="initial"
              />
            )}
          </AnimatePresence>
        </motion.div>
        
        {showChange && (
          <div className={`price-change ${trendDirection}`}>
            <div className="change-icon">
              {trendDirection === 'up' && <FiTrendingUp size={14} />}
              {trendDirection === 'down' && <FiTrendingDown size={14} />}
              {trendDirection === 'neutral' && <FiMinus size={14} />}
            </div>
            
            <div className="change-values">
              <span className="change-amount">
                {isPositive ? '+' : ''}{formatCurrency(Math.abs(change))}
              </span>
              <span className="change-percent">
                ({formatPercentage(changePercent)})
              </span>
            </div>
          </div>
        )}
      </div>
      
      {/* Pulse indicator for real-time updates */}
      <AnimatePresence>
        {isAnimating && (
          <motion.div
            className="pulse-indicator"
            initial={{ scale: 0, opacity: 1 }}
            animate={{ scale: 2, opacity: 0 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 1 }}
          />
        )}
      </AnimatePresence>
    </div>
  );
});

StockPrice.displayName = 'StockPrice';

export default StockPrice;
