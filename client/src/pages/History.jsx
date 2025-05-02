import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FiFilter, FiDownload, FiCalendar, FiTrendingUp, FiTrendingDown } from "react-icons/fi";
import PageLayout from "../components/PageLayout";
import { useToast } from "../context/ToastContext";
import "./History.css";

const History = () => {
  const { showToast } = useToast();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [dateRange, setDateRange] = useState({
    from: "",
    to: ""
  });

  // Mock data for demonstration
  const mockTransactions = [
    {
      id: 1,
      type: "buy",
      symbol: "AAPL",
      name: "Apple Inc.",
      quantity: 10,
      price: 175.43,
      total: 1754.30,
      date: "2023-10-15T14:32:00Z",
      status: "completed"
    },
    {
      id: 2,
      type: "sell",
      symbol: "MSFT",
      name: "Microsoft Corporation",
      quantity: 5,
      price: 340.25,
      total: 1701.25,
      date: "2023-10-12T09:45:00Z",
      status: "completed"
    },
    {
      id: 3,
      type: "buy",
      symbol: "GOOGL",
      name: "Alphabet Inc.",
      quantity: 8,
      price: 132.50,
      total: 1060.00,
      date: "2023-10-08T11:20:00Z",
      status: "completed"
    },
    {
      id: 4,
      type: "buy",
      symbol: "AMZN",
      name: "Amazon.com Inc.",
      quantity: 12,
      price: 128.30,
      total: 1539.60,
      date: "2023-10-05T15:10:00Z",
      status: "completed"
    },
    {
      id: 5,
      type: "sell",
      symbol: "TSLA",
      name: "Tesla, Inc.",
      quantity: 6,
      price: 240.50,
      total: 1443.00,
      date: "2023-10-01T10:05:00Z",
      status: "completed"
    },
    {
      id: 6,
      type: "buy",
      symbol: "NVDA",
      name: "NVIDIA Corporation",
      quantity: 15,
      price: 450.75,
      total: 6761.25,
      date: "2023-09-28T13:40:00Z",
      status: "completed"
    },
    {
      id: 7,
      type: "sell",
      symbol: "META",
      name: "Meta Platforms, Inc.",
      quantity: 10,
      price: 320.15,
      total: 3201.50,
      date: "2023-09-25T09:30:00Z",
      status: "completed"
    }
  ];

  // Load transaction data
  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setTransactions(mockTransactions);
      setLoading(false);
    }, 1000);
  }, []);

  // Filter transactions based on type and date range
  const filteredTransactions = transactions.filter((transaction) => {
    // Filter by type
    if (filter !== "all" && transaction.type !== filter) {
      return false;
    }

    // Filter by date range
    if (dateRange.from && new Date(transaction.date) < new Date(dateRange.from)) {
      return false;
    }
    if (dateRange.to && new Date(transaction.date) > new Date(dateRange.to)) {
      return false;
    }

    return true;
  });

  // Format date
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Export transactions as CSV
  const exportTransactions = () => {
    // Create CSV content
    const headers = ["ID", "Type", "Symbol", "Name", "Quantity", "Price", "Total", "Date", "Status"];
    const csvContent = [
      headers.join(","),
      ...filteredTransactions.map(t => [
        t.id,
        t.type,
        t.symbol,
        `"${t.name}"`, // Add quotes to handle commas in names
        t.quantity,
        t.price,
        t.total,
        formatDate(t.date),
        t.status
      ].join(","))
    ].join("\n");

    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `transaction-history-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast("Transaction history exported successfully", "success");
  };

  return (
    <PageLayout>
      <div className="history-container">
        <motion.h1
          className="history-header"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          Transaction History
        </motion.h1>

        <motion.div
          className="history-actions"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="filter-container">
            <FiFilter className="filter-icon" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Transactions</option>
              <option value="buy">Buy Orders</option>
              <option value="sell">Sell Orders</option>
            </select>
          </div>

          <div className="date-range-container">
            <div className="date-input-group">
              <FiCalendar className="date-icon" />
              <input
                type="date"
                value={dateRange.from}
                onChange={(e) => setDateRange({...dateRange, from: e.target.value})}
                className="date-input"
                placeholder="From"
              />
            </div>
            <span className="date-separator">to</span>
            <div className="date-input-group">
              <FiCalendar className="date-icon" />
              <input
                type="date"
                value={dateRange.to}
                onChange={(e) => setDateRange({...dateRange, to: e.target.value})}
                className="date-input"
                placeholder="To"
              />
            </div>
          </div>

          <button
            className="export-btn"
            onClick={exportTransactions}
            disabled={filteredTransactions.length === 0}
          >
            <FiDownload />
            Export CSV
          </button>
        </motion.div>

        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading transaction history...</p>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="empty-history">
            <p>No transactions found for the selected filters.</p>
            <p>Try changing your filter criteria or date range.</p>
          </div>
        ) : (
          <motion.div
            className="history-table-container"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <table className="history-table">
              <thead>
                <tr>
                  <th>Date & Time</th>
                  <th>Type</th>
                  <th>Symbol</th>
                  <th>Name</th>
                  <th>Quantity</th>
                  <th>Price</th>
                  <th>Total</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((transaction) => (
                  <motion.tr
                    key={transaction.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    whileHover={{ backgroundColor: "rgba(0,0,0,0.02)" }}
                  >
                    <td>{formatDate(transaction.date)}</td>
                    <td className={`type-cell ${transaction.type}`}>
                      {transaction.type === "buy" ? (
                        <FiTrendingUp className="type-icon" />
                      ) : (
                        <FiTrendingDown className="type-icon" />
                      )}
                      {transaction.type === "buy" ? "Buy" : "Sell"}
                    </td>
                    <td className="symbol-cell">{transaction.symbol}</td>
                    <td>{transaction.name}</td>
                    <td>{transaction.quantity}</td>
                    <td className="price-cell">${transaction.price.toFixed(2)}</td>
                    <td className="total-cell">${transaction.total.toFixed(2)}</td>
                    <td className="status-cell">
                      <span className={`status-badge ${transaction.status}`}>
                        {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        )}
      </div>
    </PageLayout>
  );
};

export default History;
