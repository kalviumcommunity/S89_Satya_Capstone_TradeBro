import React from 'react';
import { motion } from 'framer-motion';
import './GradientText.css';

const GradientText = ({ 
  children, 
  className = '',
  variant = 'primary', // primary, secondary, accent, rainbow
  animate = true,
  size = 'base' // sm, base, lg, xl, 2xl, 3xl
}) => {
  const variants = {
    primary: ['#047857', '#064E3B', '#065F46'],
    secondary: ['#10B981', '#059669', '#047857'],
    accent: ['#3B82F6', '#2563EB', '#1D4ED8'],
    rainbow: ['#047857', '#10B981', '#3B82F6', '#EF4444', '#F59E0B'],
    saytrix: ['#14F195', '#10B981', '#059669']
  };

  const sizeClasses = {
    sm: 'text-sm',
    base: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
    '2xl': 'text-2xl',
    '3xl': 'text-3xl'
  };

  const colors = variants[variant] || variants.primary;
  
  const gradientStyle = {
    background: `linear-gradient(135deg, ${colors.join(', ')})`,
    backgroundSize: animate ? '200% 200%' : '100% 100%',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  };

  if (animate) {
    return (
      <motion.span 
        className={`gradient-text ${sizeClasses[size]} ${className}`}
        style={gradientStyle}
        animate={{
          backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        {children}
      </motion.span>
    );
  }

  return (
    <span 
      className={`gradient-text ${sizeClasses[size]} ${className}`}
      style={gradientStyle}
    >
      {children}
    </span>
  );
};

export default GradientText;
