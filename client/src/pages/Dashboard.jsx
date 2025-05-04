import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiTrendingUp, FiTrendingDown, FiDollarSign, FiBarChart2,
  FiCreditCard, FiGift, FiRefreshCw, FiInfo, FiAlertCircle,
  FiSearch, FiX, FiStar, FiPlus
} from "react-icons/fi";
import axios from "axios";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";
import { safeApiCall, createDummyData } from "../utils/apiUtils";
import PageLayout from "../components/PageLayout";
import Loading from "../components/Loading";
import StockDetail from "../components/StockDetail";
import "./Dashboard.css";

const Dashboard = () => {
  const { isAuthenticated } = useAuth();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [marketData, setMarketData] = useState({
    indices: [],
    topGainers: [],
    topLosers: [],
    marketStatus: "open"
  });
  const [virtualMoney, setVirtualMoney] = useState({
    balance: 10000,
    lastLoginReward: null,
    portfolio: []
  });
  const [showRewardAnimation, setShowRewardAnimation] = useState(false);
  const [selectedStock, setSelectedStock] = useState(null);
  const [portfolioSummary, setPortfolioSummary] = useState({
    totalInvestment: 0,
    totalValue: 0,
    profitLoss: 0,
    profitLossPercentage: 0
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [stockSymbols, setStockSymbols] = useState([]);

  // Fetch market data
  useEffect(() => {
    const fetchMarketData = async () => {
      try {
        setLoading(true);

        // Use our proxy server instead of direct API calls
        const [indicesResponse, gainersResponse, losersResponse] = await Promise.all([
          axios.get("http://localhost:5000/api/proxy/market-indices"),
          axios.get("http://localhost:5000/api/proxy/top-gainers"),
          axios.get("http://localhost:5000/api/proxy/top-losers")
        ]);

        setMarketData({
          indices: indicesResponse.data.slice(0, 5),
          topGainers: gainersResponse.data.slice(0, 5),
          topLosers: losersResponse.data.slice(0, 5),
          marketStatus: "open" // This would come from an API in a real app
        });

        setLoading(false);
      } catch (error) {
        console.error("Error fetching market data:", error);
        toast.error("Failed to fetch market data. Using mock data instead.");

        // Use mock data as fallback
        setMarketData({
          indices: [
            { symbol: "^GSPC", name: "S&P 500", price: 4500.53, changesPercentage: 0.75 },
            { symbol: "^DJI", name: "Dow Jones", price: 35000.25, changesPercentage: 0.5 },
            { symbol: "^IXIC", name: "NASDAQ", price: 14200.75, changesPercentage: 1.2 },
            { symbol: "^RUT", name: "Russell 2000", price: 2100.30, changesPercentage: -0.3 },
            { symbol: "^VIX", name: "Volatility Index", price: 18.25, changesPercentage: -2.1 }
          ],
          topGainers: [
            { symbol: "AAPL", name: "Apple Inc.", price: 178.25, changesPercentage: 3.5 },
            { symbol: "MSFT", name: "Microsoft Corp.", price: 332.80, changesPercentage: 2.8 },
            { symbol: "GOOGL", name: "Alphabet Inc.", price: 135.60, changesPercentage: 2.3 },
            { symbol: "AMZN", name: "Amazon.com Inc.", price: 145.20, changesPercentage: 1.9 },
            { symbol: "TSLA", name: "Tesla Inc.", price: 245.75, changesPercentage: 1.7 }
          ],
          topLosers: [
            { symbol: "META", name: "Meta Platforms Inc.", price: 310.50, changesPercentage: -2.1 },
            { symbol: "NFLX", name: "Netflix Inc.", price: 425.30, changesPercentage: -1.8 },
            { symbol: "NVDA", name: "NVIDIA Corp.", price: 450.20, changesPercentage: -1.5 },
            { symbol: "JPM", name: "JPMorgan Chase & Co.", price: 155.40, changesPercentage: -1.2 },
            { symbol: "BAC", name: "Bank of America Corp.", price: 35.75, changesPercentage: -0.9 }
          ],
          marketStatus: "open"
        });

        setLoading(false);
      }
    };

    fetchMarketData();
  }, []);

  // Fetch virtual money data
  const fetchVirtualMoney = async () => {
    if (!isAuthenticated) return;

    try {
      // Create fallback data function
      const fallbackData = createDummyData({
        balance: 10000,
        portfolio: [
          {
            stockSymbol: "AAPL",
            quantity: 10,
            averageBuyPrice: 150.25,
            currentPrice: 145.75,
            totalValue: 1457.50,
            profitLoss: -47.50,
            profitLossPercentage: -3.16
          },
          {
            stockSymbol: "MSFT",
            quantity: 5,
            averageBuyPrice: 250.50,
            currentPrice: 260.25,
            totalValue: 1301.25,
            profitLoss: 48.75,
            profitLossPercentage: 3.89
          }
        ],
        lastLoginReward: null
      });

      // Use safe API call with fallback data
      // Try the public endpoint first for testing
      const result = await safeApiCall({
        method: 'get',
        url: "http://localhost:5000/api/virtual-money/public",
        fallbackData,
        timeout: 3000
      });

      if (result && result.success) {
        setVirtualMoney(result.data);

        // Update portfolio summary
        if (result.data.portfolio && result.data.portfolio.length > 0) {
          updatePortfolioSummary(result.data.portfolio);
        }

        // If this is fallback data, save to localStorage for future use
        if (result.isFallbackData) {
          localStorage.setItem('virtualMoney', JSON.stringify(result.data));
        }
      }
    } catch (error) {
      console.error("Error fetching virtual money data:", error);
      toast.error("Failed to fetch virtual money data");

      // Try to use data from localStorage as a last resort
      const storedData = localStorage.getItem('virtualMoney');
      if (storedData) {
        try {
          const parsedData = JSON.parse(storedData);
          setVirtualMoney(parsedData);
          updatePortfolioSummary(parsedData.portfolio || []);
        } catch (e) {
          console.error("Error parsing stored virtual money data:", e);
        }
      }
    }
  };

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
        `http://localhost:5000/api/proxy/stock-batch?symbols=${symbols}`
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

  useEffect(() => {
    fetchVirtualMoney();

    // Set up interval to refresh data every 15 seconds for more frequent updates
    const virtualMoneyIntervalId = setInterval(() => {
      fetchVirtualMoney();
    }, 15000);

    return () => clearInterval(virtualMoneyIntervalId);
  }, [isAuthenticated]);

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
      const result = await safeApiCall({
        method: 'get',
        url: "http://localhost:5000/api/virtual-money/reward-status",
        fallbackData,
        timeout: 3000
      });

      if (result && result.success) {
        setRewardStatus({
          canClaim: result.canClaim,
          message: result.message,
          timeRemaining: result.timeRemaining
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
  const claimDailyReward = async () => {
    if (!rewardStatus.canClaim) {
      toast.info(rewardStatus.message);
      return false;
    }

    try {
      // Create fallback data for claiming reward
      const fallbackData = () => {
        // Get current virtual money data
        const storedData = localStorage.getItem('virtualMoney');
        let currentData = storedData ? JSON.parse(storedData) : { balance: 10000, portfolio: [] };

        // Update the data with reward
        const updatedData = {
          ...currentData,
          balance: (currentData.balance || 0) + 1,
          lastLoginReward: new Date().toISOString()
        };

        // Save to localStorage
        localStorage.setItem('virtualMoney', JSON.stringify(updatedData));

        return {
          success: true,
          data: {
            rewardAmount: 1
          }
        };
      };

      // Use safe API call with fallback data
      const result = await safeApiCall({
        method: 'post',
        url: "http://localhost:5000/api/virtual-money/claim-reward",
        fallbackData,
        timeout: 3000
      });

      if (result && result.success) {
        // Update virtual money state
        fetchVirtualMoney();

        // Show animation and toast
        setShowRewardAnimation(true);
        setTimeout(() => {
          setShowRewardAnimation(false);
        }, 3000);

        toast.success(`Daily reward claimed: +${result.data.rewardAmount} coin!`);

        // Update reward status
        checkRewardStatus();
        return true;
      } else {
        toast.info(result.message || "Failed to claim reward");
        return false;
      }
    } catch (error) {
      console.error("Error claiming daily reward:", error);
      toast.error("Failed to claim daily reward");
      return false;
    }
  };

  // Handle stock selection
  const handleStockSelect = (symbol) => {
    setSelectedStock(symbol);
  };

  // Handle transaction success
  const handleTransactionSuccess = () => {
    fetchVirtualMoney();
  };

  // Add stock to watchlist
  const addToWatchlist = async (symbol, name) => {
    if (!isAuthenticated) {
      toast.error("Please log in to add stocks to your watchlist");
      return;
    }

    try {
      // Call API to add stock to watchlist
      const response = await axios.post("http://localhost:5000/api/watchlist/add", {
        symbol,
        name
      });

      if (response.data.success) {
        toast.success(`${symbol} added to watchlist`);
      } else {
        toast.error(response.data.message || "Failed to add stock to watchlist");
      }
    } catch (err) {
      console.error("Error adding stock to watchlist:", err);
      toast.info(`${symbol} would be added to your watchlist (server unavailable)`);
    }
  };

  // Fetch stock symbols
  useEffect(() => {
    const fetchStockSymbols = async () => {
      // Create fallback data for stock symbols
      const fallbackData = createDummyData([
        { symbol: "RELIANCE.NS", name: "Reliance Industries", type: "stock" },
        { symbol: "TCS.NS", name: "Tata Consultancy Services", type: "stock" },
        { symbol: "HDFCBANK.NS", name: "HDFC Bank", type: "stock" },
        { symbol: "INFY.NS", name: "Infosys", type: "stock" },
        { symbol: "ICICIBANK.NS", name: "ICICI Bank", type: "stock" },
        { symbol: "HINDUNILVR.NS", name: "Hindustan Unilever", type: "stock" },
        { symbol: "SBIN.NS", name: "State Bank of India", type: "stock" },
        { symbol: "BHARTIARTL.NS", name: "Bharti Airtel", type: "stock" },
        { symbol: "KOTAKBANK.NS", name: "Kotak Mahindra Bank", type: "stock" },
        { symbol: "ITC.NS", name: "ITC Limited", type: "stock" },
        { symbol: "TATAMOTORS.NS", name: "Tata Motors", type: "stock" },
        { symbol: "MARUTI.NS", name: "Maruti Suzuki", type: "stock" },
        { symbol: "AXISBANK.NS", name: "Axis Bank", type: "stock" },
        { symbol: "SUNPHARMA.NS", name: "Sun Pharmaceutical", type: "stock" },
        { symbol: "BAJFINANCE.NS", name: "Bajaj Finance", type: "stock" },
        { symbol: "WIPRO.NS", name: "Wipro", type: "stock" },
        // Add some US stocks
        { symbol: "AAPL", name: "Apple Inc.", type: "stock" },
        { symbol: "MSFT", name: "Microsoft Corporation", type: "stock" },
        { symbol: "GOOGL", name: "Alphabet Inc.", type: "stock" },
        { symbol: "AMZN", name: "Amazon.com Inc.", type: "stock" },
        { symbol: "META", name: "Meta Platforms Inc.", type: "stock" },
        { symbol: "TSLA", name: "Tesla Inc.", type: "stock" },
        { symbol: "NVDA", name: "NVIDIA Corporation", type: "stock" },
        { symbol: "JPM", name: "JPMorgan Chase & Co.", type: "stock" }
      ]);

      try {
        // Use safe API call with fallback data
        const result = await safeApiCall({
          method: 'get',
          url: "http://localhost:5000/api/proxy/fmp/stock/list",
          fallbackData,
          timeout: 3000
        });

        if (result && result.data) {
          // Filter to get major stocks for better performance
          const majorStocks = result.data
            .filter(stock => stock.type === "stock" && !stock.symbol.includes("."))
            .slice(0, 1000); // Limit to 1000 stocks for performance
          setStockSymbols(majorStocks);
        }
      } catch (err) {
        console.error("Error fetching stock symbols:", err);
        // Use the fallback stocks
        setStockSymbols(fallbackData().data);
      }
    };

    fetchStockSymbols();
  }, []);

  // Handle search
  const handleSearch = (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query.trim() === "") {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);

    // Filter stock symbols based on search query
    const results = stockSymbols
      .filter(stock =>
        stock.symbol.toLowerCase().includes(query.toLowerCase()) ||
        stock.name.toLowerCase().includes(query.toLowerCase())
      )
      .slice(0, 5); // Limit to 5 results

    setSearchResults(results);
  };

  // Clear search
  const clearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
    setIsSearching(false);
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
            <div className="search-input-wrapper">
              <FiSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search stocks..."
                value={searchQuery}
                onChange={handleSearch}
                className="search-input"
              />
              {searchQuery && (
                <button className="clear-search" onClick={clearSearch}>
                  <FiX />
                </button>
              )}
            </div>

            {isSearching && searchResults.length > 0 && (
              <motion.div
                className="search-results"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                {searchResults.map(stock => (
                  <div
                    key={stock.symbol}
                    className="search-result-item"
                  >
                    <div
                      className="result-info"
                      onClick={() => {
                        handleStockSelect(stock.symbol);
                        clearSearch();
                      }}
                    >
                      <div className="result-symbol">{stock.symbol}</div>
                      <div className="result-name">{stock.name}</div>
                    </div>
                    <button
                      className="add-to-watchlist-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        addToWatchlist(stock.symbol, stock.name);
                      }}
                      title="Add to Watchlist"
                    >
                      <FiPlus />
                      <FiStar />
                    </button>
                  </div>
                ))}
              </motion.div>
            )}

            {isSearching && searchResults.length === 0 && (
              <motion.div
                className="search-results"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                <div className="no-results">No stocks found</div>
              </motion.div>
            )}
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
                  ${virtualMoney.balance.toLocaleString()}
                </motion.h2>
                <div className="reward-button-container">
                  <button
                    className={`claim-reward-btn ${!rewardStatus.canClaim ? 'claimed' : ''}`}
                    onClick={claimDailyReward}
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
                <h2>${portfolioSummary.totalInvestment.toLocaleString(undefined, {maximumFractionDigits: 2})}</h2>
              </motion.div>
              <motion.div
                className="summary-card glass"
                whileHover={{ y: -10, boxShadow: "0 15px 30px rgba(0, 0, 0, 0.1)" }}
              >
                <FiBarChart2 className="card-icon" />
                <p>Current Value</p>
                <h2>${portfolioSummary.totalValue.toLocaleString(undefined, {maximumFractionDigits: 2})}</h2>
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
                <h2>${portfolioSummary.profitLoss.toLocaleString(undefined, {maximumFractionDigits: 2})}</h2>
                <p className="percentage">
                  ({portfolioSummary.profitLossPercentage.toFixed(2)}%)
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
                      {index.price.toFixed(2)}
                    </motion.div>
                    <div className={`index-change ${index.changesPercentage >= 0 ? "positive" : "negative"}`}>
                      {index.changesPercentage >= 0 ? <FiTrendingUp /> : <FiTrendingDown />}
                      {index.changesPercentage.toFixed(2)}%
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Top Movers */}
            <div className="movers-container">
              {/* Top Gainers */}
              <motion.div
                className="market-section half-width"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <h2 className="section-title">Top Gainers</h2>
                <div className="movers-list">
                  {marketData.topGainers.map((stock, idx) => (
                    <motion.div
                      key={stock.symbol}
                      className="mover-card glass positive"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 * idx }}
                      whileHover={{ y: -5, boxShadow: "0 10px 20px rgba(0, 0, 0, 0.1)" }}
                    >
                      <div className="mover-header">
                        <div
                          className="mover-symbol-container"
                          onClick={() => handleStockSelect(stock.symbol)}
                        >
                          <div className="mover-symbol">
                            {stock.symbol}
                          </div>
                          <div className="mover-name">{stock.name}</div>
                        </div>
                        <button
                          className="add-to-watchlist-btn small"
                          onClick={(e) => {
                            e.stopPropagation();
                            addToWatchlist(stock.symbol, stock.name);
                          }}
                          title="Add to Watchlist"
                        >
                          <FiStar />
                        </button>
                      </div>
                      <div
                        className="mover-details"
                        onClick={() => handleStockSelect(stock.symbol)}
                      >
                        <motion.div
                          className="mover-price"
                          key={stock.price} // Key changes when price updates
                          animate={{ scale: [1, 1.05, 1] }} // Pulse animation
                          transition={{ duration: 0.5 }}
                        >
                          ${stock.price.toFixed(2)}
                        </motion.div>
                        <div className="mover-change">
                          <FiTrendingUp />
                          {stock.changesPercentage.toFixed(2)}%
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Top Losers */}
              <motion.div
                className="market-section half-width"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <h2 className="section-title">Top Losers</h2>
                <div className="movers-list">
                  {marketData.topLosers.map((stock, idx) => (
                    <motion.div
                      key={stock.symbol}
                      className="mover-card glass negative"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 * idx }}
                      whileHover={{ y: -5, boxShadow: "0 10px 20px rgba(0, 0, 0, 0.1)" }}
                    >
                      <div className="mover-header">
                        <div
                          className="mover-symbol-container"
                          onClick={() => handleStockSelect(stock.symbol)}
                        >
                          <div className="mover-symbol">
                            {stock.symbol}
                          </div>
                          <div className="mover-name">{stock.name}</div>
                        </div>
                        <button
                          className="add-to-watchlist-btn small"
                          onClick={(e) => {
                            e.stopPropagation();
                            addToWatchlist(stock.symbol, stock.name);
                          }}
                          title="Add to Watchlist"
                        >
                          <FiStar />
                        </button>
                      </div>
                      <div
                        className="mover-details"
                        onClick={() => handleStockSelect(stock.symbol)}
                      >
                        <motion.div
                          className="mover-price"
                          key={stock.price} // Key changes when price updates
                          animate={{ scale: [1, 1.05, 1] }} // Pulse animation
                          transition={{ duration: 0.5 }}
                        >
                          ${stock.price.toFixed(2)}
                        </motion.div>
                        <div className="mover-change">
                          <FiTrendingDown />
                          {stock.changesPercentage.toFixed(2)}%
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>
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
              <span>+1 coin!</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stock Detail Component */}
        {selectedStock && (
          <StockDetail
            symbol={selectedStock}
            onClose={() => setSelectedStock(null)}
            onBuySuccess={handleTransactionSuccess}
            onSellSuccess={handleTransactionSuccess}
          />
        )}
      </div>
    </PageLayout>
  );
};

export default Dashboard;
