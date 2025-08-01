import React from 'react';
import { motion } from 'framer-motion';
import './OrbBackground.css';

const OrbBackground = ({ 
  className = '',
  orbCount = 3,
  colors = ['#3B82F6', '#10B981', '#8B5CF6'],
  size = 'large'
}) => {
  const sizeClasses = {
    small: 'orb-small',
    medium: 'orb-medium', 
    large: 'orb-large'
  };

  return (
    <div className={`orb-background ${className}`}>
      {Array.from({ length: orbCount }).map((_, index) => (
        <motion.div
          key={index}
          className={`orb ${sizeClasses[size]}`}
          style={{
            background: `radial-gradient(circle, ${colors[index % colors.length]}40 0%, ${colors[index % colors.length]}20 50%, transparent 70%)`,
            left: `${20 + (index * 30)}%`,
            top: `${10 + (index * 20)}%`,
          }}
          animate={{
            x: [0, 100, -50, 0],
            y: [0, -80, 60, 0],
            scale: [1, 1.2, 0.8, 1],
          }}
          transition={{
            duration: 20 + index * 5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: index * 2,
          }}
        />
      ))}
    </div>
  );
};

export default OrbBackground;
