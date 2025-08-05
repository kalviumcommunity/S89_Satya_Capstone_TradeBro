import React from 'react';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import { 
  FiInfo, 
  FiCheckCircle, 
  FiAlertTriangle, 
  FiXCircle, 
  FiAlertCircle,
  FiX,
  FiExternalLink
} from 'react-icons/fi';
import './NotificationToast.css';

/**
 * NotificationToast Component
 * Custom toast notification component with TradeBro styling
 */
const NotificationToast = ({ 
  notification, 
  onClose, 
  onAction,
  theme = 'light' 
}) => {
  // Get icon based on notification type
  const getIcon = (type) => {
    const iconProps = { size: 20 };
    
    switch (type) {
      case 'success':
        return <FiCheckCircle {...iconProps} className="toast-icon success" />;
      case 'error':
        return <FiXCircle {...iconProps} className="toast-icon error" />;
      case 'warning':
        return <FiAlertTriangle {...iconProps} className="toast-icon warning" />;
      case 'alert':
        return <FiAlertCircle {...iconProps} className="toast-icon alert" />;
      case 'info':
      default:
        return <FiInfo {...iconProps} className="toast-icon info" />;
    }
  };

  // Handle action click
  const handleActionClick = () => {
    if (notification.link) {
      window.open(notification.link, '_blank');
    }
    if (onAction) {
      onAction(notification);
    }
  };

  return (
    <motion.div
      className={`notification-toast ${notification.type} ${theme}`}
      initial={{ opacity: 0, x: 300, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 300, scale: 0.9 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      {/* Icon */}
      <div className="toast-icon-container">
        {getIcon(notification.type)}
      </div>

      {/* Content */}
      <div className="toast-content">
        <div className="toast-title">
          {notification.title}
        </div>
        
        {notification.message && (
          <div className="toast-message">
            {notification.message}
          </div>
        )}

        {/* Action Button */}
        {notification.link && (
          <motion.button
            className="toast-action"
            onClick={handleActionClick}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            View Details
            <FiExternalLink size={14} />
          </motion.button>
        )}
      </div>

      {/* Close Button */}
      <motion.button
        className="toast-close"
        onClick={onClose}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <FiX size={16} />
      </motion.button>
    </motion.div>
  );
};

// Toast notification functions
export const showNotificationToast = (notification, theme = 'light') => {
  const toastId = `notification-${notification.id}`;
  
  const toastOptions = {
    toastId,
    position: "top-right",
    autoClose: notification.type === 'error' ? 7000 : 5000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    closeButton: false, // We use custom close button
  };

  // Custom toast content
  const ToastContent = ({ closeToast }) => (
    <NotificationToast
      notification={notification}
      onClose={closeToast}
      theme={theme}
    />
  );

  // Show toast based on type
  switch (notification.type) {
    case 'success':
      return toast.success(ToastContent, toastOptions);
    case 'error':
      return toast.error(ToastContent, toastOptions);
    case 'warning':
      return toast.warning(ToastContent, toastOptions);
    case 'info':
    case 'alert':
    default:
      return toast.info(ToastContent, toastOptions);
  }
};

// Order-specific toast notifications
export const showOrderToast = {
  success: (orderType, symbol, quantity, price, theme = 'light') => {
    const notification = {
      id: Date.now(),
      type: 'success',
      title: `${orderType} Order Executed`,
      message: `${orderType === 'buy' ? 'Bought' : 'Sold'} ${quantity} shares of ${symbol} at ₹${price.toLocaleString('en-IN')}`,
      link: '/orders'
    };
    return showNotificationToast(notification, theme);
  },

  pending: (orderType, symbol, quantity, theme = 'light') => {
    const notification = {
      id: Date.now(),
      type: 'info',
      title: `${orderType} Order Pending`,
      message: `Placing ${orderType} order for ${quantity} shares of ${symbol}`,
      link: '/orders'
    };
    return showNotificationToast(notification, theme);
  },

  error: (message, details, theme = 'light') => {
    const notification = {
      id: Date.now(),
      type: 'error',
      title: 'Order Failed',
      message: details || message,
      link: '/orders'
    };
    return showNotificationToast(notification, theme);
  }
};

// Portfolio toast notifications
export const showPortfolioToast = {
  update: (message, theme = 'light') => {
    const notification = {
      id: Date.now(),
      type: 'info',
      title: 'Portfolio Updated',
      message,
      link: '/portfolio'
    };
    return showNotificationToast(notification, theme);
  },

  milestone: (title, message, theme = 'light') => {
    const notification = {
      id: Date.now(),
      type: 'success',
      title,
      message,
      link: '/portfolio'
    };
    return showNotificationToast(notification, theme);
  }
};

// Market toast notifications
export const showMarketToast = {
  opened: (theme = 'light') => {
    const notification = {
      id: Date.now(),
      type: 'info',
      title: 'Market Open',
      message: 'Trading is now active. You can place orders.',
      link: '/trading'
    };
    return showNotificationToast(notification, theme);
  },

  closed: (theme = 'light') => {
    const notification = {
      id: Date.now(),
      type: 'warning',
      title: 'Market Closed',
      message: 'Trading has ended. Orders will be queued for next session.',
      link: '/trading'
    };
    return showNotificationToast(notification, theme);
  }
};

// Utility functions
export const dismissToast = (toastId) => {
  toast.dismiss(toastId);
};

export const dismissAllToasts = () => {
  toast.dismiss();
};

export default NotificationToast;
