import React, { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiCommand, FiMic, FiArrowRight, FiX, FiHelpCircle } from 'react-icons/fi';
import GlobalVoiceContext from '../../context/GlobalVoiceContext';
import './SaytrixCommandSuggestions.css';

const SaytrixCommandSuggestions = ({ 
  position = 'floating', // 'floating', 'modal', 'inline'
  trigger = 'auto', // 'auto', 'manual', 'hover'
  showOnFirstVisit = true,
  autoHideDelay = 10000
}) => {
  const {
    isVoiceEnabled,
    isListening,
    isInVoiceSession,
    error
  } = useContext(GlobalVoiceContext);

  const [isVisible, setIsVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('navigation');
  const [hasSeenSuggestions, setHasSeenSuggestions] = useState(false);

  // Command categories and examples
  const commandCategories = {
    navigation: {
      title: 'Navigation',
      icon: '🧭',
      commands: [
        { text: 'Saytrix, go to dashboard', description: 'Navigate to main dashboard' },
        { text: 'Saytrix, open portfolio', description: 'View your portfolio' },
        { text: 'Saytrix, take me to login', description: 'Go to login page' },
        { text: 'Saytrix, show market data', description: 'View market overview' }
      ]
    },
    stocks: {
      title: 'Stock Queries',
      icon: '📈',
      commands: [
        { text: 'Saytrix, show me TCS stock', description: 'Get TCS stock details' },
        { text: 'Saytrix, what about Reliance?', description: 'View Reliance stock info' },
        { text: 'Saytrix, price of INFY', description: 'Get Infosys current price' },
        { text: 'Saytrix, compare TCS with Wipro', description: 'Compare two stocks' }
      ]
    },
    market: {
      title: 'Market Data',
      icon: '📊',
      commands: [
        { text: 'Saytrix, how is NIFTY doing?', description: 'Get NIFTY 50 status' },
        { text: 'Saytrix, show me Sensex', description: 'View Sensex performance' },
        { text: 'Saytrix, market status', description: 'Overall market overview' },
        { text: 'Saytrix, top gainers today', description: 'Show best performing stocks' }
      ]
    },
    portfolio: {
      title: 'Portfolio',
      icon: '💼',
      commands: [
        { text: 'Saytrix, show my portfolio', description: 'View portfolio summary' },
        { text: 'Saytrix, what\'s my P&L?', description: 'Check profit and loss' },
        { text: 'Saytrix, portfolio performance', description: 'Detailed performance metrics' },
        { text: 'Saytrix, my holdings', description: 'List all holdings' }
      ]
    },
    trading: {
      title: 'Trading',
      icon: '💰',
      commands: [
        { text: 'Saytrix, buy TCS', description: 'Place buy order for TCS' },
        { text: 'Saytrix, sell Reliance', description: 'Place sell order for Reliance' },
        { text: 'Saytrix, add to watchlist', description: 'Add stock to watchlist' },
        { text: 'Saytrix, place order', description: 'Open trading interface' }
      ]
    },
    help: {
      title: 'Help & Info',
      icon: '❓',
      commands: [
        { text: 'Saytrix, help', description: 'Show available commands' },
        { text: 'Saytrix, what can you do?', description: 'List capabilities' },
        { text: 'Saytrix, how to use voice?', description: 'Voice command tutorial' },
        { text: 'Saytrix, show commands', description: 'Display command list' }
      ]
    }
  };

  // Check if should show suggestions on first visit
  useEffect(() => {
    const hasVisited = localStorage.getItem('saytrix-suggestions-seen');
    if (!hasVisited && showOnFirstVisit) {
      setHasSeenSuggestions(false);
    } else {
      setHasSeenSuggestions(true);
    }
  }, [showOnFirstVisit]);

  // Auto-show logic
  useEffect(() => {
    if (trigger === 'auto' && isVoiceEnabled && !hasSeenSuggestions) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [trigger, isVoiceEnabled, hasSeenSuggestions]);

  // Auto-hide logic
  useEffect(() => {
    if (isVisible && autoHideDelay > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, autoHideDelay);
      return () => clearTimeout(timer);
    }
  }, [isVisible, autoHideDelay]);

  // Handle manual trigger
  const handleToggle = () => {
    setIsVisible(!isVisible);
    if (!hasSeenSuggestions) {
      setHasSeenSuggestions(true);
      localStorage.setItem('saytrix-suggestions-seen', 'true');
    }
  };

  // Handle command click (copy to clipboard or speak)
  const handleCommandClick = (command) => {
    // Copy to clipboard
    navigator.clipboard.writeText(command.text).then(() => {
      // Show toast notification
      if (window.showNotification) {
        window.showNotification({
          type: 'success',
          title: 'Command Copied',
          message: 'Voice command copied to clipboard',
          duration: 2000
        });
      }
    });

    // If voice is enabled, could also trigger the command directly
    if (isVoiceEnabled && window.saytrixProcessCommand) {
      window.saytrixProcessCommand(command.text);
    }
  };

  // Don't render if voice is not supported
  if (!isVoiceEnabled && !error) {
    return null;
  }

  const containerClass = `saytrix-suggestions-container ${position}`;

  return (
    <>
      {/* Trigger button for manual mode */}
      {trigger === 'manual' && (
        <motion.button
          className="suggestions-trigger-btn"
          onClick={handleToggle}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          title="Show voice command suggestions"
        >
          <FiHelpCircle size={20} />
          <span>Voice Commands</span>
        </motion.button>
      )}

      {/* Main suggestions panel */}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            className={containerClass}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            {/* Header */}
            <div className="suggestions-header">
              <div className="header-content">
                <FiCommand className="header-icon" />
                <div className="header-text">
                  <h3>Voice Commands</h3>
                  <p>Try saying these commands to Saytrix</p>
                </div>
              </div>
              <button 
                className="close-btn"
                onClick={() => setIsVisible(false)}
                aria-label="Close suggestions"
              >
                <FiX size={20} />
              </button>
            </div>

            {/* Category tabs */}
            <div className="category-tabs">
              {Object.entries(commandCategories).map(([key, category]) => (
                <button
                  key={key}
                  className={`category-tab ${selectedCategory === key ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(key)}
                >
                  <span className="tab-icon">{category.icon}</span>
                  <span className="tab-text">{category.title}</span>
                </button>
              ))}
            </div>

            {/* Commands list */}
            <div className="commands-list">
              <AnimatePresence mode="wait">
                <motion.div
                  key={selectedCategory}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  {commandCategories[selectedCategory].commands.map((command, index) => (
                    <motion.div
                      key={index}
                      className="command-item"
                      onClick={() => handleCommandClick(command)}
                      whileHover={{ scale: 1.02, backgroundColor: 'rgba(59, 130, 246, 0.1)' }}
                      whileTap={{ scale: 0.98 }}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <div className="command-content">
                        <div className="command-text">
                          <FiMic className="mic-icon" />
                          <span className="command-phrase">{command.text}</span>
                        </div>
                        <div className="command-description">
                          {command.description}
                        </div>
                      </div>
                      <FiArrowRight className="command-arrow" />
                    </motion.div>
                  ))}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="suggestions-footer">
              <div className="footer-tip">
                <span className="tip-icon">💡</span>
                <span>Click any command to copy it, or just say it out loud!</span>
              </div>
              {!hasSeenSuggestions && (
                <button
                  className="got-it-btn"
                  onClick={() => {
                    setHasSeenSuggestions(true);
                    localStorage.setItem('saytrix-suggestions-seen', 'true');
                    setIsVisible(false);
                  }}
                >
                  Got it!
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Backdrop for modal mode */}
      <AnimatePresence>
        {isVisible && position === 'modal' && (
          <motion.div
            className="suggestions-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsVisible(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default SaytrixCommandSuggestions;

// CSS styles will be in separate file
