// ThemeToggleEnhanced.jsx - Premium Theme Toggle with El-Classico Design
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSun, FiMoon, FiMonitor } from 'react-icons/fi';
import './ThemeToggleEnhanced.css';

const ThemeToggleEnhanced = ({ position = 'top-right', showLabel = true }) => {
  const [theme, setTheme] = useState('system');
  const [systemTheme, setSystemTheme] = useState('light');
  const [isOpen, setIsOpen] = useState(false);

  // Initialize theme on component mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'system';
    const systemPreference = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    
    setTheme(savedTheme);
    setSystemTheme(systemPreference);
    applyTheme(savedTheme, systemPreference);

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemThemeChange = (e) => {
      const newSystemTheme = e.matches ? 'dark' : 'light';
      setSystemTheme(newSystemTheme);
      if (theme === 'system') {
        applyTheme('system', newSystemTheme);
      }
    };

    mediaQuery.addEventListener('change', handleSystemThemeChange);
    return () => mediaQuery.removeEventListener('change', handleSystemThemeChange);
  }, [theme]);

  const applyTheme = (selectedTheme, currentSystemTheme = systemTheme) => {
    const root = document.documentElement;
    
    if (selectedTheme === 'system') {
      root.setAttribute('data-theme', currentSystemTheme);
    } else {
      root.setAttribute('data-theme', selectedTheme);
    }
  };

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    applyTheme(newTheme);
    setIsOpen(false);
  };

  const getCurrentTheme = () => {
    if (theme === 'system') {
      return systemTheme;
    }
    return theme;
  };

  const themeOptions = [
    {
      key: 'light',
      label: 'Light',
      icon: FiSun,
      description: 'Ivory & Gold Elegance'
    },
    {
      key: 'dark',
      label: 'Dark',
      icon: FiMoon,
      description: 'Onyx & Neon Sophistication'
    },
    {
      key: 'system',
      label: 'System',
      icon: FiMonitor,
      description: 'Follow System Preference'
    }
  ];

  const currentOption = themeOptions.find(option => option.key === theme);
  const CurrentIcon = currentOption?.icon || FiMonitor;

  return (
    <div className={`theme-toggle-enhanced ${position}`}>
      {/* Main Toggle Button */}
      <motion.button
        className="theme-toggle-btn"
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Toggle theme"
      >
        <motion.div
          key={theme}
          initial={{ rotate: -180, opacity: 0 }}
          animate={{ rotate: 0, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="theme-icon"
        >
          <CurrentIcon />
        </motion.div>
        
        {showLabel && (
          <span className="theme-label">
            {currentOption?.label}
          </span>
        )}
        
        <motion.div
          className="toggle-indicator"
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          ▼
        </motion.div>
      </motion.button>

      {/* Theme Options Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="theme-dropdown"
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <div className="dropdown-header">
              <h3>Choose Theme</h3>
              <p>Select your preferred appearance</p>
            </div>
            
            <div className="theme-options">
              {themeOptions.map((option) => {
                const Icon = option.icon;
                const isActive = theme === option.key;
                
                return (
                  <motion.button
                    key={option.key}
                    className={`theme-option ${isActive ? 'active' : ''}`}
                    onClick={() => handleThemeChange(option.key)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="option-icon">
                      <Icon />
                    </div>
                    
                    <div className="option-content">
                      <div className="option-label">{option.label}</div>
                      <div className="option-description">{option.description}</div>
                    </div>
                    
                    {isActive && (
                      <motion.div
                        className="active-indicator"
                        layoutId="activeTheme"
                        transition={{ duration: 0.2 }}
                      />
                    )}
                  </motion.button>
                );
              })}
            </div>
            
            <div className="dropdown-footer">
              <div className="current-theme-preview">
                <span>Current: </span>
                <strong>{getCurrentTheme() === 'light' ? 'Light Mode' : 'Dark Mode'}</strong>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="theme-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default ThemeToggleEnhanced;
