import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  FiInfo, 
  FiCheckCircle, 
  FiAlertTriangle, 
  FiXCircle, 
  FiAlertCircle,
  FiX,
  FiExternalLink,
  FiClock
} from 'react-icons/fi';
import './NotificationItem.css';

/**
 * NotificationItem Component
 * Displays individual notification with appropriate styling and actions
 */
const NotificationItem = ({ 
  notification, 
  onClick, 
  onDelete, 
  onMarkAsRead,
  compact = false,
  showActions = true 
}) => {
  // Get icon based on notification type
  const getNotificationIcon = (type) => {
    const iconProps = { size: compact ? 16 : 20 };
    
    switch (type) {
      case 'success':
        return <FiCheckCircle {...iconProps} className="icon-success" />;
      case 'error':
        return <FiXCircle {...iconProps} className="icon-error" />;
      case 'warning':
        return <FiAlertTriangle {...iconProps} className="icon-warning" />;
      case 'alert':
        return <FiAlertCircle {...iconProps} className="icon-alert" />;
      case 'info':
      default:
        return <FiInfo {...iconProps} className="icon-info" />;
    }
  };

  // Format timestamp
  const formatTimestamp = useCallback((timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  }, []);

  // Use useCallback for event handlers to prevent re-creation
  const handleClick = useCallback(() => {
    if (onClick) {
      onClick(notification);
    }
  }, [onClick, notification]);

  const handleDelete = useCallback((e) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(e);
    }
  }, [onDelete]);

  const handleMarkAsRead = useCallback((e) => {
    e.stopPropagation();
    if (onMarkAsRead) {
      onMarkAsRead(notification.id);
    }
  }, [onMarkAsRead, notification.id]);

  return (
    <motion.div
      className={`notification-item ${compact ? 'compact' : ''} ${notification.read ? 'read' : 'unread'} ${notification.type}`}
      onClick={handleClick}
      // Simplified hover logic using Framer Motion's whileHover prop
      whileHover={{ backgroundColor: 'var(--notification-hover-bg)' }}
      layout
    >
      {/* Unread Indicator */}
      {!notification.read && (
        <div className="unread-indicator" />
      )}

      {/* Content */}
      <div className="notification-content">
        {/* Icon */}
        <div className="notification-icon">
          {getNotificationIcon(notification.type)}
        </div>

        {/* Text Content */}
        <div className="notification-text">
          <div className="notification-title">
            {notification.title}
          </div>
          
          {notification.message && (
            <div className="notification-message">
              {notification.message}
            </div>
          )}

          {/* Metadata */}
          <div className="notification-meta">
            <span className="notification-time">
              <FiClock size={12} />
              {formatTimestamp(notification.createdAt)}
            </span>
            
            {notification.link && (
              <span className="notification-link">
                <FiExternalLink size={12} />
                View details
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        {showActions && (
          // Use CSS :hover to show/hide actions instead of useState
          <div className="notification-actions">
            {!notification.read && onMarkAsRead && (
              <motion.button
                className="action-btn mark-read"
                onClick={handleMarkAsRead}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                title="Mark as read"
                aria-label="Mark as read"
              >
                <FiCheckCircle size={14} />
              </motion.button>
            )}
            
            {onDelete && (
              <motion.button
                className="action-btn delete"
                onClick={handleDelete}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                title="Delete notification"
                aria-label="Delete notification"
              >
                <FiX size={14} />
              </motion.button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default NotificationItem;