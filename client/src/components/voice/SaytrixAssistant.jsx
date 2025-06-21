// SaytrixAssistant.jsx - Simplified SAYTRIX voice assistant using perfectVoiceAI
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMic, FiX, FiZap } from 'react-icons/fi';
import perfectVoiceAI from '../../services/perfectVoiceAI';
import './SaytrixAssistant.css';

const SaytrixAssistant = () => {
  // Simplified states
  const [isAssistantActive, setIsAssistantActive] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [status, setStatus] = useState('Ready');
  const [error, setError] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize perfectVoiceAI integration
  useEffect(() => {
    console.log('🚀 Initializing Saytrix with perfectVoiceAI...');
    
    // Set up perfectVoiceAI event handlers
    perfectVoiceAI.setOnWakeWordDetected(() => {
      console.log('🎯 Wake word detected - activating Saytrix');
      setIsAssistantActive(true);
      setStatus('Saytrix activated');
    });

    perfectVoiceAI.setOnVoiceMessage((message) => {
      console.log('🎤 Voice message received:', message);
      setStatus('Processing...');
    });

    perfectVoiceAI.setOnAIResponse((response) => {
      console.log('🤖 AI response received:', response);
      setStatus('Response ready');
    });

    perfectVoiceAI.setOnError((error) => {
      console.error('❌ PerfectVoiceAI error:', error);
      setError(error.message || 'Voice AI error occurred');
    });

    perfectVoiceAI.setOnStatusChange((newStatus) => {
      console.log('📊 Status changed:', newStatus);
      setIsListening(newStatus.isListening || false);
      setIsSpeaking(newStatus.isSpeaking || false);
    });

    // Initialize the service
    perfectVoiceAI.initialize().then(() => {
      console.log('✅ PerfectVoiceAI initialized successfully');
      setStatus('Say "Saytrix" to activate');
      setIsInitialized(true);
    }).catch((error) => {
      console.error('❌ Failed to initialize PerfectVoiceAI:', error);
      setError('Failed to initialize voice AI');
      setIsInitialized(true);
    });

    return () => {
      perfectVoiceAI.stopListening();
    };
  }, []);

  // Deactivate assistant
  const deactivateAssistant = useCallback(() => {
    console.log('🛑 Deactivating Saytrix Assistant...');
    setIsAssistantActive(false);
    setStatus('Session ended');
    perfectVoiceAI.endVoiceSession();
  }, []);

  return (
    <>
      {/* Simple Status Indicator - Only show after initialization and when there's an error */}
      {!isAssistantActive && isInitialized && error && (
        <motion.div
          className="saytrix-status-indicator"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            background: 'rgba(239, 68, 68, 0.9)',
            color: 'white',
            padding: '10px 15px',
            borderRadius: '8px',
            fontSize: '14px',
            zIndex: 9999,
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(239, 68, 68, 0.3)'
          }}
        >
          <div className="error-text">{error}</div>
        </motion.div>
      )}

      {/* Main Assistant UI */}
      <AnimatePresence>
        {isAssistantActive && (
          <motion.div
            className="saytrix-assistant-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.9)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10000
            }}
          >
            <div className="saytrix-panel" style={{
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
              borderRadius: '20px',
              padding: '30px',
              minWidth: '400px',
              textAlign: 'center',
              color: 'white'
            }}>
              {/* Header */}
              <div className="saytrix-header" style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '20px'
              }}>
                <div className="saytrix-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <FiZap className="title-icon" />
                  <span style={{ fontSize: '24px', fontWeight: 'bold' }}>SAYTRIX</span>
                </div>
                <button 
                  className="saytrix-close" 
                  onClick={deactivateAssistant}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'white',
                    fontSize: '24px',
                    cursor: 'pointer'
                  }}
                >
                  <FiX />
                </button>
              </div>

              {/* Status Display */}
              <div className="saytrix-status" style={{ marginBottom: '30px' }}>
                <div className="status-text" style={{ fontSize: '18px', marginBottom: '10px' }}>{status}</div>
                {isListening && <div className="listening-indicator" style={{ color: '#4ade80' }}>🎤 Listening...</div>}
                {isSpeaking && <div className="speaking-indicator" style={{ color: '#60a5fa' }}>🔊 Speaking...</div>}
              </div>

              {/* Audio Visualization */}
              <div className="saytrix-visualizer" style={{ display: 'flex', justifyContent: 'center' }}>
                <motion.div
                  animate={{
                    scale: isListening ? [1, 1.2, 1] : 1,
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: isListening ? Infinity : 0,
                    ease: "easeInOut"
                  }}
                >
                  <FiMic style={{ fontSize: '48px', color: isListening ? '#4ade80' : '#9ca3af' }} />
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default SaytrixAssistant;
