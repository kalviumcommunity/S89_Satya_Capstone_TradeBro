import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMic, FiMicOff, FiX, FiVolume2 } from 'react-icons/fi';
import OrbBackground from './OrbBackground';
import { useGlobalVoice } from '../../context/GlobalVoiceContext';
import './VoiceCommandOverlay.css';

const VoiceCommandOverlay = () => {
  const {
    isVoiceEnabled,
    isListening,
    isInVoiceSession,
    lastCommand,
    confidence,
    error,
    toggleVoiceCommands,
    handleEndVoiceSession
  } = useGlobalVoice();

  const [isProcessing, setIsProcessing] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [showCommands, setShowCommands] = useState(false);

  // Monitor voice processing state
  useEffect(() => {
    if (lastCommand && lastCommand.length > 0) {
      setIsProcessing(true);
      setCurrentTranscript(lastCommand);
      
      // Reset processing state after a delay
      const timer = setTimeout(() => {
        setIsProcessing(false);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [lastCommand]);

  const voiceCommands = [
    { command: 'Saytrix', description: 'Activate voice assistant' },
    { command: 'Computer', description: 'Alternative activation word' },
    { command: 'Stop listening', description: 'End voice session' },
    { command: 'What is [stock]?', description: 'Get stock information' },
    { command: 'Show me news', description: 'Get latest market news' },
    { command: 'Top gainers', description: 'Show top performing stocks' },
    { command: 'Top losers', description: 'Show worst performing stocks' }
  ];

  const getStatusText = () => {
    if (error) return `Error: ${error}`;
    if (isProcessing) return 'Processing your command...';
    if (isListening) return 'Listening... Say "Saytrix" to activate';
    if (isInVoiceSession) return 'Voice session active - speak your command';
    if (isVoiceEnabled) return 'Voice commands ready - say "Saytrix"';
    return 'Voice commands disabled';
  };

  const getStatusColor = () => {
    if (error) return 'error';
    if (isProcessing) return 'processing';
    if (isListening || isInVoiceSession) return 'active';
    if (isVoiceEnabled) return 'ready';
    return 'disabled';
  };

  // Only show overlay when voice session is active or there's an error
  // Don't render orb background when just browsing normally
  if (!isInVoiceSession && !error) {
    return null;
  }

  return (
    <AnimatePresence>
      {(isVoiceEnabled || isInVoiceSession) && (
        <>
          {/* Orb Background */}
          <OrbBackground
            isActive={isVoiceEnabled || isInVoiceSession}
            isListening={isListening}
            isProcessing={isProcessing}
            intensity={confidence}
            showBackground={isInVoiceSession || isProcessing}
          />

          {/* Voice Command Interface */}
          <motion.div
            className="voice-overlay"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
          >
            <div className="voice-overlay-content">
              {/* Header */}
              <div className="voice-header">
                <div className="voice-status">
                  <div className={`status-indicator status-${getStatusColor()}`}>
                    {isListening || isInVoiceSession ? (
                      <FiMic className="status-icon" />
                    ) : (
                      <FiMicOff className="status-icon" />
                    )}
                  </div>
                  <div className="status-text">
                    <h3>Saytrix Voice Assistant</h3>
                    <p className={`status-message status-${getStatusColor()}`}>
                      {getStatusText()}
                    </p>
                  </div>
                </div>

                <div className="voice-controls">
                  <button
                    className="voice-btn voice-btn-secondary"
                    onClick={() => setShowCommands(!showCommands)}
                    title="Show voice commands"
                  >
                    ?
                  </button>
                  <button
                    className="voice-btn voice-btn-danger"
                    onClick={isInVoiceSession ? handleEndVoiceSession : toggleVoiceCommands}
                    title={isInVoiceSession ? "End voice session" : "Disable voice commands"}
                  >
                    <FiX />
                  </button>
                </div>
              </div>

              {/* Current Transcript */}
              {currentTranscript && (
                <motion.div
                  className="voice-transcript"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <div className="transcript-label">You said:</div>
                  <div className="transcript-text">"{currentTranscript}"</div>
                  {confidence > 0 && (
                    <div className="confidence-bar">
                      <div 
                        className="confidence-fill"
                        style={{ width: `${confidence * 100}%` }}
                      />
                    </div>
                  )}
                </motion.div>
              )}

              {/* Voice Commands Help */}
              <AnimatePresence>
                {showCommands && (
                  <motion.div
                    className="voice-commands"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <h4>Available Voice Commands:</h4>
                    <div className="commands-grid">
                      {voiceCommands.map((cmd, index) => (
                        <div key={index} className="command-item">
                          <span className="command-text">"{cmd.command}"</span>
                          <span className="command-desc">{cmd.description}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Quick Actions */}
              <div className="voice-actions">
                <button
                  className={`voice-btn ${isVoiceEnabled ? 'voice-btn-primary' : 'voice-btn-secondary'}`}
                  onClick={toggleVoiceCommands}
                >
                  <FiVolume2 />
                  {isVoiceEnabled ? 'Voice On' : 'Voice Off'}
                </button>
                
                {isInVoiceSession && (
                  <button
                    className="voice-btn voice-btn-danger"
                    onClick={handleEndVoiceSession}
                  >
                    End Session
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default VoiceCommandOverlay;
