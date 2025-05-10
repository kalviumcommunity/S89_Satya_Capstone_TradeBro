import React from 'react';
import { motion } from 'framer-motion';
import PropTypes from 'prop-types';

/**
 * HoverElement component that adds hover animations to its children
 */
const HoverElement = ({
  children,
  effect = 'scale',
  scale = 1.05,
  lift = 5,
  glow = false,
  glowColor = 'rgba(27, 142, 153, 0.5)',
  duration = 0.3,
  className = '',
  ...props
}) => {
  // Define hover animation variants based on effect
  const getHoverVariants = () => {
    switch (effect) {
      case 'scale':
        return {
          initial: { scale: 1 },
          hover: { scale },
          tap: { scale: 0.98 }
        };
      case 'lift':
        return {
          initial: { y: 0, boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.1)' },
          hover: { 
            y: -lift, 
            boxShadow: '0px 10px 20px rgba(0, 0, 0, 0.15)' 
          },
          tap: { y: -2 }
        };
      case 'glow':
        return {
          initial: { boxShadow: '0px 0px 0px rgba(0, 0, 0, 0)' },
          hover: { boxShadow: `0px 0px 15px ${glowColor}` },
          tap: { boxShadow: `0px 0px 8px ${glowColor}` }
        };
      case 'both':
        return {
          initial: { 
            scale: 1, 
            y: 0, 
            boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.1)' 
          },
          hover: { 
            scale, 
            y: -lift, 
            boxShadow: glow 
              ? `0px 10px 20px rgba(0, 0, 0, 0.15), 0px 0px 15px ${glowColor}` 
              : '0px 10px 20px rgba(0, 0, 0, 0.15)' 
          },
          tap: { 
            scale: 0.98, 
            y: -2 
          }
        };
      default:
        return {
          initial: { scale: 1 },
          hover: { scale },
          tap: { scale: 0.98 }
        };
    }
  };

  const hoverVariants = getHoverVariants();

  return (
    <motion.div
      className={className}
      initial="initial"
      whileHover="hover"
      whileTap="tap"
      variants={hoverVariants}
      transition={{ duration, ease: 'easeOut' }}
      {...props}
    >
      {children}
    </motion.div>
  );
};

HoverElement.propTypes = {
  children: PropTypes.node.isRequired,
  effect: PropTypes.oneOf(['scale', 'lift', 'glow', 'both']),
  scale: PropTypes.number,
  lift: PropTypes.number,
  glow: PropTypes.bool,
  glowColor: PropTypes.string,
  duration: PropTypes.number,
  className: PropTypes.string
};

export default HoverElement;
