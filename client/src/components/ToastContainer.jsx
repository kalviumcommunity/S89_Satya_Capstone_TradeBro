import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { FiCheckCircle, FiAlertCircle, FiInfo, FiAlertTriangle, FiX } from 'react-icons/fi';
import { removeToast } from '../redux/reducers/toastReducer';
import '../styles/components/ToastContainer.css';

const ToastContainer = () => {
  const { toasts } = useSelector(state => state.toast);
  const dispatch = useDispatch();

  // Handle toast removal
  const handleRemoveToast = (id) => {
    dispatch(removeToast(id));
  };

  // Auto-remove toasts after their duration
  useEffect(() => {
    if (toasts.length > 0) {
      const timers = toasts.map(toast => {
        return setTimeout(() => {
          handleRemoveToast(toast.id);
        }, toast.duration);
      });

      // Clean up timers
      return () => {
        timers.forEach(timer => clearTimeout(timer));
      };
    }
  }, [toasts]);

  // Get icon based on toast type
  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return <FiCheckCircle />;
      case 'error':
        return <FiAlertCircle />;
      case 'warning':
        return <FiAlertTriangle />;
      case 'info':
      default:
        return <FiInfo />;
    }
  };

  return (
    <div className="toast-container">
      <AnimatePresence>
        {toasts.map(toast => (
          <motion.div
            key={toast.id}
            className={`toast toast-${toast.type}`}
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9, transition: { duration: 0.2 } }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          >
            <div className="toast-icon">
              {getIcon(toast.type)}
            </div>
            <div className="toast-content">
              <p>{toast.message}</p>
            </div>
            <button
              className="toast-close"
              onClick={() => handleRemoveToast(toast.id)}
            >
              <FiX />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default ToastContainer;
