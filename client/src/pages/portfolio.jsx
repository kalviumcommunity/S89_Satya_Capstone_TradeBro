import React, { useState, useContext } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiPlusCircle, FiRefreshCw, FiTrendingUp, FiTrendingDown, FiDollarSign, FiBarChart2 } from "react-icons/fi";
import { useToast } from "../context/ToastContext";
import Sidebar from "../components/Sidebar";
import Loading from "../components/Loading";
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
  const [newStock, setNewStock] = useState({
    symbol: "",
    company: "",
    quantity: "",
    buyPrice: "",
    currentPrice: "",
  });
  const [errors, setErrors] = useState({});

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

    setIsLoading(true);

    // Simulate API call
    setTimeout(() => {
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

      setNewStock({
        symbol: "",
        company: "",
        quantity: "",
        buyPrice: "",
        currentPrice: "",
      });

      setShowModal(false);
      setIsLoading(false);
      toast.success(`${symbol.toUpperCase()} added to portfolio!`);
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
    <motion.div
      className="portfolio-layout"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Sidebar />
      <div className="portfolio-content">
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
            <FiPlusCircle /> Add Stock
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
                <h2>Add New Stock</h2>
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
                      {isLoading ? <Loading size="small" text="" /> : "Add Stock"}
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
      </div>
    </motion.div>
  );
};

export default PortfolioPage;
