import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiTrendingUp, FiTrendingDown, FiDollarSign, FiBarChart2, FiShoppingCart, FiAlertCircle, FiClock } from "react-icons/fi";
import axios from "axios";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";
import Loading from "./Loading";
import StockChart from "./StockChart";
import API_ENDPOINTS from "../config/apiConfig";
import "../styles/StockDetail.css";

const StockDetail = ({ symbol, onClose, onBuySuccess, onSellSuccess }) => {
  const { isAuthenticated } = useAuth();
  const toast = useToast();
  const [stockData, setStockData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [showSellModal, setShowSellModal] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [orderType, setOrderType] = useState("MARKET");
  const [limitPrice, setLimitPrice] = useState("");
  const [virtualMoney, setVirtualMoney] = useState({
    balance: 0,
    portfolio: []
  });
  const [processingTransaction, setProcessingTransaction] = useState(false);

  // Fetch stock data
  useEffect(() => {
    const fetchStockData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get user ID for personalized data if authenticated
        const userId = isAuthenticated ? localStorage.getItem('userId') || localStorage.getItem('authToken') : null;

        // Use our proxy server to get stock data with personalization
        const url = userId
          ? `${API_ENDPOINTS.PROXY.STOCK_BATCH(symbol)}&userId=${userId}`
          : API_ENDPOINTS.PROXY.STOCK_BATCH(symbol);

        const response = await axios.get(url);

        if (response.data && response.data.length > 0) {
          setStockData(response.data[0]);
        } else {
          setError("No data found for this stock symbol");
        }
      } catch (err) {
        console.error("Error fetching stock data:", err);

        // Check if it's an Indian stock (ends with .NS or .BO)
        const isIndianStock = symbol.endsWith('.NS') || symbol.endsWith('.BO');

        // Generate mock data for Indian stocks
        if (isIndianStock) {
          // Get user ID for personalized data if authenticated
          const userId = isAuthenticated ? localStorage.getItem('userId') || localStorage.getItem('authToken') : null;

          // Format the stock name nicely
          let stockName = symbol;
          if (symbol.endsWith('.NS')) {
            stockName = symbol.replace('.NS', '').replace(/([A-Z])/g, ' $1').trim() + ' (NSE)';
          } else if (symbol.endsWith('.BO')) {
            stockName = symbol.replace('.BO', '').replace(/([A-Z])/g, ' $1').trim() + ' (BSE)';
          }

          // Generate personalized mock data
          const isGainer = userId ?
            (userId + symbol).split('').reduce((a, b) => a + b.charCodeAt(0), 0) % 2 === 0 :
            Math.random() > 0.5;

          // Base price based on the first few characters of the symbol (for consistency)
          const basePrice = (symbol.charCodeAt(0) + symbol.charCodeAt(1)) * 10 + 500;

          // Generate a realistic percentage change
          const percentChange = isGainer
            ? (Math.random() * 5).toFixed(2) // Positive change up to 5%
            : (-Math.random() * 5).toFixed(2); // Negative change up to -5%

          // Calculate absolute change
          const change = (basePrice * percentChange / 100).toFixed(2);

          // Create mock stock data
          const mockIndianStock = {
            symbol: symbol,
            name: stockName,
            price: basePrice,
            change: parseFloat(change),
            changesPercentage: parseFloat(percentChange),
            open: parseFloat((basePrice - (Math.random() * 50)).toFixed(2)),
            dayHigh: parseFloat((basePrice + (Math.random() * 100)).toFixed(2)),
            dayLow: parseFloat((basePrice - (Math.random() * 100)).toFixed(2)),
            volume: Math.floor(Math.random() * 10000000) + 100000,
            marketCap: Math.floor(Math.random() * 10000000000000) + 100000000000,
            pe: parseFloat((Math.random() * 40 + 10).toFixed(2)),
            yearHigh: parseFloat((basePrice * 1.3).toFixed(2)),
            yearLow: parseFloat((basePrice * 0.7).toFixed(2))
          };

          setStockData(mockIndianStock);
          setError(null);
          toast.info("Using offline data for this stock");
        } else {
          // Use mock data as fallback for common stocks
          const mockData = {
            "AAPL": { symbol: "AAPL", name: "Apple Inc.", price: 178.25, change: 2.35, changesPercentage: 1.32, open: 176.15, dayHigh: 179.20, dayLow: 175.80, volume: 65432100, marketCap: 2850000000000, pe: 29.5, yearHigh: 182.50, yearLow: 124.30 },
            "MSFT": { symbol: "MSFT", name: "Microsoft Corporation", price: 332.80, change: 3.50, changesPercentage: 1.05, open: 330.10, dayHigh: 334.20, dayLow: 329.50, volume: 25678900, marketCap: 2450000000000, pe: 35.2, yearHigh: 340.15, yearLow: 245.80 },
            "GOOGL": { symbol: "GOOGL", name: "Alphabet Inc.", price: 135.60, change: 1.80, changesPercentage: 1.33, open: 134.20, dayHigh: 136.50, dayLow: 133.90, volume: 18765400, marketCap: 1750000000000, pe: 25.8, yearHigh: 142.30, yearLow: 98.50 },
            "AMZN": { symbol: "AMZN", name: "Amazon.com Inc.", price: 145.20, change: -0.80, changesPercentage: -0.55, open: 146.30, dayHigh: 147.10, dayLow: 144.80, volume: 32145600, marketCap: 1500000000000, pe: 42.3, yearHigh: 155.40, yearLow: 101.20 },
            "TSLA": { symbol: "TSLA", name: "Tesla Inc.", price: 245.75, change: 5.25, changesPercentage: 2.18, open: 241.30, dayHigh: 248.90, dayLow: 240.50, volume: 87654300, marketCap: 780000000000, pe: 68.5, yearHigh: 310.20, yearLow: 152.40 }
          };

          if (mockData[symbol]) {
            setStockData(mockData[symbol]);
            setError(null);
            toast.info("Using offline data for this stock");
          } else {
            setError("Failed to fetch stock data. Please try again later.");
          }
        }
      } finally {
        setLoading(false);
      }
    };

    fetchStockData();
  }, [symbol, isAuthenticated]);

  // Fetch virtual money data
  useEffect(() => {
    const fetchVirtualMoney = async () => {
      if (!isAuthenticated) return;

      try {
        // Try the public endpoint first for testing
        const response = await axios.get("http://localhost:5000/api/virtual-money/public", { timeout: 3000 });
        if (response.data.success) {
          setVirtualMoney(response.data.data);
        }
      } catch (err) {
        console.log("Backend API not available, using local storage data");
        const storedData = localStorage.getItem('virtualMoney');
        if (storedData) {
          setVirtualMoney(JSON.parse(storedData));
        }
      }
    };

    fetchVirtualMoney();
  }, [isAuthenticated]);

  const handleBuy = async () => {
    if (!isAuthenticated) {
      toast.error("Please log in to buy stocks");
      return;
    }

    if (!stockData) return;

    // Validate limit price for limit orders
    if (orderType === "LIMIT" && (!limitPrice || parseFloat(limitPrice) <= 0)) {
      toast.error("Please enter a valid limit price");
      return;
    }

    setProcessingTransaction(true);

    try {
      // Calculate total cost
      const totalCost = quantity * stockData.price;

      // For market orders, check if user has enough balance
      if (orderType === "MARKET" && totalCost > virtualMoney.balance) {
        toast.error(`Insufficient funds. You need $${totalCost.toFixed(2)} but have $${virtualMoney.balance.toFixed(2)}`);
        setProcessingTransaction(false);
        return;
      }

      // Prepare order data
      const orderData = {
        type: "BUY",
        stockSymbol: symbol,
        stockName: stockData.name,
        quantity: parseInt(quantity),
        price: stockData.price,
        orderType: orderType,
        limitPrice: orderType === "LIMIT" ? parseFloat(limitPrice) : null
      };

      // Place order
      try {
        const response = await axios.post(API_ENDPOINTS.ORDERS.PLACE, orderData);

        if (response.data.success) {
          // If market order was executed immediately
          if (orderType === "MARKET") {
            toast.success(`Successfully purchased ${quantity} shares of ${symbol}`);
            setVirtualMoney(response.data.data);
          } else {
            toast.success(`Limit order placed successfully for ${quantity} shares of ${symbol}`);
          }

          setShowBuyModal(false);
          if (onBuySuccess) onBuySuccess();
        }
      } catch (apiError) {
        console.log("Backend API not available, using local implementation");

        // Local implementation for market orders only
        if (orderType === "MARKET") {
          const updatedVirtualMoney = {
            ...virtualMoney,
            balance: virtualMoney.balance - totalCost,
            portfolio: [...virtualMoney.portfolio]
          };

          // Check if stock already exists in portfolio
          const existingStockIndex = updatedVirtualMoney.portfolio.findIndex(
            item => item.stockSymbol === symbol
          );

          if (existingStockIndex !== -1) {
            // Update existing stock
            const existingStock = updatedVirtualMoney.portfolio[existingStockIndex];
            const totalShares = existingStock.quantity + parseInt(quantity);
            const totalValue = (existingStock.quantity * existingStock.averageBuyPrice) + (parseInt(quantity) * stockData.price);

            updatedVirtualMoney.portfolio[existingStockIndex] = {
              ...existingStock,
              quantity: totalShares,
              averageBuyPrice: totalValue / totalShares,
              lastUpdated: new Date()
            };
          } else {
            // Add new stock to portfolio
            updatedVirtualMoney.portfolio.push({
              stockSymbol: symbol,
              quantity: parseInt(quantity),
              averageBuyPrice: stockData.price,
              lastUpdated: new Date()
            });
          }

          setVirtualMoney(updatedVirtualMoney);
          localStorage.setItem('virtualMoney', JSON.stringify(updatedVirtualMoney));
          toast.success(`Successfully purchased ${quantity} shares of ${symbol}`);
        } else {
          // For limit orders in offline mode
          toast.info(`Limit order would be placed for ${quantity} shares of ${symbol} at $${limitPrice}`);
        }

        setShowBuyModal(false);
        if (onBuySuccess) onBuySuccess();
      }
    } catch (err) {
      console.error("Error buying stock:", err);
      toast.error("Failed to complete purchase. Please try again.");
    } finally {
      setProcessingTransaction(false);
    }
  };

  const handleSell = async () => {
    if (!isAuthenticated) {
      toast.error("Please log in to sell stocks");
      return;
    }

    if (!stockData) return;

    // Find stock in portfolio
    const stockInPortfolio = virtualMoney.portfolio.find(item => item.stockSymbol === symbol);

    if (!stockInPortfolio) {
      toast.error(`You don't own any shares of ${symbol}`);
      return;
    }

    if (parseInt(quantity) > stockInPortfolio.quantity) {
      toast.error(`You only have ${stockInPortfolio.quantity} shares to sell`);
      return;
    }

    // Validate limit price for limit orders
    if (orderType === "LIMIT" && (!limitPrice || parseFloat(limitPrice) <= 0)) {
      toast.error("Please enter a valid limit price");
      return;
    }

    setProcessingTransaction(true);

    try {
      // Prepare order data
      const orderData = {
        type: "SELL",
        stockSymbol: symbol,
        stockName: stockData.name,
        quantity: parseInt(quantity),
        price: stockData.price,
        orderType: orderType,
        limitPrice: orderType === "LIMIT" ? parseFloat(limitPrice) : null
      };

      // Place order
      try {
        const response = await axios.post(API_ENDPOINTS.ORDERS.PLACE, orderData);

        if (response.data.success) {
          // If market order was executed immediately
          if (orderType === "MARKET") {
            toast.success(`Successfully sold ${quantity} shares of ${symbol}`);
            setVirtualMoney(response.data.data);
          } else {
            toast.success(`Limit sell order placed successfully for ${quantity} shares of ${symbol}`);
          }

          setShowSellModal(false);
          if (onSellSuccess) onSellSuccess();
        }
      } catch (apiError) {
        console.log("Backend API not available, using local implementation");

        // Local implementation for market orders only
        if (orderType === "MARKET") {
          const saleAmount = parseInt(quantity) * stockData.price;
          const updatedVirtualMoney = {
            ...virtualMoney,
            balance: virtualMoney.balance + saleAmount,
            portfolio: [...virtualMoney.portfolio]
          };

          // Find stock in portfolio
          const stockIndex = updatedVirtualMoney.portfolio.findIndex(
            item => item.stockSymbol === symbol
          );

          if (stockIndex !== -1) {
            const stock = updatedVirtualMoney.portfolio[stockIndex];

            if (stock.quantity === parseInt(quantity)) {
              // Remove stock from portfolio if all shares are sold
              updatedVirtualMoney.portfolio.splice(stockIndex, 1);
            } else {
              // Update quantity
              updatedVirtualMoney.portfolio[stockIndex] = {
                ...stock,
                quantity: stock.quantity - parseInt(quantity),
                lastUpdated: new Date()
              };
            }

            setVirtualMoney(updatedVirtualMoney);
            localStorage.setItem('virtualMoney', JSON.stringify(updatedVirtualMoney));
            toast.success(`Successfully sold ${quantity} shares of ${symbol}`);
          }
        } else {
          // For limit orders in offline mode
          toast.info(`Limit sell order would be placed for ${quantity} shares of ${symbol} at $${limitPrice}`);
        }

        setShowSellModal(false);
        if (onSellSuccess) onSellSuccess();
      }
    } catch (err) {
      console.error("Error selling stock:", err);
      toast.error("Failed to complete sale. Please try again.");
    } finally {
      setProcessingTransaction(false);
    }
  };

  // Format large numbers
  const formatLargeNumber = (num) => {
    if (num >= 1000000000000) {
      return `$${(num / 1000000000000).toFixed(2)}T`;
    } else if (num >= 1000000000) {
      return `$${(num / 1000000000).toFixed(2)}B`;
    } else if (num >= 1000000) {
      return `$${(num / 1000000).toFixed(2)}M`;
    } else {
      return `$${num.toLocaleString()}`;
    }
  };

  return (
    <motion.div
      className="stock-detail-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="stock-detail-container"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
      >
        <button className="close-btn" onClick={onClose}>×</button>

        {loading ? (
          <div className="loading-container">
            <Loading size="large" text="Loading stock data..." />
          </div>
        ) : error ? (
          <div className="error-container">
            <FiAlertCircle className="error-icon" />
            <p>{error}</p>
          </div>
        ) : stockData && (
          <>
            <div className="stock-header">
              <div className="stock-title">
                <h2>{stockData.name} ({stockData.symbol})</h2>
                <p className={stockData.changesPercentage >= 0 ? "positive" : "negative"}>
                  {stockData.changesPercentage >= 0 ? <FiTrendingUp /> : <FiTrendingDown />}
                  {stockData.changesPercentage.toFixed(2)}%
                </p>
              </div>
              <div className="stock-price">
                <h1>${stockData.price.toFixed(2)}</h1>
                <p className={stockData.change >= 0 ? "positive" : "negative"}>
                  {stockData.change >= 0 ? "+" : ""}{stockData.change.toFixed(2)}
                </p>
              </div>
            </div>

            <div className="stock-details-grid">
              <div className="detail-item">
                <span className="detail-label">Open</span>
                <span className="detail-value">${stockData.open.toFixed(2)}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">High</span>
                <span className="detail-value">${stockData.dayHigh.toFixed(2)}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Low</span>
                <span className="detail-value">${stockData.dayLow.toFixed(2)}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Volume</span>
                <span className="detail-value">{stockData.volume.toLocaleString()}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Market Cap</span>
                <span className="detail-value">{formatLargeNumber(stockData.marketCap)}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">P/E Ratio</span>
                <span className="detail-value">{stockData.pe ? stockData.pe.toFixed(2) : 'N/A'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">52W High</span>
                <span className="detail-value">${stockData.yearHigh.toFixed(2)}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">52W Low</span>
                <span className="detail-value">${stockData.yearLow.toFixed(2)}</span>
              </div>
            </div>

            <StockChart symbol={symbol} />

            <div className="action-buttons">
              <button className="buy-btn" onClick={() => setShowBuyModal(true)}>
                <FiShoppingCart /> Buy
              </button>
              <button className="sell-btn" onClick={() => setShowSellModal(true)}>
                <FiBarChart2 /> Sell
              </button>
            </div>
          </>
        )}

        {/* Buy Modal */}
        <AnimatePresence>
          {showBuyModal && (
            <motion.div
              className="transaction-modal"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="modal-content"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
              >
                <h3>Buy {symbol}</h3>
                <p className="balance-info">Available Balance: ${virtualMoney.balance.toFixed(2)}</p>
                <p className="price-info">Current Price: ${stockData?.price.toFixed(2)}</p>

                <div className="order-type-selector">
                  <label>Order Type:</label>
                  <div className="order-type-buttons">
                    <button
                      type="button"
                      className={orderType === "MARKET" ? "active" : ""}
                      onClick={() => setOrderType("MARKET")}
                    >
                      Market
                    </button>
                    <button
                      type="button"
                      className={orderType === "LIMIT" ? "active" : ""}
                      onClick={() => setOrderType("LIMIT")}
                    >
                      Limit
                    </button>
                  </div>
                </div>

                <div className="quantity-input">
                  <label>Quantity:</label>
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  />
                </div>

                {orderType === "LIMIT" && (
                  <div className="limit-price-input">
                    <label>Limit Price ($):</label>
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={limitPrice}
                      onChange={(e) => setLimitPrice(e.target.value)}
                      placeholder="Enter limit price"
                    />
                    <p className="limit-price-info">
                      <FiClock /> Order will execute when price reaches ${limitPrice || "0.00"}
                    </p>
                  </div>
                )}

                <div className="total-cost">
                  <p>Estimated Total: ${(quantity * (stockData?.price || 0)).toFixed(2)}</p>
                  {orderType === "LIMIT" && (
                    <p className="limit-total">
                      Limit Total: ${limitPrice ? (quantity * parseFloat(limitPrice)).toFixed(2) : "0.00"}
                    </p>
                  )}
                </div>

                <div className="modal-buttons">
                  <button
                    className="confirm-btn"
                    onClick={handleBuy}
                    disabled={processingTransaction}
                  >
                    {processingTransaction ? <Loading size="small" text="" /> : orderType === "MARKET" ? "Buy Now" : "Place Order"}
                  </button>
                  <button
                    className="cancel-btn"
                    onClick={() => setShowBuyModal(false)}
                    disabled={processingTransaction}
                  >
                    Cancel
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Sell Modal */}
        <AnimatePresence>
          {showSellModal && (
            <motion.div
              className="transaction-modal"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="modal-content"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
              >
                <h3>Sell {symbol}</h3>
                <p className="balance-info">Current Balance: ${virtualMoney.balance.toFixed(2)}</p>
                <p className="price-info">Current Price: ${stockData?.price.toFixed(2)}</p>

                {virtualMoney.portfolio.find(item => item.stockSymbol === symbol) ? (
                  <>
                    <p className="shares-info">
                      Shares Owned: {virtualMoney.portfolio.find(item => item.stockSymbol === symbol)?.quantity || 0}
                    </p>

                    <div className="order-type-selector">
                      <label>Order Type:</label>
                      <div className="order-type-buttons">
                        <button
                          type="button"
                          className={orderType === "MARKET" ? "active" : ""}
                          onClick={() => setOrderType("MARKET")}
                        >
                          Market
                        </button>
                        <button
                          type="button"
                          className={orderType === "LIMIT" ? "active" : ""}
                          onClick={() => setOrderType("LIMIT")}
                        >
                          Limit
                        </button>
                      </div>
                    </div>

                    <div className="quantity-input">
                      <label>Quantity to Sell:</label>
                      <input
                        type="number"
                        min="1"
                        max={virtualMoney.portfolio.find(item => item.stockSymbol === symbol)?.quantity || 0}
                        value={quantity}
                        onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      />
                    </div>

                    {orderType === "LIMIT" && (
                      <div className="limit-price-input">
                        <label>Limit Price ($):</label>
                        <input
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={limitPrice}
                          onChange={(e) => setLimitPrice(e.target.value)}
                          placeholder="Enter limit price"
                        />
                        <p className="limit-price-info">
                          <FiClock /> Order will execute when price reaches ${limitPrice || "0.00"}
                        </p>
                      </div>
                    )}

                    <div className="total-value">
                      <p>Estimated Value: ${(quantity * (stockData?.price || 0)).toFixed(2)}</p>
                      {orderType === "LIMIT" && (
                        <p className="limit-total">
                          Limit Value: ${limitPrice ? (quantity * parseFloat(limitPrice)).toFixed(2) : "0.00"}
                        </p>
                      )}
                    </div>

                    <div className="modal-buttons">
                      <button
                        className="confirm-btn"
                        onClick={handleSell}
                        disabled={processingTransaction}
                      >
                        {processingTransaction ? <Loading size="small" text="" /> : orderType === "MARKET" ? "Sell Now" : "Place Order"}
                      </button>
                      <button
                        className="cancel-btn"
                        onClick={() => setShowSellModal(false)}
                        disabled={processingTransaction}
                      >
                        Cancel
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="no-shares">
                    <p>You don't own any shares of {symbol}</p>
                    <button
                      className="cancel-btn"
                      onClick={() => setShowSellModal(false)}
                    >
                      Close
                    </button>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};

export default StockDetail;
