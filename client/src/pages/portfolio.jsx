import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useSelector } from 'react-redux';
import {
  FiPieChart,
  FiTrendingUp,
  FiTrendingDown,
  FiDollarSign,
  FiRefreshCw,
  FiDownload,
  FiPlus,
  FiBarChart2,
  FiArrowUpRight,
  FiArrowDownRight,
  FiMoreHorizontal,
  FiEdit,
  FiTrash2
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import CountUp from 'react-countup';
import StockPrice from '../components/StockPrice';
import { PortfolioActionButtons } from '../components/trading/StockActionButtons';
import PageHeader from '../components/layout/PageHeader';
import { usePortfolio } from '../contexts/PortfolioContext';
import SlideToBuy from '../components/trading/SlideToBuy';
import WatchlistButton from '../components/trading/WatchlistButton';
import { useSlideToBuy } from '../hooks/useSlideToBuy';
import { formatCurrency, formatPercentage } from '../utils/formatters';
import '../styles/portfolio.css';

const Portfolio = ({ user, theme }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [refreshing, setRefreshing] = useState(false);
  const [highlightedStock, setHighlightedStock] = useState(null);
  const { isOpen, currentStock, defaultQuantity, openSlideToBuy, closeSlideToBuy } = useSlideToBuy();
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('value');
  const { portfolioData, loading, updatePortfolioValues, refreshPortfolio } = usePortfolio();

  // Portfolio data is automatically loaded by PortfolioContext
  // No need to manually refresh on mount

  // Handle purchase success from navigation state
  useEffect(() => {
    if (location.state?.showPurchaseSuccess && location.state?.purchasedStock) {
      const purchasedStock = location.state.purchasedStock;

      // Show success message
      toast.success(
        `🎉 Successfully purchased ${purchasedStock.quantity} shares of ${purchasedStock.symbol} for ${formatCurrency(purchasedStock.totalCost)}!`,
        { duration: 5000 }
      );

      // Highlight the purchased stock
      setHighlightedStock(purchasedStock.symbol);

      // Remove highlight after 5 seconds
      setTimeout(() => {
        setHighlightedStock(null);
      }, 5000);

      // Clear the navigation state
      navigate(location.pathname, { replace: true });
    }
  }, [location.state, navigate, location.pathname]);

  // Show loading state if portfolio data is not ready
  if (loading || !portfolioData) {
    return (
      <div className="portfolio-page">
        <div className="portfolio-container">
          <div className="loading-container">
            <div className="loading-spinner" />
            <p>Loading portfolio...</p>
          </div>
        </div>
      </div>
    );
  }

  // Portfolio overview stats from real data
  const portfolioStats = [
    {
      title: 'Total Value',
      value: portfolioData.totalValue || 0,
      changePercent: portfolioData.totalGainLossPercentage || 0,
      changeAmount: portfolioData.totalGainLoss || 0,
      icon: FiDollarSign,
      color: 'primary'
    },
    {
      title: 'Available Cash',
      value: portfolioData.availableCash || 0,
      changePercent: 0,
      changeAmount: 0,
      icon: FiDollarSign,
      color: 'info'
    },
    {
      title: 'Total Invested',
      value: portfolioData.totalInvested || 0,
      changePercent: portfolioData.totalGainLossPercentage || 0,
      changeAmount: portfolioData.totalGainLoss || 0,
      icon: FiBarChart2,
      color: (portfolioData.totalGainLoss || 0) >= 0 ? 'success' : 'danger'
    },
    {
      title: 'Holdings',
      value: portfolioData.holdings?.length || 0,
      changePercent: 0,
      changeAmount: 0,
      icon: FiPieChart,
      color: 'info'
    }
  ];

  // Use real holdings data
  const holdings = portfolioData.holdings || [];

  // Filter holdings based on selected filter
  const filteredHoldings = holdings.filter(holding => {
    if (filter === 'gainers') {
      return (holding.totalGain || 0) > 0;
    } else if (filter === 'losers') {
      return (holding.totalGain || 0) < 0;
    }
    return true; // 'all' - show all holdings
  });

  // Sort holdings by total value (descending)
  const sortedHoldings = [...filteredHoldings].sort((a, b) => {
    return (b.value || 0) - (a.value || 0);
  });



  const handleRefresh = async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setRefreshing(false);
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

  return (
    <div className="portfolio-page">
      {/* Page Header */}
      <PageHeader
        icon={FiPieChart}
        title="Portfolio"
        subtitle="Track your investments and portfolio performance"
        borderColor="success"
        actions={[
          {
            label: "Refresh",
            icon: FiRefreshCw,
            onClick: handleRefresh,
            variant: "secondary",
            disabled: refreshing
          }
        ]}
      />

      <div className="portfolio-container">

        {/* Portfolio Stats */}
        <motion.div
          className="portfolio-stats"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          {portfolioStats.map((stat, index) => {
            const Icon = stat.icon;
            const isPositive = stat.changePercent >= 0;
            
            return (
              <motion.div
                key={stat.title}
                className={`stat-card stat-${stat.color}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
              >
                <div className="stat-header">
                  <div className="stat-icon">
                    <Icon />
                  </div>
                  <div className={`stat-change ${isPositive ? 'positive' : 'negative'}`}>
                    {isPositive ? <FiArrowUpRight size={14} /> : <FiArrowDownRight size={14} />}
                    {Math.abs(stat.changePercent)}%
                  </div>
                </div>
                <div className="stat-content">
                  <h3 className="stat-value">
                    {typeof stat.value === 'number' && stat.value > 1000 ? (
                      <CountUp
                        end={stat.value}
                        duration={2}
                        separator=","
                        prefix={stat.title.includes('Value') || stat.title.includes('P&L') ? '₹' : ''}
                      />
                    ) : (
                      stat.value
                    )}
                  </h3>
                  <p className="stat-title">{stat.title}</p>
                  {stat.changeAmount !== 0 && (
                    <p className={`stat-change-amount ${isPositive ? 'positive' : 'negative'}`}>
                      {isPositive ? '+' : ''}{formatCurrency(stat.changeAmount)}
                    </p>
                  )}
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Portfolio Content Grid */}
        <div className="portfolio-grid">
          {/* Holdings Table */}
          <motion.div
            className="portfolio-card holdings-table"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <div className="card-header">
              <div className="header-left">
                <h3 className="card-title">
                  <FiBarChart2 className="card-icon" />
                  My Holdings
                  <span className="holdings-count">({filteredHoldings.length} of {holdings.length} stocks)</span>
                </h3>
                <div className="holdings-summary">
                  <span className="total-invested">
                    Total Invested: {formatCurrency(portfolioData.totalInvested || 0)}
                  </span>
                  <span className="current-value">
                    Current Value: {formatCurrency(portfolioData.totalValue || 0)}
                  </span>
                </div>
              </div>
              <div className="card-actions">
                <div className="filter-group">
                  <select
                    className="filter-select"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                  >
                    <option value="all">All Holdings</option>
                    <option value="gainers">Gainers Only</option>
                    <option value="losers">Losers Only</option>
                  </select>
                </div>
                <button
                  className="btn-refresh"
                  onClick={handleRefresh}
                  disabled={refreshing}
                  title="Refresh Holdings"
                >
                  <FiRefreshCw className={refreshing ? 'spinning' : ''} />
                </button>
              </div>
            </div>
            <div className="card-content">
              <div className="holdings-table">
                <div className="table-header">
                  <div className="col-stock">Stock</div>
                  <div className="col-quantity">Quantity</div>
                  <div className="col-avg-price">Avg Price</div>
                  <div className="col-current-price">Current Price</div>
                  <div className="col-value">Value</div>
                  <div className="col-gains">Total P&L</div>
                  <div className="col-day-change">Day Change</div>
                  <div className="col-actions">Actions</div>
                </div>
                <div className="table-body">
                  {sortedHoldings.length > 0 ? sortedHoldings.map((holding, index) => (
                    <motion.div
                      key={holding.symbol}
                      className={`table-row clickable ${highlightedStock === holding.symbol ? 'highlighted-purchase' : ''}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{
                        opacity: 1,
                        y: 0,
                        scale: highlightedStock === holding.symbol ? 1.02 : 1
                      }}
                      style={{
                        backgroundColor: highlightedStock === holding.symbol ? 'var(--success-bg, rgba(16, 185, 129, 0.1))' : 'transparent'
                      }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      onClick={() => navigate(`/stock/${holding.symbol}`)}
                    >
                      <div className="col-stock">
                        <div className="stock-info">
                          <div className="stock-symbol">{holding.symbol}</div>
                          <div className="stock-name">{holding.name}</div>
                          <div className="stock-sector">{holding.sector}</div>
                        </div>
                      </div>
                      <div className="col-quantity">{formatNumber(holding.quantity || 0)}</div>
                      <div className="col-avg-price">{formatCurrency(holding.avgPrice || 0)}</div>
                      <div className="col-current-price">
                        <StockPrice
                          price={holding.currentPrice || 0}
                          change={holding.dayChange || 0}
                          changePercent={holding.dayChangePercent || 0}
                          size="small"
                        />
                      </div>
                      <div className="col-value">{formatCurrency(holding.value || 0)}</div>
                      <div className="col-gains">
                        <div className={`gain-amount ${(holding.totalGain || 0) >= 0 ? 'positive' : 'negative'}`}>
                          {(holding.totalGain || 0) >= 0 ? '+' : ''}{formatCurrency(holding.totalGain || 0)}
                        </div>
                        <div className={`gain-percent ${(holding.totalGainPercent || 0) >= 0 ? 'positive' : 'negative'}`}>
                          ({(holding.totalGainPercent || 0) >= 0 ? '+' : ''}{(holding.totalGainPercent || 0).toFixed(2)}%)
                        </div>
                      </div>
                      <div className="col-day-change">
                        <div className={`day-change ${(holding.dayChange || 0) >= 0 ? 'positive' : 'negative'}`}>
                          {(holding.dayChange || 0) >= 0 ? '+' : ''}{(holding.dayChange || 0).toFixed(2)}
                        </div>
                        <div className={`day-change-percent ${(holding.dayChangePercent || 0) >= 0 ? 'positive' : 'negative'}`}>
                          ({(holding.dayChangePercent || 0) >= 0 ? '+' : ''}{(holding.dayChangePercent || 0).toFixed(2)}%)
                        </div>
                      </div>
                      <div className="col-actions">
                        <div className="action-buttons">
                          <WatchlistButton
                            stockData={{
                              symbol: holding.symbol,
                              name: holding.name,
                              price: holding.currentPrice,
                              change: holding.dayChange,
                              changePercent: holding.dayChangePercent
                            }}
                            size="small"
                            variant="simple"
                            showText={false}
                          />
                          <button
                            className="buy-btn-small"
                            onClick={(e) => {
                              e.stopPropagation();
                              openSlideToBuy({
                                symbol: holding.symbol,
                                name: holding.name,
                                price: holding.currentPrice,
                                change: holding.dayChange,
                                changePercent: holding.dayChangePercent
                              });
                            }}
                            title="Buy More"
                          >
                            Buy
                          </button>
                          <PortfolioActionButtons
                            stockData={{
                              symbol: holding.symbol,
                              name: holding.name,
                              price: holding.currentPrice,
                              change: holding.dayChange,
                              changePercent: holding.dayChangePercent,
                              quantity: holding.quantity,
                              avgPrice: holding.avgPrice,
                              totalValue: holding.value
                            }}
                          />
                        </div>
                      </div>
                    </motion.div>
                  )) : (
                    <div className="empty-holdings">
                      <div className="empty-icon">
                        <FiBarChart2 size={48} />
                      </div>
                      <h3 className="empty-title">
                        {filter === 'gainers' ? 'No Gainers Found' :
                         filter === 'losers' ? 'No Losers Found' :
                         'No Holdings Yet'}
                      </h3>
                      <p className="empty-description">
                        {filter === 'gainers' ? 'None of your holdings are currently in profit.' :
                         filter === 'losers' ? 'None of your holdings are currently in loss.' :
                         'Start building your portfolio by adding your first stock.'}
                      </p>
                      {filter !== 'all' && (
                        <button
                          className="btn-secondary"
                          onClick={() => setFilter('all')}
                        >
                          View All Holdings
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>


        </div>

        {/* Slide to Buy Modal */}
        <SlideToBuy
          stockData={currentStock}
          isOpen={isOpen}
          onClose={closeSlideToBuy}
          defaultQuantity={defaultQuantity}
          onSuccess={() => {
            // Refresh portfolio data after successful purchase
            // portfolioData will be updated automatically by the context
          }}
        />
      </div>
    </div>
  );
};

export default Portfolio;
