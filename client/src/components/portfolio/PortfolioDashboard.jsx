import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiTrendingUp, FiTrendingDown, FiDollarSign, FiPieChart, FiBarChart2, FiRefreshCw } from 'react-icons/fi';
import TradingIntegration from '../trading/TradingIntegration';
import tradingEngine from '../../services/tradingEngine';
import portfolioCalculator from '../../services/portfolioCalculator';
import './PortfolioDashboard.css';

const PortfolioDashboard = () => {
  const [portfolioData, setPortfolioData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Load portfolio data on component mount
  useEffect(() => {
    loadPortfolioData();
    
    // Listen for portfolio updates
    const handlePortfolioUpdate = (updatedData) => {
      setPortfolioData(updatedData);
    };

    tradingEngine.addListener(handlePortfolioUpdate);
    return () => tradingEngine.removeListener(handlePortfolioUpdate);
  }, []);

  const loadPortfolioData = async () => {
    setIsLoading(true);
    try {
      // Get portfolio summary from trading engine
      const summary = tradingEngine.getPortfolioSummary();
      
      // Enhance with calculated metrics
      const enhancedData = portfolioCalculator.calculatePortfolioMetrics(
        summary.positions,
        summary.virtualBalance
      );
      
      setPortfolioData(enhancedData);
    } catch (error) {
      console.error('Error loading portfolio data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadPortfolioData();
    setTimeout(() => setRefreshing(false), 1000);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-IN').format(num);
  };

  if (isLoading) {
    return (
      <div className="portfolio-loading">
        <div className="loading-spinner" />
        <p>Loading your portfolio...</p>
      </div>
    );
  }

  if (!portfolioData) {
    return (
      <div className="portfolio-error">
        <p>Unable to load portfolio data</p>
        <button onClick={loadPortfolioData}>Retry</button>
      </div>
    );
  }

  return (
    <div className="portfolio-dashboard">
      {/* Header */}
      <div className="portfolio-header">
        <div className="header-content">
          <h1>Portfolio Dashboard</h1>
          <p>Track your investments and performance</p>
        </div>
        <button 
          className={`refresh-btn ${refreshing ? 'refreshing' : ''}`}
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <FiRefreshCw size={20} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Portfolio Summary Cards */}
      <div className="summary-cards">
        <motion.div 
          className="summary-card total-value"
          whileHover={{ y: -2 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <div className="card-icon">
            <FiDollarSign size={24} />
          </div>
          <div className="card-content">
            <h3>Total Portfolio Value</h3>
            <p className="value">{formatCurrency(portfolioData.totalPortfolioValue)}</p>
            <span className="subtext">
              Invested: {formatCurrency(portfolioData.totalInvested)} | 
              Cash: {formatCurrency(portfolioData.virtualBalance)}
            </span>
          </div>
        </motion.div>

        <motion.div 
          className={`summary-card pnl ${portfolioData.isPortfolioProfit ? 'profit' : 'loss'}`}
          whileHover={{ y: -2 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <div className="card-icon">
            {portfolioData.isPortfolioProfit ? <FiTrendingUp size={24} /> : <FiTrendingDown size={24} />}
          </div>
          <div className="card-content">
            <h3>Total P&L</h3>
            <p className="value">
              {portfolioData.isPortfolioProfit ? '+' : ''}{formatCurrency(portfolioData.totalPnL)}
            </p>
            <span className="percentage">
              ({portfolioData.isPortfolioProfit ? '+' : ''}{portfolioData.totalPnLPercentage.toFixed(2)}%)
            </span>
          </div>
        </motion.div>

        <motion.div 
          className="summary-card positions"
          whileHover={{ y: -2 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <div className="card-icon">
            <FiPieChart size={24} />
          </div>
          <div className="card-content">
            <h3>Active Positions</h3>
            <p className="value">{portfolioData.positionCount}</p>
            <span className="subtext">
              {portfolioData.profitablePositions} profitable | {portfolioData.losingPositions} losing
            </span>
          </div>
        </motion.div>

        <motion.div 
          className={`summary-card day-pnl ${portfolioData.isDayGainer ? 'profit' : 'loss'}`}
          whileHover={{ y: -2 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <div className="card-icon">
            <FiBarChart2 size={24} />
          </div>
          <div className="card-content">
            <h3>Today's P&L</h3>
            <p className="value">
              {portfolioData.isDayGainer ? '+' : ''}{formatCurrency(portfolioData.dayPnL)}
            </p>
            <span className="percentage">
              ({portfolioData.isDayGainer ? '+' : ''}{portfolioData.dayPnLPercentage.toFixed(2)}%)
            </span>
          </div>
        </motion.div>
      </div>

      {/* Holdings Table */}
      {portfolioData.positions.length > 0 ? (
        <div className="holdings-section">
          <h2>Your Holdings</h2>
          <div className="holdings-table">
            <div className="table-header">
              <div className="col-symbol">Symbol</div>
              <div className="col-quantity">Quantity</div>
              <div className="col-avg-price">Avg Price</div>
              <div className="col-current-price">Current Price</div>
              <div className="col-current-value">Current Value</div>
              <div className="col-pnl">P&L</div>
              <div className="col-actions">Actions</div>
            </div>
            
            <AnimatePresence>
              {portfolioData.positions.map((position, index) => (
                <motion.div
                  key={position.symbol}
                  className="table-row"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
                >
                  <div className="col-symbol">
                    <span className="symbol-name">{position.symbol}</span>
                    <span className="weightage">{position.weightage.toFixed(1)}%</span>
                  </div>
                  <div className="col-quantity">
                    {formatNumber(position.quantity)}
                  </div>
                  <div className="col-avg-price">
                    ₹{position.avgPrice.toFixed(2)}
                  </div>
                  <div className="col-current-price">
                    ₹{position.currentPrice.toFixed(2)}
                  </div>
                  <div className="col-current-value">
                    {formatCurrency(position.currentValue)}
                  </div>
                  <div className={`col-pnl ${position.isProfit ? 'profit' : 'loss'}`}>
                    <div className="pnl-amount">
                      {position.isProfit ? '+' : ''}{formatCurrency(position.unrealizedPnL)}
                    </div>
                    <div className="pnl-percentage">
                      ({position.isProfit ? '+' : ''}{position.unrealizedPnLPercentage.toFixed(2)}%)
                    </div>
                  </div>
                  <div className="col-actions">
                    <TradingIntegration
                      symbol={position.symbol}
                      currentPrice={position.currentPrice}
                      stockData={position}
                      layout="horizontal"
                      size="small"
                      showHoldings={false}
                    />
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      ) : (
        <div className="empty-portfolio">
          <FiPieChart size={64} />
          <h3>No Holdings Yet</h3>
          <p>Start building your portfolio by buying your first stock</p>
          <button 
            className="explore-btn"
            onClick={() => window.location.href = '/dashboard'}
          >
            Explore Stocks
          </button>
        </div>
      )}

      {/* Portfolio Allocation */}
      {portfolioData.positions.length > 0 && (
        <div className="allocation-section">
          <h2>Portfolio Allocation</h2>
          <div className="allocation-grid">
            <div className="allocation-chart">
              <div className="chart-placeholder">
                <FiPieChart size={48} />
                <p>Portfolio allocation chart will be displayed here</p>
              </div>
            </div>
            <div className="allocation-breakdown">
              <div className="breakdown-item">
                <span className="label">Invested Amount</span>
                <span className="value">{formatCurrency(portfolioData.totalInvested)}</span>
                <span className="percentage">{portfolioData.investedAllocation.toFixed(1)}%</span>
              </div>
              <div className="breakdown-item">
                <span className="label">Available Cash</span>
                <span className="value">{formatCurrency(portfolioData.virtualBalance)}</span>
                <span className="percentage">{portfolioData.cashAllocation.toFixed(1)}%</span>
              </div>
              <div className="breakdown-item">
                <span className="label">Win Rate</span>
                <span className="value">{portfolioData.winRate.toFixed(1)}%</span>
                <span className="percentage">
                  {portfolioData.profitablePositions}/{portfolioData.positionCount}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PortfolioDashboard;
