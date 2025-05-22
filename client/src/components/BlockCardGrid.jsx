import React from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import '../styles/components/BlockCard.css';

/**
 * BlockCardGrid component that displays a grid of cards
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Card components to display
 * @param {string} props.title - Section title
 */
const BlockCardGrid = ({ children, title }) => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  return (
    <div className="block-card-section">
      {title && (
        <motion.h2 
          className="block-card-section-title"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {title}
        </motion.h2>
      )}
      <motion.div 
        className="block-card-grid"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {children}
      </motion.div>
    </div>
  );
};

BlockCardGrid.propTypes = {
  children: PropTypes.node.isRequired,
  title: PropTypes.string
};

export default BlockCardGrid;
