import React, { useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMic, FiMicOff } from 'react-icons/fi';
import { useVoice } from '../../contexts/VoiceContext';

const SaytrixTriggerButton = ({
  position = 'navbar',
  size = 'small',
  showLabel = false,
  className = '',
}) => {
  const { isListening, isSupported, startListening, stopListening, triggerVoiceMode } = useVoice();

  const handleClick = useCallback(() => {
    if (!isSupported) {
      alert('Voice commands are not supported in this browser. Please use Chrome, Edge, or Safari.');
      return;
    }

    // Request microphone permission first
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert('Voice input is not supported in this browser.');
      return;
    }

    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(() => {
        if (isListening) {
          stopListening();
        } else {
          // Use triggerVoiceMode for better voice command handling
          if (triggerVoiceMode) {
            triggerVoiceMode();
          } else {
            startListening();
          }
        }
      })
      .catch((err) => {
        console.error('Microphone access denied:', err);
        alert('Microphone access is required for voice commands. Please allow it in your browser settings.');
      });
  }, [isListening, startListening, stopListening, triggerVoiceMode, isSupported]);

  if (!isSupported) {
    return null; // Don't show the button if voice is not supported.
  }

  // Determine the button state based on the 'isListening' state.
  const isButtonActive = isListening;

  return (
    <button
      className={`saytrix-trigger-btn ${position} ${size} ${className} ${isButtonActive ? 'active' : ''}`}
      onClick={handleClick}
      title={isButtonActive ? 'Deactivate Saytrix AI' : 'Activate Saytrix AI'}
      aria-label={isButtonActive ? 'Deactivate Saytrix AI voice assistant' : 'Activate Saytrix AI voice assistant'}
    >
      <AnimatePresence mode="wait">
        <motion.span
          key={isListening ? 'mic-on' : 'mic-off'}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.2 }}
        >
          {isListening ? <FiMicOff /> : <FiMic />}
        </motion.span>
      </AnimatePresence>
      {showLabel && <span>Saytrix</span>}
    </button>
  );
};

export default SaytrixTriggerButton;