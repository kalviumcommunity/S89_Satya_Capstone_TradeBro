import React from 'react';
import { motion } from 'framer-motion';
import GradientText from '../animations/GradientText';
import './SectionHeader.css';

const SectionHeader = ({ 
  title, 
  subtitle, 
  highlight, // text to highlight with gradient
  variant = 'primary',
  align = 'center',
  className = '',
  animate = true
}) => {
  const alignmentClass = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right'
  };

  const renderTitle = () => {
    if (highlight && title.includes(highlight)) {
      const parts = title.split(highlight);
      return (
        <>
          {parts[0]}
          <GradientText variant={variant} animate={animate}>
            {highlight}
          </GradientText>
          {parts[1]}
        </>
      );
    }
    return title;
  };

  if (animate) {
    return (
      <motion.div 
        className={`section-header-modern ${alignmentClass[align]} ${className}`}
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
      >
        <motion.h2 
          className="section-title-modern"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          viewport={{ once: true }}
        >
          {renderTitle()}
        </motion.h2>
        {subtitle && (
          <motion.p 
            className="section-subtitle-modern"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
          >
            {subtitle}
          </motion.p>
        )}
      </motion.div>
    );
  }

  return (
    <div className={`section-header-modern ${alignmentClass[align]} ${className}`}>
      <h2 className="section-title-modern">
        {renderTitle()}
      </h2>
      {subtitle && (
        <p className="section-subtitle-modern">
          {subtitle}
        </p>
      )}
    </div>
  );
};

export default SectionHeader;
