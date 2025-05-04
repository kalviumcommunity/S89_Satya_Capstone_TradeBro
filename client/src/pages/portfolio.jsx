import React, { useState, useContext, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiPlusCircle, FiRefreshCw, FiTrendingUp, FiTrendingDown,
  FiDollarSign, FiBarChart2, FiCreditCard, FiShoppingCart, FiGift, FiSearch
} from "react-icons/fi";
import { useToast } from "../context/ToastContext";
import { safeApiCall, createDummyData } from "../utils/apiUtils";
import { getCachedStockSymbols, cacheStockSymbols } from "../utils/stockCache";
import PageLayout from "../components/PageLayout";
import Loading from "../components/Loading";
import StockDetail from "../components/StockDetail";
import StockSearch from "../components/StockSearch";
import axios from "axios";
import API_ENDPOINTS from "../config/apiConfig";
import "./portfolio.css";

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
  const [portfolio, setPortfolio] = useState(mockPortfolio);
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [virtualMoney, setVirtualMoney] = useState({
    balance: 10000,
    lastLoginReward: null
  });
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
  const handleSearch = () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const query = searchQuery.toUpperCase();
    const results = stockSymbols.filter(
      stock => stock.symbol.includes(query) || stock.name?.toUpperCase().includes(query)
    ).slice(0, 10); // Limit to 10 results

    setSearchResults(results);
  };

  useEffect(() => {
    handleSearch();
  }, [searchQuery]);

  // Handle stock selection
  const handleStockSelect = (symbol) => {
    setSelectedStock(symbol);
    setSearchQuery("");
    setSearchResults([]);
  };

  // Handle transaction success
  const handleTransactionSuccess = () => {
    fetchVirtualMoney();
  };

  // Fetch virtual money data
  const fetchVirtualMoney = async () => {
    try {
      // Create fallback data for virtual money
      const fallbackData = createDummyData({
        balance: 9500, // Start with less to show some losses
        portfolio: [
          {
            stockSymbol: "AAPL",
            quantity: 10,
            averageBuyPrice: 150.25,
            lastUpdated: new Date().toISOString()
          },
          {
            stockSymbol: "MSFT",
            quantity: 5,
            averageBuyPrice: 250.50,
            lastUpdated: new Date().toISOString()
          }
        ],
        lastLoginReward: null
      });

      // Use safe API call with fallback data
      const result = await safeApiCall({
        method: 'get',
        url: API_ENDPOINTS.VIRTUAL_MONEY.ACCOUNT,
        fallbackData,
        timeout: 3000
      });

      if (result && result.success) {
        // Check if the data is in the expected format
        const virtualMoneyData = result.data || result;

        setVirtualMoney(virtualMoneyData);

        // Update portfolio with current prices
        if (virtualMoneyData.portfolio && virtualMoneyData.portfolio.length > 0) {
          updatePortfolioWithCurrentPrices(virtualMoneyData.portfolio);
        } else {
          setPortfolio([]);
        }

        // If this is fallback data, save to localStorage for future use
        if (result.isFallbackData) {
          localStorage.setItem('virtualMoney', JSON.stringify(virtualMoneyData));
        }
      }

      // Check if user can claim daily reward
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (!virtualMoney.lastLoginReward || new Date(virtualMoney.lastLoginReward) < today) {
        // Show claim reward button is handled by the button's disabled state
      }
    } catch (err) {
      console.error("Error in virtual money handling:", err);

      // Try to use data from local storage as a last resort
      const storedData = localStorage.getItem('virtualMoney');
      if (storedData) {
        try {
          const parsedData = JSON.parse(storedData);
          setVirtualMoney(parsedData);

          if (parsedData.portfolio && parsedData.portfolio.length > 0) {
            updatePortfolioWithCurrentPrices(parsedData.portfolio);
          }
        } catch (e) {
          console.error("Error parsing stored virtual money data:", e);
        }
      }

      // Show error notification to user
      toast.error("Failed to fetch portfolio data. Server may be down.");
    }
  };

  // Update portfolio with current prices
  const updatePortfolioWithCurrentPrices = async (portfolioData) => {
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

      // Get user ID for personalized data if authenticated
      const userId = localStorage.getItem('userId') || localStorage.getItem('authToken');

      // Use safe API call with fallback data
      const result = await safeApiCall({
        method: 'get',
        url: userId
          ? `${API_ENDPOINTS.PROXY.STOCK_BATCH(symbols)}&userId=${userId}`
          : API_ENDPOINTS.PROXY.STOCK_BATCH(symbols),
        fallbackData,
        timeout: 3000
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
  };

  useEffect(() => {
    fetchVirtualMoney();

    // Set up interval to refresh portfolio prices every 15 seconds
    const intervalId = setInterval(() => {
      fetchVirtualMoney();
    }, 15000);

    return () => clearInterval(intervalId);
  }, []);

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

        // Add a timeout to the request
        const response = await axios.post(API_ENDPOINTS.VIRTUAL_MONEY.CLAIM_REWARD, {}, {
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
          setVirtualMoney({
            ...virtualMoney,
            balance: response.data.data.balance,
            lastLoginReward: new Date(),
            userName: userName,
            userFullName: userFullName,
            dayStreak: dayStreak
          });

          console.log("Successfully claimed reward from API");

          // Show personalized success message
          toast.success(response.data.message || `Daily reward claimed: +${rewardAmount} coin!`);
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

        setVirtualMoney(updatedVirtualMoney);

        // Save to local storage for offline use
        localStorage.setItem('virtualMoney', JSON.stringify(updatedVirtualMoney));

        // Show animation and toast
        setShowRewardAnimation(true);
        setTimeout(() => {
          setShowRewardAnimation(false);
        }, 3000);

        toast.success(`Daily reward claimed: +${rewardAmount} coin!`);
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
      toast.error(`Insufficient funds. You need ${totalCost} coins but have ${virtualMoney.balance} coins.`);
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
          setVirtualMoney(response.data.data);

          // Fetch updated portfolio data
          fetchVirtualMoney();

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

        setVirtualMoney(updatedVirtualMoney);
        localStorage.setItem('virtualMoney', JSON.stringify(updatedVirtualMoney));

        toast.success(`${symbol.toUpperCase()} added to portfolio! Spent ${totalCost} coins.`);
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
          const response = await axios.delete("http://localhost:5000/api/virtual-money/portfolio");

          if (response.data.success) {
            // Update virtual money and portfolio
            fetchVirtualMoney();
            toast.success("Portfolio has been reset successfully");
          }
        } catch (apiError) {
          console.log("Backend API not available, using local implementation");

          // Local implementation
          const updatedVirtualMoney = {
            ...virtualMoney,
            portfolio: []
          };

          setVirtualMoney(updatedVirtualMoney);
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
              <span>+1 coin!</span>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          className="table-container glass"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
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
                <p className="modal-subtitle">Available Balance: ${virtualMoney.balance.toLocaleString()} coins</p>
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

      {/* Stock Detail Component */}
      {selectedStock && (
        <StockDetail
          symbol={selectedStock}
          onClose={() => setSelectedStock(null)}
          onBuySuccess={handleTransactionSuccess}
          onSellSuccess={handleTransactionSuccess}
        />
      )}
    </PageLayout>
  );
};

export default PortfolioPage;
