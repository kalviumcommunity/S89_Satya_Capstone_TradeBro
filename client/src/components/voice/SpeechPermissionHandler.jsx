import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiVolume2, FiX } from 'react-icons/fi';

/**
 * SpeechPermissionHandler - Handles speech synthesis permission requirements
 * Shows a subtle prompt when speech synthesis requires user interaction
 */
const SpeechPermissionHandler = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  useEffect(() => {
    // Listen for speech permission events
    const handleSpeechPermissionNeeded = () => {
      if (!hasInteracted) {
        setShowPrompt(true);
      }
    };

    const handleUserInteraction = () => {
      setHasInteracted(true);
      setShowPrompt(false);
      
      // Enable speech synthesis by triggering a silent utterance
      try {
        const testUtterance = new SpeechSynthesisUtterance('');
        testUtterance.volume = 0;
        window.speechSynthesis.speak(testUtterance);
      } catch (error) {
        // Silently handle any errors
      }
    };

    // Listen for various user interaction events
    const events = ['click', 'keydown', 'touchstart', 'mousedown'];
    events.forEach(event => {
      document.addEventListener(event, handleUserInteraction, { once: true, passive: true });
    });

    // Custom event for when speech permission is needed
    window.addEventListener('speechPermissionNeeded', handleSpeechPermissionNeeded);

    // Cleanup
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleUserInteraction);
      });
      window.removeEventListener('speechPermissionNeeded', handleSpeechPermissionNeeded);
    };
  }, [hasInteracted]);

  const handleEnableClick = () => {
    setHasInteracted(true);
    setShowPrompt(false);
    
    // Trigger speech synthesis permission
    try {
      const testUtterance = new SpeechSynthesisUtterance('Voice enabled');
      testUtterance.volume = 0.1;
      window.speechSynthesis.speak(testUtterance);
    } catch (error) {
      console.warn('Could not enable speech synthesis:', error);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
  };

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          className="speech-permission-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            zIndex: 10000,
            background: 'rgba(0, 0, 0, 0.9)',
            color: 'white',
            padding: '16px 20px',
            borderRadius: '12px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            maxWidth: '320px',
            fontSize: '14px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <FiVolume2 style={{ color: '#3B82F6', marginTop: '2px', flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                Enable Voice Features
              </div>
              <div style={{ color: 'rgba(255, 255, 255, 0.8)', marginBottom: '12px' }}>
                Click to enable voice responses and audio feedback
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={handleEnableClick}
                  style={{
                    background: '#3B82F6',
                    color: 'white',
                    border: 'none',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  Enable
                </button>
                <button
                  onClick={handleDismiss}
                  style={{
                    background: 'transparent',
                    color: 'rgba(255, 255, 255, 0.6)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  Dismiss
                </button>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              style={{
                background: 'none',
                border: 'none',
                color: 'rgba(255, 255, 255, 0.6)',
                cursor: 'pointer',
                padding: '4px',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <FiX size={16} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SpeechPermissionHandler;
