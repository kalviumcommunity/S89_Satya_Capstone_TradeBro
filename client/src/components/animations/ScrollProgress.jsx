import React, { useState, useEffect } from 'react';
import { motion, useScroll, useSpring } from 'framer-motion';
import PropTypes from 'prop-types';

/**
 * ScrollProgress component
 * 
 * Shows a progress bar indicating the scroll position on the page
 * 
 * @param {Object} props - Component props
 * @param {string} props.position - Position of the progress bar (top, bottom)
 * @param {number} props.height - Height of the progress bar in pixels
 * @param {string} props.color - Color of the progress bar
 * @param {boolean} props.showOnlyWhenScrolling - Whether to show the progress bar only when scrolling
 * @param {number} props.hideDelay - Delay in milliseconds before hiding the progress bar after scrolling stops
 */
const ScrollProgress = ({
  position = 'top',
  height = 4,
  color = 'var(--primary-color)',
  showOnlyWhenScrolling = false,
  hideDelay = 1000
}) => {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });
  
  const [isScrolling, setIsScrolling] = useState(false);
  const [timeoutId, setTimeoutId] = useState(null);

  // Handle scroll events if showOnlyWhenScrolling is true
  useEffect(() => {
    if (!showOnlyWhenScrolling) return;

    const handleScroll = () => {
      setIsScrolling(true);
      
      // Clear previous timeout
      if (timeoutId) clearTimeout(timeoutId);
      
      // Set new timeout to hide the progress bar
      const id = setTimeout(() => {
        setIsScrolling(false);
      }, hideDelay);
      
      setTimeoutId(id);
    };
    
    window.addEventListener('scroll', handleScroll);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [showOnlyWhenScrolling, timeoutId, hideDelay]);

  // Determine position styles
  const getPositionStyles = () => {
    switch (position) {
      case 'bottom':
        return { bottom: 0 };
      case 'top':
      default:
        return { top: 0 };
    }
  };

  // Determine visibility
  const isVisible = !showOnlyWhenScrolling || isScrolling;

  return (
    <motion.div
      className="scroll-progress-container"
      style={{
        position: 'fixed',
        left: 0,
        right: 0,
        height: `${height}px`,
        backgroundColor: 'rgba(0, 0, 0, 0.1)',
        zIndex: 9999,
        ...getPositionStyles(),
        opacity: isVisible ? 1 : 0,
        transition: 'opacity 0.3s ease'
      }}
    >
      <motion.div
        className="scroll-progress-bar"
        style={{
          height: '100%',
          backgroundColor: color,
          transformOrigin: 'left',
          scaleX
        }}
      />
    </motion.div>
  );
};

ScrollProgress.propTypes = {
  position: PropTypes.oneOf(['top', 'bottom']),
  height: PropTypes.number,
  color: PropTypes.string,
  showOnlyWhenScrolling: PropTypes.bool,
  hideDelay: PropTypes.number
};

export default ScrollProgress;
