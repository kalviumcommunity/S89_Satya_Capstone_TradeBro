import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiTrendingUp, FiTrendingDown, FiDollarSign, FiBarChart2,
  FiCreditCard, FiGift, FiRefreshCw, FiInfo, FiAlertCircle,
  FiSearch, FiX, FiStar, FiPlus, FiClock, FiTrash2, FiEye,
  FiShoppingCart
} from "react-icons/fi";
import axios from "axios";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";
import { useVirtualMoney } from "../context/VirtualMoneyContext";
import { safeApiCall, createDummyData } from "../utils/apiUtils";

import API_ENDPOINTS from "../config/apiConfig";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { showSuccessToast } from "../redux/reducers/toastReducer";
import PageLayout from "../components/PageLayout";
import Loading from "../components/common/Loading";
import StockSearch from "../components/StockSearch";
import "../styles/pages/Dashboard.css";

const Dashboard = () => {
  const { isAuthenticated, login } = useAuth();
  const { success, error, info } = useToast();
  const { virtualMoney, loading: virtualMoneyLoading, fetchVirtualMoney } = useVirtualMoney();
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Handle stock selection for chart view (redirect to charts page)
  const handleStockSelect = (symbol) => {
    navigate(`/charts?symbol=${symbol}`);
  };
  const [marketData, setMarketData] = useState({
    indices: [],
    marketStatus: "open"
  });

  // Enhanced state for market movers with advanced functionality
  const [marketMovers, setMarketMovers] = useState({
    gainers: [],
    losers: [],
    loading: false,
    activeTab: 'gainers',
    sortBy: 'percentage',
    lastUpdated: null,
    autoRefresh: true,
    refreshInterval: null,
    animationKey: 0
  });
  const [showRewardAnimation, setShowRewardAnimation] = useState(false);
  const [portfolioSummary, setPortfolioSummary] = useState({
    totalInvestment: 0,
    totalValue: 0,
    profitLoss: 0,
    profitLossPercentage: 0
  });

  // Handle Google OAuth callback with token in URL
  useEffect(() => {
    // Check for token in URL (from Google OAuth callback)
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const successParam = urlParams.get('success');
    const google = urlParams.get('google');

    if (token && successParam === 'true' && google === 'true') {
      console.log('Google OAuth token found in URL');

      // Remove token from URL to prevent issues on refresh
      window.history.replaceState({}, document.title, '/dashboard');

      // Show success message
      success('Successfully logged in with Google!');

      // Store token in localStorage first to ensure it's available
      localStorage.setItem('authToken', token);

      // Process the token using Redux
      dispatch(reduxLogin(token));
      dispatch(showSuccessToast("Google login successful!"));

      // Also use the AuthContext login with force flag
      login(token, null, true);

      // Force authentication state update
      setTimeout(() => {
        if (!isAuthenticated) {
          console.log('Forcing authentication state update after Google login');
          login(token, null, true);
        }
      }, 1000);

      // Fetch user data
      const fetchUserData = async () => {
        try {
          const response = await axios.get(API_ENDPOINTS.AUTH.USER, {
            headers: { Authorization: `Bearer ${token}` }
          });

          if (response.data && response.data.user) {
            console.log('User data fetched successfully:', response.data.user);
            // Update login with user data
            login(token, response.data.user, true);
          }
        } catch (error) {
          console.error('Error fetching user data after Google login:', error);
        }
      };

      fetchUserData();

      // Refresh virtual money data
      setTimeout(() => {
        fetchVirtualMoney();
      }, 500);
    }
  }, [dispatch, login, success, fetchVirtualMoney]);

  // Fetch market data
  useEffect(() => {
    const fetchMarketData = async () => {
      try {
        setLoading(true);

        // Fetch only market indices
        const indicesResponse = await axios.get(API_ENDPOINTS.PROXY.MARKET_INDICES);

        setMarketData({
          indices: indicesResponse.data.slice(0, 5),
          marketStatus: "open" // This would come from an API in a real app
        });

        setLoading(false);
      } catch (error) {
        console.error("Error fetching market data:", error);
        error("Failed to fetch market data. Using mock data instead.");

        // Use mock data as fallback with Indian indices
        setMarketData({
          indices: [
            { symbol: "^NSEI", name: "NIFTY 50", price: 19850.25, changesPercentage: 0.85 },
            { symbol: "^BSESN", name: "BSE SENSEX", price: 66750.40, changesPercentage: 0.72 },
            { symbol: "^NSEBANK", name: "NIFTY BANK", price: 45280.60, changesPercentage: 1.15 },
            { symbol: "^NSEIT", name: "NIFTY IT", price: 28450.30, changesPercentage: -0.45 },
            { symbol: "^INDIAVIX", name: "India VIX", price: 15.75, changesPercentage: -1.8 }
          ],
          marketStatus: "open"
        });

        setLoading(false);
      }
    };

    fetchMarketData();
  }, []);

  // Separate fetch function for market movers with enhanced functionality
  const fetchMarketMovers = async (forceRefresh = false) => {
    try {
      setMarketMovers(prev => ({ ...prev, loading: true }));

      // Fetch both gainers and losers separately for better performance
      const [gainersResponse, losersResponse] = await Promise.all([
        axios.get(API_ENDPOINTS.PROXY.TOP_GAINERS),
        axios.get(API_ENDPOINTS.PROXY.TOP_LOSERS)
      ]);

      // Enhanced data structure with additional metrics and safe defaults
      const enhancedGainers = gainersResponse.data.slice(0, 10).map((stock, index) => ({
        ...stock,
        rank: index + 1,
        price: stock.price || 0,
        changesPercentage: stock.changesPercentage || 0,
        volume: stock.volume || Math.floor(Math.random() * 10000000) + 1000000,
        marketCap: stock.marketCap || Math.floor(Math.random() * 100000000000) + 10000000000,
        dayHigh: stock.dayHigh || stock.price || 0,
        dayLow: stock.dayLow || stock.price || 0,
        sector: stock.sector || 'Technology',
        pe: stock.pe || 'N/A'
      }));

      const enhancedLosers = losersResponse.data.slice(0, 10).map((stock, index) => ({
        ...stock,
        rank: index + 1,
        price: stock.price || 0,
        changesPercentage: stock.changesPercentage || 0,
        volume: stock.volume || Math.floor(Math.random() * 10000000) + 1000000,
        marketCap: stock.marketCap || Math.floor(Math.random() * 100000000000) + 10000000000,
        dayHigh: stock.dayHigh || stock.price || 0,
        dayLow: stock.dayLow || stock.price || 0,
        sector: stock.sector || 'Technology',
        pe: stock.pe || 'N/A'
      }));

      setMarketMovers(prev => ({
        ...prev,
        gainers: enhancedGainers,
        losers: enhancedLosers,
        loading: false,
        lastUpdated: new Date(),
        animationKey: prev.animationKey + 1
      }));

    } catch (error) {
      console.error("Error fetching market movers:", error);

      // Enhanced fallback data with premium Indian stocks and detailed metrics
      const mockGainers = [
        {
          symbol: "RELIANCE.NS",
          name: "Reliance Industries Ltd.",
          price: 2485.75,
          changesPercentage: 4.2,
          rank: 1,
          volume: 12500000,
          marketCap: 1680000000000,
          dayHigh: 2520.30,
          dayLow: 2445.60,
          sector: "Energy",
          pe: 28.5,
          trend: "bullish",
          exchange: "NSE",
          currency: "INR"
        },
        {
          symbol: "TCS.NS",
          name: "Tata Consultancy Services",
          price: 3650.40,
          changesPercentage: 3.8,
          rank: 2,
          volume: 8200000,
          marketCap: 1320000000000,
          dayHigh: 3685.20,
          dayLow: 3598.75,
          sector: "IT Services",
          pe: 26.8,
          trend: "bullish",
          exchange: "NSE",
          currency: "INR"
        },
        {
          symbol: "500325",
          name: "Reliance Industries Ltd.",
          price: 2485.75,
          changesPercentage: 3.1,
          rank: 3,
          volume: 15600000,
          marketCap: 1680000000000,
          dayHigh: 2520.30,
          dayLow: 2445.60,
          sector: "Energy",
          pe: 28.5,
          trend: "bullish",
          exchange: "BSE",
          currency: "INR"
        }
      ];

      const mockLosers = [
        {
          symbol: "BHARTIARTL.NS",
          name: "Bharti Airtel Limited",
          price: 865.25,
          changesPercentage: -3.4,
          rank: 1,
          volume: 14500000,
          marketCap: 520000000000,
          dayHigh: 895.60,
          dayLow: 862.30,
          sector: "Telecom",
          pe: 22.1,
          trend: "bearish",
          exchange: "NSE",
          currency: "INR"
        },
        {
          symbol: "ITC.NS",
          name: "ITC Limited",
          price: 412.80,
          changesPercentage: -2.9,
          rank: 2,
          volume: 22000000,
          marketCap: 510000000000,
          dayHigh: 425.40,
          dayLow: 410.15,
          sector: "FMCG",
          pe: 24.7,
          trend: "bearish",
          exchange: "NSE",
          currency: "INR"
        },
        {
          symbol: "532174",
          name: "ICICI Bank Ltd",
          price: 598.45,
          changesPercentage: -2.6,
          rank: 3,
          volume: 28500000,
          marketCap: 530000000000,
          dayHigh: 615.80,
          dayLow: 595.20,
          sector: "Banking",
          pe: 12.4,
          trend: "bearish",
          exchange: "BSE",
          currency: "INR"
        }
      ];

      setMarketMovers(prev => ({
        ...prev,
        gainers: mockGainers,
        losers: mockLosers,
        loading: false,
        lastUpdated: new Date(),
        animationKey: prev.animationKey + 1
      }));
    }
  };

  // Initial fetch of market movers
  useEffect(() => {
    fetchMarketMovers();
  }, []);

  // Auto-refresh functionality
  useEffect(() => {
    if (marketMovers.autoRefresh) {
      const interval = setInterval(() => {
        fetchMarketMovers(true);
      }, 15000); // Refresh every 15 seconds for real-time updates

      setMarketMovers(prev => ({ ...prev, refreshInterval: interval }));

      return () => {
        if (interval) clearInterval(interval);
      };
    } else {
      if (marketMovers.refreshInterval) {
        clearInterval(marketMovers.refreshInterval);
        setMarketMovers(prev => ({ ...prev, refreshInterval: null }));
      }
    }
  }, [marketMovers.autoRefresh]);

  // Enhanced market movers control functions
  const handleTabChange = (tab) => {
    setMarketMovers(prev => ({
      ...prev,
      activeTab: tab,
      animationKey: prev.animationKey + 1
    }));
  };

  const handleSortChange = (sortBy) => {
    setMarketMovers(prev => ({
      ...prev,
      sortBy,
      animationKey: prev.animationKey + 1
    }));
  };

  const handleRefreshMovers = () => {
    fetchMarketMovers(true);
    success("Market movers refreshed!");
  };

  const toggleAutoRefresh = () => {
    setMarketMovers(prev => ({
      ...prev,
      autoRefresh: !prev.autoRefresh
    }));

    if (!marketMovers.autoRefresh) {
      success("Auto-refresh enabled!");
    } else {
      info("Auto-refresh disabled");
    }
  };

  // Sort market movers based on selected criteria
  const getSortedMovers = (movers, sortBy) => {
    const sorted = [...movers];
    switch (sortBy) {
      case 'percentage':
        return sorted.sort((a, b) => Math.abs(b.changesPercentage) - Math.abs(a.changesPercentage));
      case 'price':
        return sorted.sort((a, b) => b.price - a.price);
      case 'volume':
        return sorted.sort((a, b) => b.volume - a.volume);
      default:
        return sorted;
    }
  };

  // Update portfolio summary when virtual money data changes
  useEffect(() => {
    if (virtualMoney && virtualMoney.portfolio && virtualMoney.portfolio.length > 0) {
      updatePortfolioSummary(virtualMoney.portfolio);
    } else {
      setPortfolioSummary({
        totalInvestment: 0,
        totalValue: 0,
        profitLoss: 0,
        profitLossPercentage: 0
      });
    }
  }, [virtualMoney]);

  // Update portfolio summary
  const updatePortfolioSummary = async (portfolioData) => {
    try {
      // Get symbols from portfolio
      const symbols = portfolioData.map(item => item.stockSymbol).join(',');

      if (!symbols) {
        setPortfolioSummary({
          totalInvestment: 0,
          totalValue: 0,
          profitLoss: 0,
          profitLossPercentage: 0
        });
        return;
      }

      // Fetch current prices for all stocks in portfolio using our proxy
      const response = await axios.get(
        API_ENDPOINTS.PROXY.STOCK_BATCH(symbols)
      );

      if (response.data && response.data.length > 0) {
        let totalInvestment = 0;
        let totalValue = 0;

        portfolioData.forEach(item => {
          const stockData = response.data.find(stock => stock.symbol === item.stockSymbol);
          const currentPrice = stockData?.price || item.averageBuyPrice;

          totalInvestment += item.quantity * item.averageBuyPrice;
          totalValue += item.quantity * currentPrice;
        });

        const profitLoss = totalValue - totalInvestment;
        const profitLossPercentage = totalInvestment > 0
          ? (profitLoss / totalInvestment) * 100
          : 0;

        setPortfolioSummary({
          totalInvestment,
          totalValue,
          profitLoss,
          profitLossPercentage
        });
      }
    } catch (error) {
      console.error("Error updating portfolio summary:", error);

      // Calculate using the buy prices as fallback
      if (portfolioData && portfolioData.length > 0) {
        let totalInvestment = 0;

        portfolioData.forEach(item => {
          totalInvestment += item.quantity * item.averageBuyPrice;
        });

        setPortfolioSummary({
          totalInvestment,
          totalValue: totalInvestment, // Assume no change as fallback
          profitLoss: 0,
          profitLossPercentage: 0
        });
      }
    }
  };

  // No need for an interval to refresh virtual money data
  // The VirtualMoneyContext already handles periodic refreshes

  // No automatic refresh of market data

  // State for reward status
  const [rewardStatus, setRewardStatus] = useState({
    canClaim: false,
    message: "Checking reward status...",
    timeRemaining: null
  });

  // Function to check reward status
  const checkRewardStatus = async () => {
    try {
      // Create fallback data for reward status
      const fallbackData = () => {
        // Fallback to local check
        const now = new Date().getTime();
        const lastReward = virtualMoney.lastLoginReward ? new Date(virtualMoney.lastLoginReward).getTime() : 0;
        const hoursSinceLastReward = (now - lastReward) / (1000 * 60 * 60);

        if (hoursSinceLastReward >= 24 || !virtualMoney.lastLoginReward) {
          return {
            success: true,
            canClaim: true,
            message: "You can claim your daily reward!",
            timeRemaining: null
          };
        } else {
          const minutesRemaining = Math.ceil((24 - hoursSinceLastReward) * 60);
          const hoursRemaining = Math.floor(minutesRemaining / 60);
          const mins = minutesRemaining % 60;

          return {
            success: true,
            canClaim: false,
            message: `You can claim your next reward in ${hoursRemaining}h ${mins}m`,
            timeRemaining: {
              hours: hoursRemaining,
              minutes: mins,
              totalMinutes: minutesRemaining
            }
          };
        }
      };

      // Use safe API call with fallback data
      // Use the public endpoint for non-authenticated users, otherwise use the authenticated endpoint
      const endpoint = isAuthenticated
        ? API_ENDPOINTS.VIRTUAL_MONEY.REWARD_STATUS
        : API_ENDPOINTS.VIRTUAL_MONEY.REWARD_STATUS_PUBLIC;

      const result = await safeApiCall({
        method: 'get',
        url: endpoint,
        fallbackData,
        timeout: 3000
      });

      console.log('Reward status result:', result);

      if (result) {
        // Check if the result has the expected structure
        if (result.success && result.canClaim !== undefined) {
          // Direct structure from API
          console.log('Using direct structure for reward status');
          setRewardStatus({
            canClaim: result.canClaim,
            message: result.message,
            timeRemaining: result.timeRemaining
          });
        } else if (result.success && result.data && result.data.canClaim !== undefined) {
          // Nested structure from mock data
          console.log('Using nested structure for reward status');
          setRewardStatus({
            canClaim: result.data.canClaim,
            message: result.data.message,
            timeRemaining: result.data.timeRemaining
          });
        } else {
          // Unexpected structure, use fallback
          console.log('Unexpected reward status structure, using fallback');
          const fallbackStatus = fallbackData();
          setRewardStatus({
            canClaim: fallbackStatus.canClaim,
            message: fallbackStatus.message,
            timeRemaining: fallbackStatus.timeRemaining
          });
        }
      } else {
        // No result, use fallback
        console.log('No reward status result, using fallback');
        const fallbackStatus = fallbackData();
        setRewardStatus({
          canClaim: fallbackStatus.canClaim,
          message: fallbackStatus.message,
          timeRemaining: fallbackStatus.timeRemaining
        });
      }
    } catch (error) {
      console.error("Error checking reward status:", error);
    }
  };

  // Check reward status when component mounts or virtual money changes
  useEffect(() => {
    if (isAuthenticated) {
      checkRewardStatus();
    }
  }, [isAuthenticated, virtualMoney.lastLoginReward]);

  // Function to claim daily login reward
  const handleClaimDailyReward = async () => {
    if (!rewardStatus.canClaim) {
      info(rewardStatus.message);
      return false;
    }

    try {
      // Use axios to claim the reward with authentication header
      const token = localStorage.getItem('authToken');
      const response = await axios.post(API_ENDPOINTS.VIRTUAL_MONEY.CLAIM_REWARD, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data && response.data.success) {
        // Show animation and toast
        setShowRewardAnimation(true);
        setTimeout(() => {
          setShowRewardAnimation(false);
        }, 3000);

        success(`Daily reward claimed: +₹1`);

        // Refresh virtual money data
        fetchVirtualMoney(true);

        // Update reward status
        checkRewardStatus();

        // Save the claim time to localStorage
        localStorage.setItem('lastRewardClaim', new Date().getTime().toString());

        return true;
      } else {
        info(response.data?.message || "Failed to claim reward");
        return false;
      }
    } catch (error) {
      console.error("Error claiming daily reward:", error);
      error("Failed to claim daily reward");
      return false;
    }
  };

  // Handle stock selection with chart modal
  const handleStockSelectWithHistory = (symbol, stockName = "") => {
    // Create a basic stock object
    const stockData = {
      symbol,
      name: stockName || symbol
    };



    // Open chart modal
    handleStockSelect(symbol, stockName);

    // Show a toast notification to confirm selection
    success(`Loading chart for ${symbol} - ${stockData.name || 'Stock'}`);
  };

  // Handle transaction success
  const handleTransactionSuccess = () => {
    // Refresh virtual money data
    fetchVirtualMoney(true);
  };

  // Add stock to watchlist
  const addToWatchlist = async (symbol, name) => {
    if (!isAuthenticated) {
      error("Please log in to add stocks to your watchlist");
      return;
    }

    try {
      // Call API to add stock to watchlist
      const response = await axios.post(API_ENDPOINTS.WATCHLIST.ADD, {
        symbol,
        name
      });

      if (response.data.success) {
        success(`${symbol} added to watchlist`);
      } else {
        error(response.data.message || "Failed to add stock to watchlist");
      }
    } catch (err) {
      console.error("Error adding stock to watchlist:", err);
      info(`${symbol} would be added to your watchlist (server unavailable)`);
    }
  };





  return (
    <PageLayout>
      <div className="dashboard-container">
        <div className="dashboard-header">
          <motion.h1
            className="dashboard-title"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <FiBarChart2 className="title-icon" /> Market Dashboard
          </motion.h1>

          <motion.div
            className="search-container"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <StockSearch
              onStockSelect={handleStockSelect}
              onAddToWatchlist={addToWatchlist}
              placeholder="Search stocks..."
              showWatchlistButton={true}
              showChartButton={true}
              variant="default"
            />
          </motion.div>
        </div>

        {loading ? (
          <div className="loading-container">
            <Loading size="large" text="Loading market data..." />
          </div>
        ) : (
          <>
            {/* Virtual Money and Portfolio Summary */}
            <motion.div
              className="dashboard-summary"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <motion.div
                className="summary-card glass virtual-money-card"
                whileHover={{ y: -10, boxShadow: "0 15px 30px rgba(0, 0, 0, 0.1)" }}
              >
                <FiCreditCard className="card-icon" />
                <p>Virtual Money</p>
                <motion.h2
                  key={virtualMoney.balance}
                  initial={{ scale: 1 }}
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 0.5 }}
                >
                  ₹{virtualMoney.balance.toLocaleString('en-IN')}
                </motion.h2>
                <div className="reward-button-container">
                  <button
                    className={`claim-reward-btn ${!rewardStatus.canClaim ? 'claimed' : ''}`}
                    onClick={handleClaimDailyReward}
                    disabled={!rewardStatus.canClaim}
                  >
                    <FiGift /> {rewardStatus.canClaim ? 'Claim Daily Reward' : rewardStatus.message}
                  </button>
                </div>
              </motion.div>
              <motion.div
                className="summary-card glass"
                whileHover={{ y: -10, boxShadow: "0 15px 30px rgba(0, 0, 0, 0.1)" }}
              >
                <FiDollarSign className="card-icon" />
                <p>Total Investment</p>
                <h2>₹{portfolioSummary.totalInvestment.toLocaleString('en-IN', {maximumFractionDigits: 2})}</h2>
              </motion.div>
              <motion.div
                className="summary-card glass"
                whileHover={{ y: -10, boxShadow: "0 15px 30px rgba(0, 0, 0, 0.1)" }}
              >
                <FiBarChart2 className="card-icon" />
                <p>Current Value</p>
                <h2>₹{portfolioSummary.totalValue.toLocaleString('en-IN', {maximumFractionDigits: 2})}</h2>
              </motion.div>
              <motion.div
                className={`summary-card glass ${
                  portfolioSummary.profitLoss >= 0 ? "profit" : "loss"
                }`}
                whileHover={{ y: -10, boxShadow: "0 15px 30px rgba(0, 0, 0, 0.1)" }}
              >
                {portfolioSummary.profitLoss >= 0 ? (
                  <FiTrendingUp className="card-icon" />
                ) : (
                  <FiTrendingDown className="card-icon" />
                )}
                <p>Profit / Loss</p>
                <h2>₹{(portfolioSummary.profitLoss || 0).toLocaleString('en-IN', {maximumFractionDigits: 2})}</h2>
                <p className="percentage">
                  ({(Number(portfolioSummary.profitLossPercentage) || 0).toFixed(2)}%)
                </p>
              </motion.div>
            </motion.div>

            {/* Market Indices */}
            <motion.div
              className="market-section"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <h2 className="section-title">Market Indices</h2>
              <div className="indices-grid">
                {marketData.indices.map((index, idx) => (
                  <motion.div
                    key={index.symbol}
                    className="index-card glass"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * idx }}
                    whileHover={{ y: -5, boxShadow: "0 10px 20px rgba(0, 0, 0, 0.1)" }}
                  >
                    <h3>{index.name}</h3>
                    <motion.div
                      className="index-price"
                      key={index.price} // Key changes when price updates
                      animate={{ scale: [1, 1.05, 1] }} // Pulse animation
                      transition={{ duration: 0.5 }}
                    >
                      {(Number(index.price) || 0).toFixed(2)}
                    </motion.div>
                    <div className={`index-change ${(Number(index.changesPercentage) || 0) >= 0 ? "positive" : "negative"}`}>
                      {(Number(index.changesPercentage) || 0) >= 0 ? <FiTrendingUp /> : <FiTrendingDown />}
                      {(Number(index.changesPercentage) || 0).toFixed(2)}%
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* 📊 MINIMALISTIC MARKET MOVERS - DATA-FOCUSED DESIGN */}
            <motion.div
              className="market-data-section"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
            >
              {/* Clean Header */}
              <div className="data-header">
                <div className="header-left">
                  <h2 className="data-title">Market Movers</h2>
                  <div className="data-tabs">
                    <button
                      className={`data-tab ${marketMovers.activeTab === 'gainers' ? 'active' : ''}`}
                      onClick={() => handleTabChange('gainers')}
                    >
                      Gainers
                    </button>
                    <button
                      className={`data-tab ${marketMovers.activeTab === 'losers' ? 'active' : ''}`}
                      onClick={() => handleTabChange('losers')}
                    >
                      Losers
                    </button>
                  </div>
                </div>

                <div className="header-controls">
                  <button
                    className="control-btn"
                    onClick={handleRefreshMovers}
                    disabled={marketMovers.loading}
                  >
                    <FiRefreshCw />
                  </button>
                  <select
                    className="control-select"
                    value={marketMovers.sortBy}
                    onChange={(e) => handleSortChange(e.target.value)}
                  >
                    <option value="percentage">% Change</option>
                    <option value="price">Price</option>
                    <option value="volume">Volume</option>
                    <option value="marketCap">Market Cap</option>
                  </select>
                </div>
              </div>

              {/* Minimalistic Data Grid */}
              <div className="data-grid">
                {marketMovers.loading ? (
                  <div className="loading-state">
                    <div className="loading-dot"></div>
                    <span>Loading...</span>
                  </div>
                ) : (
                  getSortedMovers(
                    marketMovers.activeTab === 'gainers' ? marketMovers.gainers : marketMovers.losers,
                    marketMovers.sortBy
                  ).slice(0, 3).map((stock, idx) => (
                    <motion.div
                      key={`${marketMovers.activeTab}-${stock.symbol}-${marketMovers.animationKey}`}
                      className={`data-card ${marketMovers.activeTab}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 * idx }}
                      onClick={() => handleStockSelectWithHistory(stock.symbol, stock.name)}
                    >
                      {/* Stock Identity */}
                      <div className="stock-identity">
                        <div className="stock-rank">#{idx + 1}</div>
                        <div className="stock-info">
                          <div className="symbol">{stock.symbol}</div>
                          <div className="company">{stock.name}</div>
                          <div className="sector">{stock.sector}</div>
                        </div>
                      </div>

                      {/* Price Section */}
                      <div className="price-section">
                        <div className="current-price">₹{(Number(stock.price) || 0).toFixed(2)}</div>
                        <div className={`change ${marketMovers.activeTab}`}>
                          {marketMovers.activeTab === 'gainers' ? '+' : ''}
                          {(Number(stock.changesPercentage) || 0).toFixed(2)}%
                        </div>
                      </div>

                      {/* Data Metrics */}
                      <div className="metrics-grid">
                        <div className="metric">
                          <span className="label">Volume</span>
                          <span className="value">{((Number(stock.volume) || 0) / 1000000).toFixed(1)}M</span>
                        </div>
                        <div className="metric">
                          <span className="label">Market Cap</span>
                          <span className="value">₹{((Number(stock.marketCap) || 0) / 1000000000).toFixed(1)}B</span>
                        </div>
                        <div className="metric">
                          <span className="label">Day High</span>
                          <span className="value">₹{(Number(stock.dayHigh) || 0).toFixed(2)}</span>
                        </div>
                        <div className="metric">
                          <span className="label">Day Low</span>
                          <span className="value">₹{(Number(stock.dayLow) || 0).toFixed(2)}</span>
                        </div>
                        <div className="metric">
                          <span className="label">P/E</span>
                          <span className="value">{stock.pe || 'N/A'}</span>
                        </div>
                        <div className="metric">
                          <span className="label">52W Range</span>
                          <span className="value">
                            ₹{((Number(stock.dayLow) || 0) * 0.8).toFixed(0)} - ₹{((Number(stock.dayHigh) || 0) * 1.2).toFixed(0)}
                          </span>
                        </div>
                      </div>

                      {/* Quick Actions */}
                      <div className="quick-actions">
                        <button
                          className="action-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            addToWatchlist(stock.symbol, stock.name);
                          }}
                        >
                          <FiStar />
                        </button>
                        <button
                          className="action-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStockSelectWithHistory(stock.symbol, stock.name);
                          }}
                        >
                          <FiEye />
                        </button>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}



        {/* Reward Animation */}
        <AnimatePresence>
          {showRewardAnimation && (
            <motion.div
              className="reward-animation"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <FiGift className="reward-icon" />
              <span>+₹1</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Chart functionality moved to dedicated charts page */}
      </div>
    </PageLayout>
  );
};

export default Dashboard;
