import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiMic,
  FiMicOff,
  FiSend,
  FiRefreshCw,
  FiVolume2,
  FiVolumeX,
  FiZap,
  FiUser,
  FiAlertTriangle,
  FiCpu,
  FiX
} from 'react-icons/fi';
import useSaytrix from '../hooks/useSaytrix';
import SaytrixCardRenderer from '../components/ai/SaytrixCardRenderer';
import '../styles/saytrix.css';

const Saytrix = ({ user, theme }) => {
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [recentQuestions] = useState([
    'Show me NIFTY performance',
    'What are today\'s top gainers?',
    'Tell me about RELIANCE stock',
    'Latest market news',
    'Portfolio analysis'
  ]);

  // Use the custom Saytrix hook
  const {
    messages,
    inputText,
    isProcessing,
    isListening,
    isSpeaking,
    error,
    confidence,
    onlyIndianStocks,
    aiMode,
    messagesEndRef,
    setInputText,
    sendMessage,
    startListening,
    stopListening,
    clearChat,
    setOnlyIndianStocks,
    setAiMode,
    setError
  } = useSaytrix();



  // Event handlers
  const handleVoiceToggle = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      // Check for microphone permission
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError('Voice input is not supported in this browser.');
        return;
      }
      
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(() => {
          startListening();
        })
        .catch((err) => {
          console.error('Microphone access denied:', err);
          setError('Microphone access is required for voice input. Please allow microphone access and try again.');
        });
    }
  }, [isListening, startListening, stopListening, setError]);

  const handleSendMessage = useCallback(() => {
    sendMessage();
  }, [sendMessage]);

  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    } else if (e.key === 'Escape') {
      setInputText('');
      setError(null);
    } else if (e.ctrlKey && e.key === 'k') {
      e.preventDefault();
      clearChat();
    } else if (e.ctrlKey && e.key === 'm') {
      e.preventDefault();
      handleVoiceToggle();
    }
  }, [handleSendMessage, setInputText, setError, clearChat, handleVoiceToggle]);

  const handleSuggestionClick = useCallback((suggestion) => {
    setInputText(suggestion);
  }, [setInputText]);

  const handleRecentQuestionClick = useCallback((question) => {
    setInputText(question);
    setTimeout(() => {
      sendMessage(question);
    }, 100);
  }, [setInputText, sendMessage]);

  const handleModeChange = useCallback((mode) => {
    setAiMode(mode);
    
    // Add system message about mode change
    const modeMessage = {
      id: Date.now(),
      type: 'assistant',
      content: `🤖 **AI Mode Changed**\n\nSwitched to **${mode.charAt(0).toUpperCase() + mode.slice(1)} Mode**\n\n${mode === 'expert' ? '🎯 Expert mode provides detailed technical analysis and advanced trading insights.' : '😊 Casual mode offers friendly, easy-to-understand market information.'}`,
      timestamp: new Date(),
      cardType: 'text',
      suggestions: mode === 'expert' ? ['Technical analysis', 'Market trends', 'Risk assessment'] : ['Stock basics', 'Simple explanations', 'Market overview']
    };
    
    setMessages(prev => [...prev, modeMessage]);
  }, [setAiMode, setMessages]);

  const handleBuyStock = useCallback((stockData) => {
    if (!stockData) return;
    
    // Create buy order data
    const orderData = {
      symbol: stockData.symbol,
      type: 'buy',
      quantity: 1,
      price: stockData.price,
      orderType: 'market'
    };
    
    // Add user message about the buy action
    const buyMessage = {
      id: Date.now(),
      type: 'user',
      content: `Buy ${stockData.symbol} at ₹${stockData.price}`,
      timestamp: new Date(),
      confidence: 'high'
    };
    
    const confirmMessage = {
      id: Date.now() + 1,
      type: 'assistant',
      content: `💰 **Buy Order Initiated**\n\n**Stock:** ${stockData.symbol}\n**Price:** ₹${stockData.price}\n**Quantity:** 1 share\n\n✅ Order would be placed in a real trading environment.`,
      timestamp: new Date(),
      cardType: 'text',
      suggestions: ['Show portfolio', 'Check order status', 'Buy more stocks']
    };
    
    setMessages(prev => [...prev, buyMessage, confirmMessage]);
    console.log('Buy order:', orderData);
  }, [setMessages]);

  const handleSellStock = useCallback((stockData) => {
    if (!stockData) return;
    
    const orderData = {
      symbol: stockData.symbol,
      type: 'sell',
      quantity: 1,
      price: stockData.price,
      orderType: 'market'
    };
    
    const sellMessage = {
      id: Date.now(),
      type: 'user',
      content: `Sell ${stockData.symbol} at ₹${stockData.price}`,
      timestamp: new Date(),
      confidence: 'high'
    };
    
    const confirmMessage = {
      id: Date.now() + 1,
      type: 'assistant',
      content: `💸 **Sell Order Initiated**\n\n**Stock:** ${stockData.symbol}\n**Price:** ₹${stockData.price}\n**Quantity:** 1 share\n\n✅ Order would be placed in a real trading environment.`,
      timestamp: new Date(),
      cardType: 'text',
      suggestions: ['Show portfolio', 'Check order status', 'Find more stocks']
    };
    
    setMessages(prev => [...prev, sellMessage, confirmMessage]);
    console.log('Sell order:', orderData);
  }, [setMessages]);

  const handleAlertDismiss = useCallback((alertId) => {
    setError(null);
    console.log('Alert dismissed:', alertId);
  }, [setError]);



  return (
    <div className="saytrix-page">
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
          <button 
            className="profile-btn"
            onClick={clearChat}
            title="Clear Chat"
            style={{ marginRight: '1rem' }}
          >
            <FiRefreshCw />
            <span>Clear</span>
          </button>
          <button className="profile-btn">
            <FiUser />
            <span>{user?.name || 'User'}</span>
          </button>
        </div>
      </div>

      <div className="saytrix-container">

        {/* Main Layout */}
        <div className="saytrix-layout">


          {/* Main Chat Area */}
          <div className="saytrix-main">
            {/* Recent Questions */}
            {messages.length <= 1 && (
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
                      {message.type === 'user' ? (
                        <FiUser size={20} />
                      ) : (
                        <FiCpu size={20} />
                      )}
                    </div>

                    <div className="message-content">
                      {message.type === 'user' ? (
                        <div className="user-message">
                          <p>{message.content}</p>
                          <div className="message-meta">
                            <span className="message-time">
                              {message.timestamp.toLocaleTimeString('en-IN', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                            {message.confidence && (
                              <span className={`confidence-badge ${message.confidence}`}>
                                {message.confidence} confidence
                              </span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <SaytrixCardRenderer
                          message={message}
                          onSuggestionClick={handleSuggestionClick}
                          onBuyClick={handleBuyStock}
                          onSellClick={handleSellStock}
                          onAlertDismiss={handleAlertDismiss}
                        />
                      )}
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
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Error Display */}
            {error && (
              <motion.div
                className="error-banner"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <FiAlertTriangle size={16} />
                <span>{error}</span>
                <button onClick={() => setError(null)}>
                  <FiX size={16} />
                </button>
              </motion.div>
            )}
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
              className={`voice-btn ${isListening ? 'listening' : ''}`}
              onClick={handleVoiceToggle}
              title={isListening ? 'Stop listening' : 'Start voice input'}
            >
              <AnimatePresence mode="wait">
                {isListening ? (
                  <motion.div
                    key="listening"
                    initial={{ scale: 1 }}
                    animate={{ scale: [1, 1.2, 1] }}
                    exit={{ scale: 1 }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    <FiMic size={20} />
                  </motion.div>
                ) : (
                  <motion.div
                    key="not-listening"
                    initial={{ scale: 1 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 1 }}
                  >
                    <FiMicOff size={20} />
                  </motion.div>
                )}
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
              onClick={handleSendMessage}
              disabled={!inputText.trim() || isProcessing}
              title="Send message"
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
            {isListening && (
              <motion.div
                className="voice-indicator listening"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.2 }}
              >
                <div className="listening-animation">
                  <div className="wave"></div>
                  <div className="wave"></div>
                  <div className="wave"></div>
                </div>
                <span>Listening... Speak now</span>
              </motion.div>
            )}

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
