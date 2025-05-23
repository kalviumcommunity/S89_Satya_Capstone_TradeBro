import React from 'react';
import { motion } from 'framer-motion';
import '../styles/components/SquaresBackground.css';

/**
 * SquaresBackground component
 * 
 * Creates a background with animated squares
 * 
 * @param {Object} props - Component props
 * @param {string} props.color - Color theme (primary, secondary, success, error, warning, info)
 * @param {number} props.count - Number of squares to display
 * @param {boolean} props.animated - Whether squares should be animated
 */
const SquaresBackground = ({ 
  color = 'primary', 
  count = 10, 
  animated = true 
}) => {
  // Generate random positions for squares
  const squares = Array.from({ length: count }, (_, i) => ({
    id: i,
    size: Math.floor(Math.random() * 80) + 20, // 20-100px
    x: Math.floor(Math.random() * 100), // 0-100%
    y: Math.floor(Math.random() * 100), // 0-100%
    rotation: Math.floor(Math.random() * 360), // 0-360deg
    delay: Math.random() * 5, // 0-5s
    duration: Math.random() * 20 + 10, // 10-30s
  }));

  return (
    <div className={`squares-background ${color}`}>
      {squares.map((square) => (
        <motion.div
          key={square.id}
          className="square"
          style={{
            width: square.size,
            height: square.size,
            left: `${square.x}%`,
            top: `${square.y}%`,
          }}
          initial={{ 
            opacity: 0.1, 
            rotate: square.rotation 
          }}
          animate={animated ? { 
            opacity: [0.1, 0.2, 0.1],
            rotate: [square.rotation, square.rotation + 180, square.rotation + 360],
            x: [0, 30, 0],
            y: [0, 30, 0],
          } : {}}
          transition={animated ? {
            duration: square.duration,
            delay: square.delay,
            repeat: Infinity,
            ease: "linear"
          } : {}}
        />
      ))}
    </div>
  );
};

export default SquaresBackground;
