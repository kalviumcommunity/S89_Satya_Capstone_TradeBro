import React, { useEffect, useRef } from 'react';
import { motion, useInView, useAnimation } from 'framer-motion';
import PropTypes from 'prop-types';

/**
 * ScrollReveal component that animates children when they enter the viewport
 * Enhanced with more animation variants and customization options
 */
const ScrollReveal = ({
  children,
  variant = 'fadeUp',
  delay = 0,
  duration = 0.5,
  threshold = 0.1,
  once = true,
  className = '',
  distance = 30,
  easing = 'easeOut',
  staggerChildren = false,
  staggerDelay = 0.1,
  ...props
}) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once, amount: threshold });
  const controls = useAnimation();

  // Define easing options
  const easingOptions = {
    easeOut: [0.25, 0.1, 0.25, 1.0],
    easeIn: [0.42, 0, 1, 1],
    easeInOut: [0.42, 0, 0.58, 1],
    easeOutBack: [0.34, 1.56, 0.64, 1],
    easeInBack: [0.36, 0, 0.66, 1.56],
    easeOutElastic: [0.64, 0.57, 0.67, 1.53],
    easeInElastic: [0.7, 0, 0.84, 0],
    linear: [0, 0, 1, 1]
  };

  const selectedEase = easingOptions[easing] || easingOptions.easeOut;

  // Define animation variants
  const variants = {
    fadeUp: {
      hidden: { opacity: 0, y: distance },
      visible: {
        opacity: 1,
        y: 0,
        transition: {
          duration,
          delay,
          ease: selectedEase,
          staggerChildren: staggerChildren ? staggerDelay : 0
        }
      }
    },
    fadeDown: {
      hidden: { opacity: 0, y: -distance },
      visible: {
        opacity: 1,
        y: 0,
        transition: {
          duration,
          delay,
          ease: selectedEase,
          staggerChildren: staggerChildren ? staggerDelay : 0
        }
      }
    },
    fadeLeft: {
      hidden: { opacity: 0, x: -distance },
      visible: {
        opacity: 1,
        x: 0,
        transition: {
          duration,
          delay,
          ease: selectedEase,
          staggerChildren: staggerChildren ? staggerDelay : 0
        }
      }
    },
    fadeRight: {
      hidden: { opacity: 0, x: distance },
      visible: {
        opacity: 1,
        x: 0,
        transition: {
          duration,
          delay,
          ease: selectedEase,
          staggerChildren: staggerChildren ? staggerDelay : 0
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
          ease: selectedEase,
          staggerChildren: staggerChildren ? staggerDelay : 0
        }
      }
    },
    scaleDown: {
      hidden: { opacity: 0, scale: 1.1 },
      visible: {
        opacity: 1,
        scale: 1,
        transition: {
          duration,
          delay,
          ease: selectedEase,
          staggerChildren: staggerChildren ? staggerDelay : 0
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
          ease: selectedEase,
          staggerChildren: staggerChildren ? staggerDelay : 0
        }
      }
    },
    flip: {
      hidden: { opacity: 0, rotateX: 90 },
      visible: {
        opacity: 1,
        rotateX: 0,
        transition: {
          duration,
          delay,
          ease: selectedEase,
          staggerChildren: staggerChildren ? staggerDelay : 0
        }
      }
    },
    flipY: {
      hidden: { opacity: 0, rotateY: 90 },
      visible: {
        opacity: 1,
        rotateY: 0,
        transition: {
          duration,
          delay,
          ease: selectedEase,
          staggerChildren: staggerChildren ? staggerDelay : 0
        }
      }
    },
    rotate: {
      hidden: { opacity: 0, rotate: -15 },
      visible: {
        opacity: 1,
        rotate: 0,
        transition: {
          duration,
          delay,
          ease: selectedEase,
          staggerChildren: staggerChildren ? staggerDelay : 0
        }
      }
    },
    bounce: {
      hidden: { opacity: 0, y: distance },
      visible: {
        opacity: 1,
        y: 0,
        transition: {
          type: "spring",
          stiffness: 500,
          damping: 20,
          delay,
          staggerChildren: staggerChildren ? staggerDelay : 0
        }
      }
    },
    elastic: {
      hidden: { opacity: 0, y: distance },
      visible: {
        opacity: 1,
        y: 0,
        transition: {
          type: "spring",
          stiffness: 300,
          damping: 10,
          delay,
          staggerChildren: staggerChildren ? staggerDelay : 0
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
      {...props}
    >
      {children}
    </motion.div>
  );
};

ScrollReveal.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf([
    'fadeUp', 'fadeDown', 'fadeLeft', 'fadeRight',
    'scale', 'scaleDown', 'fade', 'flip', 'flipY',
    'rotate', 'bounce', 'elastic'
  ]),
  delay: PropTypes.number,
  duration: PropTypes.number,
  threshold: PropTypes.number,
  once: PropTypes.bool,
  className: PropTypes.string,
  distance: PropTypes.number,
  easing: PropTypes.oneOf([
    'easeOut', 'easeIn', 'easeInOut', 'easeOutBack',
    'easeInBack', 'easeOutElastic', 'easeInElastic', 'linear'
  ]),
  staggerChildren: PropTypes.bool,
  staggerDelay: PropTypes.number
};

export default ScrollReveal;
