import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMic, FiMicOff, FiSettings, FiHelpCircle, FiZap } from 'react-icons/fi';
import { useGlobalVoice } from '../../context/GlobalVoiceContext';
// import useVoiceAssistant from '../../hooks/useVoiceAssistant';
import './VoiceFloatingButton.css';

const VoiceFloatingButton = () => {
  const {
    isVoiceEnabled,
    isListening,
    isInVoiceSession,
    toggleVoiceCommands,
    error
  } = useGlobalVoice();

  // Temporary simple state management
  const [isSaytrixVisible, setIsSaytrixVisible] = useState(false);
  const showSaytrix = () => setIsSaytrixVisible(true);
  const hideSaytrix = () => setIsSaytrixVisible(false);
  const toggleSaytrix = () => setIsSaytrixVisible(!isSaytrixVisible);

  const [showMenu, setShowMenu] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const getButtonState = () => {
    if (error) return 'error';
    if (isSaytrixVisible) return 'saytrix';
    if (isInVoiceSession) return 'session';
    if (isListening) return 'listening';
    if (isVoiceEnabled) return 'enabled';
    return 'disabled';
  };

  const getButtonIcon = () => {
    const state = getButtonState();
    switch (state) {
      case 'saytrix':
        return <FiZap />;
      case 'session':
      case 'listening':
      case 'enabled':
        return <FiMic />;
      default:
        return <FiMicOff />;
    }
  };

  const handleMainButtonClick = () => {
    if (showMenu) {
      setShowMenu(false);
    } else {
      // Primary action: Toggle Saytrix AI Assistant
      toggleSaytrix();
    }
  };

  const buttonVariants = {
    idle: { scale: 1 },
    listening: { 
      scale: [1, 1.1, 1],
      transition: { 
        duration: 1.5, 
        repeat: Infinity,
        ease: "easeInOut"
      }
    },
    session: {
      scale: [1, 1.05, 1],
      transition: { 
        duration: 2, 
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  const menuItems = [
    {
      icon: <FiZap />,
      label: 'Saytrix AI',
      onClick: () => {
        setShowMenu(false);
        toggleSaytrix();
      }
    },
    {
      icon: <FiMic />,
      label: 'Voice Commands',
      onClick: () => {
        setShowMenu(false);
        toggleVoiceCommands();
      }
    },
    {
      icon: <FiSettings />,
      label: 'Voice Settings',
      onClick: () => {
        setShowMenu(false);
        // Open voice settings modal
      }
    },
    {
      icon: <FiHelpCircle />,
      label: 'Help',
      onClick: () => {
        setShowHelp(!showHelp);
        setShowMenu(false);
      }
    }
  ];

  return (
    <>
      <div className="voice-fab-container">
        {/* Menu Items */}
        <AnimatePresence>
          {showMenu && (
            <motion.div
              className="voice-fab-menu"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
            >
              {menuItems.map((item, index) => (
                <motion.button
                  key={index}
                  className="voice-fab-menu-item"
                  onClick={item.onClick}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {item.icon}
                  <span className="menu-item-label">{item.label}</span>
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main FAB */}
        <motion.button
          className={`voice-fab voice-fab-${getButtonState()}`}
          onClick={handleMainButtonClick}
          onContextMenu={(e) => {
            e.preventDefault();
            setShowMenu(!showMenu);
          }}
          variants={buttonVariants}
          animate={isListening ? 'listening' : isInVoiceSession ? 'session' : 'idle'}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          title={isSaytrixVisible ? 'Saytrix AI Active' : 'Click to activate Saytrix AI Assistant'}
        >
          <div className="fab-icon">
            {getButtonIcon()}
          </div>
          
          {/* Status indicator */}
          <div className={`fab-status-ring fab-status-${getButtonState()}`} />
          
          {/* Pulse effect removed for cleaner design */}
        </motion.button>

        {/* Status tooltip */}
        <AnimatePresence>
          {(isSaytrixVisible || isListening || isInVoiceSession || error) && (
            <motion.div
              className="voice-fab-tooltip"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
            >
              {error ? (
                <span className="tooltip-error">Voice Error</span>
              ) : isSaytrixVisible ? (
                <span className="tooltip-saytrix">Saytrix AI Active</span>
              ) : isInVoiceSession ? (
                <span className="tooltip-session">Voice Session Active</span>
              ) : isListening ? (
                <span className="tooltip-listening">Listening for "Saytrix"</span>
              ) : null}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Help Modal */}
      <AnimatePresence>
        {showHelp && (
          <motion.div
            className="voice-help-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowHelp(false)}
          >
            <motion.div
              className="voice-help-modal"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3>Voice Commands</h3>
              <div className="help-commands">
                <div className="help-command">
                  <strong>"Saytrix"</strong> - Activate voice assistant
                </div>
                <div className="help-command">
                  <strong>"Computer"</strong> - Alternative activation
                </div>
                <div className="help-command">
                  <strong>"What is [stock]?"</strong> - Get stock info
                </div>
                <div className="help-command">
                  <strong>"Show me news"</strong> - Latest market news
                </div>
                <div className="help-command">
                  <strong>"Top gainers"</strong> - Best performing stocks
                </div>
                <div className="help-command">
                  <strong>"Stop listening"</strong> - End voice session
                </div>
              </div>
              <button 
                className="help-close-btn"
                onClick={() => setShowHelp(false)}
              >
                Got it!
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default VoiceFloatingButton;
