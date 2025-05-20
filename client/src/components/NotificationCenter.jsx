import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiBell, FiX, FiCheck, FiTrash2, FiSettings, FiInfo, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';
import '../styles/components/NotificationCenter.css';

/**
 * NotificationCenter component
 * 
 * Displays a notification center with a list of notifications
 * 
 * @param {Object} props - Component props
 * @param {Array} props.notifications - Array of notification objects
 * @param {Function} props.onMarkAsRead - Function to mark a notification as read
 * @param {Function} props.onMarkAllAsRead - Function to mark all notifications as read
 * @param {Function} props.onDelete - Function to delete a notification
 * @param {Function} props.onClearAll - Function to clear all notifications
 */
const NotificationCenter = ({
  notifications = [],
  onMarkAsRead,
  onMarkAllAsRead,
  onDelete,
  onClearAll
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Calculate unread count
  useEffect(() => {
    setUnreadCount(notifications.filter(notification => !notification.read).length);
  }, [notifications]);

  // Toggle notification center
  const toggleNotificationCenter = () => {
    setIsOpen(!isOpen);
  };

  // Close notification center
  const closeNotificationCenter = () => {
    setIsOpen(false);
  };

  // Get icon based on notification type
  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return <FiCheckCircle className="notification-icon success" />;
      case 'warning':
        return <FiAlertCircle className="notification-icon warning" />;
      case 'error':
        return <FiAlertCircle className="notification-icon error" />;
      case 'info':
      default:
        return <FiInfo className="notification-icon info" />;
    }
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) {
      return 'Just now';
    } else if (diffMin < 60) {
      return `${diffMin} min ago`;
    } else if (diffHour < 24) {
      return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
    } else if (diffDay < 7) {
      return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <div className="notification-center-container">
      <button 
        className="notification-bell-button" 
        onClick={toggleNotificationCenter}
        aria-label="Notifications"
      >
        <FiBell />
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount}</span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              className="notification-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeNotificationCenter}
            />
            
            <motion.div
              className="notification-center"
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <div className="notification-center-header">
                <h3>Notifications</h3>
                <div className="notification-center-actions">
                  <button 
                    className="notification-center-action"
                    onClick={onMarkAllAsRead}
                    disabled={unreadCount === 0}
                    aria-label="Mark all as read"
                  >
                    <FiCheck />
                  </button>
                  <button 
                    className="notification-center-action"
                    onClick={onClearAll}
                    disabled={notifications.length === 0}
                    aria-label="Clear all notifications"
                  >
                    <FiTrash2 />
                  </button>
                  <button 
                    className="notification-center-action"
                    onClick={closeNotificationCenter}
                    aria-label="Close notification center"
                  >
                    <FiX />
                  </button>
                </div>
              </div>

              <div className="notification-center-content">
                {notifications.length === 0 ? (
                  <div className="notification-empty">
                    <p>No notifications</p>
                  </div>
                ) : (
                  <ul className="notification-list">
                    {notifications.map((notification) => (
                      <li 
                        key={notification.id} 
                        className={`notification-item ${notification.read ? 'read' : 'unread'}`}
                      >
                        <div className="notification-item-content">
                          {getIcon(notification.type)}
                          <div className="notification-item-text">
                            <h4 className="notification-item-title">{notification.title}</h4>
                            <p className="notification-item-message">{notification.message}</p>
                            <span className="notification-item-time">{formatDate(notification.timestamp)}</span>
                          </div>
                        </div>
                        <div className="notification-item-actions">
                          {!notification.read && (
                            <button 
                              className="notification-item-action"
                              onClick={() => onMarkAsRead(notification.id)}
                              aria-label="Mark as read"
                            >
                              <FiCheck />
                            </button>
                          )}
                          <button 
                            className="notification-item-action"
                            onClick={() => onDelete(notification.id)}
                            aria-label="Delete notification"
                          >
                            <FiTrash2 />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationCenter;
