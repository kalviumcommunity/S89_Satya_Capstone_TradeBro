import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiMic,
  FiMicOff,
  FiSend,
  FiRefreshCw,
  FiVolume2,
  FiUser,
  FiAlertTriangle,
  FiCpu,
  FiX,
  FiZap,
} from 'react-icons/fi';
import { useVoice } from '../contexts/VoiceContext';
import useSaytrix from '../hooks/useSaytrix';
import SaytrixCardRenderer from '../components/ai/SaytrixCardRenderer';
import '../styles/saytrix.css';
import '../styles/saytrix-responsive.css';

// Extracted the VoiceMicToggle component to be more self-contained and reusable.
const VoiceMicToggle = () => {
  const { isListening, stopListening, startListening } = useVoice();

  const handleToggle = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      // Prompt for microphone access before starting
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert('Voice input is not supported in this browser.');
        return;
      }

      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(() => startListening())
        .catch((err) => {
          console.error('Microphone access denied:', err);
          alert('Microphone access is required for voice input. Please allow it in your browser settings.');
        });
    }
  }, [isListening, startListening, stopListening]);

  return (
    <button
      className={`audio-toggle-btn ${isListening ? 'enabled' : 'disabled'}`}
      onClick={handleToggle}
      title={isListening ? 'Turn Off Microphone' : 'Turn On Microphone'}
      aria-label={isListening ? 'Turn Off Microphone' : 'Turn On Microphone'}
    >
      <AnimatePresence mode="wait">
        <motion.span
          key={isListening ? "mic-on" : "mic-off"}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.2 }}
        >
          {isListening ? <FiMic /> : <FiMicOff />}
        </motion.span>
      </AnimatePresence>
      <span className="button-text">{isListening ? 'Mic On' : 'Mic Off'}</span>
    </button>
  );
};

