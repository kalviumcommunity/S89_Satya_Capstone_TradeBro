import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSearch, FiTrendingUp, FiBarChart2, FiActivity, FiStar, FiClock } from 'react-icons/fi';
import PageLayout from '../components/PageLayout';
import PageTransition from '../components/PageTransition';
import ChartModal from '../components/ChartModal';
import StockSearch from '../components/StockSearch';

import { useToast } from '../context/ToastContext';
import { useChartModal } from '../hooks/useChartModal';
import '../styles/pages/ChartsPage.css';

const ChartsPage = () => {
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [popularStocks] = useState([
    { symbol: 'RELIANCE.NS', name: 'Reliance Industries Ltd', price: 2485.75, change: 89.25, changePercent: 3.72, exchange: 'NSE' },
    { symbol: 'TCS.NS', name: 'Tata Consultancy Services Ltd', price: 3567.80, change: 125.40, changePercent: 3.64, exchange: 'NSE' },
    { symbol: 'HDFCBANK.NS', name: 'HDFC Bank Ltd', price: 1634.25, change: 52.15, changePercent: 3.29, exchange: 'NSE' },
    { symbol: 'INFY.NS', name: 'Infosys Ltd', price: 1456.90, change: 43.20, changePercent: 3.05, exchange: 'NSE' },
    { symbol: '500325', name: 'Reliance Industries Ltd', price: 2485.75, change: 89.25, changePercent: 3.72, exchange: 'BSE' },
    { symbol: '532540', name: 'Tata Consultancy Services Ltd', price: 3567.80, change: 125.40, changePercent: 3.64, exchange: 'BSE' }
  ]);
  const toast = useToast();

  // Chart modal functionality
  const { handleStockSelect, modalProps } = useChartModal();

  // Handle stock selection with recently viewed update
  const handleStockSelectWithHistory = (symbol, name = '') => {
    // Add to recently viewed
    setRecentlyViewed(prev => {
      const filtered = prev.filter(stock => stock !== symbol);
      return [symbol, ...filtered].slice(0, 5);
    });

    // Open chart modal
    handleStockSelect(symbol, name);

    toast.success(`Loading chart for ${symbol}`);
  };

  // Popular stock card component
  const PopularStockCard = ({ stock }) => (
    <motion.div
      className="popular-stock-card"
      whileHover={{ y: -4, boxShadow: "0 8px 25px rgba(85, 130, 139, 0.15)" }}
      whileTap={{ scale: 0.98 }}
      onClick={() => handleStockSelectWithHistory(stock.symbol, stock.name)}
    >
      <div className="stock-header">
        <div className="stock-info">
          <h3 className="stock-symbol">{stock.symbol}</h3>
          <p className="stock-name">{stock.name}</p>
        </div>
        <button className="chart-button">
          <FiBarChart2 />
        </button>
      </div>
      
      <div className="stock-price">
        <span className="price">${stock.price}</span>
        <span className={`change ${stock.change >= 0 ? 'positive' : 'negative'}`}>
          {stock.change >= 0 ? <FiTrendingUp /> : <FiTrendingUp style={{ transform: 'rotate(180deg)' }} />}
          {stock.change >= 0 ? '+' : ''}{stock.change} ({stock.changePercent >= 0 ? '+' : ''}{stock.changePercent}%)
        </span>
      </div>
    </motion.div>
  );

  return (
    <PageLayout>
      <PageTransition showLoading={false} transitionType="fade">
        <div className="charts-page">
          {/* Header */}
          <motion.div
            className="charts-header"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6 }}
          >
            <div className="header-content">
              <h1 className="page-title">
                <FiBarChart2 className="title-icon" />
                Stock Charts
              </h1>
              <p className="page-subtitle">
                Analyze stock performance with interactive charts and real-time data
              </p>
            </div>
          </motion.div>

          {/* Search Section */}
          <motion.div
            className="search-section"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <div className="search-container">
              <div className="search-header">
                <FiSearch className="search-icon" />
                <h2>Search Stocks</h2>
              </div>
              <div className="search-input-container">
                <StockSearch
                  onStockSelect={handleStockSelect}
                  placeholder="Search for Indian stocks to view charts (e.g., RELIANCE.NS, TCS.NS, HDFCBANK.NS)..."
                  showWatchlistButton={false}
                  showChartButton={false}
                  variant="default"
                />
              </div>
            </div>
          </motion.div>

          {/* Recently Viewed */}
          {recentlyViewed.length > 0 && (
            <motion.div
              className="recently-viewed-section"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className="section-header">
                <FiClock className="section-icon" />
                <h2>Recently Viewed</h2>
              </div>
              <div className="recently-viewed-list">
                {recentlyViewed.map((symbol, index) => (
                  <motion.button
                    key={symbol}
                    className="recent-stock-button"
                    onClick={() => handleStockSelectWithHistory(symbol)}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {symbol}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Popular Stocks */}
          <motion.div
            className="popular-stocks-section"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <div className="section-header">
              <FiStar className="section-icon" />
              <h2>Popular Stocks</h2>
              <p className="section-subtitle">Click on any stock to view its chart</p>
            </div>
            
            <div className="popular-stocks-grid">
              {popularStocks.map((stock, index) => (
                <motion.div
                  key={stock.symbol}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 * index }}
                >
                  <PopularStockCard stock={stock} />
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Chart Modal */}
          <ChartModal {...modalProps} />

          {/* Help Section */}
          <motion.div
            className="help-section"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <div className="help-content">
              <h3>How to Use Charts</h3>
              <div className="help-grid">
                <div className="help-item">
                  <FiSearch className="help-icon" />
                  <h4>Search</h4>
                  <p>Use the search bar to find any stock by symbol or company name</p>
                </div>
                <div className="help-item">
                  <FiBarChart2 className="help-icon" />
                  <h4>View Charts</h4>
                  <p>Click on any stock to view its interactive price chart</p>
                </div>
                <div className="help-item">
                  <FiActivity className="help-icon" />
                  <h4>Analyze</h4>
                  <p>Switch between different time ranges and chart types for analysis</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </PageTransition>
    </PageLayout>
  );
};

export default ChartsPage;
