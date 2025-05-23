import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import PropTypes from 'prop-types';

/**
 * MagneticButton component
 * 
 * Creates a button with a magnetic hover effect that follows the cursor
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Button content
 * @param {string} props.className - Additional CSS class
 * @param {number} props.strength - Strength of the magnetic effect (1-10)
 * @param {number} props.distance - Distance of the magnetic effect in pixels
 * @param {number} props.scale - Scale factor when hovered
 * @param {boolean} props.showCursor - Whether to show a custom cursor
 * @param {string} props.cursorColor - Color of the custom cursor
 * @param {Function} props.onClick - Click handler
 */
const MagneticButton = ({
  children,
  className = '',
  strength = 5,
  distance = 50,
  scale = 1.05,
  showCursor = false,
  cursorColor = 'var(--primary-color)',
  onClick,
  ...props
}) => {
  const buttonRef = useRef(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
  
  // Normalize strength to a reasonable range
  const normalizedStrength = Math.min(Math.max(strength, 1), 10) / 10;
  
  // Handle mouse move
  const handleMouseMove = (e) => {
    if (!buttonRef.current || !isHovered) return;
    
    const rect = buttonRef.current.getBoundingClientRect();
    
    // Calculate center of the button
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    // Calculate distance from cursor to center
    const distanceX = e.clientX - centerX;
    const distanceY = e.clientY - centerY;
    
    // Calculate distance from cursor to center as a percentage of the button size
    const maxDistanceX = rect.width / 2 + distance;
    const maxDistanceY = rect.height / 2 + distance;
    
    // Calculate movement based on distance and strength
    const moveX = (distanceX / maxDistanceX) * normalizedStrength * 20;
    const moveY = (distanceY / maxDistanceY) * normalizedStrength * 20;
    
    // Update position
    setPosition({ x: moveX, y: moveY });
    
    // Update cursor position
    setCursorPosition({ x: e.clientX, y: e.clientY });
  };
  
  // Handle mouse enter
  const handleMouseEnter = () => {
    setIsHovered(true);
  };
  
  // Handle mouse leave
  const handleMouseLeave = () => {
    setIsHovered(false);
    setPosition({ x: 0, y: 0 });
  };
  
  // Add/remove event listeners
  useEffect(() => {
    if (isHovered) {
      window.addEventListener('mousemove', handleMouseMove);
    }
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [isHovered]);
  
  return (
    <>
      <motion.button
        ref={buttonRef}
        className={`magnetic-button ${className}`}
        animate={{
          x: position.x,
          y: position.y,
          scale: isHovered ? scale : 1
        }}
        transition={{
          type: 'spring',
          stiffness: 150,
          damping: 15,
          mass: 0.1
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={onClick}
        style={{ cursor: showCursor ? 'none' : 'pointer' }}
        {...props}
      >
        {children}
      </motion.button>
      
      {showCursor && isHovered && (
        <motion.div
          className="magnetic-cursor"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '20px',
            height: '20px',
            borderRadius: '50%',
            backgroundColor: cursorColor,
            pointerEvents: 'none',
            zIndex: 9999,
            mixBlendMode: 'difference',
            x: cursorPosition.x - 10,
            y: cursorPosition.y - 10
          }}
          animate={{
            scale: isHovered ? 1.5 : 1
          }}
          transition={{
            type: 'spring',
            stiffness: 150,
            damping: 15
          }}
        />
      )}
    </>
  );
};

MagneticButton.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  strength: PropTypes.number,
  distance: PropTypes.number,
  scale: PropTypes.number,
  showCursor: PropTypes.bool,
  cursorColor: PropTypes.string,
  onClick: PropTypes.func
};

export default MagneticButton;
