import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiBell, FiX, FiCheck, FiAlertCircle, FiInfo, FiCheckCircle, FiExternalLink } from "react-icons/fi";
import { Link } from "react-router-dom";
import axios from "axios";
import { API_ENDPOINTS } from "../config/apiConfig";
import { useAuth } from "../context/AuthContext";
import { usePusher } from "../context/PusherContext";
import "./NotificationsPopup.css";

const NotificationsPopup = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const popupRef = useRef(null);
  const { isAuthenticated } = useAuth();
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

          // Count unread notifications
          const unread = response.data.data.filter(notification => !notification.read).length;
          setUnreadCount(unread);
        }
      } catch (error) {
        console.error("Error fetching notifications:", error);

        // Fallback to empty notifications
        setNotifications([]);
        setUnreadCount(0);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [isAuthenticated]);

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

      // Increment unread count
      setUnreadCount(prevCount => prevCount + 1);
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

      // Update unread count if notification was marked as read
      if (read) {
        setUnreadCount(prevCount => Math.max(0, prevCount - 1));
      }
    };

    // Handle notification deletion
    const handleNotificationDelete = (event) => {
      const { id } = event.detail;

      // Check if the deleted notification was unread
      const deletedNotification = notifications.find(n => n._id === id);
      const wasUnread = deletedNotification && !deletedNotification.read;

      // Remove notification from the list
      setNotifications(prevNotifications =>
        prevNotifications.filter(notification => notification._id !== id)
      );

      // Update unread count if needed
      if (wasUnread) {
        setUnreadCount(prevCount => Math.max(0, prevCount - 1));
      }
    };

    // Handle marking all notifications as read
    const handleMarkAllRead = () => {
      // Update all notifications in the list
      setNotifications(prevNotifications =>
        prevNotifications.map(notification => ({ ...notification, read: true }))
      );

      // Reset unread count
      setUnreadCount(0);
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
  }, [isAuthenticated, notifications]);

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popupRef.current && !popupRef.current.contains(event.target) &&
          !event.target.closest('.notifications-toggle-btn')) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Toggle notifications popup
  const toggleNotifications = () => {
    setIsOpen(!isOpen);
  };

  // Mark notification as read
  const markAsRead = async (id) => {
    if (!isAuthenticated) return;

    try {
      const response = await axios.put(API_ENDPOINTS.NOTIFICATIONS.MARK_READ(id));

      if (response.data.success) {
        // Update will happen via Pusher event
        console.log("Notification marked as read:", id);
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);

      // Fallback to local update
      setNotifications(prevNotifications =>
        prevNotifications.map(notification =>
          notification._id === id ? { ...notification, read: true } : notification
        )
      );

      // Update unread count
      setUnreadCount(prevCount => Math.max(0, prevCount - 1));
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
      }
    } catch (error) {
      console.error("Error marking all notifications as read:", error);

      // Fallback to local update
      setNotifications(prevNotifications =>
        prevNotifications.map(notification => ({ ...notification, read: true }))
      );

      // Reset unread count
      setUnreadCount(0);
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
    <div className="notifications-container">
      <button
        className="notifications-toggle-btn"
        onClick={toggleNotifications}
      >
        <FiBell />
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount}</span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="notifications-popup"
            ref={popupRef}
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <div className="popup-header">
              <h3 className="popup-title">Notifications</h3>
              <div className="popup-actions">
                {unreadCount > 0 && (
                  <button
                    className="mark-all-read-btn"
                    onClick={markAllAsRead}
                    title="Mark all as read"
                  >
                    <FiCheck />
                  </button>
                )}
                <button
                  className="close-popup-btn"
                  onClick={toggleNotifications}
                  title="Close"
                >
                  <FiX />
                </button>
              </div>
            </div>

            <div className="popup-body">
              {loading ? (
                <div className="loading-container">
                  <div className="loading-spinner"></div>
                  <p>Loading notifications...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="empty-notifications">
                  <FiBell className="empty-icon" />
                  <p>No notifications to display</p>
                </div>
              ) : (
                <div className="notifications-list">
                  {notifications.map((notification) => (
                    <div
                      key={notification._id}
                      className={`notification-item ${notification.read ? "read" : "unread"}`}
                      onClick={() => markAsRead(notification._id)}
                    >
                      {getNotificationIcon(notification.type)}
                      <div className="notification-content">
                        <h4 className="notification-title">{notification.title}</h4>
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
                  ))}
                </div>
              )}
            </div>

            <div className="popup-footer">
              <Link to="/notifications" className="view-all-link" onClick={() => setIsOpen(false)}>
                View All Notifications <FiExternalLink />
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationsPopup;
