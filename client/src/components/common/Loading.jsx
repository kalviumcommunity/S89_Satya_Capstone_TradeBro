import React from 'react';
import { motion } from 'framer-motion';
import '../../styles/components/Loading.css';

// Professional El-Classico Loading Animation Variants
const loadingContainerVariants = {
  start: {
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1
    }
  },
  end: {
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1
    }
  }
};

const loadingDotVariants = {
  start: {
    scale: 0.6,
    opacity: 0.3,
    y: 0
  },
  end: {
    scale: [0.6, 1.2, 0.8, 1],
    opacity: [0.3, 1, 0.7, 1],
    y: [0, -8, 0, -4, 0]
  }
};

const loadingDotTransition = {
  duration: 1.2,
  repeat: Infinity,
  ease: [0.23, 1, 0.32, 1] // Professional cubic-bezier
};

const pulseVariants = {
  start: { scale: 1, opacity: 0.8 },
  end: {
    scale: [1, 1.05, 1],
    opacity: [0.8, 1, 0.8]
  }
};

const pulseTransition = {
  duration: 2,
  repeat: Infinity,
  ease: "easeInOut"
};

const Loading = ({
  size = 'medium',
  overlay = false,
  text = 'Loading...',
  type = 'dots',
  color = 'primary'
}) => {
  const getDotSize = () => {
    switch (size) {
      case 'small':
        return 6;
      case 'medium':
        return 8;
      case 'large':
        return 12;
      default:
        return 8;
    }
  };

  const dotSize = getDotSize();

  // Professional Spinner Animation
  if (type === 'spinner') {
    return (
      <div className={`loading-container ${overlay ? 'overlay' : ''}`}>
        <motion.div
          className={`loading-spinner ${size} ${color}`}
          animate={{ rotate: 360 }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: "linear"
          }}
        />
        {text && <motion.p
          className="loading-text"
          variants={pulseVariants}
          initial="start"
          animate="end"
          transition={pulseTransition}
        >
          {text}
        </motion.p>}
      </div>
    );
  }

  // Professional Pulse Animation
  if (type === 'pulse') {
    return (
      <div className={`loading-container ${overlay ? 'overlay' : ''}`}>
        <motion.div
          className={`loading-pulse ${size} ${color}`}
          variants={pulseVariants}
          initial="start"
          animate="end"
          transition={pulseTransition}
        />
        {text && <motion.p
          className="loading-text"
          variants={pulseVariants}
          initial="start"
          animate="end"
          transition={{ ...pulseTransition, delay: 0.5 }}
        >
          {text}
        </motion.p>}
      </div>
    );
  }

  // Enhanced Dots Animation (default)
  return (
    <div className={`loading-container ${overlay ? 'overlay' : ''}`}>
      <motion.div
        className="loading-dots"
        variants={loadingContainerVariants}
        initial="start"
        animate="end"
      >
        <motion.span
          className={`loading-dot ${color}`}
          style={{ width: dotSize, height: dotSize }}
          variants={loadingDotVariants}
          transition={loadingDotTransition}
        />
        <motion.span
          className={`loading-dot ${color}`}
          style={{ width: dotSize, height: dotSize }}
          variants={loadingDotVariants}
          transition={{ ...loadingDotTransition, delay: 0.2 }}
        />
        <motion.span
          className={`loading-dot ${color}`}
          style={{ width: dotSize, height: dotSize }}
          variants={loadingDotVariants}
          transition={{ ...loadingDotTransition, delay: 0.4 }}
        />
      </motion.div>
      {text && <motion.p
        className="loading-text"
        variants={pulseVariants}
        initial="start"
        animate="end"
        transition={pulseTransition}
      >
        {text}
      </motion.p>}
    </div>
  );
};

export default Loading;
