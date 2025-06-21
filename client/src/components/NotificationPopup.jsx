import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiBell, FiInfo, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';
import '../styles/components/NotificationPopup.css';

/**
 * NotificationPopup component
 * 
 * Displays a popup notification that automatically disappears after a set duration
 * 
 * @param {Object} props - Component props
 * @param {string} props.type - Notification type (info, success, warning, error)
 * @param {string} props.message - Notification message
 * @param {string} props.title - Notification title
 * @param {number} props.duration - Duration in milliseconds before the notification disappears
 * @param {Function} props.onClose - Function to call when notification is closed
 */
const NotificationPopup = ({ 
  type = 'info', 
  message, 
  title, 
  duration = 5000, 
  onClose 
}) => {
  const [isVisible, setIsVisible] = useState(true);

  // Auto-close notification after duration
  useEffect(() => {
    if (!duration) return;
    
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => {
        if (onClose) onClose();
      }, 300); // Wait for exit animation to complete
    }, duration);
    
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  // Handle manual close
  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      if (onClose) onClose();
    }, 300); // Wait for exit animation to complete
  };

  // Get icon based on notification type
  const getIcon = () => {
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

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className={`notification-popup ${type}`}
          initial={{ opacity: 0, y: -20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.9 }}
          transition={{ duration: 0.3 }}
        >
          <div className="notification-content">
            {getIcon()}
            <div className="notification-text">
              {title && <h4 className="notification-title">{title}</h4>}
              <p className="notification-message">{message}</p>
            </div>
            <button className="notification-close" onClick={handleClose}>
              <FiX />
            </button>
          </div>
          <motion.div 
            className="notification-progress"
            initial={{ width: '100%' }}
            animate={{ width: '0%' }}
            transition={{ duration: duration / 1000, ease: 'linear' }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default NotificationPopup;
