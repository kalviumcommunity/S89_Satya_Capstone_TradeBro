import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiMessageCircle,
  FiSend,
  FiMic,
  FiSmile,
  FiPlus,
  FiTrash2,
  FiDownload,
  FiRefreshCw
} from 'react-icons/fi';

import ChatMessage from '../components/saytrix/ChatMessage';
import QuickActions from '../components/saytrix/QuickActions';
import { useGlobalVoice } from '../context/GlobalVoiceContext';
import PageLayout from '../components/PageLayout';
import { sendMessageFallback, checkServerAvailability } from '../utils/fallbackServer';
import '../styles/pages/SaytrixPage.css';

const SaytrixPage = () => {
  const [chatSessions, setChatSessions] = useState([
    { id: 1, title: 'Stock Market Basics', timestamp: new Date().toISOString(), active: true }
  ]);
  const [currentSession, setCurrentSession] = useState(1);
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: 'assistant',
      content: "# Welcome to Saytrix! 🚀\n\nI'm your advanced AI stock market assistant, powered by cutting-edge AI and real-time market data. I can help you with:\n\n- **📈 Stock Analysis** - Get detailed insights on any stock\n- **📊 Market Data** - Real-time quotes, charts, and trends  \n- **📰 Market News** - Latest financial news and updates\n- **🔍 Stock Comparison** - Compare multiple stocks side by side\n- **💡 Educational Content** - Learn about investing and markets\n\nTry asking me something like:\n- \"What's the current price of RELIANCE?\"\n- \"Show me today's top gainers\"\n- \"Compare TCS and INFY\"\n- \"What is P/E ratio?\"\n\nHow can I help you today?",
      timestamp: new Date().toISOString()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  // Global voice context
  const {
    voiceResponse,
    updateSaytrixState,
    registerSaytrixHandlers,
    registerMessageSender,
    speakResponse
  } = useGlobalVoice();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const createNewChat = () => {
    const newSession = {
      id: Date.now(),
      title: 'New Chat',
      timestamp: new Date().toISOString(),
      active: false
    };
    setChatSessions(prev => [newSession, ...prev.map(s => ({ ...s, active: false }))]);
    setCurrentSession(newSession.id);
    setMessages([
      {
        id: 1,
        role: 'assistant',
        content: "Hello! I'm Saytrix, your AI stock market assistant. How can I help you today?",
        timestamp: new Date().toISOString()
      }
    ]);
  };

  const switchSession = (sessionId) => {
    setChatSessions(prev => prev.map(s => ({ ...s, active: s.id === sessionId })));
    setCurrentSession(sessionId);
    // In a real app, you'd load messages for this session
  };

  const deleteSession = (sessionId) => {
    if (chatSessions.length <= 1) return;
    setChatSessions(prev => prev.filter(s => s.id !== sessionId));
    if (currentSession === sessionId) {
      const remainingSessions = chatSessions.filter(s => s.id !== sessionId);
      setCurrentSession(remainingSessions[0].id);
    }
  };

  const sendMessage = async (message = inputMessage) => {
    if (!message.trim()) return;

    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: message,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    try {
      console.log('🤖 Sending message to Saytrix API:', message);

      let response;
      let data;

      try {
        // Try main server first
        response = await fetch('http://localhost:5000/api/saytrix/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message,
            chatHistory: messages.slice(-20).map(msg => ({
              role: msg.role,
              content: msg.content
            }))
          }),
          timeout: 5000 // 5 second timeout
        });

        console.log('📡 API Response status:', response.status);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        data = await response.json();
        console.log('📦 API Response data:', data);
      } catch (serverError) {
        console.warn('🔄 Main server unavailable, using fallback mode:', serverError.message);

        // Use fallback mode
        data = await sendMessageFallback(message);
        console.log('📦 Fallback response data:', data);
      }

      if (data.success) {
        const assistantMessage = {
          id: Date.now() + 1,
          role: 'assistant',
          content: data.data.response,
          stockData: data.data.stockData,
          additionalData: data.data.additionalData,
          timestamp: data.data.timestamp,
          mode: data.data.mode || 'server'
        };

        setMessages(prev => [...prev, assistantMessage]);

        // Automatically speak response if in voice session
        if (window.saytrixSpeakResponse) {
          setTimeout(() => {
            window.saytrixSpeakResponse(data.data.response);
          }, 300);
        } else if ('speechSynthesis' in window) {
          try {
            const utterance = new SpeechSynthesisUtterance(data.data.response);
            utterance.rate = 0.8;
            utterance.pitch = 1.0;
            utterance.volume = 1.0;

            utterance.onstart = () => console.log('🎤 Saytrix speech started');
            utterance.onend = () => console.log('✅ Saytrix speech completed');
            utterance.onerror = (e) => console.warn('⚠️ Saytrix speech error:', e.error);

            if (document.hasFocus()) {
              window.speechSynthesis.speak(utterance);
            }
          } catch (error) {
            console.warn('⚠️ Saytrix speech synthesis failed:', error);
          }
        }

        // Update session title if it's the first user message
        if (messages.length === 1) {
          const title = message.length > 30 ? message.substring(0, 30) + '...' : message;
          setChatSessions(prev => prev.map(s =>
            s.id === currentSession ? { ...s, title } : s
          ));
        }
      } else {
        throw new Error(data.error || data.message || 'Failed to get response');
      }
    } catch (error) {
      console.error('❌ Error sending message to Saytrix:', error);

      let errorContent = "I'm having trouble connecting to my AI brain right now. ";

      if (error.message.includes('HTTP 404')) {
        errorContent += "The Saytrix service endpoint was not found. Please check if the server is running properly.";
      } else if (error.message.includes('HTTP 500')) {
        errorContent += "There's an internal server error. The development team has been notified.";
      } else if (error.message.includes('Failed to fetch')) {
        errorContent += "I can't reach the server. Please check your internet connection and try again.";
      } else {
        errorContent += "Please try again in a moment, or refresh the page if the problem persists.";
      }

      const errorMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: errorContent,
        timestamp: new Date().toISOString(),
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleInputChange = (e) => {
    setInputMessage(e.target.value);
    
    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
  };

  const regenerateResponse = (message) => {
    // Find the user message that prompted this response
    const messageIndex = messages.findIndex(m => m.id === message.id);
    if (messageIndex > 0) {
      const userMessage = messages[messageIndex - 1];
      if (userMessage.role === 'user') {
        // Remove the assistant's response and regenerate
        setMessages(prev => prev.slice(0, messageIndex));
        sendMessage(userMessage.content);
      }
    }
  };

  // Handle global voice commands
  useEffect(() => {
    if (voiceResponse) {
      const voiceMessage = {
        id: Date.now(),
        role: 'assistant',
        content: voiceResponse,
        timestamp: new Date().toISOString(),
        isVoiceResponse: true
      };
      setMessages(prev => [...prev, voiceMessage]);
    }
  }, [voiceResponse]);

  // Register handlers with global voice context
  useEffect(() => {
    updateSaytrixState(true); // Saytrix page is always "open"

    registerSaytrixHandlers(
      () => {
        // Already on Saytrix page, just scroll to bottom
        scrollToBottom();
      },
      () => {
        // Can't close the Saytrix page, but we can acknowledge
        console.log('Saytrix close requested from voice command');
      }
    );

    registerMessageSender(sendMessage);

    return () => {
      updateSaytrixState(false);
    };
  }, [registerSaytrixHandlers, registerMessageSender, updateSaytrixState]);

  return (
    <PageLayout>
      <div className="saytrix-page">
        {/* Sidebar */}
        <AnimatePresence>
          {showSidebar && (
            <motion.div
              className="saytrix-sidebar"
              initial={{ x: -300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -300, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="sidebar-header">
                <h2>Saytrix AI</h2>
                <button className="new-chat-btn" onClick={createNewChat}>
                  <FiPlus size={16} />
                  New Chat
                </button>
              </div>

              <div className="chat-sessions">
                {chatSessions.map(session => (
                  <div
                    key={session.id}
                    className={`chat-session ${session.id === currentSession ? 'active' : ''}`}
                    onClick={() => switchSession(session.id)}
                  >
                    <div className="session-info">
                      <h4>{session.title}</h4>
                      <span>{new Date(session.timestamp).toLocaleDateString()}</span>
                    </div>
                    {chatSessions.length > 1 && (
                      <button
                        className="delete-session"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteSession(session.id);
                        }}
                      >
                        <FiTrash2 size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="sidebar-footer">
                {/* Settings button removed as requested */}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Chat Area */}
        <div className="saytrix-main">
          {/* Messages */}
          <div className="saytrix-messages">
            <div className="messages-container">
              {messages.map((message) => (
                <ChatMessage 
                  key={message.id} 
                  message={message}
                  onRegenerate={regenerateResponse}
                />
              ))}
              
              {isLoading && (
                <div className="typing-indicator-full">
                  <div className="bot-avatar">
                    <FiMessageCircle size={20} />
                  </div>
                  <div className="typing-bubble">
                    <div className="typing-dots">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                    <span>Saytrix is analyzing...</span>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Quick Actions */}
          <QuickActions onActionClick={sendMessage} />

          {/* Input Area */}
          <div className="saytrix-input-area">
            <div className="input-container">
              <div className="input-wrapper">
                <textarea
                  ref={textareaRef}
                  value={inputMessage}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me about stocks, market trends, or anything finance-related..."
                  rows={1}
                  disabled={isLoading}
                />
                <div className="input-actions">
                  <button className="input-btn" title="Add emoji">
                    <FiSmile size={18} />
                  </button>
                  <button
                    className="send-btn"
                    onClick={() => sendMessage()}
                    disabled={!inputMessage.trim() || isLoading}
                    title="Send message"
                  >
                    <FiSend size={18} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default SaytrixPage;
