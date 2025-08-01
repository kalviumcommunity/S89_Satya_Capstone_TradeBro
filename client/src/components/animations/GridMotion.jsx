import React from 'react';
import { motion } from 'framer-motion';
import './GridMotion.css';

const GridMotion = ({
  className = '',
  gridSize = 50,
  lineColor = 'rgba(59, 130, 246, 0.1)',
  speed = 20,
  animate = true
}) => {
  return (
    <div className={`grid-motion-container ${className}`}>
      <motion.div 
        className="grid-motion-background"
        style={{
          backgroundImage: `
            linear-gradient(${lineColor} 1px, transparent 1px),
            linear-gradient(90deg, ${lineColor} 1px, transparent 1px)
          `,
          backgroundSize: `${gridSize}px ${gridSize}px`
        }}
        animate={animate ? {
          x: [0, gridSize],
          y: [0, gridSize]
        } : {}}
        transition={{
          duration: speed,
          repeat: Infinity,
          ease: "linear"
        }}
      />
    </div>
  );
};

export default GridMotion;
