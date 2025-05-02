import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FiFilter, FiRefreshCw, FiCheck, FiX, FiClock, FiAlertCircle } from "react-icons/fi";
import PageLayout from "../components/PageLayout";
import { useToast } from "../context/ToastContext";
import "./Orders.css";

const Orders = () => {
  const { showToast } = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [refreshing, setRefreshing] = useState(false);

  // Mock data for demonstration
  const mockOrders = [
    {
      id: 1,
      type: "buy",
      symbol: "AAPL",
      name: "Apple Inc.",
      quantity: 5,
      price: 178.25,
      total: 891.25,
      orderType: "market",
      status: "open",
      createdAt: "2023-10-16T09:30:00Z"
    },
    {
      id: 2,
      type: "sell",
      symbol: "MSFT",
      name: "Microsoft Corporation",
      quantity: 3,
      price: 340.00,
      total: 1020.00,
      orderType: "limit",
      status: "open",
      createdAt: "2023-10-16T10:15:00Z"
    },
    {
      id: 3,
      type: "buy",
      symbol: "GOOGL",
      name: "Alphabet Inc.",
      quantity: 2,
      price: 132.50,
      total: 265.00,
      orderType: "market",
      status: "filled",
      createdAt: "2023-10-15T14:20:00Z",
      filledAt: "2023-10-15T14:22:00Z"
    },
    {
      id: 4,
      type: "sell",
      symbol: "AMZN",
      name: "Amazon.com Inc.",
      quantity: 4,
      price: 127.75,
      total: 511.00,
      orderType: "limit",
      status: "cancelled",
      createdAt: "2023-10-15T11:05:00Z",
      cancelledAt: "2023-10-15T13:30:00Z"
    },
    {
      id: 5,
      type: "buy",
      symbol: "TSLA",
      name: "Tesla, Inc.",
      quantity: 10,
      price: 240.00,
      total: 2400.00,
      orderType: "limit",
      status: "filled",
      createdAt: "2023-10-14T09:45:00Z",
      filledAt: "2023-10-14T10:30:00Z"
    }
  ];

  // Load orders data
  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setOrders(mockOrders);
      setLoading(false);
    }, 1000);
  }, []);

  // Filter orders based on status
  const filteredOrders = orders.filter((order) => {
    if (filter === "all") return true;
    return order.status === filter;
  });

  // Format date
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Refresh orders
  const refreshOrders = () => {
    setRefreshing(true);
    // Simulate API call
    setTimeout(() => {
      // Update with slightly different data to simulate refresh
      const updatedOrders = [...mockOrders];
      // Randomly change status of one order
      if (updatedOrders.length > 0) {
        const randomIndex = Math.floor(Math.random() * updatedOrders.length);
        const randomOrder = updatedOrders[randomIndex];
        if (randomOrder.status === "open") {
          randomOrder.status = "filled";
          randomOrder.filledAt = new Date().toISOString();
        }
      }
      setOrders(updatedOrders);
      setRefreshing(false);
      showToast("Orders refreshed", "success");
    }, 1000);
  };

  // Cancel order
  const cancelOrder = (id) => {
    // In a real app, you would call an API to cancel the order
    const updatedOrders = orders.map(order => {
      if (order.id === id) {
        return {
          ...order,
          status: "cancelled",
          cancelledAt: new Date().toISOString()
        };
      }
      return order;
    });

    setOrders(updatedOrders);
    showToast("Order cancelled successfully", "success");
  };

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case "open":
        return <FiClock />;
      case "filled":
        return <FiCheck />;
      case "cancelled":
        return <FiX />;
      default:
        return <FiAlertCircle />;
    }
  };

  return (
    <PageLayout>
      <div className="orders-container">
        <motion.h1
          className="orders-header"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          Active Orders
        </motion.h1>

        <motion.div
          className="orders-actions"
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
              <option value="all">All Orders</option>
              <option value="open">Open Orders</option>
              <option value="filled">Filled Orders</option>
              <option value="cancelled">Cancelled Orders</option>
            </select>
          </div>

          <button
            className={`refresh-btn ${refreshing ? 'refreshing' : ''}`}
            onClick={refreshOrders}
            disabled={refreshing}
          >
            <FiRefreshCw className={refreshing ? 'spin' : ''} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </motion.div>

        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading orders...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="empty-orders">
            <p>No orders found for the selected filter.</p>
            <p>Try changing your filter or place a new order.</p>
          </div>
        ) : (
          <motion.div
            className="orders-table-container"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <table className="orders-table">
              <thead>
                <tr>
                  <th>Date & Time</th>
                  <th>Type</th>
                  <th>Symbol</th>
                  <th>Quantity</th>
                  <th>Price</th>
                  <th>Total</th>
                  <th>Order Type</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <motion.tr
                    key={order.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    whileHover={{ backgroundColor: "rgba(0,0,0,0.02)" }}
                  >
                    <td>{formatDate(order.createdAt)}</td>
                    <td className={`type-cell ${order.type}`}>
                      {order.type.charAt(0).toUpperCase() + order.type.slice(1)}
                    </td>
                    <td className="symbol-cell">{order.symbol}</td>
                    <td>{order.quantity}</td>
                    <td className="price-cell">${order.price.toFixed(2)}</td>
                    <td className="total-cell">${order.total.toFixed(2)}</td>
                    <td className="order-type-cell">
                      {order.orderType.charAt(0).toUpperCase() + order.orderType.slice(1)}
                    </td>
                    <td className="status-cell">
                      <span className={`status-badge ${order.status}`}>
                        {getStatusIcon(order.status)}
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                    </td>
                    <td>
                      {order.status === "open" ? (
                        <button
                          className="cancel-btn"
                          onClick={() => cancelOrder(order.id)}
                          title="Cancel order"
                        >
                          Cancel
                        </button>
                      ) : (
                        <span className="no-action">-</span>
                      )}
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

export default Orders;
