import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiBell, FiCheck, FiTrash2, FiAlertCircle, FiInfo, FiCheckCircle, FiExternalLink } from "react-icons/fi";
import axios from "axios";
import { API_ENDPOINTS } from "../config/apiConfig";
import { useAuth } from "../context/AuthContext";
import { usePusher } from "../context/PusherContext.jsx";
import { useToast } from "../hooks/useToast";
import PageLayout from "../components/PageLayout";
import "../styles/pages/Notifications.css";

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const { isAuthenticated } = useAuth();
  const toast = useToast();
  usePusher(); // Initialize Pusher connection

  // Fetch notifications from API
  useEffect(() => {
    const fetchNotifications = async () => {
      if (!isAuthenticated) return;

      setLoading(true);
      try {
        const response = await axios.get(API_ENDPOINTS.NOTIFICATIONS.ALL);
        if (response.data.success) {
          setNotifications(response.data.data);
        } else {
          toast.error("Failed to fetch notifications");
          setNotifications([]);
        }
      } catch (error) {
        console.error("Error fetching notifications:", error);
        toast.error("Failed to load notifications");
        setNotifications([]);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [isAuthenticated, toast]);

  // Listen for real-time notification events
  useEffect(() => {
    if (!isAuthenticated) return;

    // Handle new notification
    const handleNewNotification = (event) => {
      const newNotification = event.detail;

      // Add new notification to the list
      setNotifications(prevNotifications =>
        [newNotification, ...prevNotifications]
      );

      // Show toast for new notification
      toast.info(`New notification: ${newNotification.title}`);
    };

    // Handle notification update (mark as read)
    const handleNotificationUpdate = (event) => {
      const { id, read } = event.detail;

      // Update notification in the list
      setNotifications(prevNotifications =>
        prevNotifications.map(notification =>
          notification._id === id ? { ...notification, read } : notification
        )
      );
    };

    // Handle notification deletion
    const handleNotificationDelete = (event) => {
      const { id } = event.detail;

      // Remove notification from the list
      setNotifications(prevNotifications =>
        prevNotifications.filter(notification => notification._id !== id)
      );
    };

    // Handle marking all notifications as read
    const handleMarkAllRead = () => {
      // Update all notifications in the list
      setNotifications(prevNotifications =>
        prevNotifications.map(notification => ({ ...notification, read: true }))
      );
    };

    // Add event listeners
    window.addEventListener('new-notification', handleNewNotification);
    window.addEventListener('notification-update', handleNotificationUpdate);
    window.addEventListener('notification-delete', handleNotificationDelete);
    window.addEventListener('notifications-read-all', handleMarkAllRead);

    // Clean up event listeners
    return () => {
      window.removeEventListener('new-notification', handleNewNotification);
      window.removeEventListener('notification-update', handleNotificationUpdate);
      window.removeEventListener('notification-delete', handleNotificationDelete);
      window.removeEventListener('notifications-read-all', handleMarkAllRead);
    };
  }, [isAuthenticated, toast]);

  // Filter notifications
  const filteredNotifications = notifications.filter(notification => {
    if (filter === "all") return true;
    if (filter === "unread") return !notification.read;
    return notification.type === filter;
  });

  // Mark notification as read
  const markAsRead = async (id) => {
    if (!isAuthenticated) return;

    try {
      const response = await axios.put(API_ENDPOINTS.NOTIFICATIONS.MARK_READ(id));

      if (response.data.success) {
        // Update will happen via Pusher event
        console.log("Notification marked as read:", id);
      } else {
        toast.error("Failed to mark notification as read");
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
      toast.error("Failed to update notification");

      // Fallback to local update
      setNotifications(prevNotifications =>
        prevNotifications.map(notification =>
          notification._id === id ? { ...notification, read: true } : notification
        )
      );
    }
  };

  // Delete notification
  const deleteNotification = async (id) => {
    if (!isAuthenticated) return;

    try {
      const response = await axios.delete(API_ENDPOINTS.NOTIFICATIONS.DELETE(id));

      if (response.data.success) {
        // Update will happen via Pusher event
        console.log("Notification deleted:", id);
        toast.info("Notification deleted");
      } else {
        toast.error("Failed to delete notification");
      }
    } catch (error) {
      console.error("Error deleting notification:", error);
      toast.error("Failed to delete notification");

      // Fallback to local update
      setNotifications(prevNotifications =>
        prevNotifications.filter(notification => notification._id !== id)
      );
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    if (!isAuthenticated) return;

    try {
      const response = await axios.put(API_ENDPOINTS.NOTIFICATIONS.MARK_ALL_READ);

      if (response.data.success) {
        // Update will happen via Pusher event
        console.log("All notifications marked as read");
        toast.success(`${response.data.count} notifications marked as read`);
      } else {
        toast.error("Failed to update notifications");
      }
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      toast.error("Failed to update notifications");

      // Fallback to local update
      setNotifications(prevNotifications =>
        prevNotifications.map(notification => ({ ...notification, read: true }))
      );
    }
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
                  key={notification._id}
                  className={`notification-item ${notification.read ? "read" : "unread"}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                  transition={{ duration: 0.3 }}
                  layout
                >
                  <div className="notification-content" onClick={() => markAsRead(notification._id)}>
                    {getNotificationIcon(notification.type)}
                    <div className="notification-details">
                      <h3 className="notification-title">{notification.title}</h3>
                      <p className="notification-message">{notification.message}</p>
                      <span className="notification-time">{formatTimestamp(notification.createdAt)}</span>
                      {notification.link && (
                        <a
                          href={notification.link}
                          className="notification-link"
                          onClick={(e) => e.stopPropagation()}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          View Details <FiExternalLink />
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="notification-actions">
                    {!notification.read && (
                      <button
                        className="action-btn read-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsRead(notification._id);
                        }}
                        title="Mark as read"
                      >
                        <FiCheck />
                      </button>
                    )}
                    <button
                      className="action-btn delete-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(notification._id);
                      }}
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
