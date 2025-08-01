import React from 'react';
import { motion } from 'framer-motion';
import './ShinyText.css';

const ShinyText = ({ 
  children, 
  className = '',
  colors = ['#1F2937', '#3B82F6', '#10B981', '#1F2937'],
  speed = 3,
  shimmerWidth = 100
}) => {
  return (
    <motion.span 
      className={`shiny-text ${className}`}
      style={{
        background: `linear-gradient(
          90deg,
          ${colors[0]} 0%,
          ${colors[1]} 25%,
          ${colors[2]} 50%,
          ${colors[3]} 100%
        )`,
        backgroundSize: `${shimmerWidth * 2}% 100%`,
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
      }}
      animate={{
        backgroundPosition: ['200% 0', '-200% 0']
      }}
      transition={{
        duration: speed,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    >
      {children}
    </motion.span>
  );
};

export default ShinyText;
