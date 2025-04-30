import React, { useState } from "react";
import Sidebar from "../components/Sidebar";
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
  const [portfolio, setPortfolio] = useState(mockPortfolio);
  const [showModal, setShowModal] = useState(false);
  const [newStock, setNewStock] = useState({
    symbol: "",
    company: "",
    quantity: "",
    buyPrice: "",
    currentPrice: "",
  });

  const totalInvestment = portfolio.reduce(
    (acc, stock) => acc + stock.buyPrice * stock.quantity,
    0
  );
  const totalValue = portfolio.reduce(
    (acc, stock) => acc + stock.currentPrice * stock.quantity,
    0
  );
  const profitLoss = totalValue - totalInvestment;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewStock({ ...newStock, [name]: value });
  };

  const addStock = (e) => {
    e.preventDefault();
    const { symbol, company, quantity, buyPrice, currentPrice } = newStock;
    if (!symbol || !company || !quantity || !buyPrice || !currentPrice) {
      alert("Please fill all fields");
      return;
    }

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
  };

  const resetPortfolio = () => setPortfolio([]);

  return (
    <div className="portfolio-layout">
      <Sidebar />
      <div className="portfolio-content">
        <h1 className="portfolio-title">💼 Portfolio</h1>

        <div className="portfolio-summary">
          <div className="summary-card glass">
            <p>Total Investment</p>
            <h2>₹{totalInvestment.toLocaleString()}</h2>
          </div>
          <div className="summary-card glass">
            <p>Current Value</p>
            <h2>₹{totalValue.toLocaleString()}</h2>
          </div>
          <div
            className={`summary-card glass ${
              profitLoss >= 0 ? "profit" : "loss"
            }`}
          >
            <p>Profit / Loss</p>
            <h2>₹{profitLoss.toLocaleString()}</h2>
          </div>
        </div>

        <table className="portfolio-table glass">
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
              return (
                <tr key={idx}>
                  <td>{stock.symbol}</td>
                  <td>{stock.company}</td>
                  <td>{stock.quantity}</td>
                  <td>₹{stock.buyPrice}</td>
                  <td>₹{stock.currentPrice}</td>
                  <td className={stockPL >= 0 ? "profit" : "loss"}>
                    ₹{stockPL.toLocaleString()}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="portfolio-buttons">
          <button className="add-btn" onClick={() => setShowModal(true)}>
            ➕ Add Stock
          </button>
          <button className="reset-btn" onClick={resetPortfolio}>
            ♻️ Reset
          </button>
        </div>

        {/* Modal */}
        {showModal && (
          <div className="modal">
            <div className="modal-content glass">
              <h2>Add New Stock</h2>
              <form onSubmit={addStock}>
                <input
                  type="text"
                  name="symbol"
                  placeholder="Symbol (e.g., INFY)"
                  value={newStock.symbol}
                  onChange={handleInputChange}
                />
                <input
                  type="text"
                  name="company"
                  placeholder="Company Name"
                  value={newStock.company}
                  onChange={handleInputChange}
                />
                <input
                  type="number"
                  name="quantity"
                  placeholder="Quantity"
                  value={newStock.quantity}
                  onChange={handleInputChange}
                />
                <input
                  type="number"
                  name="buyPrice"
                  placeholder="Buy Price"
                  value={newStock.buyPrice}
                  onChange={handleInputChange}
                />
                <input
                  type="number"
                  name="currentPrice"
                  placeholder="Current Price"
                  value={newStock.currentPrice}
                  onChange={handleInputChange}
                />
                <button type="submit" className="auth-btn">
                  ✅ Add
                </button>
                <button
                  type="button"
                  className="reset-btn"
                  onClick={() => setShowModal(false)}
                >
                  ❌ Cancel
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PortfolioPage;
