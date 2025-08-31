import React from 'react';
import { motion } from 'framer-motion';
import { FiTrendingUp, FiTrendingDown, FiActivity } from 'react-icons/fi';
import './MarketHighlights.css';

const MarketHighlights = () => {
  const topGainers = [
    { symbol: 'ADANI PORTS', price: '789.45', change: '+67.30', changePercent: '+9.32%' },
    { symbol: 'TATA STEEL', price: '134.60', change: '+8.95', changePercent: '+7.12%' },
    { symbol: 'BAJAJ FINANCE', price: '6,789.20', change: '+398.45', changePercent: '+6.23%' },
    { symbol: 'MARUTI', price: '9,456.80', change: '+456.30', changePercent: '+5.08%' }
  ];

  const topLosers = [
    { symbol: 'BHARTI AIRTEL', price: '856.30', change: '-45.60', changePercent: '-5.06%' },
    { symbol: 'WIPRO', price: '456.75', change: '-23.45', changePercent: '-4.89%' },
    { symbol: 'TECH MAHINDRA', price: '1,234.50', change: '-58.90', changePercent: '-4.56%' },
    { symbol: 'HCL TECH', price: '1,089.40', change: '-48.20', changePercent: '-4.24%' }
  ];

  const mostActive = [
    { symbol: 'RELIANCE', volume: '2.4M', value: '₹5,890Cr' },
    { symbol: 'TCS', volume: '1.8M', value: '₹6,820Cr' },
    { symbol: 'HDFC BANK', volume: '3.2M', value: '₹5,370Cr' },
    { symbol: 'INFY', volume: '2.1M', value: '₹3,050Cr' }
  ];

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <section className="market-highlights">
      <div className="container">
        <motion.div 
          className="section-header"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="section-title">Live Market Highlights</h2>
          <p className="section-subtitle">Real-time insights from Indian stock markets</p>
        </motion.div>

        <div className="highlights-grid">
          {/* Top Gainers */}
          <motion.div 
            className="highlight-card gainers-card"
            variants={cardVariants}
            initial="hidden"
            whileInView="visible"
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
          >
            <div className="card-header">
              <div className="card-icon positive">
                <FiTrendingUp size={20} />
              </div>
              <h3>Top Gainers</h3>
            </div>
            <div className="stocks-list">
              {topGainers.map((stock, index) => (
                <motion.div 
                  key={stock.symbol}
                  className="stock-item"
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.2 + index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <div className="stock-info">
                    <span className="stock-symbol">{stock.symbol}</span>
                    <span className="stock-price">₹{stock.price}</span>
                  </div>
                  <div className="stock-change positive">
                    <span>{stock.change}</span>
                    <span className="change-percent">{stock.changePercent}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Top Losers */}
          <motion.div 
            className="highlight-card losers-card"
            variants={cardVariants}
            initial="hidden"
            whileInView="visible"
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <div className="card-header">
              <div className="card-icon negative">
                <FiTrendingDown size={20} />
              </div>
              <h3>Top Losers</h3>
            </div>
            <div className="stocks-list">
              {topLosers.map((stock, index) => (
                <motion.div 
                  key={stock.symbol}
                  className="stock-item"
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.3 + index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <div className="stock-info">
                    <span className="stock-symbol">{stock.symbol}</span>
                    <span className="stock-price">₹{stock.price}</span>
                  </div>
                  <div className="stock-change negative">
                    <span>{stock.change}</span>
                    <span className="change-percent">{stock.changePercent}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Most Active */}
          <motion.div 
            className="highlight-card active-card"
            variants={cardVariants}
            initial="hidden"
            whileInView="visible"
            transition={{ duration: 0.6, delay: 0.3 }}
            viewport={{ once: true }}
          >
            <div className="card-header">
              <div className="card-icon active">
                <FiActivity size={20} />
              </div>
              <h3>Most Active</h3>
            </div>
            <div className="stocks-list">
              {mostActive.map((stock, index) => (
                <motion.div 
                  key={stock.symbol}
                  className="stock-item"
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.4 + index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <div className="stock-info">
                    <span className="stock-symbol">{stock.symbol}</span>
                    <span className="stock-volume">{stock.volume}</span>
                  </div>
                  <div className="stock-value">
                    <span>{stock.value}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default MarketHighlights;
