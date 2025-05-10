import React from 'react';
import { motion } from 'framer-motion';
import PropTypes from 'prop-types';

// Enhanced page transition variants
const pageVariants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  in: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.43, 0.13, 0.23, 0.96],
      when: 'beforeChildren',
      staggerChildren: 0.1,
    },
  },
  out: {
    opacity: 0,
    y: -20,
    transition: {
      duration: 0.3,
      ease: [0.43, 0.13, 0.23, 0.96],
      when: 'afterChildren',
      staggerChildren: 0.05,
      staggerDirection: -1,
    },
  },
};

// Child element variants for staggered animations
const childVariants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  in: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.43, 0.13, 0.23, 0.96],
    },
  },
  out: {
    opacity: 0,
    y: -10,
    transition: {
      duration: 0.2,
      ease: [0.43, 0.13, 0.23, 0.96],
    },
  },
};

/**
 * Enhanced PageTransition component with staggered children animations
 */
const PageTransition = ({
  children,
  className = '',
  animateChildren = false,
  transitionType = 'fade',
  ...props
}) => {
  // Different transition types
  const transitionVariants = {
    fade: pageVariants,
    slide: {
      initial: { opacity: 0, x: -100 },
      in: {
        opacity: 1,
        x: 0,
        transition: {
          duration: 0.5,
          ease: [0.43, 0.13, 0.23, 0.96],
          when: 'beforeChildren',
          staggerChildren: 0.1,
        }
      },
      out: {
        opacity: 0,
        x: 100,
        transition: {
          duration: 0.3,
          ease: [0.43, 0.13, 0.23, 0.96],
          when: 'afterChildren',
          staggerChildren: 0.05,
          staggerDirection: -1,
        }
      }
    },
    scale: {
      initial: { opacity: 0, scale: 0.9 },
      in: {
        opacity: 1,
        scale: 1,
        transition: {
          duration: 0.5,
          ease: [0.43, 0.13, 0.23, 0.96],
          when: 'beforeChildren',
          staggerChildren: 0.1,
        }
      },
      out: {
        opacity: 0,
        scale: 1.1,
        transition: {
          duration: 0.3,
          ease: [0.43, 0.13, 0.23, 0.96],
          when: 'afterChildren',
          staggerChildren: 0.05,
          staggerDirection: -1,
        }
      }
    }
  };

  // If animateChildren is true, wrap each child in a motion.div
  const renderChildren = () => {
    if (!animateChildren) return children;

    return React.Children.map(children, (child, i) => (
      <motion.div key={i} variants={childVariants}>
        {child}
      </motion.div>
    ));
  };

  return (
    <motion.div
      className={className}
      initial="initial"
      animate="in"
      exit="out"
      variants={transitionVariants[transitionType]}
      {...props}
    >
      {renderChildren()}
    </motion.div>
  );
};

PageTransition.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  animateChildren: PropTypes.bool,
  transitionType: PropTypes.oneOf(['fade', 'slide', 'scale'])
};

export default PageTransition;
