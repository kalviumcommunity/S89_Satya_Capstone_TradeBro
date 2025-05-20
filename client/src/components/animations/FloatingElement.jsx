import React from 'react';
import { motion } from 'framer-motion';
import PropTypes from 'prop-types';

/**
 * FloatingElement component that adds a floating animation to its children
 * Enhanced with more animation patterns and customization options
 */
const FloatingElement = ({
  children,
  amplitude = 10,
  duration = 3,
  delay = 0,
  pattern = 'upDown',
  rotate = false,
  rotateAmplitude = 5,
  scale = false,
  scaleAmplitude = 0.05,
  className = '',
  ...props
}) => {
  // Define floating animation patterns
  const getAnimationPattern = () => {
    switch (pattern) {
      case 'upDown':
        return {
          y: [-amplitude, amplitude, -amplitude],
          ...(rotate && { rotate: [-rotateAmplitude, rotateAmplitude, -rotateAmplitude] }),
          ...(scale && { scale: [1, 1 + scaleAmplitude, 1] }),
          transition: {
            duration,
            delay,
            repeat: Infinity,
            repeatType: 'loop',
            ease: 'easeInOut',
            times: [0, 0.5, 1]
          }
        };
      case 'leftRight':
        return {
          x: [-amplitude, amplitude, -amplitude],
          ...(rotate && { rotate: [-rotateAmplitude, rotateAmplitude, -rotateAmplitude] }),
          ...(scale && { scale: [1, 1 + scaleAmplitude, 1] }),
          transition: {
            duration,
            delay,
            repeat: Infinity,
            repeatType: 'loop',
            ease: 'easeInOut',
            times: [0, 0.5, 1]
          }
        };
      case 'circular':
        return {
          y: [-amplitude, 0, amplitude, 0, -amplitude],
          x: [0, amplitude, 0, -amplitude, 0],
          ...(rotate && { rotate: [-rotateAmplitude, 0, rotateAmplitude, 0, -rotateAmplitude] }),
          ...(scale && { scale: [1, 1 + scaleAmplitude/2, 1 + scaleAmplitude, 1 + scaleAmplitude/2, 1] }),
          transition: {
            duration,
            delay,
            repeat: Infinity,
            repeatType: 'loop',
            ease: 'easeInOut',
            times: [0, 0.25, 0.5, 0.75, 1]
          }
        };
      case 'figure8':
        return {
          y: [-amplitude, amplitude, -amplitude],
          x: [amplitude, -amplitude, amplitude],
          ...(rotate && { rotate: [-rotateAmplitude, rotateAmplitude, -rotateAmplitude] }),
          ...(scale && { scale: [1, 1 + scaleAmplitude, 1] }),
          transition: {
            duration,
            delay,
            repeat: Infinity,
            repeatType: 'loop',
            ease: 'easeInOut',
            times: [0, 0.5, 1]
          }
        };
      case 'pulse':
        return {
          scale: [1, 1 + (scaleAmplitude * 2), 1],
          transition: {
            duration,
            delay,
            repeat: Infinity,
            repeatType: 'loop',
            ease: 'easeInOut',
            times: [0, 0.5, 1]
          }
        };
      case 'bounce':
        return {
          y: [0, -amplitude, 0],
          transition: {
            duration,
            delay,
            repeat: Infinity,
            repeatType: 'loop',
            ease: [0.25, 0.1, 0.25, 1.0],
            times: [0, 0.4, 1]
          }
        };
      default:
        return {
          y: [-amplitude, amplitude, -amplitude],
          transition: {
            duration,
            delay,
            repeat: Infinity,
            repeatType: 'loop',
            ease: 'easeInOut',
            times: [0, 0.5, 1]
          }
        };
    }
  };

  // Define floating animation variants
  const floatingVariants = {
    initial: { y: 0, x: 0, scale: 1, rotate: 0 },
    animate: getAnimationPattern()
  };

  return (
    <motion.div
      className={className}
      initial="initial"
      animate="animate"
      variants={floatingVariants}
      {...props}
    >
      {children}
    </motion.div>
  );
};

FloatingElement.propTypes = {
  children: PropTypes.node.isRequired,
  amplitude: PropTypes.number,
  duration: PropTypes.number,
  delay: PropTypes.number,
  pattern: PropTypes.oneOf(['upDown', 'leftRight', 'circular', 'figure8', 'pulse', 'bounce']),
  rotate: PropTypes.bool,
  rotateAmplitude: PropTypes.number,
  scale: PropTypes.bool,
  scaleAmplitude: PropTypes.number,
  className: PropTypes.string
};

export default FloatingElement;
