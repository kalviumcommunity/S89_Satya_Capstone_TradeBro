import React from 'react';
import { motion } from 'framer-motion';
import '../../styles/components/common/Loading.css';

const loadingContainerVariants = {
  start: {
    transition: {
      staggerChildren: 0.1
    }
  },
  end: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

const loadingCircleVariants = {
  start: {
    y: '0%'
  },
  end: {
    y: '100%'
  }
};

const loadingCircleTransition = {
  duration: 0.4,
  yoyo: Infinity,
  ease: 'easeInOut'
};

const Loading = ({ size = 'medium', overlay = false, text = 'Loading...' }) => {
  const getCircleSize = () => {
    switch (size) {
      case 'small':
        return 6;
      case 'medium':
        return 10;
      case 'large':
        return 14;
      default:
        return 10;
    }
  };

  const circleSize = getCircleSize();

  return (
    <div className={`loading-container ${overlay ? 'overlay' : ''}`}>
      <motion.div
        className="loading-dots"
        variants={loadingContainerVariants}
        initial="start"
        animate="end"
      >
        <motion.span
          className="loading-circle"
          style={{ width: circleSize, height: circleSize }}
          variants={loadingCircleVariants}
          transition={loadingCircleTransition}
        />
        <motion.span
          className="loading-circle"
          style={{ width: circleSize, height: circleSize }}
          variants={loadingCircleVariants}
          transition={loadingCircleTransition}
        />
        <motion.span
          className="loading-circle"
          style={{ width: circleSize, height: circleSize }}
          variants={loadingCircleVariants}
          transition={loadingCircleTransition}
        />
      </motion.div>
      {text && <p className="loading-text">{text}</p>}
    </div>
  );
};

export default Loading;
