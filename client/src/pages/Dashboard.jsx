import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiTrendingUp, FiTrendingDown, FiDollarSign, FiBarChart2,
  FiCreditCard, FiGift, FiRefreshCw, FiInfo, FiAlertCircle,
  FiSearch, FiX, FiStar, FiPlus, FiClock, FiTrash2
} from "react-icons/fi";
import axios from "axios";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";
import { useVirtualMoney } from "../context/VirtualMoneyContext";
import { safeApiCall, createDummyData } from "../utils/apiUtils";
import { addToSearchHistory, getRecentSearches, clearSearchHistory } from "../utils/searchHistoryUtils";
import API_ENDPOINTS from "../config/apiConfig";
import PageLayout from "../components/PageLayout";
import Loading from "../components/common/Loading";
import FullPageStockChart from "../components/charts/FullPageStockChart";
import "../styles/pages/Dashboard.css";

const Dashboard = () => {
  const { isAuthenticated } = useAuth();
  const toast = useToast();
  const { virtualMoney, loading: virtualMoneyLoading, fetchVirtualMoney } = useVirtualMoney();
  const [loading, setLoading] = useState(true);
  const [marketData, setMarketData] = useState({
    indices: [],
    topGainers: [],
    topLosers: [],
    marketStatus: "open"
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
  const [isLoading, setIsLoading] = useState(false);
  const [stockSymbols, setStockSymbols] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const [showRecentSearches, setShowRecentSearches] = useState(false);

  // Debounce timeout reference
  const [searchTimeout, setSearchTimeout] = useState(null);

  // Fetch market data
  useEffect(() => {
    const fetchMarketData = async () => {
      try {
        setLoading(true);

        // Use our proxy server instead of direct API calls
        const [indicesResponse, gainersResponse, losersResponse] = await Promise.all([
          axios.get(API_ENDPOINTS.PROXY.MARKET_INDICES),
          axios.get(API_ENDPOINTS.PROXY.TOP_GAINERS),
          axios.get(API_ENDPOINTS.PROXY.TOP_LOSERS)
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
      toast.info(rewardStatus.message);
      return false;
    }

    try {
      // Use axios to claim the reward
      const response = await axios.post(API_ENDPOINTS.VIRTUAL_MONEY.CLAIM_REWARD);

      if (response.data && response.data.success) {
        // Show animation and toast
        setShowRewardAnimation(true);
        setTimeout(() => {
          setShowRewardAnimation(false);
        }, 3000);

        toast.success(`Daily reward claimed: +₹1`);

        // Refresh virtual money data
        fetchVirtualMoney(true);

        // Update reward status
        checkRewardStatus();

        // Save the claim time to localStorage
        localStorage.setItem('lastRewardClaim', new Date().getTime().toString());

        return true;
      } else {
        toast.info(response.data?.message || "Failed to claim reward");
        return false;
      }
    } catch (error) {
      console.error("Error claiming daily reward:", error);
      toast.error("Failed to claim daily reward");
      return false;
    }
  };

  // Handle stock selection
  const handleStockSelect = (symbol, stockName = "") => {
    // Find the stock in search results or stockSymbols
    let stockData = searchResults.find(stock => stock.symbol === symbol);

    // If not found in search results, try to find in stockSymbols
    if (!stockData) {
      stockData = stockSymbols.find(stock => stock.symbol === symbol);
    }

    // If still not found, create a basic stock object
    if (!stockData) {
      stockData = {
        symbol,
        name: stockName || symbol
      };
    }

    // Add to search history
    addToSearchHistory(stockData);

    // Update recent searches
    setRecentSearches(getRecentSearches());

    // Clear search input and hide results
    setSearchQuery("");
    setIsSearching(false);
    setShowRecentSearches(false);

    // Set selected stock
    setSelectedStock(symbol);

    // Show a toast notification to confirm selection
    toast.success(`Selected ${symbol} - ${stockData.name || 'Stock'}`);
  };

  // Handle transaction success
  const handleTransactionSuccess = () => {
    // Refresh virtual money data
    fetchVirtualMoney(true);
  };

  // Add stock to watchlist
  const addToWatchlist = async (symbol, name) => {
    if (!isAuthenticated) {
      toast.error("Please log in to add stocks to your watchlist");
      return;
    }

    try {
      // Call API to add stock to watchlist
      const response = await axios.post(API_ENDPOINTS.WATCHLIST.ADD, {
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

  // Load recent searches
  useEffect(() => {
    const loadRecentSearches = () => {
      const recent = getRecentSearches();
      setRecentSearches(recent);
    };

    loadRecentSearches();
  }, []);

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
          url: API_ENDPOINTS.STOCK_SEARCH.LIST,
          fallbackData,
          timeout: 5000
        });

        if (result) {
          let stockData = [];

          // Check if the result has the expected structure
          if (result.data && Array.isArray(result.data)) {
            stockData = result.data;
          } else if (result.success && result.data && Array.isArray(result.data)) {
            stockData = result.data;
          }

          // Filter to get major stocks for better performance
          const majorStocks = stockData
            .filter(stock => stock.type === "stock")
            .slice(0, 1000); // Limit to 1000 stocks for performance

          console.log(`Loaded ${majorStocks.length} stocks for search`);
          setStockSymbols(majorStocks);
        }
      } catch (err) {
        console.error("Error fetching stock symbols:", err);
        // Use the fallback stocks
        const fallbackResult = fallbackData();
        if (fallbackResult && fallbackResult.data) {
          console.log(`Using ${fallbackResult.data.length} fallback stocks for search`);
          setStockSymbols(fallbackResult.data);
        } else {
          console.log('No fallback stock data available');
          setStockSymbols([]);
        }
      }
    };

    fetchStockSymbols();
  }, []);

  // Perform search with API or local fallback
  const performSearch = useCallback(async (query) => {
    if (query.trim() === "") {
      setSearchResults([]);
      setIsSearching(false);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    // If query is at least 2 characters, use the API
    if (query.length >= 2) {
      try {
        // Use the stock search API
        const response = await axios.get(`${API_ENDPOINTS.STOCK_SEARCH.SEARCH}?query=${query}`);

        if (response.data && response.data.success && Array.isArray(response.data.data)) {
          console.log(`Found ${response.data.data.length} stocks matching "${query}"`);
          setSearchResults(response.data.data.slice(0, 5)); // Limit to 5 results
          setIsLoading(false);
          return;
        }
      } catch (error) {
        console.error("Error searching for stocks:", error);
        // Fall back to local search if API fails
      }
    }

    // Fallback to local filtering if API fails or query is too short
    const results = stockSymbols
      .filter(stock =>
        stock.symbol.toLowerCase().includes(query.toLowerCase()) ||
        stock.name.toLowerCase().includes(query.toLowerCase())
      )
      .slice(0, 5); // Limit to 5 results

    console.log(`Found ${results.length} stocks matching "${query}" (local search)`);
    setSearchResults(results);
    setIsLoading(false);
  }, [stockSymbols]);

  // Handle search with debounce
  const handleSearch = (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query.trim() === "") {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);

    // Clear any existing timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    // Set a new timeout to debounce the search
    const timeoutId = setTimeout(() => {
      performSearch(query);
    }, 300); // 300ms debounce

    setSearchTimeout(timeoutId);
  };

  // Clear search
  const clearSearch = () => {
    setSearchQuery("");
    // Don't clear search results, just hide them
    setIsSearching(false);
    setShowRecentSearches(false);
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
                onFocus={() => {
                  setIsSearching(true);
                  if (searchResults.length > 0) {
                    // Show existing search results if available
                  } else if (!searchQuery) {
                    setShowRecentSearches(true);
                  }
                }}
              />
              {searchQuery && (
                <button className="clear-search" onClick={clearSearch}>
                  <FiX />
                </button>
              )}
            </div>

            {isSearching && (
              <motion.div
                className="search-results"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                {isLoading ? (
                  <div className="search-loading">
                    <div className="search-loading-spinner"></div>
                    <div>Searching...</div>
                  </div>
                ) : searchResults.length > 0 ? (
                  <>
                    <div className="search-results-header">
                      <span>Search Results</span>
                      <button
                        className="clear-search-btn"
                        onClick={() => setIsSearching(false)}
                        title="Close Results"
                      >
                        <FiX />
                      </button>
                    </div>
                    {searchResults.map(stock => (
                      <div
                        key={stock.symbol}
                        className="search-result-item"
                      >
                        <div
                          className="result-info"
                          onClick={() => {
                            handleStockSelect(stock.symbol, stock.name);
                            clearSearch();
                          }}
                        >
                          <div className="result-symbol">{stock.symbol}</div>
                          <div className="result-name">{stock.name}</div>
                          <div className="result-details">
                            {stock.exchange && (
                              <span className="result-exchange">{stock.exchange}</span>
                            )}
                            {stock.country && (
                              <span className="result-country">{stock.country}</span>
                            )}
                            {stock.currency && (
                              <span className="result-currency">{stock.currency}</span>
                            )}
                          </div>
                        </div>
                        <div className="result-actions">
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
                      </div>
                    ))}
                  </>
                ) : searchQuery.length > 0 ? (
                  <>
                    <div className="search-results-header">
                      <span>Search Results</span>
                      <button
                        className="clear-search-btn"
                        onClick={() => setIsSearching(false)}
                        title="Close Results"
                      >
                        <FiX />
                      </button>
                    </div>
                    <div className="no-results">
                      <FiAlertCircle className="no-results-icon" />
                      <p>No stocks found matching "{searchQuery}"</p>
                    </div>
                  </>
                ) : showRecentSearches && recentSearches.length > 0 ? (
                  <>
                    <div className="search-results-header">
                      <span>Recent Searches</span>
                      <div className="header-buttons">
                        <button
                          className="clear-history-btn"
                          onClick={() => {
                            clearSearchHistory();
                            setRecentSearches([]);
                            setShowRecentSearches(false);
                          }}
                          title="Clear History"
                        >
                          <FiTrash2 />
                        </button>
                        <button
                          className="clear-search-btn"
                          onClick={() => setIsSearching(false)}
                          title="Close Results"
                        >
                          <FiX />
                        </button>
                      </div>
                    </div>
                    {recentSearches.map(stock => (
                      <div
                        key={stock.symbol}
                        className="search-result-item recent-search-item"
                      >
                        <div
                          className="result-info"
                          onClick={() => {
                            handleStockSelect(stock.symbol, stock.name);
                            clearSearch();
                          }}
                        >
                          <div className="result-symbol">{stock.symbol}</div>
                          <div className="result-name">{stock.name}</div>
                          <div className="result-details">
                            <span className="result-timestamp">
                              <FiClock size={12} />
                              {new Date(stock.lastSearched).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className="result-actions">
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
                      </div>
                    ))}
                  </>
                ) : (
                  <div className="no-results">Type to search for stocks</div>
                )}
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
                <h2>₹{portfolioSummary.profitLoss.toLocaleString('en-IN', {maximumFractionDigits: 2})}</h2>
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
                          ₹{stock.price.toFixed(2)}
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
                          ₹{stock.price.toFixed(2)}
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
              <span>+₹1</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stock Detail Component */}
        {selectedStock && (
          <FullPageStockChart
            symbol={selectedStock}
            onClose={() => setSelectedStock(null)}
            onTransactionSuccess={handleTransactionSuccess}
          />
        )}
      </div>
    </PageLayout>
  );
};

export default Dashboard;
