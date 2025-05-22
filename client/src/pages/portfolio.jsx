import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiRefreshCw, FiTrendingUp, FiTrendingDown,
  FiDollarSign, FiBarChart2, FiCreditCard, FiGift,
  FiMaximize2, FiTrash2
} from "react-icons/fi";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";
import { useVirtualMoney } from "../context/VirtualMoneyContext";
import { safeApiCall, createDummyData } from "../utils/apiUtils";
import { getCachedStockSymbols, cacheStockSymbols } from "../utils/stockCache";
import PageLayout from "../components/PageLayout";
import Loading from "../components/common/Loading";
import FullScreenStockDetail from "../components/FullScreenStockDetail";
import StockSearch from "../components/StockSearch";
import axios from "axios";
import API_ENDPOINTS from "../config/apiConfig";
import "../styles/pages/portfolio.css";

// Add some additional styles for the clickable rows
const additionalStyles = `
  .stock-row {
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .stock-row:hover {
    background-color: rgba(34, 184, 176, 0.05) !important;
  }

  .view-detail-btn {
    background-color: rgba(34, 184, 176, 0.1);
    color: #22b8b0;
    border: none;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
    margin-left: 8px;
  }

  .view-detail-btn:hover {
    background-color: rgba(34, 184, 176, 0.2);
    transform: scale(1.1);
  }

  .pl-container {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    gap: 8px;
  }
`;

const mockPortfolio = [
  {
    symbol: "TCS",
    company: "Tata Consultancy Services",
    quantity: 10,
    buyPrice: 3300,
    currentPrice: 3450,
  },
  {
    symbol: "INFY",
    company: "Infosys Ltd",
    quantity: 15,
    buyPrice: 1400,
    currentPrice: 1350,
  },
];

