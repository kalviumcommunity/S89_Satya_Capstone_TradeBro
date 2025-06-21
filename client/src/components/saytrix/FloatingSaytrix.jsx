import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiMessageCircle,
  FiX,
  FiMaximize2,
  FiMinimize2,
  FiSend,
  FiMic,
  FiSmile,
  FiTrendingUp,
  FiBarChart2,
  FiDollarSign,
  FiFileText
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import ChatMessage from './ChatMessage';
import QuickActions from './QuickActions';
import { useGlobalVoice } from '../../context/GlobalVoiceContext';
import speechRecognitionManager from '../../utils/speechRecognitionManager';
import '../../styles/components/FloatingSaytrix.css';

const FloatingSaytrix = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      type: 'assistant',
      content: 'Hi! I\'m Saytrix, your AI stock market assistant. How can I help you today?',
      timestamp: new Date().toISOString()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const navigate = useNavigate();

  // Global voice context
  const {
    shouldOpenSaytrix,
    voiceResponse,
    updateSaytrixState,
    registerSaytrixHandlers,
    registerMessageSender,
    speakResponse
  } = useGlobalVoice();

  // Check speech recognition support on mount and cleanup on unmount
  useEffect(() => {
    if (!speechRecognitionManager.isSupported()) {
      console.warn('⚠️ Speech recognition not supported in this browser');
    }

    // Cleanup function to stop any active speech recognition
    return () => {
      if (speechRecognitionManager.isCurrentlyListening()) {
        speechRecognitionManager.stopListening();
      }
    };
  }, []);

  const suggestions = [
    { text: '📈 Top gainers today', icon: FiTrendingUp },
    { text: '📊 RELIANCE quote', icon: FiBarChart2 },
    { text: '💰 Market news', icon: FiFileText },
    { text: '🔍 Compare stocks', icon: FiDollarSign }
  ];

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle voice commands
  useEffect(() => {
    if (shouldOpenSaytrix) {
      setIsOpen(true);
      setIsMinimized(false);
      updateSaytrixState(true);
    }
  }, [shouldOpenSaytrix, updateSaytrixState]);

  // Handle voice responses with perfect audio
  useEffect(() => {
    if (voiceResponse) {
      const newMessage = {
        id: Date.now().toString(),
        type: 'assistant',
        content: voiceResponse,
        timestamp: new Date().toISOString(),
        isVoiceResponse: true
      };
      setMessages(prev => [...prev, newMessage]);

      // Speak the response with enhanced audio
      speakResponse(voiceResponse, {
        priority: 'high',
        queue: false // Don't queue voice responses, speak immediately
      });
    }
  }, [voiceResponse, speakResponse]);

  // Register handlers with global voice context
  useEffect(() => {
    registerSaytrixHandlers(
      () => {
        setIsOpen(true);
        setIsMinimized(false);
      },
      () => setIsOpen(false)
    );

    registerMessageSender(sendMessage);
  }, [registerSaytrixHandlers, registerMessageSender]);

  const toggleChatbot = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setIsMinimized(false);
    }
  };

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  const sendMessage = useCallback(async (messageText = inputMessage) => {
    if (!messageText.trim() || isLoading) return;

    const userMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: messageText.trim(),
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    setShowSuggestions(false);

    try {
      const response = await fetch('/api/saytrix/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: messageText.trim(),
          chatHistory: messages.slice(-10)
        }),
      });

      // Check if response is ok
      if (!response.ok) {
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
      }

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('❌ Non-JSON response received:', text.substring(0, 200));
        throw new Error('Server returned invalid response format');
      }

      const data = await response.json();

      if (data.success) {
        const assistantMessage = {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          content: data.data.response,
          timestamp: data.data.timestamp,
          stockData: data.data.stockData,
          suggestions: data.data.suggestions
        };

        setMessages(prev => [...prev, assistantMessage]);

        // Speak the response with perfect audio
        speakResponse(data.data.response, {
          priority: 'high',
          queue: false
        });
      } else {
        throw new Error(data.error || 'Failed to get response');
      }
    } catch (error) {
      console.error('❌ Error sending message:', error);

      let errorText = 'Sorry, I encountered an error. Please try again.';

      if (error.message.includes('Server error: 404')) {
        errorText = 'The chat service is currently unavailable. Please check if the server is running.';
      } else if (error.message.includes('invalid response format')) {
        errorText = 'There was a server configuration issue. Please try again later.';
      } else if (error.message.includes('Failed to fetch')) {
        errorText = 'Unable to connect to the server. Please check your internet connection.';
      }

      const errorMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: errorText,
        timestamp: new Date().toISOString(),
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);

      // Speak error message
      speakResponse(errorText, {
        priority: 'high',
        queue: false
      });
    } finally {
      setIsLoading(false);
    }
  }, [inputMessage, messages, isLoading]);

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const startVoiceInput = () => {
    if (!speechRecognitionManager.isSupported()) {
      console.warn('⚠️ Speech recognition not supported');
      return;
    }

    if (speechRecognitionManager.isCurrentlyListening()) {
      console.log('🔄 Speech recognition already active, stopping first...');
      stopVoiceInput();
      return;
    }

    setIsListening(true);

    const success = speechRecognitionManager.startListening(
      (transcript, confidence) => {
        console.log('🎤 Voice input received:', transcript);
        setInputMessage(transcript);
        setIsListening(false);
      },
      (error) => {
        console.error('❌ Voice input error:', error);
        setIsListening(false);

        // Only show user-facing errors for real issues
        if (error !== 'aborted' && error !== 'not-supported') {
          // Could show a toast notification here
          console.log('Voice input failed:', error);
        }
      }
    );

    if (!success) {
      setIsListening(false);
    }
  };

  const stopVoiceInput = () => {
    speechRecognitionManager.stopListening();
    setIsListening(false);
  };

  const handleSuggestionClick = (suggestion) => {
    sendMessage(suggestion.text);
  };

  const clearChat = () => {
    setMessages([
      {
        id: 'welcome',
        type: 'assistant',
        content: 'Hi! I\'m Saytrix, your AI stock market assistant. How can I help you today?',
        timestamp: new Date().toISOString()
      }
    ]);
    setShowSuggestions(true);
  };

  return (
    <>
      {/* Floating Action Button */}
      <motion.div
        className="floating-saytrix-fab"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={toggleChatbot}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: 180, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 180, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <FiX size={24} />
            </motion.div>
          ) : (
            <motion.div
              key="chat"
              initial={{ rotate: -180, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -180, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <FiMessageCircle size={24} />
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Notification badge */}
        <div className="notification-badge">
          <span>AI</span>
        </div>
      </motion.div>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className={`floating-saytrix-window ${isMinimized ? 'minimized' : ''}`}
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            {/* Header */}
            <div className="saytrix-header">
              <div className="header-info">
                <div className="bot-avatar">
                  <FiMessageCircle size={20} />
                </div>
                <div className="bot-details">
                  <h4>Saytrix AI</h4>
                  <span className="status">Online</span>
                </div>
              </div>
              <div className="header-actions">
                <button 
                  className="header-btn"
                  onClick={toggleMinimize}
                  title={isMinimized ? "Expand" : "Minimize"}
                >
                  {isMinimized ? <FiMaximize2 size={16} /> : <FiMinimize2 size={16} />}
                </button>
                <button 
                  className="header-btn"
                  onClick={toggleChatbot}
                  title="Close"
                >
                  <FiX size={16} />
                </button>
              </div>
            </div>

            {!isMinimized && (
              <>
                {/* Messages */}
                <div className="saytrix-messages">
                  {messages.map((message) => (
                    <ChatMessage 
                      key={message.id} 
                      message={message}
                      isCompact={true}
                    />
                  ))}
                  
                  {isLoading && (
                    <div className="typing-indicator">
                      <div className="typing-dots">
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                      <span>Saytrix is typing...</span>
                    </div>
                  )}

                  {showSuggestions && (
                    <div className="quick-suggestions">
                      <p>Try asking:</p>
                      <div className="suggestions-grid">
                        {suggestions.map((suggestion, index) => (
                          <button
                            key={index}
                            className="suggestion-btn"
                            onClick={() => handleSuggestionClick(suggestion)}
                          >
                            <suggestion.icon size={14} />
                            {suggestion.text}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Quick Actions */}
                <QuickActions onActionClick={sendMessage} />

                {/* Input */}
                <div className="saytrix-input">
                  <div className="input-wrapper">
                    <textarea
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Ask me about stocks, market news, or anything..."
                      rows={1}
                      disabled={isLoading}
                    />
                    <div className="input-actions">
                      <button className="input-btn" title="Add emoji">
                        <FiSmile size={16} />
                      </button>
                      <button
                        className={`input-btn voice-btn ${isListening ? 'listening' : ''}`}
                        onClick={isListening ? stopVoiceInput : startVoiceInput}
                        disabled={isLoading}
                        title={isListening ? "Stop listening" : "Voice input"}
                      >
                        <FiMic size={16} />
                      </button>
                      <button
                        className="send-btn"
                        onClick={() => sendMessage()}
                        disabled={!inputMessage.trim() || isLoading}
                        title="Send message"
                      >
                        <FiSend size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default FloatingSaytrix;
