import React, { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMic, FiVolume2, FiActivity } from 'react-icons/fi';
import GlobalVoiceContext from '../../context/GlobalVoiceContext';
import './SaytrixListeningFeedback.css';

const SaytrixListeningFeedback = ({ 
  position = 'center', // 'center', 'bottom-right', 'top-right'
  size = 'large',
  showWaveform = true,
  showStatus = true
}) => {
  const {
    isVoiceEnabled,
    isListening,
    isInVoiceSession,
    confidence,
    error,
    serviceStatus
  } = useContext(GlobalVoiceContext);

  const [audioLevel, setAudioLevel] = useState(0);
  const [statusText, setStatusText] = useState('');
  const [dots, setDots] = useState('');

  // Simulate audio level for visual feedback
  useEffect(() => {
    let interval;
    if (isListening || isInVoiceSession) {
      interval = setInterval(() => {
        // Simulate audio level with some randomness
        const baseLevel = isInVoiceSession ? 0.6 : 0.3;
        const randomVariation = Math.random() * 0.4;
        setAudioLevel(baseLevel + randomVariation);
      }, 100);
    } else {
      setAudioLevel(0);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isListening, isInVoiceSession]);

  // Update status text
  useEffect(() => {
    if (error) {
      setStatusText('Voice Error');
    } else if (isInVoiceSession) {
      setStatusText('Saytrix is listening...');
    } else if (isListening) {
      setStatusText('Say "Saytrix" to activate');
    } else if (isVoiceEnabled) {
      setStatusText('Voice ready');
    } else {
      setStatusText('Voice disabled');
    }
  }, [isVoiceEnabled, isListening, isInVoiceSession, error]);

  // Animated dots for listening state
  useEffect(() => {
    let interval;
    if (isInVoiceSession) {
      let dotCount = 0;
      interval = setInterval(() => {
        dotCount = (dotCount + 1) % 4;
        setDots('.'.repeat(dotCount));
      }, 500);
    } else {
      setDots('');
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isInVoiceSession]);

  // Don't render if voice is not enabled
  if (!isVoiceEnabled && !error) {
    return null;
  }

  const getContainerClass = () => {
    let classes = `saytrix-feedback-container ${position} ${size}`;
    if (error) classes += ' error';
    if (isInVoiceSession) classes += ' active-session';
    if (isListening) classes += ' listening';
    return classes;
  };

  return (
    <AnimatePresence>
      {(isListening || isInVoiceSession || error) && (
        <motion.div
          className={getContainerClass()}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          {/* Main feedback circle */}
          <div className="feedback-circle">
            {/* Outer pulse rings */}
            <AnimatePresence>
              {(isListening || isInVoiceSession) && (
                <>
                  <motion.div
                    className="pulse-ring ring-1"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ 
                      scale: [1, 1.5, 2],
                      opacity: [0.6, 0.3, 0]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeOut"
                    }}
                  />
                  <motion.div
                    className="pulse-ring ring-2"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ 
                      scale: [1, 1.5, 2],
                      opacity: [0.4, 0.2, 0]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeOut",
                      delay: 0.5
                    }}
                  />
                  <motion.div
                    className="pulse-ring ring-3"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ 
                      scale: [1, 1.5, 2],
                      opacity: [0.2, 0.1, 0]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeOut",
                      delay: 1
                    }}
                  />
                </>
              )}
            </AnimatePresence>

            {/* Inner glow */}
            <motion.div
              className="inner-glow"
              animate={{
                opacity: isInVoiceSession ? [0.3, 0.8, 0.3] : isListening ? 0.5 : 0.2,
                scale: isInVoiceSession ? [1, 1.1, 1] : 1
              }}
              transition={{
                duration: isInVoiceSession ? 1.5 : 2,
                repeat: (isListening || isInVoiceSession) ? Infinity : 0,
                ease: "easeInOut"
              }}
            />

            {/* Center icon */}
            <motion.div
              className="center-icon"
              animate={{
                rotate: isInVoiceSession ? [0, 5, -5, 0] : 0,
                scale: isInVoiceSession ? [1, 1.1, 1] : 1
              }}
              transition={{
                rotate: { duration: 0.5, repeat: isInVoiceSession ? Infinity : 0 },
                scale: { duration: 1, repeat: isInVoiceSession ? Infinity : 0 }
              }}
            >
              {error ? (
                <FiVolume2 size={size === 'large' ? 32 : size === 'medium' ? 24 : 20} />
              ) : (
                <FiMic size={size === 'large' ? 32 : size === 'medium' ? 24 : 20} />
              )}
            </motion.div>

            {/* Confidence indicator */}
            {confidence > 0 && (
              <motion.div
                className="confidence-ring"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ 
                  scale: 1, 
                  opacity: 0.6,
                  strokeDasharray: `${confidence * 100} 100`
                }}
                transition={{ duration: 0.3 }}
              />
            )}
          </div>

          {/* Waveform visualization */}
          {showWaveform && (isListening || isInVoiceSession) && (
            <motion.div
              className="waveform-container"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ delay: 0.2 }}
            >
              <div className="waveform">
                {[...Array(5)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="wave-bar"
                    animate={{
                      height: [
                        `${20 + audioLevel * 30}%`,
                        `${40 + audioLevel * 60}%`,
                        `${20 + audioLevel * 30}%`
                      ]
                    }}
                    transition={{
                      duration: 0.5 + i * 0.1,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  />
                ))}
              </div>
            </motion.div>
          )}

          {/* Status text */}
          {showStatus && (
            <motion.div
              className="status-text"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="status-main">
                {statusText}{dots}
              </div>
              {isInVoiceSession && (
                <motion.div
                  className="status-hint"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  Speak your command now
                </motion.div>
              )}
              {confidence > 0 && (
                <motion.div
                  className="confidence-text"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  Confidence: {Math.round(confidence * 100)}%
                </motion.div>
              )}
            </motion.div>
          )}

          {/* Activity indicator */}
          <motion.div
            className="activity-indicator"
            animate={{
              opacity: (isListening || isInVoiceSession) ? [0.3, 1, 0.3] : 0
            }}
            transition={{
              duration: 1.5,
              repeat: (isListening || isInVoiceSession) ? Infinity : 0,
              ease: "easeInOut"
            }}
          >
            <FiActivity size={16} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SaytrixListeningFeedback;

// CSS will be added in separate file
