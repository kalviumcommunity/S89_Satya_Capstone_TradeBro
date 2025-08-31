import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { motion } from 'framer-motion';
import { FiTrendingUp, FiTrendingDown } from 'react-icons/fi';
import ScrollVelocity from '../animations/ScrollVelocity';
import { useCleanup, throttle } from '../../utils/performanceOptimizer';
import './LiveMarketTicker.css';

const LiveMarketTicker = memo(() => {
  const cleanupManager = useCleanup();
  const [gainers, setGainers] = useState([
    { symbol: 'NIFTY 50', price: '19,674.25', change: '+124.85', changePercent: '+0.64%' },
    { symbol: 'SENSEX', price: '65,930.77', change: '+298.42', changePercent: '+0.45%' },
    { symbol: 'TCS', price: '3,789.60', change: '+45.20', changePercent: '+1.21%' },
    { symbol: 'HDFC BANK', price: '1,678.90', change: '+23.15', changePercent: '+1.40%' },
    { symbol: 'ITC', price: '456.80', change: '+5.60', changePercent: '+1.24%' },
    { symbol: 'ICICI BANK', price: '987.45', change: '+12.30', changePercent: '+1.26%' },
    { symbol: 'WIPRO', price: '432.15', change: '+8.75', changePercent: '+2.06%' },
    { symbol: 'BAJAJ FINANCE', price: '6,789.30', change: '+89.45', changePercent: '+1.34%' }
  ]);

  const [losers, setLosers] = useState([
    { symbol: 'RELIANCE', price: '2,456.30', change: '-12.45', changePercent: '-0.50%' },
    { symbol: 'INFY', price: '1,456.75', change: '-8.30', changePercent: '-0.57%' },
    { symbol: 'BHARTI AIRTEL', price: '876.20', change: '-15.60', changePercent: '-1.75%' },
    { symbol: 'MARUTI', price: '9,234.50', change: '-67.80', changePercent: '-0.73%' },
    { symbol: 'ASIAN PAINTS', price: '3,145.90', change: '-23.40', changePercent: '-0.74%' },
    { symbol: 'TITAN', price: '2,987.65', change: '-34.25', changePercent: '-1.13%' },
    { symbol: 'NESTLE', price: '21,456.80', change: '-156.70', changePercent: '-0.72%' },
    { symbol: 'COAL INDIA', price: '234.75', change: '-4.85', changePercent: '-2.03%' }
  ]);

  // Optimized real-time updates with performance improvements
  useEffect(() => {
    const cleanupManager = useCleanup();

    // Throttled update functions to prevent excessive re-renders
    const updateGainers = throttle((newData) => {
      setGainers(newData);
    }, 2000); // Throttle to max once per 2 seconds

    const updateLosers = throttle((newData) => {
      setLosers(newData);
    }, 2000);

    const updateData = () => {
      // Batch both updates together
      const newGainers = gainers.map(stock => ({
        ...stock,
        price: (parseFloat(stock.price.replace(/,/g, '')) + Math.random() * 10).toLocaleString('en-IN', { minimumFractionDigits: 2 }),
        change: `+${(Math.random() * 50 + 5).toFixed(2)}`,
        changePercent: `+${(Math.random() * 3 + 0.1).toFixed(2)}%`
      }));

      const newLosers = losers.map(stock => ({
        ...stock,
        price: (parseFloat(stock.price.replace(/,/g, '')) - Math.random() * 10).toLocaleString('en-IN', { minimumFractionDigits: 2 }),
        change: `-${(Math.random() * 50 + 5).toFixed(2)}`,
        changePercent: `-${(Math.random() * 3 + 0.1).toFixed(2)}%`
      }));

      // Use throttled updates
      updateGainers(newGainers);
      updateLosers(newLosers);
    };

    // Reduced frequency from 4s to 6s for better performance
    const intervalId = setInterval(updateData, 6000);
    cleanupManager.addInterval(intervalId);

    return () => {
      clearInterval(intervalId);
      cleanupManager.cleanup();
    };
  }, []); // Empty dependency array to prevent recreation

  const renderStockItem = useCallback((stock, index, isGainer = true) => (
    <motion.div
      key={`${stock.symbol}-${index}`}
      className={`ticker-item ${isGainer ? 'positive' : 'negative'}`}
      whileHover={{ scale: 1.05 }}
    >
      <span className="stock-symbol">{stock.symbol}</span>
      <span className="stock-price">₹{stock.price}</span>
      <span className="stock-change">
        {isGainer ? <FiTrendingUp size={12} /> : <FiTrendingDown size={12} />}
        <span>{stock.change}</span>
        <span className="change-percent">({stock.changePercent})</span>
      </span>
    </motion.div>
  ), []);

  return (
    <div className="live-market-ticker">
      <div className="ticker-header">
        <div className="live-indicator">
          <span className="live-dot"></span>
          <span className="live-text">LIVE MARKET</span>
        </div>
        <span className="market-status">Market Open</span>
      </div>

      {/* Gainers - Moving Left to Right */}
      <div className="ticker-section gainers-section">
        <div className="section-label">
          <FiTrendingUp />
          <span>TOP GAINERS</span>
        </div>
        <ScrollVelocity
          baseVelocity={2}
          direction="left"
          className="gainers-ticker"
        >
          {gainers.map((stock, index) => renderStockItem(stock, index, true))}
        </ScrollVelocity>
      </div>

      {/* Losers - Moving Right to Left */}
      <div className="ticker-section losers-section">
        <div className="section-label">
          <FiTrendingDown />
          <span>TOP LOSERS</span>
        </div>
        <ScrollVelocity
          baseVelocity={2}
          direction="right"
          className="losers-ticker"
        >
          {losers.map((stock, index) => renderStockItem(stock, index, false))}
        </ScrollVelocity>
      </div>
    </div>
  );
});

LiveMarketTicker.displayName = 'LiveMarketTicker';

export default LiveMarketTicker;
