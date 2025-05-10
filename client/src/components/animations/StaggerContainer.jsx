import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import PropTypes from 'prop-types';

/**
 * StaggerContainer component that animates children in a staggered sequence
 */
const StaggerContainer = ({
  children,
  delay = 0,
  staggerDelay = 0.1,
  duration = 0.5,
  threshold = 0.1,
  once = true,
  className = '',
  childClassName = '',
  childVariant = 'fadeUp',
  ...props
}) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once, amount: threshold });

  // Container variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: delay,
        staggerChildren: staggerDelay
      }
    }
  };

  // Child variants
  const childVariants = {
    fadeUp: {
      hidden: { opacity: 0, y: 20 },
      visible: {
        opacity: 1,
        y: 0,
        transition: {
          duration,
          ease: [0.25, 0.1, 0.25, 1.0]
        }
      }
    },
    fadeDown: {
      hidden: { opacity: 0, y: -20 },
      visible: {
        opacity: 1,
        y: 0,
        transition: {
          duration,
          ease: [0.25, 0.1, 0.25, 1.0]
        }
      }
    },
    fadeLeft: {
      hidden: { opacity: 0, x: -20 },
      visible: {
        opacity: 1,
        x: 0,
        transition: {
          duration,
          ease: [0.25, 0.1, 0.25, 1.0]
        }
      }
    },
    fadeRight: {
      hidden: { opacity: 0, x: 20 },
      visible: {
        opacity: 1,
        x: 0,
        transition: {
          duration,
          ease: [0.25, 0.1, 0.25, 1.0]
        }
      }
    },
    scale: {
      hidden: { opacity: 0, scale: 0.9 },
      visible: {
        opacity: 1,
        scale: 1,
        transition: {
          duration,
          ease: [0.25, 0.1, 0.25, 1.0]
        }
      }
    },
    fade: {
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: {
          duration,
          ease: [0.25, 0.1, 0.25, 1.0]
        }
      }
    }
  };

  // Wrap each child in a motion.div with staggered animation
  const staggeredChildren = React.Children.map(children, (child, index) => {
    return (
      <motion.div
        key={index}
        variants={childVariants[childVariant]}
        className={childClassName}
      >
        {child}
      </motion.div>
    );
  });

  return (
    <motion.div
      ref={ref}
      className={className}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      variants={containerVariants}
      {...props}
    >
      {staggeredChildren}
    </motion.div>
  );
};

StaggerContainer.propTypes = {
  children: PropTypes.node.isRequired,
  delay: PropTypes.number,
  staggerDelay: PropTypes.number,
  duration: PropTypes.number,
  threshold: PropTypes.number,
  once: PropTypes.bool,
  className: PropTypes.string,
  childClassName: PropTypes.string,
  childVariant: PropTypes.oneOf(['fadeUp', 'fadeDown', 'fadeLeft', 'fadeRight', 'scale', 'fade'])
};

export default StaggerContainer;
