import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiVolume2, FiVolumeX } from 'react-icons/fi';

const SpeakingIndicator = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [currentText, setCurrentText] = useState('');

  useEffect(() => {
    // Register global speaking indicator functions
    window.showSpeakingIndicator = (show, text = '') => {
      setIsVisible(show);
      setCurrentText(text);
    };

    return () => {
      window.showSpeakingIndicator = null;
    };
  }, []);

  const stopSpeaking = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsVisible(false);
    setCurrentText('');
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.8 }}
          transition={{ 
            type: "spring", 
            stiffness: 300, 
            damping: 25,
            duration: 0.3
          }}
          className="speaking-indicator"
          style={{
            position: 'fixed',
            bottom: '30px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            padding: '15px 25px',
            borderRadius: '50px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            zIndex: 10000,
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            minWidth: '200px',
            maxWidth: '400px'
          }}
        >
          {/* Animated sound waves */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
            {[...Array(4)].map((_, i) => (
              <motion.div
                key={i}
                animate={{
                  scaleY: [1, 2, 1],
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{
                  duration: 0.8,
                  repeat: Infinity,
                  delay: i * 0.1,
                  ease: "easeInOut"
                }}
                style={{
                  width: '3px',
                  height: '12px',
                  background: 'white',
                  borderRadius: '2px'
                }}
              />
            ))}
          </div>

          {/* Speaking text */}
          <div style={{ flex: 1 }}>
            <div style={{ 
              fontSize: '14px', 
              fontWeight: '600',
              marginBottom: '2px'
            }}>
              🎤 Saytrix Speaking
            </div>
            {currentText && (
              <div style={{ 
                fontSize: '12px', 
                opacity: 0.8,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {currentText.substring(0, 50)}...
              </div>
            )}
          </div>

          {/* Stop button */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={stopSpeaking}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            title="Stop Speaking"
          >
            <FiVolumeX size={16} />
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SpeakingIndicator;
