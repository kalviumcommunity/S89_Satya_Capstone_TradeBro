import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMic } from 'react-icons/fi';
import { useVoice } from '../../contexts/VoiceContext';
import './SaytrixActivationIndicator.css';

const SaytrixActivationIndicator = () => {
  const { isListening } = useVoice();

  return (
    <AnimatePresence>
      {isListening && (
        <motion.div
          className="saytrix-activation-indicator"
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 100, opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <FiMic className="mic-icon" />
          <span>Listening...</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SaytrixActivationIndicator;