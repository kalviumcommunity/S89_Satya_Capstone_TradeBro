import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiArrowUp } from 'react-icons/fi';
import PropTypes from 'prop-types';

/**
 * ScrollToTop component
 * 
 * Displays a button that scrolls to the top of the page when clicked
 * Only appears when the user has scrolled down a certain distance
 * 
 * @param {Object} props - Component props
 * @param {number} props.showAfter - Distance in pixels after which to show the button
 * @param {string} props.position - Position of the button (bottom-right, bottom-left, bottom-center)
 * @param {string} props.color - Background color of the button
 * @param {string} props.iconColor - Color of the icon
 * @param {boolean} props.showBackground - Whether to show a background behind the button
 * @param {string} props.className - Additional CSS class
 */
const ScrollToTop = ({
  showAfter = 300,
  position = 'bottom-right',
  color = 'var(--primary-color)',
  iconColor = 'white',
  showBackground = true,
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState(false);
  
  // Handle scroll event to show/hide the button
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setIsVisible(scrollY > showAfter);
    };
    
    window.addEventListener('scroll', handleScroll);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [showAfter]);
  
  // Scroll to top when button is clicked
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };
  
  // Get position styles
  const getPositionStyles = () => {
    switch (position) {
      case 'bottom-left':
        return { bottom: '20px', left: '20px' };
      case 'bottom-center':
        return { bottom: '20px', left: '50%', transform: 'translateX(-50%)' };
      case 'bottom-right':
      default:
        return { bottom: '20px', right: '20px' };
    }
  };
  
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.button
          className={`scroll-to-top ${className}`}
          style={{
            position: 'fixed',
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            backgroundColor: showBackground ? color : 'transparent',
            color: iconColor,
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 999,
            boxShadow: showBackground ? '0 2px 10px rgba(0, 0, 0, 0.2)' : 'none',
            ...getPositionStyles()
          }}
          onClick={scrollToTop}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.3 }}
          aria-label="Scroll to top"
        >
          <FiArrowUp size={20} />
        </motion.button>
      )}
    </AnimatePresence>
  );
};

ScrollToTop.propTypes = {
  showAfter: PropTypes.number,
  position: PropTypes.oneOf(['bottom-right', 'bottom-left', 'bottom-center']),
  color: PropTypes.string,
  iconColor: PropTypes.string,
  showBackground: PropTypes.bool,
  className: PropTypes.string
};

export default ScrollToTop;
