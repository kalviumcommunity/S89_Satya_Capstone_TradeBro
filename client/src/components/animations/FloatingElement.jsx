import React from 'react';
import { motion } from 'framer-motion';
import PropTypes from 'prop-types';

/**
 * FloatingElement component that adds a floating animation to its children
 */
const FloatingElement = ({
  children,
  amplitude = 10,
  duration = 3,
  delay = 0,
  yOnly = true,
  className = '',
  ...props
}) => {
  // Define floating animation variants
  const floatingVariants = {
    initial: { y: 0, x: 0 },
    animate: yOnly
      ? {
          y: [-amplitude, amplitude, -amplitude],
          transition: {
            duration,
            delay,
            repeat: Infinity,
            repeatType: 'loop',
            ease: 'easeInOut',
            times: [0, 0.5, 1]
          }
        }
      : {
          y: [-amplitude, amplitude, -amplitude],
          x: [amplitude, -amplitude, amplitude],
          transition: {
            duration,
            delay,
            repeat: Infinity,
            repeatType: 'loop',
            ease: 'easeInOut',
            times: [0, 0.5, 1]
          }
        }
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
  yOnly: PropTypes.bool,
  className: PropTypes.string
};

export default FloatingElement;
