import React, { useState, useContext, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiPlusCircle, FiRefreshCw, FiTrendingUp, FiTrendingDown,
  FiDollarSign, FiBarChart2, FiCreditCard, FiShoppingCart, FiGift
} from "react-icons/fi";
import { useToast } from "../context/ToastContext";
import PageLayout from "../components/PageLayout";
import Loading from "../components/Loading";
import axios from "axios";
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

  // Fetch virtual money data
  useEffect(() => {
    const fetchVirtualMoney = async () => {
      try {
        // Try to call the API to get virtual money data
        try {
          const response = await axios.get("http://localhost:5000/api/virtual-money/account", { timeout: 3000 });
          if (response.data.success) {
            setVirtualMoney(response.data.data);
            console.log("Successfully fetched virtual money data from API");
          }
        } catch (apiError) {
          console.log("Backend API not available, using local storage data");

          // Try to get data from local storage
          const storedData = localStorage.getItem('virtualMoney');
          if (storedData) {
            const parsedData = JSON.parse(storedData);
            setVirtualMoney(parsedData);
            console.log("Using data from local storage");
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
        // Continue with default mock data
      }
    };

    fetchVirtualMoney();
  }, []);

  // Function to claim daily login reward
  const claimDailyReward = async () => {
    try {
      let rewardClaimed = false;
      let rewardAmount = 1; // Default reward amount

      // Try to call the API to claim daily reward
      try {
        const response = await axios.post("http://localhost:5000/api/virtual-money/claim-reward", { timeout: 3000 });
        if (response.data.success) {
          rewardAmount = response.data.data.rewardAmount;
          rewardClaimed = true;
          console.log("Successfully claimed reward from API");
        }
      } catch (apiError) {
        console.log("Backend API not available, using local implementation");

        // Local implementation for claiming reward
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (!virtualMoney.lastLoginReward || new Date(virtualMoney.lastLoginReward) < today) {
          rewardClaimed = true;
        } else {
          toast.info("You've already claimed your daily reward today");
          return false;
        }
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
      console.error("Error claiming daily reward:", err);
      toast.error("Failed to claim daily reward");
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

  const addStock = (e) => {
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

    // Simulate API call to buy stock with virtual money
    setTimeout(() => {
      // Add stock to portfolio
      setPortfolio([
        ...portfolio,
        {
          symbol: symbol.toUpperCase(),
          company,
          quantity: parseInt(quantity),
          buyPrice: parseFloat(buyPrice),
          currentPrice: parseFloat(currentPrice),
        },
      ]);

      // Deduct virtual money
      setVirtualMoney(prev => ({
        ...prev,
        balance: prev.balance - totalCost
      }));

      // Reset form
      setNewStock({
        symbol: "",
        company: "",
        quantity: "",
        buyPrice: "",
        currentPrice: "",
      });

      setShowModal(false);
      setIsLoading(false);
      toast.success(`${symbol.toUpperCase()} added to portfolio! Spent ${totalCost} coins.`);

      // In a real app, this would call the API
      // const buyStockAPI = async () => {
      //   try {
      //     const response = await axios.post("http://localhost:5000/api/virtual-money/buy", {
      //       stockSymbol: symbol.toUpperCase(),
      //       quantity: parseInt(quantity),
      //       price: parseFloat(buyPrice)
      //     });
      //
      //     if (response.data.success) {
      //       // Update virtual money balance
      //       setVirtualMoney(response.data.data);
      //     }
      //   } catch (err) {
      //     console.error("Error buying stock:", err);
      //   }
      // };
      //
      // buyStockAPI();
    }, 800);
  };

  const resetPortfolio = () => {
    if (portfolio.length === 0) {
      toast.info("Portfolio is already empty");
      return;
    }

    if (confirm("Are you sure you want to reset your portfolio?")) {
      setPortfolio([]);
      toast.info("Portfolio has been reset");
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
          className="portfolio-buttons"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <motion.button
            className="add-btn"
            onClick={() => setShowModal(true)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FiShoppingCart /> Buy Stock with Coins
          </motion.button>
          <motion.button
            className="reset-btn"
            onClick={resetPortfolio}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FiRefreshCw /> Reset
          </motion.button>
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
    </PageLayout>
  );
};

export default PortfolioPage;
