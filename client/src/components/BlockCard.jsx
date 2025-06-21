import React from 'react';
import { motion } from 'framer-motion';
import PropTypes from 'prop-types';
import '../styles/components/BlockCard.css';

/**
 * BlockCard component that displays content in a block style similar to Kalvium's design
 * 
 * @param {Object} props - Component props
 * @param {string} props.title - Card title
 * @param {string} props.color - Background color of the card (yellow, blue, green, pink, purple, orange, teal, brown)
 * @param {number} props.progress - Progress percentage (0-100)
 * @param {string} props.icon - URL or component for the icon
 * @param {React.ReactNode} props.children - Additional content
 * @param {Function} props.onClick - Click handler
 */
const BlockCard = ({ 
  title, 
  color = 'blue', 
  progress = 0, 
  icon, 
  children,
  onClick 
}) => {
  // Map color names to CSS variables
  const colorMap = {
    yellow: 'var(--card-yellow)',
    blue: 'var(--card-blue)',
    green: 'var(--card-green)',
    pink: 'var(--card-pink)',
    purple: 'var(--card-purple)',
    orange: 'var(--card-orange)',
    teal: 'var(--card-teal)',
    brown: 'var(--card-brown)'
  };

  // Map color names to progress bar colors
  const progressColorMap = {
    yellow: 'var(--progress-yellow)',
    blue: 'var(--progress-blue)',
    green: 'var(--progress-green)',
    pink: 'var(--progress-red)',
    purple: 'var(--progress-purple)',
    orange: 'var(--progress-orange)',
    teal: 'var(--progress-teal)',
    brown: 'var(--progress-brown)'
  };

  const backgroundColor = colorMap[color] || colorMap.blue;
  const progressColor = progressColorMap[color] || progressColorMap.blue;

  return (
    <motion.div 
      className="block-card"
      style={{ backgroundColor }}
      whileHover={{ 
        y: -5,
        boxShadow: '0 10px 20px rgba(0, 0, 0, 0.1)'
      }}
      onClick={onClick}
    >
      <div className="block-card-content">
        <div className="block-card-icon">
          {typeof icon === 'string' ? (
            <img src={icon} alt={title} />
          ) : (
            icon
          )}
        </div>
        {children}
      </div>
      
      <div className="block-card-footer">
        <div className="block-card-progress-container">
          <div 
            className="block-card-progress-bar" 
            style={{ 
              width: `${progress}%`,
              backgroundColor: progressColor
            }}
          />
        </div>
        <div className="block-card-info">
          <h3 className="block-card-title">{title}</h3>
          <span className="block-card-percentage">{progress}%</span>
        </div>
      </div>
    </motion.div>
  );
};

BlockCard.propTypes = {
  title: PropTypes.string.isRequired,
  color: PropTypes.oneOf(['yellow', 'blue', 'green', 'pink', 'purple', 'orange', 'teal', 'brown']),
  progress: PropTypes.number,
  icon: PropTypes.oneOfType([PropTypes.string, PropTypes.element]),
  children: PropTypes.node,
  onClick: PropTypes.func
};

export default BlockCard;
