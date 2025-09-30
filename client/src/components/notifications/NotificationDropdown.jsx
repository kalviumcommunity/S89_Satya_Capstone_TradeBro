import React, { useCallback } from 'react';
import { motion } from 'framer-motion';
import { FiCheck, FiExternalLink, FiSettings, FiCheckCircle } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { useNotifications } from '../../contexts/NotificationContext';
import NotificationItem from './NotificationItem';
import './NotificationDropdown.css';

/**
 * NotificationDropdown Component
 * Displays a dropdown with recent notifications and actions
 */
const NotificationDropdown = ({ 
  notifications = [], 
  unreadCount = 0, 
  loading = false,
  onClose // Prop to handle closing the dropdown, e.g., on click of view all
}) => {
  const { markAsRead, deleteNotification, markAllAsRead } = useNotifications();

  // Get recent notifications (limit to 5 for dropdown)
  const recentNotifications = notifications.slice(0, 5);

  // Handle notification click and navigation
  const handleNotificationClick = useCallback(async (notification) => {
    try {
      if (!notification.read) {
        await markAsRead(notification.id);
      }
      if (notification.link) {
        window.location.href = notification.link;
      }
      onClose(); // Close the dropdown after the click action
    } catch (error) {
      console.error('Failed to handle notification click:', error);
    }
  }, [markAsRead, onClose]);

  // Handle delete notification
  const handleDeleteNotification = useCallback(async (notificationId, event) => {
    event.stopPropagation(); // Prevents the parent handleNotificationClick from firing
    try {
      await deleteNotification(notificationId);
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  }, [deleteNotification]);

  // Handle mark all as read action
  const handleMarkAllAsRead = useCallback(async () => {
    try {
      await markAllAsRead();
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  }, [markAllAsRead]);

  return (
    <div className="notification-dropdown">
      {/* Header */}
      <div className="dropdown-header">
        <div className="header-content">
          <h3 className="dropdown-title">Notifications</h3>
          {unreadCount > 0 && (
            <span className="unread-count">{unreadCount} new</span>
          )}
        </div>
        
        <div className="header-actions">
          {unreadCount > 0 && (
            <motion.button
              className="mark-all-read-btn"
              onClick={handleMarkAllAsRead}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title="Mark all as read"
              aria-label="Mark all notifications as read"
            >
              <FiCheck size={16} />
            </motion.button>
          )}
          
          <Link to="/settings" className="settings-btn" title="Notification settings" onClick={onClose}>
            <FiSettings size={16} />
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="dropdown-content">
        {loading ? (
          <div className="dropdown-loading">
            <div className="loading-spinner"></div>
            <span>Loading notifications...</span>
          </div>
        ) : recentNotifications.length > 0 ? (
          <>
            <div className="notification-list">
              {recentNotifications.map((notification, index) => (
                <motion.div
                  key={notification._id || notification.id} // Use _id or id for unique key
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <NotificationItem
                    notification={notification}
                    onClick={() => handleNotificationClick(notification)}
                    onDelete={(e) => handleDeleteNotification(notification._id || notification.id, e)}
                    compact={true}
                  />
                </motion.div>
              ))}
            </div>

            <div className="dropdown-footer">
              <Link to="/notifications" className="view-all-btn" onClick={onClose}>
                View all notifications
                <FiExternalLink size={14} />
              </Link>
            </div>
          </>
        ) : (
          <div className="empty-state">
            <div className="empty-icon"><FiCheckCircle size={32} /></div>
            <h4>All caught up!</h4>
            <p>You have no new notifications</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationDropdown;