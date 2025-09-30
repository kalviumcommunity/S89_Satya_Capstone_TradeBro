import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useSelector } from 'react-redux';
import {
  FiTrendingUp,
  FiTrendingDown,
  FiDollarSign,
  FiRefreshCw,
  FiShoppingCart,
  FiArrowUpRight,
  FiArrowDownRight,
  FiCheckCircle,
  FiGift,
  FiClock
} from 'react-icons/fi';
import CountUp from 'react-countup';
import StockPrice from '../components/StockPrice';
import MarketStatus from '../components/MarketStatus';
import DailyRewards from '../components/DailyRewards';
import PageHeader from '../components/layout/PageHeader';
import SlideToBuy from '../components/trading/SlideToBuy';

import { usePortfolio } from '../contexts/PortfolioContext';
import { useSlideToBuy } from '../hooks/useSlideToBuy';
import tradingService from '../services/tradingService';
// Removed performance optimizer to prevent excessive re-renders during signup
import { toast } from 'react-toastify';
import '../styles/dashboard.css';

const Dashboard = memo(({ user, theme, onLogin }) => {
  const navigate = useNavigate();
  const [refreshing, setRefreshing] = useState(false);
  const { portfolioData, loading, updatePortfolioValues, refreshPortfolio } = usePortfolio();
  const { isOpen, currentStock, defaultQuantity, openSlideToBuy, closeSlideToBuy } = useSlideToBuy();

  // Handle Google OAuth callback
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const userParam = urlParams.get('user');
    
    if (token && userParam && onLogin) {
      try {
        const userData = JSON.parse(decodeURIComponent(userParam));
        onLogin(userData, token);
        toast.success(`Welcome ${userData.fullName}!`);
        // Clean URL
        window.history.replaceState({}, document.title, window.location.pathname);
      } catch (error) {
        console.error('Error parsing OAuth callback:', error);
        toast.error('Authentication failed. Please try again.');
      }
    }
  }, [onLogin]);



  // Debug portfolio data changes and force refresh if needed
  useEffect(() => {
    console.log('🏠 Dashboard received portfolio data update:', {
      availableCash: portfolioData.availableCash,
      totalValue: portfolioData.totalValue
    });

    // If we're still showing default values, force a refresh
    if (portfolioData.availableCash === 10000 && portfolioData.totalValue === 10000) {
      console.log('🔄 Dashboard detected default values, forcing refresh...');
      setTimeout(() => {
        refreshPortfolio();
      }, 1000);
    }
  }, [portfolioData.availableCash, portfolioData.totalValue, refreshPortfolio]);

  // Calculate portfolio statistics from real data
  const portfolioStats = [
    {
      title: 'Total Value',
      value: portfolioData.totalValue,
      changePercent: portfolioData.totalGainLossPercentage,
      icon: FiDollarSign,
      color: 'primary'
    },
    {
      title: 'Available Cash',
      value: portfolioData.availableCash,
      changePercent: 0,
      icon: FiDollarSign,
      color: 'info'
    },
    {
      title: 'Total Invested',
      value: portfolioData.totalInvested,
      changePercent: portfolioData.totalGainLossPercentage,
      icon: FiTrendingUp,
      color: portfolioData.totalGainLoss >= 0 ? 'success' : 'danger'
    },
    {
      title: 'Holdings',
      value: portfolioData.holdings?.length || 0,
      changePercent: 0,
      icon: FiShoppingCart,
      color: 'success'
    }
  ];

  // Market indices exactly like TradeBro
  const marketIndices = [
    { name: 'NIFTY 50', value: 19674.25, change: 145.30, changePercent: 0.74 },
    { name: 'SENSEX', value: 65953.48, change: 501.92, changePercent: 0.77 },
    { name: 'NIFTY BANK', value: 44821.15, change: 287.65, changePercent: 0.65 },
    { name: 'NIFTY IT', value: 29847.30, change: -89.45, changePercent: -0.30 }
  ];


  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      console.log('🔄 Manual refresh triggered');

      // Debug: Check trading service balance directly
      const tradingSummary = tradingService.getPortfolioSummary();
      console.log('🔍 Direct trading service check:', {
        availableCash: tradingSummary.availableCash,
        totalValue: tradingSummary.totalValue
      });

      // Force refresh from trading service
      refreshPortfolio();

      // Also update portfolio values from server
      await updatePortfolioValues();

      // Also refresh market data if needed
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Function to claim daily reward with proper async handling
  const claimDailyReward = async () => {
    try {
      const result = await tradingService.claimDailyReward();
      console.log('🎁 Daily reward claim:', result);

      if (result.success) {
        // Show success message
        console.log(`✅ Claimed ₹${result.amount} daily reward!`);
        toast.success(`Daily reward claimed! +₹${result.amount}`);
      } else if (result.alreadyClaimed) {
        console.log('⚠️ Daily reward already claimed today');
        toast.info('Daily reward already claimed today!');
      }

      // Refresh portfolio data - the balance should already be synced
      setTimeout(() => {
        refreshPortfolio();
        handleRefresh();
      }, 1000);
    } catch (error) {
      console.error('Error claiming daily reward:', error);
      toast.error('Failed to claim daily reward');
    }
  };

  // Debug function to test daily rewards (for development)
  const testDailyReward = () => {
    const result = tradingService.forceDailyReward();
    console.log('🧪 Daily reward test:', result);

    // Refresh portfolio data instead of full page reload
    setTimeout(() => {
      refreshPortfolio();
      handleRefresh();
    }, 1000);
  };

  return (
    <div className="dashboard-page">
      {/* Page Header */}
      <PageHeader
        icon={FiTrendingUp}
        title="TradeBro Dashboard"
        subtitle="Indian Stock Market Overview - NSE & BSE Trading Platform"
        borderColor="primary"
        actions={[
          {
            label: "Refresh",
            icon: FiRefreshCw,
            onClick: handleRefresh,
            variant: "secondary",
            disabled: refreshing
          },
          {
            label: "Claim Daily ₹100",
            icon: FiGift,
            onClick: claimDailyReward,
            variant: "success",
            disabled: false
          }
        ]}
      />

      {/* Daily Rewards Component */}
      <DailyRewards />

      <div className="dashboard-container">
        {/* Market Indices Grid - TradeBro Layout */}
        <motion.div
          className="market-indices"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          {marketIndices.map((index, idx) => {
            const isPositive = index.change >= 0;
            return (
              <motion.div 
                key={index.name} 
                className="index-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: idx * 0.1 }}
              >
                <div className="index-header">
                  <h3 className="index-name">{index.name}</h3>
                  <div className={`index-change ${isPositive ? 'positive' : 'negative'}`}>
                    {isPositive ? <FiArrowUpRight size={12} /> : <FiArrowDownRight size={12} />}
                    {Math.abs(index.changePercent)}%
                  </div>
                </div>
                <div className="index-value">
                  <CountUp
                    end={index.value}
                    duration={2}
                    separator=","
                    decimals={2}
                  />
                </div>
                <div className={`index-change-value ${isPositive ? 'positive' : 'negative'}`}>
                  {isPositive ? '+' : ''}{index.change.toFixed(2)}
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Portfolio Stats - TradeBro Cards */}
        <motion.div
          className="stats-grid"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
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
                transition={{ duration: 0.4, delay: (index + 4) * 0.1 }}
              >
                <div className="stat-header">
                  <div className="stat-icon">
                    <Icon />
                  </div>
                  {stat.changePercent !== 0 && (
                    <div className={`stat-change ${isPositive ? 'positive' : 'negative'}`}>
                      {isPositive ? <FiArrowUpRight size={12} /> : <FiArrowDownRight size={12} />}
                      {Math.abs(stat.changePercent).toFixed(1)}%
                    </div>
                  )}
                </div>
                <div className="stat-content">
                  <h3 className="stat-value">
                    {typeof stat.value === 'number' && stat.value > 1000 ? (
                      <CountUp
                        end={stat.value}
                        duration={2}
                        separator=","
                        prefix={stat.title.includes('Value') || stat.title.includes('Cash') || stat.title.includes('Invested') ? '₹' : ''}
                      />
                    ) : (
                      stat.value
                    )}
                  </h3>
                  <p className="stat-title">{stat.title}</p>
                </div>
              </motion.div>
            );
          })}
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
          updatePortfolioValues();
        }}
      />
    </div>
  );
});

Dashboard.displayName = 'Dashboard';

// Daily Reward Button Component
const DailyRewardButton = ({ onClaim, rewardsInfo }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleClaim = async () => {
    if (rewardsInfo.alreadyClaimedToday || isLoading) return;

    setIsLoading(true);
    try {
      await onClaim();
    } finally {
      setIsLoading(false);
    }
  };

  const formatTimeRemaining = (timeInfo) => {
    if (!timeInfo) return '';
    const { hours, minutes } = timeInfo;
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  if (rewardsInfo.alreadyClaimedToday) {
    return (
      <button
        className="btn-premium btn-secondary"
        disabled
        title={`Next reward available in ${formatTimeRemaining(rewardsInfo.timeUntilNextReward)}`}
      >
        <FiClock size={16} />
        Claimed Today
      </button>
    );
  }

  return (
    <button
      className={`btn-premium btn-primary ${isLoading ? 'loading' : ''}`}
      onClick={handleClaim}
      disabled={isLoading}
    >
      <FiGift size={16} />
      {isLoading ? 'Claiming...' : 'Claim Daily Reward'}
    </button>
  );
};

export default Dashboard;
