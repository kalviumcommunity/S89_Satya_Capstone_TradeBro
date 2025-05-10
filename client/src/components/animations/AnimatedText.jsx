import React from 'react';
import { motion } from 'framer-motion';
import PropTypes from 'prop-types';

/**
 * AnimatedText component that animates text with various effects
 */
const AnimatedText = ({
  text,
  type = 'words',
  animation = 'fadeUp',
  staggerDelay = 0.03,
  duration = 0.5,
  delay = 0,
  className = '',
  ...props
}) => {
  // Split text into characters, words, or lines
  const splitText = () => {
    if (type === 'chars') {
      return text.split('').map((char, index) => (
        <motion.span
          key={`char-${index}`}
          className="inline-block"
          variants={getVariants(animation)}
          custom={index}
        >
          {char === ' ' ? '\u00A0' : char}
        </motion.span>
      ));
    } else if (type === 'words') {
      return text.split(' ').map((word, index) => (
        <motion.span
          key={`word-${index}`}
          className="inline-block"
          variants={getVariants(animation)}
          custom={index}
        >
          {word}
          {index !== text.split(' ').length - 1 && '\u00A0'}
        </motion.span>
      ));
    } else if (type === 'lines') {
      return text.split('\\n').map((line, index) => (
        <motion.div
          key={`line-${index}`}
          className="block"
          variants={getVariants(animation)}
          custom={index}
        >
          {line}
        </motion.div>
      ));
    }
    return text;
  };

  // Get animation variants based on animation type
  const getVariants = (animationType) => {
    const baseTransition = {
      duration,
      ease: [0.25, 0.1, 0.25, 1.0],
      delay: (i) => delay + i * staggerDelay
    };

    switch (animationType) {
      case 'fadeUp':
        return {
          hidden: { opacity: 0, y: 20 },
          visible: (i) => ({
            opacity: 1,
            y: 0,
            transition: { ...baseTransition, delay: delay + i * staggerDelay }
          })
        };
      case 'fadeDown':
        return {
          hidden: { opacity: 0, y: -20 },
          visible: (i) => ({
            opacity: 1,
            y: 0,
            transition: { ...baseTransition, delay: delay + i * staggerDelay }
          })
        };
      case 'fadeLeft':
        return {
          hidden: { opacity: 0, x: -20 },
          visible: (i) => ({
            opacity: 1,
            x: 0,
            transition: { ...baseTransition, delay: delay + i * staggerDelay }
          })
        };
      case 'fadeRight':
        return {
          hidden: { opacity: 0, x: 20 },
          visible: (i) => ({
            opacity: 1,
            x: 0,
            transition: { ...baseTransition, delay: delay + i * staggerDelay }
          })
        };
      case 'scale':
        return {
          hidden: { opacity: 0, scale: 0.8 },
          visible: (i) => ({
            opacity: 1,
            scale: 1,
            transition: { ...baseTransition, delay: delay + i * staggerDelay }
          })
        };
      case 'typewriter':
        return {
          hidden: { opacity: 0, display: 'none' },
          visible: (i) => ({
            opacity: 1,
            display: 'inline-block',
            transition: { ...baseTransition, delay: delay + i * staggerDelay }
          })
        };
      default:
        return {
          hidden: { opacity: 0 },
          visible: (i) => ({
            opacity: 1,
            transition: { ...baseTransition, delay: delay + i * staggerDelay }
          })
        };
    }
  };

  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: staggerDelay
          }
        }
      }}
      {...props}
    >
      {splitText()}
    </motion.div>
  );
};

AnimatedText.propTypes = {
  text: PropTypes.string.isRequired,
  type: PropTypes.oneOf(['chars', 'words', 'lines']),
  animation: PropTypes.oneOf(['fadeUp', 'fadeDown', 'fadeLeft', 'fadeRight', 'scale', 'typewriter']),
  staggerDelay: PropTypes.number,
  duration: PropTypes.number,
  delay: PropTypes.number,
  className: PropTypes.string
};

export default AnimatedText;
