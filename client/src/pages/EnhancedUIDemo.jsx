import React, { useState } from "react";
import { motion } from "framer-motion";
import { 
  FiInfo, FiCheckCircle, FiAlertCircle, FiArrowRight, 
  FiCpu, FiUser, FiSettings, FiDollarSign, FiTrendingUp, 
  FiTrendingDown, FiClock, FiGift, FiMessageSquare
} from "react-icons/fi";
import PageLayout from "../components/PageLayout";
import EnhancedSidebar from "../components/EnhancedSidebar";
import "../styles/pages/EnhancedTradingAssistantPage.css";
import "../styles/EnhancedSidebar.css";

// Enhanced UI Demo Page
const EnhancedUIDemo = () => {
  const [activeTab, setActiveTab] = useState("assistant");
  const [fontSizeLevel, setFontSizeLevel] = useState(1); // 0: small, 1: medium, 2: large
  
  // Demo data
  const virtualMoney = {
    balance: 17832.33,
    canClaimReward: true,
    timeToNextReward: { hours: 23, minutes: 45 }
  };
  
  const balanceHistory = [
    { date: "Mon", balance: 15000 },
    { date: "Tue", balance: 16200 },
    { date: "Wed", balance: 15800 },
    { date: "Thu", balance: 16500 },
    { date: "Fri", balance: 17200 },
    { date: "Sat", balance: 17500 },
    { date: "Sun", balance: 17832.33 }
  ];
  
  const recentActions = [
    {
      id: 1,
      type: "reward",
      title: "Daily Reward Claimed",
      time: "2 hours ago",
      icon: <FiGift />
    },
    {
      id: 2,
      type: "trade",
      title: "Bought AAPL x5",
      time: "Yesterday",
      icon: <FiTrendingUp />
    },
    {
      id: 3,
      type: "chat",
      title: "Asked about market trends",
      time: "2 days ago",
      icon: <FiMessageSquare />
    }
  ];
  
  const messages = [
    {
      id: 1,
      text: `👋 Hi there! I'm your TradeBro assistant powered by Google's Gemini 2.0. You currently have ₹17,832.33 in virtual money to practice trading. Feel free to ask me anything about stocks, trading strategies, or market trends. How can I help you today?`,
      sender: "bot",
      timestamp: new Date(Date.now() - 3600000)
    },
    {
      id: 2,
      text: "What are the top performing stocks today?",
      sender: "user",
      timestamp: new Date(Date.now() - 3500000)
    },
    {
      id: 3,
      text: `Here are today's top performing stocks:

• **NVIDIA (NVDA)**: Up 4.2% - Strong demand for AI chips continues to drive growth
• **Tesla (TSLA)**: Up 3.8% - Announced new battery technology
• **Apple (AAPL)**: Up 2.5% - New product announcement expected next week
• **Microsoft (MSFT)**: Up 2.1% - Cloud services revenue exceeding expectations
• **Amazon (AMZN)**: Up 1.9% - E-commerce growth remains strong

Would you like more details about any of these stocks?`,
      sender: "bot",
      timestamp: new Date(Date.now() - 3400000),
      fromGemini: true
    },
    {
      id: 4,
      text: "Tell me more about NVIDIA",
      sender: "user",
      timestamp: new Date(Date.now() - 1800000)
    },
    {
      id: 5,
      text: `📊 Here's the latest data for NVDA:

• Price: ₹845.32
• Daily High: ₹852.75
• Daily Low: ₹830.18
• Market Cap: ₹2.08T
• P/E Ratio: 68.42
• Volume: 42,567,890

NVIDIA has been performing exceptionally well due to the AI boom. Their GPUs are essential for training and running AI models, giving them a strong competitive advantage in the current market.

Would you like to know more about NVIDIA or see a price chart?`,
      sender: "bot",
      timestamp: new Date(Date.now() - 1700000),
      stockData: true
    }
  ];
  
  const suggestedQuestions = [
    "What's the difference between bulls and bears?",
    "How do I read a stock chart?",
    "What is market capitalization?",
    "How to identify undervalued stocks?",
    "What are the best stocks to invest in now?"
  ];
  
  // Format message text with markdown-like syntax
  const formatMessageText = (text) => {
    if (!text) return "";
    
    // Replace bullet points
    const bulletPointsReplaced = text.replace(/•\s(.*?)(?=\n•|\n\n|$)/g, (match, content) => {
      return `<div class="bullet-point-row"><span class="bullet-point">•</span><span class="bullet-content">${content}</span></div>`;
    });
    
    // Replace headers
    const headersReplaced = bulletPointsReplaced
      .replace(/^# (.*?)$/gm, '<span class="header-1">$1</span>')
      .replace(/^## (.*?)$/gm, '<span class="header-2">$1</span>')
      .replace(/^### (.*?)$/gm, '<span class="header-3">$1</span>');
    
    // Replace bold text
    const boldReplaced = headersReplaced.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Replace quotes
    const quotesReplaced = boldReplaced.replace(/> (.*?)(?=\n|$)/g, '<span class="quoted-text">$1</span>');
    
    return <div dangerouslySetInnerHTML={{ __html: quotesReplaced }} />;
  };
  
  // Format timestamp
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "";
    
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  // Get font size class based on current level
  const getFontSizeClass = () => {
    return fontSizeLevel === 0 ? 'font-small' : fontSizeLevel === 1 ? 'font-medium' : 'font-large';
  };
  
  return (
    <PageLayout>
      <div className={`trading-assistant-page ${getFontSizeClass()}`}>
        <div className="assistant-header">
          <motion.div
            className="header-content"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1>Enhanced UI Demo</h1>
            <p>Showcasing the new Trading Assistant interface</p>
          </motion.div>
        </div>
        
        <div className="assistant-container">
          <div className="chat-interface">
            <div className="chat-sidebar">
              {/* Virtual Money Section */}
              <motion.div
                className="sidebar-section virtual-money-section"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.15 }}
              >
                <h3><FiDollarSign /> Virtual Money</h3>
                <div className="virtual-balance">
                  <span className="balance-label">Balance:</span>
                  <motion.span
                    className="balance-amount"
                    key={virtualMoney.balance}
                    initial={{ scale: 1 }}
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 0.5 }}
                  >
                    ₹{virtualMoney.balance.toLocaleString()}
                  </motion.span>
                </div>
                
                {/* Balance History Chart */}
                <div className="balance-history">
                  <h4>Balance History</h4>
                  <div className="mini-chart" style={{ height: '60px', background: 'rgba(16, 163, 127, 0.1)', borderRadius: '8px', position: 'relative' }}>
                    <div style={{ 
                      position: 'absolute', 
                      bottom: '0', 
                      left: '0', 
                      width: '100%', 
                      height: '40px',
                      background: 'linear-gradient(to top, rgba(16, 163, 127, 0.2), transparent)',
                      borderRadius: '8px'
                    }}></div>
                    <div style={{ 
                      position: 'absolute', 
                      bottom: '10px', 
                      left: '10%', 
                      width: '80%', 
                      height: '30px',
                      borderBottom: '2px solid #10a37f',
                      borderRadius: '50%'
                    }}></div>
                  </div>
                </div>
                
                {/* Daily Reward Button */}
                <div className="reward-section">
                  <button 
                    className={`claim-reward-btn ${virtualMoney.canClaimReward ? '' : 'claimed'}`}
                  >
                    <FiGift /> 
                    {virtualMoney.canClaimReward 
                      ? 'Claim Daily Reward' 
                      : `Next reward in ${virtualMoney.timeToNextReward.hours}h ${virtualMoney.timeToNextReward.minutes}m`}
                  </button>
                </div>
              </motion.div>
              
              {/* Recent Actions Section */}
              <motion.div
                className="sidebar-section"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <h3><FiClock /> Recent Actions</h3>
                <div className="recent-actions">
                  {recentActions.map(action => (
                    <div key={action.id} className="action-item">
                      <div className="action-icon">{action.icon}</div>
                      <div className="action-details">
                        <p className="action-title">{action.title}</p>
                        <p className="action-time">{action.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>

            <div className="chat-main">
              <div className="chat-messages">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`message ${message.sender === "bot" ? "bot" : "user"} ${message.fromGemini ? 'from-gemini' : ''} ${message.stockData ? 'stock-data' : ''}`}
                  >
                    <div className="message-avatar">
                      {message.sender === "bot" ? <FiCpu /> : <FiUser />}
                    </div>
                    <div className="message-content">
                      {message.fromGemini && (
                        <div className="message-source">
                          <span className="gemini-badge">Gemini 2.0</span>
                        </div>
                      )}
                      <div className={`message-text ${message.isError ? 'error' : ''} ${message.isOffline ? 'offline' : ''} ${message.isFallback ? 'mock-response' : ''}`}>
                        {formatMessageText(message.text)}
                      </div>
                      <div className="message-time">{formatTimestamp(message.timestamp)}</div>
                    </div>
                  </div>
                ))}
                
                {/* Typing Indicator Demo */}
                <div className="message bot">
                  <div className="message-avatar">
                    <FiCpu />
                  </div>
                  <div className="message-content">
                    <div className="typing-indicator">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="chat-controls">
                <div className="suggested-questions">
                  <div className="questions-header">
                    <h4>Suggested Questions</h4>
                    <FiArrowRight />
                  </div>
                  <div className="questions-list">
                    {suggestedQuestions.map((question, index) => (
                      <motion.button
                        key={index}
                        className="question-btn"
                        whileHover={{ y: -2, boxShadow: "0 4px 8px rgba(0,0,0,0.1)" }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {question}
                      </motion.button>
                    ))}
                  </div>
                </div>

                <form className="chat-input">
                  <input
                    type="text"
                    placeholder="Ask me about stocks, trading, or market trends..."
                    value=""
                  />
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <FiArrowRight />
                  </motion.button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default EnhancedUIDemo;
