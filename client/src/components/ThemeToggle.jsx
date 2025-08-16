import React from 'react';
import { motion } from 'framer-motion';
import { FiSun, FiMoon } from 'react-icons/fi';
import { useTheme } from '../contexts/ThemeContext';
import '../styles/components/theme-toggle.css';

const ThemeToggle = ({ className = '', size = 'medium' }) => {
  const { theme, toggleTheme, isLight, isDark } = useTheme();

  const toggleVariants = {
    light: {
      backgroundColor: '#F3F4F6',
      borderColor: '#E5E7EB'
    },
    dark: {
      backgroundColor: '#374151',
      borderColor: '#4B5563'
    }
  };

  const iconVariants = {
    light: {
      x: 0,
      rotate: 0,
      scale: 1
    },
    dark: {
      x: 28,
      rotate: 180,
      scale: 1
    }
  };

  const sunVariants = {
    light: {
      opacity: 1,
      scale: 1,
      rotate: 0
    },
    dark: {
      opacity: 0,
      scale: 0.8,
      rotate: 90
    }
  };

  const moonVariants = {
    light: {
      opacity: 0,
      scale: 0.8,
      rotate: -90
    },
    dark: {
      opacity: 1,
      scale: 1,
      rotate: 0
    }
  };

  return (
    <motion.button
      className={`theme-toggle ${size} ${className}`}
      onClick={toggleTheme}
      animate={theme}
      variants={toggleVariants}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      title={`Switch to ${isLight ? 'dark' : 'light'} mode`}
    >
      <div className="toggle-track">
        <motion.div
          className="toggle-thumb"
          animate={theme}
          variants={iconVariants}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          <motion.div
            className="icon sun-icon"
            animate={theme}
            variants={sunVariants}
            transition={{ duration: 0.2 }}
          >
            <FiSun />
          </motion.div>
          <motion.div
            className="icon moon-icon"
            animate={theme}
            variants={moonVariants}
            transition={{ duration: 0.2 }}
          >
            <FiMoon />
          </motion.div>
        </motion.div>
      </div>
      
      <span className="toggle-label">
        {isLight ? 'Light' : 'Dark'} Mode
      </span>
    </motion.button>
  );
};

export default ThemeToggle;