const PortfolioPage = () => {
  const toast = useToast();
  const { isAuthenticated, user } = useAuth();
  const { virtualMoney, fetchVirtualMoney, updateVirtualMoney } = useVirtualMoney();
  const [portfolio, setPortfolio] = useState(mockPortfolio);
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showRewardAnimation, setShowRewardAnimation] = useState(false);
  const [newStock, setNewStock] = useState({
    symbol: "",
    company: "",
    quantity: "",
    buyPrice: "",
    currentPrice: "",
  });
  const [errors, setErrors] = useState({});
  const [selectedStock, setSelectedStock] = useState(null);
  const [showFullScreenDetail, setShowFullScreenDetail] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [stockSymbols, setStockSymbols] = useState([]);

  // Fetch stock symbols from API
  useEffect(() => {
    const fetchStockSymbols = async () => {
      // First, try to get cached stock symbols
      const cachedSymbols = getCachedStockSymbols();

      // Set the cached symbols immediately to improve user experience
      setStockSymbols(cachedSymbols);

      // Then try to fetch fresh data in the background with a longer timeout
      try {
        // Use safe API call with cached data as fallback
        const result = await safeApiCall({
          method: 'get',
          url: API_ENDPOINTS.PROXY.STOCK_LIST,
          fallbackData: () => ({ success: true, data: cachedSymbols }),
          timeout: 8000 // Increase timeout to 8 seconds
        });

        if (result && result.data && result.data.length > 0) {
          // Filter to get major stocks for better performance
          const majorStocks = result.data
            .filter(stock => stock.type === "stock")
            .slice(0, 1000); // Limit to 1000 stocks for performance

          // Update state with fresh data
          setStockSymbols(majorStocks);

          // Cache the fresh data for future use
          cacheStockSymbols(majorStocks);

          console.log('Stock symbols updated from API');
        }
      } catch (err) {
        console.error("Error fetching stock symbols:", err);
        // We're already using cached symbols, so no need to update state again
        console.log('Using cached stock symbols due to API error');
      }
    };

    fetchStockSymbols();
  }, []);

  // Handle search
  const handleSearch = React.useCallback(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const query = searchQuery.toUpperCase();
    const results = stockSymbols.filter(
      stock => stock.symbol.includes(query) || stock.name?.toUpperCase().includes(query)
    ).slice(0, 10); // Limit to 10 results

    setSearchResults(results);
  }, [searchQuery, stockSymbols]);

  useEffect(() => {
    handleSearch();
  }, [handleSearch]);

  // Handle stock selection
  const handleStockSelect = (symbol) => {
    setSelectedStock(symbol);
    setShowFullScreenDetail(true);
    setSearchQuery("");
    setSearchResults([]);
  };

  // Handle closing the full-screen detail view
  const handleCloseFullScreenDetail = () => {
    setShowFullScreenDetail(false);
    setSelectedStock(null);
  };

  // Handle transaction success
  const handleTransactionSuccess = () => {
    // Show loading indicator
    setIsLoading(true);

    // Fetch updated portfolio data
    fetchVirtualMoneyData();

    // Show success toast
    toast.success("Portfolio updated successfully!");

    // Hide loading after a short delay
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  };

  // Update portfolio with current prices
  const updatePortfolioWithCurrentPrices = React.useCallback(async (portfolioData) => {
    try {
      // Check if the portfolio data already has currentPrice (from server)
      const hasCurrentPrices = portfolioData.some(item => item.currentPrice !== undefined);

      if (hasCurrentPrices) {
        // Use the server-provided prices and profit/loss calculations
        const updatedPortfolio = portfolioData.map(item => ({
          symbol: item.stockSymbol,
          company: item.stockSymbol, // Will be updated with real name if available
          quantity: item.quantity,
          buyPrice: item.averageBuyPrice,
          currentPrice: item.currentPrice,
          change: item.profitLoss / item.quantity, // Per-share change
          changePercent: item.profitLossPercentage,
          totalValue: item.totalValue,
          profitLoss: item.profitLoss
        }));

        setPortfolio(updatedPortfolio);
        return;
      }

      // Get symbols from portfolio
      const symbols = portfolioData.map(item => item.stockSymbol).join(',');

      if (!symbols) {
        setPortfolio([]);
        return;
      }

      // Create fallback data for stock prices
      const fallbackData = createDummyData(() => {
        // Use fallback with just the buy prices if API fails
        if (portfolioData && portfolioData.length > 0) {
          const mockStockData = portfolioData.map(item => {
            // Generate a random price fluctuation that favors losses (more realistic)
            // 60% chance of loss, 40% chance of gain
            const lossChance = Math.random() < 0.6;
            let randomFactor;

            if (lossChance) {
              // Loss: 0.85 to 0.98 (2-15% loss)
              randomFactor = 0.85 + (Math.random() * 0.13);
            } else {
              // Gain: 1.01 to 1.08 (1-8% gain)
              randomFactor = 1.01 + (Math.random() * 0.07);
            }

            const mockPrice = item.averageBuyPrice * randomFactor;

            return {
              symbol: item.stockSymbol,
              name: item.stockSymbol,
              price: mockPrice,
              change: mockPrice - item.averageBuyPrice,
              changePercent: ((mockPrice - item.averageBuyPrice) / item.averageBuyPrice) * 100
            };
          });

          return mockStockData;
        }
        return [];
      });

      // Get auth token from localStorage
      const token = localStorage.getItem('authToken');

      // Set headers with auth token if available
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      // Get user ID for personalized data if authenticated
      const userId = user?.id || localStorage.getItem('userId') || token;

      // Use safe API call with fallback data
      const result = await safeApiCall({
        method: 'get',
        url: userId
          ? `${API_ENDPOINTS.PROXY.STOCK_BATCH(symbols)}&userId=${userId}`
          : API_ENDPOINTS.PROXY.STOCK_BATCH(symbols),
        headers,
        fallbackData,
        timeout: 5000 // Increase timeout to 5 seconds
      });

      if (result && result.data && result.data.length > 0) {
        // Map portfolio data with current prices
        const updatedPortfolio = portfolioData.map(item => {
          const stockData = result.data.find(stock => stock.symbol === item.stockSymbol);

          // Calculate profit/loss
          const currentPrice = stockData?.price || item.averageBuyPrice;
          const totalValue = currentPrice * item.quantity;
          const investedValue = item.averageBuyPrice * item.quantity;
          const profitLoss = totalValue - investedValue;
          const profitLossPercentage = (profitLoss / investedValue) * 100;

          return {
            symbol: item.stockSymbol,
            company: stockData?.name || item.stockSymbol,
            quantity: item.quantity,
            buyPrice: item.averageBuyPrice,
            currentPrice: currentPrice,
            change: stockData ? (stockData.price - item.averageBuyPrice) : 0,
            changePercent: stockData ? ((stockData.price - item.averageBuyPrice) / item.averageBuyPrice * 100) : 0,
            totalValue: parseFloat(totalValue.toFixed(2)),
            profitLoss: parseFloat(profitLoss.toFixed(2)),
            profitLossPercentage: parseFloat(profitLossPercentage.toFixed(2))
          };
        });

        setPortfolio(updatedPortfolio);
      } else {
        // Use fallback with just the buy prices if no data, but with some losses
        const fallbackPortfolio = portfolioData.map(item => {
          // Generate a random price fluctuation that favors losses (more realistic)
          // 60% chance of loss, 40% chance of gain
          const lossChance = Math.random() < 0.6;
          let randomFactor;

          if (lossChance) {
            // Loss: 0.85 to 0.98 (2-15% loss)
            randomFactor = 0.85 + (Math.random() * 0.13);
          } else {
            // Gain: 1.01 to 1.08 (1-8% gain)
            randomFactor = 1.01 + (Math.random() * 0.07);
          }

          const currentPrice = item.averageBuyPrice * randomFactor;
          const totalValue = currentPrice * item.quantity;
          const investedValue = item.averageBuyPrice * item.quantity;
          const profitLoss = totalValue - investedValue;
          const profitLossPercentage = (profitLoss / investedValue) * 100;

          return {
            symbol: item.stockSymbol,
            company: item.stockSymbol, // Use symbol as company name fallback
            quantity: item.quantity,
            buyPrice: item.averageBuyPrice,
            currentPrice: currentPrice,
            change: currentPrice - item.averageBuyPrice,
            changePercent: ((currentPrice - item.averageBuyPrice) / item.averageBuyPrice * 100),
            totalValue: parseFloat(totalValue.toFixed(2)),
            profitLoss: parseFloat(profitLoss.toFixed(2)),
            profitLossPercentage: parseFloat(profitLossPercentage.toFixed(2))
          };
        });

        setPortfolio(fallbackPortfolio);
      }
    } catch (error) {
      console.error("Error updating portfolio with current prices:", error);

      // Use fallback with just the buy prices if API fails, but with some losses
      if (portfolioData && portfolioData.length > 0) {
        const fallbackPortfolio = portfolioData.map(item => {
          // Generate a random price fluctuation that favors losses (more realistic)
          // 60% chance of loss, 40% chance of gain
          const lossChance = Math.random() < 0.6;
          let randomFactor;

          if (lossChance) {
            // Loss: 0.85 to 0.98 (2-15% loss)
            randomFactor = 0.85 + (Math.random() * 0.13);
          } else {
            // Gain: 1.01 to 1.08 (1-8% gain)
            randomFactor = 1.01 + (Math.random() * 0.07);
          }

          const currentPrice = item.averageBuyPrice * randomFactor;
          const totalValue = currentPrice * item.quantity;
          const investedValue = item.averageBuyPrice * item.quantity;
          const profitLoss = totalValue - investedValue;
          const profitLossPercentage = (profitLoss / investedValue) * 100;

          return {
            symbol: item.stockSymbol,
            company: item.stockSymbol, // Use symbol as company name fallback
            quantity: item.quantity,
            buyPrice: item.averageBuyPrice,
            currentPrice: currentPrice,
            change: currentPrice - item.averageBuyPrice,
            changePercent: ((currentPrice - item.averageBuyPrice) / item.averageBuyPrice * 100),
            totalValue: parseFloat(totalValue.toFixed(2)),
            profitLoss: parseFloat(profitLoss.toFixed(2)),
            profitLossPercentage: parseFloat(profitLossPercentage.toFixed(2))
          };
        });

        setPortfolio(fallbackPortfolio);
      }
    }
  }, [user, safeApiCall]);

  // Fetch virtual money data using context
  const fetchVirtualMoneyData = React.useCallback(() => {
    if (!isAuthenticated) return Promise.resolve();

    // Use the fetchVirtualMoney function from context
    // Wrap in a Promise to ensure we can use .then() and .catch()
    return Promise.resolve(fetchVirtualMoney(true)); // Force refresh
  }, [isAuthenticated, fetchVirtualMoney]);

  // Update portfolio when virtual money changes
  React.useEffect(() => {
    if (virtualMoney.portfolio && virtualMoney.portfolio.length > 0) {
      updatePortfolioWithCurrentPrices(virtualMoney.portfolio);
    } else {
      setPortfolio([]);
    }
  }, [updatePortfolioWithCurrentPrices, virtualMoney]);

  // Handle Google OAuth callback with token in URL
  const { login } = useAuth();

  useEffect(() => {
    // Check for token in URL (from Google OAuth callback)
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const success = urlParams.get('success');

    if (token && success === 'true') {
      console.log('Google OAuth token found in URL');

      // Remove token from URL to prevent issues on refresh
      window.history.replaceState({}, document.title, '/portfolio');

      // Show success message
      toast.success('Successfully logged in with Google!');

      // Fetch user data
      const fetchUserData = async () => {
        try {
          const response = await axios.get(API_ENDPOINTS.AUTH.USER, {
            headers: { Authorization: `Bearer ${token}` }
          });

          if (response.data && response.data.user) {
            console.log('User data fetched successfully:', response.data.user);

            // Call login function with token and user data
            login(token, response.data.user, true);

            // Force a refresh of virtual money data
            setTimeout(() => {
              fetchVirtualMoney();
            }, 500);
          } else {
            console.warn('User data response is empty or invalid');
            // Even if we can't fetch user data, still call login with the token
            login(token, null, true);
          }
        } catch (error) {
          console.error('Error fetching user data after Google login:', error);

          // Create a basic user object from the token
          try {
            // Decode the JWT token to get basic user info
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
              return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));

            const payload = JSON.parse(jsonPayload);
            console.log('Decoded token payload:', payload);

            // Create a basic user object from the token payload
            const basicUserData = {
              id: payload.id,
              email: payload.email,
              username: payload.username || payload.email.split('@')[0],
              fullName: payload.fullName || payload.username || payload.email.split('@')[0]
            };

            // Call login with the basic user data
            login(token, basicUserData, true);
          } catch (decodeError) {
            console.error('Error decoding token:', decodeError);
            // If all else fails, just call login with the token
            login(token, null, true);
          }
        }
      };

      fetchUserData();
    }
  }, [login, toast, fetchVirtualMoneyData]);

  useEffect(() => {
    // Show loading indicator
    setIsLoading(true);

    // Initial fetch - don't use Promise chaining since fetchVirtualMoneyData may not return a Promise
    fetchVirtualMoneyData();

    // Hide loading indicator after a short delay
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    // Check URL parameters for transaction success
    const urlParams = new URLSearchParams(window.location.search);
    const transactionSuccess = urlParams.get('transactionSuccess');

    if (transactionSuccess === 'true') {
      // Clear URL parameters
      window.history.replaceState({}, document.title, '/portfolio');

      // Show success toast
      toast.success("Transaction completed successfully!");

      // Force refresh portfolio data
      setTimeout(() => {
        fetchVirtualMoneyData();
      }, 1000);
    }

    // Set up interval to refresh portfolio prices every 30 seconds
    // This is less frequent to prevent rendering loops
    const intervalId = setInterval(() => {
      // Only fetch if the document is visible (user is active)
      if (document.visibilityState === 'visible') {
        fetchVirtualMoneyData();
      }
    }, 30000); // 30 seconds

    // Set up visibility change listener to fetch when user returns to the app
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchVirtualMoneyData();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Clean up
    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchVirtualMoneyData, toast]);

  // Function to claim daily login reward
  const claimDailyReward = async () => {
    try {
      let rewardClaimed = false;
      let rewardAmount = 1; // Default reward amount

      // Set loading state
      setIsLoading(true);

      // Try to call the API to claim daily reward
      try {
        console.log("Attempting to claim daily reward from API");

        // Get auth token from localStorage
        const token = localStorage.getItem('authToken');

        // Set headers with auth token if available
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        // Add user info to request body if available
        const requestBody = user ? {
          userId: user.id,
          userEmail: user.email
        } : {};

        // Add a timeout to the request
        const response = await axios.post(API_ENDPOINTS.VIRTUAL_MONEY.CLAIM_REWARD, requestBody, {
          headers,
          timeout: 10000 // 10 second timeout
        });

        console.log("API response:", response.data);

        if (response.data.success) {
          rewardAmount = response.data.data.rewardAmount || 1;
          rewardClaimed = true;

          // Get personalized data from response
          const userName = response.data.data.userName || '';
          const userFullName = response.data.data.userFullName || '';
          const dayStreak = response.data.data.dayStreak || 1;

          // Update virtual money with the new balance and user info
          updateVirtualMoney({
            ...virtualMoney,
            balance: response.data.data.balance,
            lastLoginReward: new Date(),
            userName: userName,
            userFullName: userFullName,
            dayStreak: dayStreak
          });

          console.log("Successfully claimed reward from API");

          // Show personalized success message
          toast.success(response.data.message || `Daily reward claimed: +₹${rewardAmount}`);
        } else {
          // Handle unsuccessful response
          toast.error(response.data.message || "Failed to claim reward");
          setIsLoading(false);
          return false;
        }
      } catch (apiError) {
        console.error("Error claiming daily reward:", apiError);

        // Safely check if we have a response object
        if (apiError && apiError.response) {
          // Check if we got a 400 response (already claimed)
          if (apiError.response.status === 400) {
            try {
              // Show personalized message if available
              const message = apiError.response.data?.message || "You've already claimed your daily reward today";
              toast.info(message);

              // If there's time remaining info, show it
              if (apiError.response.data?.timeRemaining) {
                const { hours, minutes } = apiError.response.data.timeRemaining;
                const timeMessage = `Next reward available in ${hours}h ${minutes}m`;
                toast.info(timeMessage);
              }
            } catch (parseError) {
              // If there's an error parsing the response data
              console.error("Error parsing response data:", parseError);
              toast.info("You've already claimed your daily reward today");
            }

            setIsLoading(false);
            return false;
          } else {
            // Handle other HTTP error statuses
            toast.error(`Server error (${apiError.response.status}): ${apiError.response.data?.message || apiError.message || 'Unknown error'}`);
          }
        } else if (apiError.code === 'ECONNABORTED') {
          // Handle timeout specifically
          toast.warning("Connection to server timed out. Using local implementation.");
        } else {
          // Handle other errors (network issues, etc.)
          toast.error(`Error: ${apiError.message || 'Unknown error'}`);
        }

        // Local implementation for claiming reward
        console.log("Using local implementation for daily reward");
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (!virtualMoney.lastLoginReward || new Date(virtualMoney.lastLoginReward) < today) {
          rewardClaimed = true;
        } else {
          toast.info("You've already claimed your daily reward today");
          setIsLoading(false);
          return false;
        }
      } finally {
        setIsLoading(false);
      }

      if (rewardClaimed) {
        // Update virtual money state
        const updatedVirtualMoney = {
          ...virtualMoney,
          balance: virtualMoney.balance + rewardAmount,
          lastLoginReward: new Date()
        };

        updateVirtualMoney(updatedVirtualMoney);

        // Save to local storage for offline use
        localStorage.setItem('virtualMoney', JSON.stringify(updatedVirtualMoney));

        // Show animation and toast
        setShowRewardAnimation(true);
        setTimeout(() => {
          setShowRewardAnimation(false);
        }, 3000);

        toast.success(`Daily reward claimed: +₹${rewardAmount}`);
        return true;
      }

      return false;
    } catch (err) {
      console.error("Unexpected error claiming daily reward:", err);

      // Make sure loading state is reset
      setIsLoading(false);

      // Show a user-friendly error message
      toast.error("Something went wrong while claiming your reward. Please try again later.");

      // Log detailed error for debugging
      if (err instanceof Error) {
        console.error("Error details:", {
          name: err.name,
          message: err.message,
          stack: err.stack
        });
      } else {
        console.error("Unknown error type:", err);
      }

      return false;
    }
  };

  const totalInvestment = portfolio.reduce(
    (acc, stock) => acc + stock.buyPrice * stock.quantity,
    0
  );
  const totalValue = portfolio.reduce(
    (acc, stock) => acc + stock.currentPrice * stock.quantity,
    0
  );
  const profitLoss = totalValue - totalInvestment;

  const validateForm = () => {
    const newErrors = {};
    const { symbol, company, quantity, buyPrice, currentPrice } = newStock;

    if (!symbol) {
      newErrors.symbol = "Symbol is required";
    }

    if (!company) {
      newErrors.company = "Company name is required";
    }

    if (!quantity) {
      newErrors.quantity = "Quantity is required";
    } else if (isNaN(quantity) || parseInt(quantity) <= 0) {
      newErrors.quantity = "Quantity must be a positive number";
    }

    if (!buyPrice) {
      newErrors.buyPrice = "Buy price is required";
    } else if (isNaN(buyPrice) || parseFloat(buyPrice) <= 0) {
      newErrors.buyPrice = "Buy price must be a positive number";
    }

    if (!currentPrice) {
      newErrors.currentPrice = "Current price is required";
    } else if (isNaN(currentPrice) || parseFloat(currentPrice) <= 0) {
      newErrors.currentPrice = "Current price must be a positive number";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewStock({ ...newStock, [name]: value });

    // Clear error when user types
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: null
      });
    }
  };

  const addStock = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const { symbol, company, quantity, buyPrice, currentPrice } = newStock;

    // Calculate total cost
    const totalCost = parseInt(quantity) * parseFloat(buyPrice);

    // Check if user has enough virtual money
    if (totalCost > virtualMoney.balance) {
      toast.error(`Insufficient funds. You need ₹${totalCost.toLocaleString('en-IN')} but have ₹${virtualMoney.balance.toLocaleString('en-IN')}.`);
      return;
    }

    setIsLoading(true);

    try {
      // Call API to buy stock
      try {
        const response = await axios.post(API_ENDPOINTS.VIRTUAL_MONEY.BUY, {
          stockSymbol: symbol.toUpperCase(),
          quantity: parseInt(quantity),
          price: parseFloat(buyPrice)
        });

        if (response.data.success) {
          // Update virtual money and portfolio
          updateVirtualMoney(response.data.data);

          // Fetch updated portfolio data
          fetchVirtualMoneyData();

          toast.success(`Successfully purchased ${quantity} shares of ${symbol.toUpperCase()}`);
        }
      } catch (apiError) {
        console.log("Backend API not available, using local implementation");

        // Local implementation
        // Add stock to portfolio
        const updatedPortfolio = [
          ...portfolio,
          {
            symbol: symbol.toUpperCase(),
            company,
            quantity: parseInt(quantity),
            buyPrice: parseFloat(buyPrice),
            currentPrice: parseFloat(currentPrice),
          },
        ];
        setPortfolio(updatedPortfolio);

        // Update virtual money in local storage
        const updatedVirtualMoney = {
          ...virtualMoney,
          balance: virtualMoney.balance - totalCost,
          portfolio: [
            ...(virtualMoney.portfolio || []),
            {
              stockSymbol: symbol.toUpperCase(),
              quantity: parseInt(quantity),
              averageBuyPrice: parseFloat(buyPrice),
              lastUpdated: new Date()
            }
          ]
        };

        updateVirtualMoney(updatedVirtualMoney);
        localStorage.setItem('virtualMoney', JSON.stringify(updatedVirtualMoney));

        toast.success(`${symbol.toUpperCase()} added to portfolio! Spent ₹${totalCost.toLocaleString('en-IN')}.`);
      }

      // Reset form
      setNewStock({
        symbol: "",
        company: "",
        quantity: "",
        buyPrice: "",
        currentPrice: "",
      });

      setShowModal(false);
    } catch (err) {
      console.error("Error buying stock:", err);
      toast.error("Failed to buy stock. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const resetPortfolio = async () => {
    if (portfolio.length === 0) {
      toast.info("Portfolio is already empty");
      return;
    }

    if (confirm("Are you sure you want to reset your portfolio?")) {
      try {
        // Call API to reset portfolio
        try {
          const response = await axios.delete(API_ENDPOINTS.VIRTUAL_MONEY.PORTFOLIO);

          if (response.data.success) {
            // Update virtual money and portfolio
            fetchVirtualMoneyData();
            toast.success("Portfolio has been reset successfully");
          }
        } catch (apiError) {
          console.log("Backend API not available, using local implementation", apiError);

          // Local implementation
          const updatedVirtualMoney = {
            ...virtualMoney,
            portfolio: []
          };

          updateVirtualMoney(updatedVirtualMoney);
          setPortfolio([]);
          localStorage.setItem('virtualMoney', JSON.stringify(updatedVirtualMoney));

          toast.info("Portfolio has been reset");
        }
      } catch (err) {
        console.error("Error resetting portfolio:", err);
        toast.error("Failed to reset portfolio. Please try again.");
      }
    }
  };

  return (
    <PageLayout>
      <style>{additionalStyles}</style>
      <motion.div
        className="portfolio-container"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <motion.h1
          className="portfolio-title"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <FiBarChart2 className="title-icon" /> Portfolio Dashboard
        </motion.h1>

        <motion.div
          className="portfolio-summary"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <motion.div
            className="summary-card glass virtual-money-card"
            whileHover={{ y: -10, boxShadow: "0 15px 30px rgba(0, 0, 0, 0.1)" }}
          >
            <FiCreditCard className="card-icon" />
            <p>Virtual Money {virtualMoney.userFullName ? `- ${virtualMoney.userFullName}` : ''}</p>
            <motion.h2
              key={virtualMoney.balance}
              initial={{ scale: 1 }}
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 0.5 }}
            >
              ₹{virtualMoney.balance.toLocaleString()}
            </motion.h2>

            {virtualMoney.dayStreak > 1 && (
              <div className="day-streak">
                <span className="streak-badge">{virtualMoney.dayStreak}</span>
                <span className="streak-text">Day Streak!</span>
              </div>
            )}

            <div className="reward-button-container">
              <button
                className={`claim-reward-btn ${virtualMoney.lastLoginReward && new Date(virtualMoney.lastLoginReward).setHours(0,0,0,0) === new Date().setHours(0,0,0,0) ? 'claimed' : ''}`}
                onClick={claimDailyReward}
                disabled={virtualMoney.lastLoginReward && new Date(virtualMoney.lastLoginReward).setHours(0,0,0,0) === new Date().setHours(0,0,0,0)}
              >
                <FiGift /> {virtualMoney.lastLoginReward && new Date(virtualMoney.lastLoginReward).setHours(0,0,0,0) === new Date().setHours(0,0,0,0) ? 'Reward Claimed' : 'Claim Daily Reward'}
              </button>
            </div>
          </motion.div>
          <motion.div
            className="summary-card glass"
            whileHover={{ y: -10, boxShadow: "0 15px 30px rgba(0, 0, 0, 0.1)" }}
          >
            <FiDollarSign className="card-icon" />
            <p>Total Investment</p>
            <h2>₹{totalInvestment.toLocaleString()}</h2>
          </motion.div>
          <motion.div
            className="summary-card glass"
            whileHover={{ y: -10, boxShadow: "0 15px 30px rgba(0, 0, 0, 0.1)" }}
          >
            <FiBarChart2 className="card-icon" />
            <p>Current Value</p>
            <h2>₹{totalValue.toLocaleString()}</h2>
          </motion.div>
          <motion.div
            className={`summary-card glass ${
              profitLoss >= 0 ? "profit" : "loss"
            }`}
            whileHover={{ y: -10, boxShadow: "0 15px 30px rgba(0, 0, 0, 0.1)" }}
          >
            {profitLoss >= 0 ? (
              <FiTrendingUp className="card-icon" />
            ) : (
              <FiTrendingDown className="card-icon" />
            )}
            <p>Profit / Loss</p>
            <h2>₹{profitLoss.toLocaleString()}</h2>
            <p className="percentage">
              {totalInvestment > 0
                ? `(${((profitLoss / totalInvestment) * 100).toFixed(2)}%)`
                : "(0.00%)"}
            </p>
          </motion.div>
        </motion.div>

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

        <motion.div
          className="table-container glass"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div className="portfolio-actions">
            <motion.button
              className="refresh-btn"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={fetchVirtualMoneyData}
              title="Refresh portfolio data"
            >
              <FiRefreshCw /> Refresh
            </motion.button>
            <motion.button
              className="reset-btn"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={resetPortfolio}
              title="Reset portfolio"
            >
              <FiTrash2 /> Reset Portfolio
            </motion.button>
          </div>

          {portfolio.length > 0 ? (
            <table className="portfolio-table">
              <thead>
                <tr>
                  <th>Symbol</th>
                  <th>Company</th>
                  <th>Qty</th>
                  <th>Buy ₹</th>
                  <th>Now ₹</th>
                  <th>P/L</th>
                </tr>
              </thead>
              <tbody>
                {portfolio.map((stock, idx) => {
                  const stockPL =
                    (stock.currentPrice - stock.buyPrice) * stock.quantity;
                  const percentChange = ((stock.currentPrice - stock.buyPrice) / stock.buyPrice * 100).toFixed(2);

                  return (
                    <motion.tr
                      key={idx}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 * idx }}
                      whileHover={{ backgroundColor: "rgba(255, 255, 255, 0.9)" }}
                      className="stock-row"
                      onClick={() => handleStockSelect(stock.symbol)}
                    >
                      <td className="symbol-cell">{stock.symbol}</td>
                      <td>{stock.company}</td>
                      <td>{stock.quantity}</td>
                      <td>₹{stock.buyPrice.toLocaleString()}</td>
                      <td>₹{stock.currentPrice.toLocaleString()}</td>
                      <td className={stockPL >= 0 ? "profit" : "loss"}>
                        <div className="pl-container">
                          <span>₹{stockPL.toLocaleString()}</span>
                          <span className="percentage">({percentChange}%)</span>
                          {stockPL >= 0 ? <FiTrendingUp /> : <FiTrendingDown />}
                          <button
                            className="view-detail-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStockSelect(stock.symbol);
                            }}
                            title="View details"
                          >
                            <FiMaximize2 />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="empty-portfolio">
              <p>Your portfolio is empty</p>
              <p>Add stocks to start tracking your investments</p>
            </div>
          )}
        </motion.div>

        <motion.div
          className="search-section"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <h3 className="section-title">Search Stocks</h3>
          <div className="search-container">
            <StockSearch
              onStockSelect={(symbol) => setSelectedStock(symbol)}
              placeholder="Search for stocks to view details..."
            />
          </div>
        </motion.div>

        {/* Modal */}
        <AnimatePresence>
          {showModal && (
            <motion.div
              className="modal"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="modal-content glass"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
              >
                <h2>Buy Stock with Virtual Money</h2>
                <p className="modal-subtitle">Available Balance: ₹{virtualMoney.balance.toLocaleString('en-IN')}</p>
                <form onSubmit={addStock}>
                  <div className="form-group">
                    <input
                      type="text"
                      name="symbol"
                      placeholder="Symbol (e.g., INFY)"
                      value={newStock.symbol}
                      onChange={handleInputChange}
                      className={errors.symbol ? "error" : ""}
                    />
                    {errors.symbol && <div className="error-message">{errors.symbol}</div>}
                  </div>

                  <div className="form-group">
                    <input
                      type="text"
                      name="company"
                      placeholder="Company Name"
                      value={newStock.company}
                      onChange={handleInputChange}
                      className={errors.company ? "error" : ""}
                    />
                    {errors.company && <div className="error-message">{errors.company}</div>}
                  </div>

                  <div className="form-group">
                    <input
                      type="number"
                      name="quantity"
                      placeholder="Quantity"
                      value={newStock.quantity}
                      onChange={handleInputChange}
                      className={errors.quantity ? "error" : ""}
                    />
                    {errors.quantity && <div className="error-message">{errors.quantity}</div>}
                  </div>

                  <div className="form-group">
                    <input
                      type="number"
                      name="buyPrice"
                      placeholder="Buy Price"
                      value={newStock.buyPrice}
                      onChange={handleInputChange}
                      className={errors.buyPrice ? "error" : ""}
                    />
                    {errors.buyPrice && <div className="error-message">{errors.buyPrice}</div>}
                  </div>

                  <div className="form-group">
                    <input
                      type="number"
                      name="currentPrice"
                      placeholder="Current Price"
                      value={newStock.currentPrice}
                      onChange={handleInputChange}
                      className={errors.currentPrice ? "error" : ""}
                    />
                    {errors.currentPrice && <div className="error-message">{errors.currentPrice}</div>}
                  </div>

                  <div className="modal-buttons">
                    <motion.button
                      type="submit"
                      className="auth-btn"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      disabled={isLoading}
                    >
                      {isLoading ? <Loading size="small" text="" /> : "Buy Stock"}
                    </motion.button>
                    <motion.button
                      type="button"
                      className="cancel-btn"
                      onClick={() => setShowModal(false)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      disabled={isLoading}
                    >
                      Cancel
                    </motion.button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Full-screen stock detail */}
      <AnimatePresence>
        {showFullScreenDetail && selectedStock && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <FullScreenStockDetail
              symbol={selectedStock}
              onClose={handleCloseFullScreenDetail}
              onBuySuccess={() => {
                handleCloseFullScreenDetail();
                handleTransactionSuccess();
              }}
              onSellSuccess={() => {
                handleCloseFullScreenDetail();
                handleTransactionSuccess();
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </PageLayout>
  );
};

export default PortfolioPage;
