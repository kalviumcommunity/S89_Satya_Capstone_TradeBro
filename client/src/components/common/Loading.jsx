import React from 'react';
import { motion } from 'framer-motion';
<<<<<<< HEAD
<<<<<<<< HEAD:client/src/components/common/Loading.jsx
import '../../styles/components/Loading.css';
========
import '../styles/components/Loading.css';
>>>>>>>> b1a8bb87a9f2e1b3c2ce0c8518a40cf83a513f40:client/src/components/Loading.jsx
=======
import '../../styles/components/common/Loading.css';
>>>>>>> b1a8bb87a9f2e1b3c2ce0c8518a40cf83a513f40

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
