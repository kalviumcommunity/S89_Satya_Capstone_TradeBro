import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FiSend, FiMic, FiUser, FiCpu, FiArrowRight } from 'react-icons/fi';
import SectionHeader from '../ui/SectionHeader';
import './SaytrixChatPreview.css';

const SaytrixChatPreview = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [inputValue, setInputValue] = useState('');

  const demoConversation = [
    {
      type: 'user',
      message: 'Compare TCS and Infosys for me',
      timestamp: '2:34 PM'
    },
    {
      type: 'ai',
      message: 'Great question! Here\'s a detailed comparison:\n\nTCS (Tata Consultancy Services)\n• Current Price: ₹3,789.60 (+1.21%)\n• Market Cap: ₹13.8L Cr\n• P/E Ratio: 28.5\n• Dividend Yield: 1.8%\n\nInfosys\n• Current Price: ₹1,456.75 (-0.57%)\n• Market Cap: ₹6.2L Cr\n• P/E Ratio: 24.2\n• Dividend Yield: 2.1%\n\nMy Analysis: TCS has stronger fundamentals and market leadership, but Infosys offers better value at current levels. For long-term investment, I\'d lean towards TCS.',
      timestamp: '2:34 PM'
    },
    {
      type: 'user',
      message: 'What about the technical analysis?',
      timestamp: '2:35 PM'
    },
    {
      type: 'ai',
      message: '📈 Technical Analysis:\n\nTCS:\n• RSI: 65 (Slightly overbought)\n• Moving Average: Above 50-day MA\n• Support: ₹3,650 | Resistance: ₹3,850\n• Trend: Bullish momentum\n\nInfosys:\n• RSI: 45 (Neutral zone)\n• Moving Average: Near 50-day MA\n• Support: ₹1,400 | Resistance: ₹1,500\n• Trend: Consolidation phase\n\nRecommendation: TCS shows stronger momentum, while Infosys is in a good accumulation zone.',
      timestamp: '2:35 PM'
    }
  ];

  const quickActions = [
    'Compare stocks',
    'Market analysis',
    'Portfolio review',
    'Risk assessment'
  ];

  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentMessageIndex < demoConversation.length) {
        if (demoConversation[currentMessageIndex].type === 'ai') {
          setIsTyping(true);
          setTimeout(() => {
            setMessages(prev => [...prev, demoConversation[currentMessageIndex]]);
            setIsTyping(false);
            setCurrentMessageIndex(prev => prev + 1);
          }, 1500);
        } else {
          setMessages(prev => [...prev, demoConversation[currentMessageIndex]]);
          setCurrentMessageIndex(prev => prev + 1);
        }
      } else {
        // Reset after showing all messages
        setTimeout(() => {
          setMessages([]);
          setCurrentMessageIndex(0);
        }, 5000);
      }
    }, currentMessageIndex === 0 ? 1000 : 3000);

    return () => clearTimeout(timer);
  }, [currentMessageIndex, demoConversation.length]);

  const handleQuickAction = (action) => {
    setInputValue(action);
  };

  // Format AI messages with better typography
  const formatMessage = (message) => {
    if (!message) return message;

    // Split by lines and format each line
    return message.split('\n').map((line, index) => {
      // Check if line is a section header (ends with colon and no bullet)
      if (line.trim().endsWith(':') && !line.trim().startsWith('•')) {
        return (
          <div key={index} className="message-header">
            {line.trim()}
          </div>
        );
      }
      // Regular line
      return (
        <div key={index} className="message-line">
          {line}
        </div>
      );
    });
  };

  return (
    <section className="saytrix-chat-preview">
      <div className="container">
        <SectionHeader
          title="Meet Saytrix AI Assistant"
          subtitle="Your personal trading mentor powered by advanced AI"
          highlight="Saytrix"
          variant="saytrix"
        />

        <div className="chat-demo-container">
          <motion.div 
            className="chat-window"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <div className="chat-header">
              <div className="chat-avatar">
                <FiCpu size={20} />
              </div>
              <div className="chat-info">
                <h3>Saytrix AI</h3>
                <span className="status">Online • Ready to help</span>
              </div>
              <div className="voice-indicator">
                <FiMic size={16} />
              </div>
            </div>

            <div className="chat-messages">
              <AnimatePresence>
                {messages.map((msg, index) => (
                  <motion.div
                    key={index}
                    className={`message ${msg.type}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="message-avatar">
                      {msg.type === 'user' ? <FiUser size={16} /> : <FiCpu size={16} />}
                    </div>
                    <div className="message-content">
                      <div className="message-text">
                        {msg.type === 'ai' ? formatMessage(msg.message) : msg.message}
                      </div>
                      <span className="message-time">{msg.timestamp}</span>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {isTyping && (
                <motion.div
                  className="message ai typing"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <div className="message-avatar">
                    <FiCpu size={16} />
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
            </div>

            <div className="chat-input-container">
              <div className="quick-actions">
                {quickActions.map((action, index) => (
                  <motion.button
                    key={action}
                    className="quick-action-btn"
                    onClick={() => handleQuickAction(action)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    {action}
                  </motion.button>
                ))}
              </div>
              
              <div className="chat-input">
                <input
                  type="text"
                  placeholder="Ask Saytrix anything about stocks..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                />
                <button className="send-btn">
                  <FiSend size={16} />
                </button>
              </div>
            </div>
          </motion.div>

          <motion.div 
            className="chat-features"
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            viewport={{ once: true }}
          >
            <h3>What Saytrix Can Do:</h3>
            <ul>
              <li>📊 Real-time stock analysis</li>
              <li>📈 Technical chart interpretation</li>
              <li>💰 Portfolio optimization tips</li>
              <li>🎯 Risk assessment guidance</li>
              <li>📰 Market news summaries</li>
              <li>🗣️ Voice command support</li>
            </ul>
            
            <motion.button
              className="try-saytrix-btn"
              onClick={() => navigate('/signup')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Try Saytrix Now
              <FiArrowRight size={16} />
            </motion.button>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default SaytrixChatPreview;
