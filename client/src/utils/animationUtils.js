/**
 * Animation Utilities for TradeBro
 * Inspired by marketmakers.trade animations
 */

import { useEffect, useRef, useState } from 'react';
import { useInView } from 'framer-motion';

/**
 * Hook to check if an element is in view
 * @param {Object} options - Options for the intersection observer
 * @returns {Object} - Ref and inView status
 */
export const useElementInView = (options = { once: true, amount: 0.3 }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, options);
  
  return { ref, isInView };
};

/**
 * Hook to create a typing animation effect
 * @param {String} text - The text to animate
 * @param {Number} speed - The typing speed in milliseconds
 * @param {Boolean} startTyping - Whether to start typing immediately
 * @returns {String} - The animated text
 */
export const useTypewriter = (text, speed = 50, startTyping = true) => {
  const [displayText, setDisplayText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(startTyping);

  useEffect(() => {
    if (!isTyping) return;
    
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, speed);
      
      return () => clearTimeout(timeout);
    } else {
      setIsTyping(false);
    }
  }, [currentIndex, isTyping, speed, text]);

  const startAnimation = () => {
    setDisplayText('');
    setCurrentIndex(0);
    setIsTyping(true);
  };

  return { displayText, isComplete: currentIndex >= text.length, startAnimation };
};

/**
 * Animation variants for scroll reveal animations
 */
export const scrollRevealVariants = {
  hidden: {
    opacity: 0,
    y: 50,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 100,
      damping: 15,
      duration: 0.5,
    },
  },
};

/**
 * Animation variants for staggered children
 */
export const staggerContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

/**
 * Animation variants for fade in animations
 */
export const fadeInVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.6,
      ease: 'easeInOut',
    },
  },
};

/**
 * Animation variants for slide in animations
 */
export const slideInVariants = {
  hidden: (direction = 'left') => ({
    x: direction === 'left' ? -100 : direction === 'right' ? 100 : 0,
    y: direction === 'up' ? 100 : direction === 'down' ? -100 : 0,
    opacity: 0,
  }),
  visible: {
    x: 0,
    y: 0,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 100,
      damping: 15,
      duration: 0.5,
    },
  },
};

/**
 * Animation variants for floating elements
 */
export const floatingVariants = {
  initial: { y: 0 },
  float: {
    y: [0, -10, 0],
    transition: {
      duration: 3,
      repeat: Infinity,
      repeatType: 'reverse',
      ease: 'easeInOut',
    },
  },
};

/**
 * Animation variants for pulse effect
 */
export const pulseVariants = {
  initial: { scale: 1 },
  pulse: {
    scale: [1, 1.05, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      repeatType: 'reverse',
      ease: 'easeInOut',
    },
  },
};

/**
 * Animation variants for hover effects
 */
export const hoverVariants = {
  initial: { scale: 1, boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.1)' },
  hover: { 
    scale: 1.03, 
    boxShadow: '0px 10px 20px rgba(0, 0, 0, 0.15)',
    transition: { duration: 0.3, ease: 'easeInOut' }
  },
  tap: { scale: 0.98 },
};

/**
 * Animation variants for page transitions
 */
export const pageTransitionVariants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.43, 0.13, 0.23, 0.96],
      when: 'beforeChildren',
      staggerChildren: 0.1,
    },
  },
  exit: {
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
