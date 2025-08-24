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
  // Use isListening directly from the useVoice hook for consistency.
  // The triggerVoiceMode function is not present in the current useVoice hook.
  // It's simpler to directly use startListening and stopListening.
  const { isListening, isSupported, startListening, stopListening } = useVoice();

  const handleClick = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

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