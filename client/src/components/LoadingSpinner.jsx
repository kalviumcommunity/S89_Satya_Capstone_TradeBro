import React from 'react';
import { motion } from 'framer-motion';
import { FiLoader } from 'react-icons/fi';
import './LoadingSpinner.css';

const LoadingSpinner = ({ 
  size = 'medium', 
  text = 'Loading...', 
  fullScreen = false,
  transparent = false
}) => {
  // Determine size in pixels
  const sizeMap = {
    small: 24,
    medium: 40,
    large: 60,
    xlarge: 80
  };
  
  const iconSize = sizeMap[size] || sizeMap.medium;
  
  // Spinner animation
  const spinTransition = {
    repeat: Infinity,
    ease: "linear",
    duration: 1
  };
  
  // Container classes
  const containerClasses = `loading-spinner-container ${fullScreen ? 'fullscreen' : ''} ${transparent ? 'transparent' : ''}`;
  
  return (
    <div className={containerClasses}>
      <div className="loading-spinner-content">
        <motion.div
          animate={{ rotate: 360 }}
          transition={spinTransition}
          className="spinner-icon"
        >
          <FiLoader size={iconSize} />
        </motion.div>
        
        {text && (
          <motion.p 
            className="loading-text"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {text}
          </motion.p>
        )}
      </div>
    </div>
  );
};

export default LoadingSpinner;
