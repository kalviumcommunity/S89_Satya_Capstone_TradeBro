import React, { useState, useCallback, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMic, FiMicOff, FiVolume2, FiVolumeX } from 'react-icons/fi';
import GlobalVoiceContext from '../../context/GlobalVoiceContext';
import './SaytrixTriggerButton.css';

const SaytrixTriggerButton = ({ 
  className = '', 
  size = 'medium',
  showLabel = true,
  position = 'navbar' // 'navbar', 'floating', 'inline'
}) => {
  const {
    isVoiceEnabled,
    hasUserConsent,
    isListening,
    isInVoiceSession,
    error,
    toggleVoiceCommands,
    requestVoiceConsent
  } = useContext(GlobalVoiceContext);

  const [isHovered, setIsHovered] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  // Handle voice activation
  const handleVoiceToggle = useCallback(async () => {
    try {
      if (!hasUserConsent) {
        const granted = await requestVoiceConsent();
        if (!granted) return;
      }
      
      await toggleVoiceCommands();
    } catch (error) {
      console.error('Voice toggle error:', error);
    }
  }, [hasUserConsent, requestVoiceConsent, toggleVoiceCommands]);

  // Get button state and styling
  const getButtonState = () => {
    if (error) return 'error';
    if (isInVoiceSession) return 'active-session';
    if (isListening) return 'listening';
    if (isVoiceEnabled) return 'enabled';
    return 'disabled';
  };

  const buttonState = getButtonState();

  // Get appropriate icon
  const getIcon = () => {
    if (error) return FiVolumeX;
    if (isVoiceEnabled) return FiMic;
    return FiMicOff;
  };

  const IconComponent = getIcon();

  // Get status text
  const getStatusText = () => {
    if (error) return 'Voice Error';
    if (isInVoiceSession) return 'Saytrix Active';
    if (isListening) return 'Listening...';
    if (isVoiceEnabled) return 'Voice Ready';
    return 'Enable Voice';
  };

  const statusText = getStatusText();

  // Get tooltip text
  const getTooltipText = () => {
    if (error) return `Voice Error: ${error}`;
    if (!hasUserConsent) return 'Click to enable voice commands';
    if (isInVoiceSession) return 'Saytrix is active - say your command';
    if (isListening) return 'Listening for wake word "Saytrix"';
    if (isVoiceEnabled) return 'Voice commands enabled - say "Saytrix"';
    return 'Click to enable voice commands';
  };

  return (
    <div className={`saytrix-trigger-container ${position} ${className}`}>
      <motion.button
        className={`saytrix-trigger-btn ${buttonState} ${size}`}
        onClick={handleVoiceToggle}
        onHoverStart={() => {
          setIsHovered(true);
          setShowTooltip(true);
        }}
        onHoverEnd={() => {
          setIsHovered(false);
          setTimeout(() => setShowTooltip(false), 200);
        }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
        aria-label={statusText}
        title={getTooltipText()}
      >
        {/* Animated background for listening state */}
        <AnimatePresence>
          {(isListening || isInVoiceSession) && (
            <motion.div
              className="listening-pulse"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ 
                scale: [1, 1.2, 1], 
                opacity: [0.3, 0.6, 0.3] 
              }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ 
                duration: 2, 
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          )}
        </AnimatePresence>

        {/* Icon with animation */}
        <motion.div
          className="icon-wrapper"
          animate={{
            rotate: isInVoiceSession ? [0, 5, -5, 0] : 0,
            scale: isListening ? [1, 1.1, 1] : 1
          }}
          transition={{
            rotate: { duration: 0.5, repeat: isInVoiceSession ? Infinity : 0 },
            scale: { duration: 1, repeat: isListening ? Infinity : 0 }
          }}
        >
          <IconComponent size={size === 'small' ? 16 : size === 'large' ? 24 : 20} />
        </motion.div>

        {/* Status indicator dot */}
        <motion.div
          className={`status-dot ${buttonState}`}
          animate={{
            scale: isInVoiceSession ? [1, 1.2, 1] : 1,
            opacity: error ? [1, 0.3, 1] : 1
          }}
          transition={{
            duration: error ? 0.5 : 1,
            repeat: (isInVoiceSession || error) ? Infinity : 0
          }}
        />

        {/* Label for navbar version */}
        {showLabel && position === 'navbar' && (
          <motion.span
            className="button-label"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            Saytrix
          </motion.span>
        )}
      </motion.button>

      {/* Tooltip */}
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            className="saytrix-tooltip"
            initial={{ opacity: 0, y: 10, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.8 }}
            transition={{ duration: 0.2 }}
          >
            <div className="tooltip-content">
              <div className="tooltip-title">{statusText}</div>
              <div className="tooltip-description">{getTooltipText()}</div>
              {!hasUserConsent && (
                <div className="tooltip-hint">
                  🎤 Microphone permission required
                </div>
              )}
            </div>
            <div className="tooltip-arrow" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Command suggestions for active state */}
      <AnimatePresence>
        {isVoiceEnabled && !isInVoiceSession && position === 'floating' && (
          <motion.div
            className="command-suggestions"
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.8 }}
            transition={{ delay: 1, duration: 0.3 }}
          >
            <div className="suggestions-title">Try saying:</div>
            <div className="suggestions-list">
              <div className="suggestion-item">"Saytrix, go to dashboard"</div>
              <div className="suggestion-item">"Saytrix, show my portfolio"</div>
              <div className="suggestion-item">"Saytrix, how is NIFTY doing?"</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SaytrixTriggerButton;
