import React, { useContext, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMic, FiMicOff, FiVolume2, FiVolumeX, FiSettings, FiTool } from 'react-icons/fi';
import { useGlobalVoice } from '../context/GlobalVoiceContext';

import '../styles/components/VoiceStatusIndicator.css';

const VoiceStatusIndicator = ({ position = 'bottom-left', showToggle = true }) => {
  const {
    isVoiceEnabled,
    isListening,
    isSupported,
    error,
    confidence,
    lastCommand,
    isInVoiceSession,
    toggleVoiceCommands
  } = useGlobalVoice();

  const [showDetails, setShowDetails] = useState(false);
  const [pulseAnimation, setPulseAnimation] = useState(false);


  // Trigger pulse animation when listening
  useEffect(() => {
    if (isListening) {
      setPulseAnimation(true);
      const timer = setTimeout(() => setPulseAnimation(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [isListening]);

  // Auto-show details when command detected
  useEffect(() => {
    if (lastCommand) {
      setShowDetails(true);
      const timer = setTimeout(() => setShowDetails(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [lastCommand]);

  if (!isSupported) {
    return null;
  }

  return (
    <div className={`voice-status-indicator ${position}`}>
      <AnimatePresence>
        {isVoiceEnabled && (
          <motion.div
            className={`voice-status-card ${isListening ? 'listening' : ''} ${error ? 'error' : ''}`}
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            {/* Status Icon */}
            <div className="voice-status-icon">
              {isListening ? (
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <FiMic />
                </motion.div>
              ) : (
                <FiMicOff />
              )}
            </div>

            {/* Status Text */}
            <div className="voice-status-text">
              {error ? (
                <span className="error-text">Voice Error</span>
              ) : isInVoiceSession ? (
                <div className="session-text">
                  <span>🎤 Saytrix is listening...</span>
                  <div className="session-indicator">Active Session</div>
                </div>
              ) : isListening ? (
                <div className="listening-text">
                  <span>Listening for "Saytrix"</span>
                  {confidence > 0 && (
                    <div className="confidence-bar">
                      <div
                        className="confidence-fill"
                        style={{ width: `${confidence * 100}%` }}
                      />
                    </div>
                  )}
                </div>
              ) : (
                <span>Saytrix Ready</span>
              )}
            </div>

            {/* Toggle Button */}
            {showToggle && (
              <button
                className="voice-toggle-btn"
                onClick={toggleVoiceCommands}
                title={isVoiceEnabled ? 'Disable voice commands' : 'Enable voice commands'}
              >
                {isVoiceEnabled ? <FiVolume2 /> : <FiVolumeX />}
              </button>
            )}

            {/* Pulse Animation removed for cleaner design */}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Compact Toggle Button (when voice is disabled) */}
      {!isVoiceEnabled && showToggle && (
        <motion.button
          className="voice-toggle-compact"
          onClick={toggleVoiceCommands}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          title="Enable voice commands"
        >
          <FiVolumeX />
        </motion.button>
      )}

      {/* Voice Details Panel */}
      <AnimatePresence>
        {showDetails && (
          <motion.div
            className="voice-details-panel"
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <div className="details-header">
              <FiSettings className="details-icon" />
              <span>Voice Status</span>
            </div>

            {lastCommand && (
              <div className="detail-row">
                <span>Last Command:</span>
                <span className="command-text">"{lastCommand.wakeWord}"</span>
              </div>
            )}

            {confidence > 0 && (
              <div className="detail-row">
                <span>Confidence:</span>
                <span className="confidence-text">{(confidence * 100).toFixed(0)}%</span>
              </div>
            )}

            <div className="wake-words-section">
              <div className="wake-words-title">Supported Wake Words:</div>
              <div className="wake-words-grid">
                <span className="wake-word primary">"Saytrix"</span>
                <span className="wake-word">"Say Trix"</span>
                <span className="wake-word auto-correct">"Citrix" (auto-corrected)</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Wake Word Hint - Removed for cleaner UI */}

      {/* Settings Button */}
      {isVoiceEnabled && (
        <motion.button
          className="voice-settings-btn"
          onClick={() => setShowDetails(!showDetails)}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          title="Voice settings and status"
        >
          <FiSettings />
        </motion.button>
      )}


    </div>
  );
};

export default VoiceStatusIndicator;
