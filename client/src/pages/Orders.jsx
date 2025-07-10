import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FiFilter, FiRefreshCw, FiCheck, FiX, FiClock, FiAlertCircle } from "react-icons/fi";
import PageLayout from "../components/PageLayout";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { API_ENDPOINTS } from "../config/apiConfig";
import "../styles/pages/Orders.css";

const Orders = () => {
  const { success, error: showError } = useToast();
  const { isAuthenticated } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

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
    const fetchOrders = async () => {
      if (!isAuthenticated) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await axios.get(API_ENDPOINTS.ORDERS.ALL);

        if (response.data.success) {
          // Transform the data to match our frontend format
          const formattedOrders = response.data.data.map(order => ({
            id: order._id,
            type: order.type.toLowerCase(),
            symbol: order.stockSymbol,
            name: order.stockName,
            quantity: order.quantity,
            price: order.price,
            total: order.total,
            orderType: order.orderType.toLowerCase(),
            status: order.status.toLowerCase(),
            createdAt: order.createdAt,
            filledAt: order.filledAt,
            cancelledAt: order.cancelledAt
          }));

          setOrders(formattedOrders);
        } else {
          setError("Failed to load orders");
          // Use mock data as fallback
          setOrders(mockOrders);
        }
      } catch (err) {
        console.error("Error fetching orders:", err);
        setError("Failed to load orders. Using sample data instead.");
        // Use mock data as fallback
        setOrders(mockOrders);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [isAuthenticated]);

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
  const refreshOrders = async () => {
    if (!isAuthenticated) {
      showToast("Please log in to refresh orders", "error");
      return;
    }

    setRefreshing(true);
    setError(null);

    try {
      const response = await axios.get(API_ENDPOINTS.ORDERS.ALL);

      if (response.data.success) {
        // Transform the data to match our frontend format
        const formattedOrders = response.data.data.map(order => ({
          id: order._id,
          type: order.type.toLowerCase(),
          symbol: order.stockSymbol,
          name: order.stockName,
          quantity: order.quantity,
          price: order.price,
          total: order.total,
          orderType: order.orderType.toLowerCase(),
          status: order.status.toLowerCase(),
          createdAt: order.createdAt,
          filledAt: order.filledAt,
          cancelledAt: order.cancelledAt
        }));

        setOrders(formattedOrders);
        showToast("Orders refreshed", "success");
      } else {
        setError("Failed to refresh orders");
        showToast("Failed to refresh orders", "error");
      }
    } catch (err) {
      console.error("Error refreshing orders:", err);
      setError("Failed to refresh orders");
      showToast("Failed to refresh orders", "error");
    } finally {
      setRefreshing(false);
    }
  };

  // Cancel order
  const cancelOrder = async (id) => {
    if (!isAuthenticated) {
      showToast("Please log in to cancel orders", "error");
      return;
    }

    try {
      const response = await axios.post(API_ENDPOINTS.ORDERS.CANCEL(id));

      if (response.data.success) {
        // Update the order in the local state
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
      } else {
        showToast(response.data.message || "Failed to cancel order", "error");
      }
    } catch (err) {
      console.error("Error cancelling order:", err);
      showToast("Failed to cancel order", "error");

      // Fallback to local implementation if API fails
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
      showToast("Order cancelled (local only)", "warning");
    }
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
        ) : error ? (
          <div className="error-container">
            <FiAlertCircle className="error-icon" />
            <p>{error}</p>
          </div>
        ) : !isAuthenticated ? (
          <div className="empty-orders">
            <p>Please log in to view your orders.</p>
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
