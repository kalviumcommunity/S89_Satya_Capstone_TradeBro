import React from 'react';
import { motion } from 'framer-motion';
import PropTypes from 'prop-types';
import '../styles/components/EnhancedLoading.css';

/**
 * EnhancedLoading component with multiple animation styles
 * 
 * @param {Object} props - Component props
 * @param {string} props.type - Animation type: 'dots', 'pulse', 'spinner', 'wave', 'gradient'
 * @param {string} props.size - Size of the loading animation: 'small', 'medium', 'large'
 * @param {boolean} props.overlay - Whether to show as a full-screen overlay
 * @param {string} props.text - Text to display with the loading animation
 * @param {string} props.color - Primary color for the animation (CSS color)
 * @param {string} props.className - Additional CSS class
 */
const EnhancedLoading = ({
  type = 'dots',
  size = 'medium',
  overlay = false,
  text = 'Loading...',
  color = '#55828b', // Using the preferred color
  className = ''
}) => {
  // Size mapping
  const getSizeValue = () => {
    switch (size) {
      case 'small': return { container: 'small', element: 8 };
      case 'large': return { container: 'large', element: 16 };
      case 'medium':
      default: return { container: 'medium', element: 12 };
    }
  };

  const sizeValue = getSizeValue();

  // Render different loading animations based on type
  const renderLoadingAnimation = () => {
    switch (type) {
      case 'pulse':
        return (
          <div className="enhanced-loading-pulse">
            <motion.div
              className="pulse-circle"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.7, 1, 0.7]
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              style={{ backgroundColor: color }}
            />
            <motion.div
              className="pulse-circle"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.7, 1, 0.7]
              }}
              transition={{
                duration: 1.5,
                delay: 0.2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              style={{ backgroundColor: color }}
            />
            <motion.div
              className="pulse-circle"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.7, 1, 0.7]
              }}
              transition={{
                duration: 1.5,
                delay: 0.4,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              style={{ backgroundColor: color }}
            />
          </div>
        );

      case 'spinner':
        return (
          <div className="enhanced-loading-spinner">
            <motion.div
              className="spinner-ring"
              animate={{ rotate: 360 }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "linear"
              }}
              style={{ borderTopColor: color }}
            />
          </div>
        );

      case 'wave':
        return (
          <div className="enhanced-loading-wave">
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                className="wave-bar"
                animate={{ height: ["40%", "100%", "40%"] }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  delay: i * 0.1,
                  ease: "easeInOut"
                }}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        );

      case 'gradient':
        return (
          <div className="enhanced-loading-gradient">
            <motion.div
              className="gradient-circle"
              animate={{ 
                rotate: 360,
                background: [
                  `conic-gradient(from 0deg, ${color}, transparent)`,
                  `conic-gradient(from 360deg, ${color}, transparent)`
                ]
              }}
              transition={{
                rotate: {
                  duration: 2,
                  repeat: Infinity,
                  ease: "linear"
                },
                background: {
                  duration: 2,
                  repeat: Infinity,
                  ease: "linear"
                }
              }}
            />
          </div>
        );

      case 'dots':
      default:
        return (
          <div className="enhanced-loading-dots">
            <motion.div
              className="loading-dot"
              animate={{ y: ["0%", "100%", "0%"] }}
              transition={{
                duration: 0.6,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              style={{ backgroundColor: color }}
            />
            <motion.div
              className="loading-dot"
              animate={{ y: ["0%", "100%", "0%"] }}
              transition={{
                duration: 0.6,
                delay: 0.15,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              style={{ backgroundColor: color }}
            />
            <motion.div
              className="loading-dot"
              animate={{ y: ["0%", "100%", "0%"] }}
              transition={{
                duration: 0.6,
                delay: 0.3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              style={{ backgroundColor: color }}
            />
          </div>
        );
    }
  };

  return (
    <div className={`enhanced-loading-container ${sizeValue.container} ${overlay ? 'overlay' : ''} ${className}`}>
      {renderLoadingAnimation()}
      {text && <motion.p 
        className="loading-text"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        {text}
      </motion.p>}
    </div>
  );
};

EnhancedLoading.propTypes = {
  type: PropTypes.oneOf(['dots', 'pulse', 'spinner', 'wave', 'gradient']),
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  overlay: PropTypes.bool,
  text: PropTypes.string,
  color: PropTypes.string,
  className: PropTypes.string
};

export default EnhancedLoading;
