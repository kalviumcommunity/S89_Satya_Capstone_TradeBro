import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiBell, FiCheck, FiTrash2, FiAlertCircle, FiInfo, FiCheckCircle } from "react-icons/fi";
import PageLayout from "../components/PageLayout";
import "./Notifications.css";

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  // Mock notifications data (replace with actual API call)
  useEffect(() => {
    const fetchNotifications = async () => {
      setLoading(true);
      try {
        // In a real app, replace this with an actual API call
        // const response = await axios.get('https://api.example.com/notifications');
        // setNotifications(response.data);

        // Mock data for demonstration
        setTimeout(() => {
          const mockNotifications = [
            {
              id: 1,
              type: "alert",
              title: "Price Alert: AAPL",
              message: "Apple Inc. has reached your target price of $180.",
              timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
              read: false
            },
            {
              id: 2,
              type: "info",
              title: "Market Update",
              message: "US markets have opened higher today with the S&P 500 up 0.5%.",
              timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
              read: true
            },
            {
              id: 3,
              type: "success",
              title: "Order Executed",
              message: "Your buy order for 10 shares of MSFT has been successfully executed.",
              timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), // 5 hours ago
              read: false
            },
            {
              id: 4,
              type: "alert",
              title: "Unusual Activity",
              message: "We've detected unusual trading activity in your account. Please verify recent transactions.",
              timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
              read: false
            },
            {
              id: 5,
              type: "info",
              title: "New Feature Available",
              message: "Check out our new portfolio analysis tools now available in your dashboard.",
              timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 2 days ago
              read: true
            },
            {
              id: 6,
              type: "success",
              title: "Dividend Payment",
              message: "A dividend of $45.30 from your investments has been credited to your account.",
              timestamp: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(), // 3 days ago
              read: true
            }
          ];
          setNotifications(mockNotifications);
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error("Error fetching notifications:", error);
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  // Filter notifications
  const filteredNotifications = notifications.filter(notification => {
    if (filter === "all") return true;
    if (filter === "unread") return !notification.read;
    return notification.type === filter;
  });

  // Mark notification as read
  const markAsRead = (id) => {
    setNotifications(prevNotifications =>
      prevNotifications.map(notification =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
  };

  // Delete notification
  const deleteNotification = (id) => {
    setNotifications(prevNotifications =>
      prevNotifications.filter(notification => notification.id !== id)
    );
  };

  // Mark all as read
  const markAllAsRead = () => {
    setNotifications(prevNotifications =>
      prevNotifications.map(notification => ({ ...notification, read: true }))
    );
  };

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) {
      return "Just now";
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    }
  };

  // Get icon based on notification type
  const getNotificationIcon = (type) => {
    switch (type) {
      case "alert":
        return <FiAlertCircle className="notification-icon alert" />;
      case "info":
        return <FiInfo className="notification-icon info" />;
      case "success":
        return <FiCheckCircle className="notification-icon success" />;
      default:
        return <FiBell className="notification-icon" />;
    }
  };

  return (
    <PageLayout>
      <div className="notifications-container">
        <div className="notifications-header">
          <h1>Notifications</h1>
          <div className="notifications-actions">
            <button className="mark-all-read" onClick={markAllAsRead}>
              <FiCheck /> Mark all as read
            </button>
          </div>
        </div>

        <div className="notifications-filters">
          <button
            className={`filter-btn ${filter === "all" ? "active" : ""}`}
            onClick={() => setFilter("all")}
          >
            All
          </button>
          <button
            className={`filter-btn ${filter === "unread" ? "active" : ""}`}
            onClick={() => setFilter("unread")}
          >
            Unread
          </button>
          <button
            className={`filter-btn ${filter === "alert" ? "active" : ""}`}
            onClick={() => setFilter("alert")}
          >
            Alerts
          </button>
          <button
            className={`filter-btn ${filter === "info" ? "active" : ""}`}
            onClick={() => setFilter("info")}
          >
            Info
          </button>
          <button
            className={`filter-btn ${filter === "success" ? "active" : ""}`}
            onClick={() => setFilter("success")}
          >
            Success
          </button>
        </div>

        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading notifications...</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="empty-notifications">
            <FiBell className="empty-icon" />
            <p>No notifications to display</p>
          </div>
        ) : (
          <div className="notifications-list">
            <AnimatePresence>
              {filteredNotifications.map((notification) => (
                <motion.div
                  key={notification.id}
                  className={`notification-item ${notification.read ? "read" : "unread"}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                  transition={{ duration: 0.3 }}
                  layout
                >
                  <div className="notification-content" onClick={() => markAsRead(notification.id)}>
                    {getNotificationIcon(notification.type)}
                    <div className="notification-details">
                      <h3 className="notification-title">{notification.title}</h3>
                      <p className="notification-message">{notification.message}</p>
                      <span className="notification-time">{formatTimestamp(notification.timestamp)}</span>
                    </div>
                  </div>
                  <div className="notification-actions">
                    {!notification.read && (
                      <button
                        className="action-btn read-btn"
                        onClick={() => markAsRead(notification.id)}
                        title="Mark as read"
                      >
                        <FiCheck />
                      </button>
                    )}
                    <button
                      className="action-btn delete-btn"
                      onClick={() => deleteNotification(notification.id)}
                      title="Delete notification"
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </PageLayout>
  );
};

export default Notifications;
