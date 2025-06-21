// SaytrixUI.jsx - Main animated voice assistant widget
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiMic, 
  FiMicOff, 
  FiSettings, 
  FiX, 
  FiVolume2, 
  FiVolumeX,
  FiActivity,
  FiZap
} from 'react-icons/fi';
import VoiceCommandHandler from './VoiceCommandHandler';
import './SaytrixUI.css';

const SaytrixUI = ({ 
  isVisible = false, 
  onClose,
  onCommandProcessed,
  className = '' 
}) => {
  const [isListening, setIsListening] = useState(false);
  const [isVoiceOn, setIsVoiceOn] = useState(true);
  const [isWakeWordActive, setIsWakeWordActive] = useState(true);
  const [status, setStatus] = useState('idle'); // idle, listening, processing, speaking
  const [transcript, setTranscript] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [sessionActive, setSessionActive] = useState(false);
  const [lastCommands, setLastCommands] = useState([]);
  const [showSettings, setShowSettings] = useState(false);
  const [error, setError] = useState(null);

  const voiceHandlerRef = useRef(null);

  // Handle wake word detection
  const handleWakeWordDetected = useCallback(() => {
    console.log('🎯 Wake word detected - activating voice session');
    setSessionActive(true);
    setStatus('listening');
    
    // Play activation sound or visual feedback
    if (isVoiceOn) {
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT');
      audio.volume = 0.3;
      audio.play().catch(console.error);
    }
  }, [isVoiceOn]);

  // Handle voice command processing
  const handleCommandProcessed = useCallback((result) => {
    console.log('🎤 Command processed:', result);
    
    // Add to recent commands
    setLastCommands(prev => [
      {
        transcript: result.transcript,
        response: result.response,
        timestamp: new Date().toISOString(),
        intent: result.intent
      },
      ...prev.slice(0, 4) // Keep last 5 commands
    ]);

    // Update status
    setStatus('completed');
    
    // Notify parent
    onCommandProcessed && onCommandProcessed(result);

    // Auto-close after successful command (optional)
    setTimeout(() => {
      if (sessionActive) {
        handleEndSession();
      }
    }, 3000);
  }, [sessionActive, onCommandProcessed]);

  // Handle status changes
  const handleStatusChange = useCallback((newStatus) => {
    setStatus(newStatus);
    
    if (newStatus === 'listening') {
      setIsListening(true);
    } else if (newStatus === 'stopped' || newStatus === 'completed') {
      setIsListening(false);
    }
  }, []);

  // Handle transcript updates
  const handleTranscriptUpdate = useCallback((text, conf) => {
    setTranscript(text);
    setConfidence(conf);
  }, []);

  // Handle errors
  const handleError = useCallback((errorMessage) => {
    setError(errorMessage);
    setStatus('error');
    setTimeout(() => {
      setError(null);
      setStatus('idle');
    }, 3000);
  }, []);

  // Toggle voice on/off
  const toggleVoice = useCallback(() => {
    setIsVoiceOn(prev => !prev);
  }, []);

  // Start manual voice session
  const startVoiceSession = useCallback(() => {
    if (!sessionActive) {
      setSessionActive(true);
      setStatus('listening');
    }
  }, [sessionActive]);

  // End voice session
  const handleEndSession = useCallback(() => {
    setSessionActive(false);
    setIsListening(false);
    setStatus('idle');
    setTranscript('');
    setConfidence(0);
    setError(null);
  }, []);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Ctrl+Shift+M to toggle assistant
      if (event.ctrlKey && event.shiftKey && event.key === 'M') {
        event.preventDefault();
        if (isVisible) {
          onClose && onClose();
        } else {
          startVoiceSession();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isVisible, onClose, startVoiceSession]);

  // Get status message
  const getStatusMessage = () => {
    switch (status) {
      case 'listening':
        return isWakeWordActive ? "Saytrix is listening..." : "Ready";
      case 'processing':
        return "Processing your request...";
      case 'speaking':
        return "Saytrix is responding...";
      case 'error':
        return error || "Something went wrong";
      case 'completed':
        return "Command completed";
      default:
        return "Ready";
    }
  };

  // Get status color
  const getStatusColor = () => {
    switch (status) {
      case 'listening':
        return '#00ff88';
      case 'processing':
        return '#ffa500';
      case 'speaking':
        return '#00bfff';
      case 'error':
        return '#ff4444';
      case 'completed':
        return '#9d4edd';
      default:
        return '#666';
    }
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        className={`saytrix-ui ${className}`}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        {/* Wake Word Detection is now handled by perfectVoiceAI service */}

        {/* Voice Command Handler */}
        <VoiceCommandHandler
          ref={voiceHandlerRef}
          isActive={sessionActive}
          onCommandProcessed={handleCommandProcessed}
          onError={handleError}
          onStatusChange={handleStatusChange}
          onTranscriptUpdate={handleTranscriptUpdate}
        />

        {/* Main UI Container */}
        <div className="saytrix-container">
          {/* Animated Background Orb */}
          <div className="saytrix-orb-background">
            <motion.div
              className="orb-gradient"
              animate={{
                scale: isListening ? [1, 1.2, 1] : 1,
                opacity: isListening ? [0.6, 0.9, 0.6] : 0.6,
              }}
              transition={{
                duration: 2,
                repeat: isListening ? Infinity : 0,
                ease: "easeInOut"
              }}
            />
          </div>

          {/* Status Chip - Bottom Left */}
          <motion.div
            className="saytrix-status-chip"
            style={{ borderColor: getStatusColor() }}
            animate={{ 
              boxShadow: `0 0 20px ${getStatusColor()}40`,
              borderColor: getStatusColor()
            }}
          >
            <div className="status-indicator" style={{ backgroundColor: getStatusColor() }} />
            <span className="status-text">{getStatusMessage()}</span>
          </motion.div>

          {/* Control Panel - Bottom Right */}
          <div className="saytrix-controls">
            {/* Mic Button */}
            <motion.button
              className={`control-btn mic-btn ${isListening ? 'active' : ''}`}
              onClick={startVoiceSession}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title="Start voice command"
            >
              {isListening ? <FiMicOff /> : <FiMic />}
              {isListening && (
                <motion.div
                  className="pulse-ring"
                  animate={{ scale: [1, 1.5], opacity: [0.7, 0] }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
              )}
            </motion.button>

            {/* Voice Toggle */}
            <motion.button
              className={`control-btn voice-btn ${isVoiceOn ? 'active' : ''}`}
              onClick={toggleVoice}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title={isVoiceOn ? 'Voice On' : 'Voice Off'}
            >
              {isVoiceOn ? <FiVolume2 /> : <FiVolumeX />}
              <span className="btn-label">{isVoiceOn ? 'Voice On' : 'Voice Off'}</span>
            </motion.button>

            {/* End Session */}
            <motion.button
              className="control-btn end-btn"
              onClick={handleEndSession}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title="End Session"
            >
              <FiX />
              <span className="btn-label">End Session</span>
            </motion.button>

            {/* Settings */}
            <motion.button
              className="control-btn settings-btn"
              onClick={() => setShowSettings(!showSettings)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title="Settings"
            >
              <FiSettings />
            </motion.button>
          </div>

          {/* Activity Indicator */}
          {sessionActive && (
            <motion.div
              className="activity-indicator"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <FiActivity />
              <span>Voice Session Active</span>
            </motion.div>
          )}

          {/* Transcript Display */}
          {transcript && (
            <motion.div
              className="transcript-display"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="transcript-text">"{transcript}"</div>
              <div className="confidence-bar">
                <div 
                  className="confidence-fill" 
                  style={{ width: `${confidence * 100}%` }}
                />
              </div>
            </motion.div>
          )}

          {/* Close Button */}
          <motion.button
            className="saytrix-close-btn"
            onClick={onClose}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            title="Close Saytrix"
          >
            <FiX />
          </motion.button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default SaytrixUI;
