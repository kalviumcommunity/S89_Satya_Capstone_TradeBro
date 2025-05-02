import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiBell, FiX, FiCheck, FiAlertCircle, FiInfo, FiCheckCircle, FiExternalLink } from "react-icons/fi";
import { Link } from "react-router-dom";
import "./NotificationsPopup.css";

const NotificationsPopup = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const popupRef = useRef(null);

  // Fetch notifications (mock data)
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
            }
          ];
          setNotifications(mockNotifications);
          setLoading(false);
          
          // Count unread notifications
          const unread = mockNotifications.filter(notification => !notification.read).length;
          setUnreadCount(unread);
        }, 1000);
      } catch (error) {
        console.error("Error fetching notifications:", error);
        setLoading(false);
      }
    };

    fetchNotifications();
    
    // Set up interval to periodically check for new notifications
    const intervalId = setInterval(() => {
      // In a real app, you would call the API again here
      console.log("Checking for new notifications...");
    }, 60000); // Check every minute
    
    return () => clearInterval(intervalId);
  }, []);

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
  const markAsRead = (id) => {
    setNotifications(prevNotifications =>
      prevNotifications.map(notification =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
    
    // Update unread count
    setUnreadCount(prevCount => Math.max(0, prevCount - 1));
  };

  // Mark all as read
  const markAllAsRead = () => {
    setNotifications(prevNotifications =>
      prevNotifications.map(notification => ({ ...notification, read: true }))
    );
    
    // Reset unread count
    setUnreadCount(0);
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
                      key={notification.id} 
                      className={`notification-item ${notification.read ? "read" : "unread"}`}
                      onClick={() => markAsRead(notification.id)}
                    >
                      {getNotificationIcon(notification.type)}
                      <div className="notification-content">
                        <h4 className="notification-title">{notification.title}</h4>
                        <p className="notification-message">{notification.message}</p>
                        <span className="notification-time">{formatTimestamp(notification.timestamp)}</span>
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
