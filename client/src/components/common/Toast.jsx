import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiCheckCircle, FiAlertCircle, FiInfo, FiX, FiAlertTriangle } from 'react-icons/fi';
import '../../styles/components/common/Toast.css';

const toastVariants = {
  initial: { opacity: 0, y: 50, scale: 0.8 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, scale: 0.8, transition: { duration: 0.2 } }
};

const Toast = ({
  message,
  type = 'success',
  duration = 5000, // Increased to 5 seconds as per requirements
  onClose,
  position = 'top-right' // Changed default position to top-right as per requirements
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      if (onClose) setTimeout(onClose, 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const handleClose = () => {
    setIsVisible(false);
    if (onClose) setTimeout(onClose, 300);
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <FiCheckCircle className="toast-icon success" />;
      case 'error':
        return <FiAlertCircle className="toast-icon error" />;
      case 'warning':
        return <FiAlertTriangle className="toast-icon warning" />;
      case 'info':
        return <FiInfo className="toast-icon info" />;
      default:
        return <FiInfo className="toast-icon info" />;
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className={`toast ${type} ${position}`}
          variants={toastVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        >
          <div className="toast-content">
            {getIcon()}
            <p>{message}</p>
          </div>
          <button className="toast-close" onClick={handleClose}>
            <FiX />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Toast;