const Saytrix = ({ user, theme }) => {
  // Removed `audioEnabled` state since its logic is handled directly by `useVoice`.
  const [recentQuestions] = useState([
    'Show me NIFTY performance',
    "What are today's top gainers?",
    'Tell me about RELIANCE stock',
    'Latest market news',
    'Portfolio analysis',
  ]);

  // Use the custom Saytrix hook
  const {
    messages,
    inputText,
    isProcessing,
    isListening,
    isSpeaking,
    error,
    messagesEndRef,
    setInputText,
    setMessages,
    sendMessage,
    clearChat,
    aiMode,
    setAiMode,
    setError,
    handleModeChange,
    handleBuyStock,
    handleSellStock,
    handleSuggestionClick,
    handleRecentQuestionClick
  } = useSaytrix();

  // Unified voice toggle handler
  const { isListening: isVoiceListening, startListening, stopListening } = useVoice();

  // Effect to sync isListening state between useSaytrix and useVoice
  useEffect(() => {
    // This effect is not strictly necessary if `useSaytrix` gets `isListening` from `useVoice`,
    // but it helps ensure state consistency if the hooks are not tightly coupled.
    // The `useSaytrix` hook should handle its own internal state based on `useVoice`.
  }, [isVoiceListening]);

  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    } else if (e.key === 'Escape') {
      setInputText('');
      setError(null);
    } else if (e.ctrlKey && e.key === 'k') {
      e.preventDefault();
      clearChat();
    } else if (e.ctrlKey && e.key === 'm') {
      e.preventDefault();
      // Re-use the handler from VoiceMicToggle
      if (isVoiceListening) {
        stopListening();
      } else {
        startListening();
      }
    }
  }, [sendMessage, setInputText, setError, clearChat, isVoiceListening, stopListening, startListening]);

  return (
    <div className={`saytrix-page ${theme}`}>
      {/* Top Navigation Bar */}
      <div className="saytrix-navbar">
        <div className="navbar-left">
          <div className="tradebro-brand">
            <FiZap className="brand-icon" />
            <span className="brand-text">TradeBro</span>
          </div>
        </div>

        <div className="navbar-center">
          <div className="ai-mode-toggle">
            <button
              className={`mode-btn ${aiMode === 'casual' ? 'active' : ''}`}
              onClick={() => handleModeChange('casual')}
            >
              Casual
            </button>
            <button
              className={`mode-btn ${aiMode === 'expert' ? 'active' : ''}`}
              onClick={() => handleModeChange('expert')}
            >
              Expert
            </button>
          </div>
        </div>

        <div className="navbar-right">
          <VoiceMicToggle />
          <button 
            className="profile-btn"
            onClick={clearChat}
            title="Clear Chat"
            aria-label="Clear Chat"
          >
            <FiRefreshCw />
            <span className="button-text">Clear</span>
          </button>
          <button className="profile-btn">
            <FiUser />
            <span className="button-text">{user?.name || 'User'}</span>
          </button>
        </div>
      </div>
      <div className="saytrix-container">
        {/* Main Layout */}
        <div className="saytrix-layout">
          {/* Main Chat Area */}
          <div className="saytrix-main">
            {/* Recent Questions */}
            {messages.length === 0 && ( // Changed to 0 for a better initial state
              <motion.div
                className="recent-questions"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <h3>Recent Questions</h3>
                <div className="question-chips">
                  {recentQuestions.map((question, index) => (
                    <motion.button
                      key={index}
                      className="question-chip"
                      onClick={() => handleRecentQuestionClick(question)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {question}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Messages Container */}
            <div className="messages-container">
              <AnimatePresence>
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    className={`message-wrapper ${message.type}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="message-avatar">
                      {message.type === 'user' ? <FiUser size={20} /> : <FiCpu size={20} />}
                    </div>
                    <div className="message-content">
                      <SaytrixCardRenderer
                        message={message}
                        onSuggestionClick={handleSuggestionClick}
                        onBuyClick={handleBuyStock}
                        onSellClick={handleSellStock}
                      />
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {isProcessing && (
                <motion.div
                  className="message-wrapper assistant processing"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="message-avatar">
                    <FiCpu size={20} />
                  </div>
                  <div className="message-content">
                    <div className="typing-indicator">
                      <span></span><span></span><span></span>
                    </div>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Error Display */}
            <AnimatePresence>
              {error && (
                <motion.div
                  className="error-banner"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <FiAlertTriangle size={16} />
                  <span>{error}</span>
                  <button onClick={() => setError(null)} aria-label="Dismiss error">
                    <FiX size={16} />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
        {/* Floating Chat Input */}
        <motion.div
          className="floating-input"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <div className="input-container">
            <button
              className="voice-btn"
              onClick={isVoiceListening ? stopListening : startListening}
              title={isVoiceListening ? 'Stop listening' : 'Start voice input'}
              aria-label={isVoiceListening ? 'Stop voice input' : 'Start voice input'}
            >
              <AnimatePresence mode="wait">
                <motion.span
                  key={isVoiceListening ? "mic-listening" : "mic-off"}
                  initial={{ scale: 1 }}
                  animate={{ scale: [1, 1.2, 1] }}
                  exit={{ scale: 1 }}
                  transition={{ duration: isVoiceListening ? 1 : 0.2, repeat: isVoiceListening ? Infinity : 0 }}
                >
                  {isVoiceListening ? <FiMic size={20} /> : <FiMicOff size={20} />}
                </motion.span>
              </AnimatePresence>
            </button>

            <input
              type="text"
              className="message-input"
              placeholder="Ask Saytrix about stocks, portfolio, or market trends... (Ctrl+M for voice, Ctrl+K to clear)"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyPress}
              autoFocus
            />

            <button
              className="send-btn"
              onClick={sendMessage}
              disabled={!inputText.trim() || isProcessing}
              title="Send message"
              aria-label="Send message"
            >
              {isProcessing ? (
                <FiRefreshCw size={20} className="animate-spin" />
              ) : (
                <FiSend size={20} />
              )}
            </button>
          </div>

          {/* Voice Indicators */}
          <AnimatePresence>
            {isSpeaking && (
              <motion.div
                className="voice-indicator speaking"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.2 }}
              >
                <FiVolume2 size={16} />
                <span>Saytrix is speaking...</span>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
};

export default Saytrix;