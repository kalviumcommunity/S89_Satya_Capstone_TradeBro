import React, { useEffect, useRef } from 'react';
import { motion, useInView, useAnimation } from 'framer-motion';
import PropTypes from 'prop-types';

/**
 * ScrollReveal component that animates children when they enter the viewport
 */
const ScrollReveal = ({
  children,
  variant = 'fadeUp',
  delay = 0,
  duration = 0.5,
  threshold = 0.1,
  once = true,
  className = '',
  ...props
}) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once, amount: threshold });
  const controls = useAnimation();

  // Define animation variants
  const variants = {
    fadeUp: {
      hidden: { opacity: 0, y: 30 },
      visible: {
        opacity: 1,
        y: 0,
        transition: {
          duration,
          delay,
          ease: [0.25, 0.1, 0.25, 1.0]
        }
      }
    },
    fadeDown: {
      hidden: { opacity: 0, y: -30 },
      visible: {
        opacity: 1,
        y: 0,
        transition: {
          duration,
          delay,
          ease: [0.25, 0.1, 0.25, 1.0]
        }
      }
    },
    fadeLeft: {
      hidden: { opacity: 0, x: -30 },
      visible: {
        opacity: 1,
        x: 0,
        transition: {
          duration,
          delay,
          ease: [0.25, 0.1, 0.25, 1.0]
        }
      }
    },
    fadeRight: {
      hidden: { opacity: 0, x: 30 },
      visible: {
        opacity: 1,
        x: 0,
        transition: {
          duration,
          delay,
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
          delay,
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
          delay,
          ease: [0.25, 0.1, 0.25, 1.0]
        }
      }
    }
  };

  useEffect(() => {
    if (isInView) {
      controls.start('visible');
    } else if (!once) {
      controls.start('hidden');
    }
  }, [isInView, controls, once]);

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={controls}
      variants={variants[variant]}
      className={className}
      style={{ position: 'relative', ...props.style }}
      {...props}
    >
      {children}
    </motion.div>
  );
};

ScrollReveal.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf(['fadeUp', 'fadeDown', 'fadeLeft', 'fadeRight', 'scale', 'fade']),
  delay: PropTypes.number,
  duration: PropTypes.number,
  threshold: PropTypes.number,
  once: PropTypes.bool,
  className: PropTypes.string
};

export default ScrollReveal;
