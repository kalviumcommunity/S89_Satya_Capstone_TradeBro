import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiMessageSquare, FiX, FiSend, FiUser, FiCpu, FiChevronDown, FiChevronUp, FiAlertCircle } from "react-icons/fi";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import { safeApiCall, createDummyData } from "../utils/apiUtils";
import API_ENDPOINTS from "../config/apiConfig";
import "../styles/components/TradingAssistant.css";

const TradingAssistant = () => {
  // Get saved state from localStorage or use defaults
  const getSavedState = () => {
    try {
      const savedMessages = localStorage.getItem('tradebro_chat_messages');
      const savedIsOpen = localStorage.getItem('tradebro_chat_isOpen');
      const savedSuggestions = localStorage.getItem('tradebro_chat_suggestions');
      const savedShowSuggestions = localStorage.getItem('tradebro_chat_showSuggestions');

      return {
        messages: savedMessages ? JSON.parse(savedMessages) : [
          {
            id: 1,
            text: "👋 Hi there! I'm your TradeBro assistant. Feel free to ask me anything about stocks, trading strategies, or market trends. How can I help you today?",
            sender: "bot",
            timestamp: new Date()
          }
        ],
        isOpen: savedIsOpen ? JSON.parse(savedIsOpen) : false,
        suggestedQuestions: savedSuggestions ? JSON.parse(savedSuggestions) : [
          "What are the current market trends?",
          "Tell me about Zomato stock",
          "Explain options trading",
          "What's the difference between limit and market orders?"
        ],
        showSuggestions: savedShowSuggestions ? JSON.parse(savedShowSuggestions) : true
      };
    } catch (error) {
      console.error("Error loading saved chat state:", error);
      // Return defaults if there's an error
      return {
        messages: [
          {
            id: 1,
            text: "👋 Hi there! I'm your TradeBro assistant. Feel free to ask me anything about stocks, trading strategies, or market trends. How can I help you today?",
            sender: "bot",
            timestamp: new Date()
          }
        ],
        isOpen: false,
        suggestedQuestions: [
          "What are the current market trends?",
          "Tell me about Zomato stock",
          "Explain options trading",
          "What's the difference between limit and market orders?"
        ],
        showSuggestions: true
      };
    }
  };

  const savedState = getSavedState();

  const [isOpen, setIsOpen] = useState(savedState.isOpen);
  const [messages, setMessages] = useState(savedState.messages);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [suggestedQuestions, setSuggestedQuestions] = useState(savedState.suggestedQuestions);
  const [showSuggestions, setShowSuggestions] = useState(savedState.showSuggestions);
  const [sessionId, setSessionId] = useState(null);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);

  // Save state to localStorage when it changes
  useEffect(() => {
    try {
      localStorage.setItem('tradebro_chat_messages', JSON.stringify(messages));
    } catch (error) {
      console.error("Error saving messages to localStorage:", error);
    }
  }, [messages]);

  useEffect(() => {
    try {
      localStorage.setItem('tradebro_chat_isOpen', JSON.stringify(isOpen));
    } catch (error) {
      console.error("Error saving isOpen state to localStorage:", error);
    }
  }, [isOpen]);

  useEffect(() => {
    try {
      localStorage.setItem('tradebro_chat_suggestions', JSON.stringify(suggestedQuestions));
      localStorage.setItem('tradebro_chat_showSuggestions', JSON.stringify(showSuggestions));
    } catch (error) {
      console.error("Error saving suggestions to localStorage:", error);
    }
  }, [suggestedQuestions, showSuggestions]);

  // Start a chat session when the component mounts
  useEffect(() => {
    const startChatSession = async () => {
      const clientSessionId = uuidv4();

      // Create fallback data for chat session
      const fallbackData = createDummyData({
        success: true,
        sessionId: clientSessionId,
        isFallbackSession: true
      });

      try {
        // Use safe API call with fallback data
        const result = await safeApiCall({
          method: 'post',
          url: API_ENDPOINTS.CHATBOT.START,
          data: { sessionId: clientSessionId },
          fallbackData,
          timeout: 3000
        });

        if (result && result.success) {
          setSessionId(result.sessionId);
          console.log("Chat session started with ID:", result.sessionId);

          // If this is a fallback session, add a message about limited connectivity
          if (result.isFallbackSession) {
            setTimeout(() => {
              setMessages(prevMessages => [
                ...prevMessages,
                {
                  id: uuidv4(),
                  text: "I'm currently experiencing limited connectivity to the server. Some features may be limited, but I'll do my best to assist you.",
                  sender: "bot",
                  timestamp: new Date(),
                  isFallback: true
                }
              ]);
            }, 500);
          }
        }
      } catch (err) {
        console.error("Error starting chat session:", err);

        // Set a local session ID as a fallback
        setSessionId(clientSessionId);

        // Add a user-friendly error message
        setMessages(prevMessages => [
          ...prevMessages,
          {
            id: uuidv4(),
            text: "I encountered an error while starting up. Some features may be limited.",
            sender: "bot",
            timestamp: new Date(),
            isError: true
          }
        ]);
      }
    };

    if (!sessionId) {
      startChatSession();
    }

    // Clean up function to end the chat session when component unmounts
    return () => {
      if (sessionId) {
        // Try to end the session
        safeApiCall({
          method: 'post',
          url: API_ENDPOINTS.CHATBOT.END,
          data: { sessionId },
          fallbackData: createDummyData({ success: true }),
          timeout: 2000
        })
          .then(() => console.log("Chat session ended"))
          .catch(err => console.error("Error ending chat session:", err));
      }
    };
  }, [sessionId]);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Toggle chat window
  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  // Handle input change
  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  // Send message to chatbot API
  const sendMessage = async (text) => {
    if (!sessionId) {
      // Create a new session if one doesn't exist
      try {
        const clientSessionId = uuidv4();
        setSessionId(clientSessionId);
        console.log("Created new chat session with ID:", clientSessionId);
      } catch (err) {
        setError("Unable to initialize chat session. Please refresh the page and try again.");
        return;
      }
    }

    setIsTyping(true);

    // Function to generate a response based on the query
    const generateContextualResponse = (query) => {
      const lowerQuery = query.toLowerCase();

      if (lowerQuery.includes("stock") || lowerQuery.includes("price") || lowerQuery.includes("share")) {
        return `I'd be happy to help you with information about stocks and the market.

The stock market has been quite volatile lately, with tech stocks showing strong performance. If you're interested in a specific stock, you can ask me about it, and I'll provide you with the latest information.

Some popular stocks to consider:
• Reliance Industries (RELIANCE.NS)
• Tata Consultancy Services (TCS.NS)
• HDFC Bank (HDFCBANK.NS)
• Infosys (INFY.NS)
• ICICI Bank (ICICIBANK.NS)

What specific information would you like to know?`;
      } else if (lowerQuery.includes("market") || lowerQuery.includes("trend") || lowerQuery.includes("index")) {
        return `The market has been showing interesting trends lately. Tech stocks continue to perform well, while energy and financial sectors have been more volatile.

Key market indicators:
• NIFTY 50: Showing moderate growth
• BSE SENSEX: Stable with upward momentum
• NIFTY Bank: Mixed performance
• India VIX: Volatility has been decreasing

Would you like more specific information about any particular sector or trend?`;
      } else if (lowerQuery.includes("help") || lowerQuery.includes("what can you do") || lowerQuery.includes("assist")) {
        return `I'm your TradeBro assistant, and I'm here to help you with all things related to trading and investing. Here's what I can do:

1. Provide real-time stock information
2. Analyze market trends
3. Explain trading concepts
4. Offer investment strategies
5. Answer financial questions

Just ask me anything related to trading, and I'll do my best to assist you!`;
      } else if (lowerQuery.includes("buy") || lowerQuery.includes("sell") || lowerQuery.includes("trade")) {
        return `I can help you understand trading concepts and strategies!

When considering buying or selling stocks, it's important to:

• Research the company fundamentals
• Analyze technical indicators
• Consider market conditions
• Set clear entry and exit points
• Manage your risk appropriately

Would you like me to explain any of these aspects in more detail?`;
      } else {
        return `Thanks for your question! As your TradeBro assistant, I'm here to help with all your trading needs.

Based on your question, I'd recommend exploring some of the key features of our platform:

• Real-time stock tracking
• Portfolio management
• Market analysis tools
• Trading strategies

Would you like me to explain any of these features in more detail?`;
      }
    };

    // Create fallback data for chat messages
    const fallbackData = createDummyData(() => {
      return {
        success: true,
        type: 'text',
        message: generateContextualResponse(text),
        isFallbackData: true
      };
    });

    try {
      // Use safe API call with fallback data
      const result = await safeApiCall({
        method: 'post',
        url: API_ENDPOINTS.CHATBOT.MESSAGE,
        data: {
          sessionId,
          message: text
        },
        fallbackData,
        timeout: 10000 // Increase timeout to give server more time to respond
      });

      if (result && result.success) {
        let botResponse;

        try {
          // Handle different response types
          if (result.type === 'text') {
            botResponse = {
              id: uuidv4(),
              text: result.message,
              sender: "bot",
              timestamp: new Date(),
              isFallback: result.isFallbackData
            };
          } else if (result.type === 'stockData') {
            // Format stock data response
            const data = result.data || {};

            // Safely format market cap with fallbacks
            let marketCapFormatted = 'N/A';
            try {
              const marketCap = Number(data.marketCap);
              if (!isNaN(marketCap)) {
                if (marketCap >= 1000000000000) {
                  marketCapFormatted = `₹${(marketCap / 1000000000000).toFixed(2)} trillion`;
                } else if (marketCap >= 1000000000) {
                  marketCapFormatted = `₹${(marketCap / 1000000000).toFixed(2)} billion`;
                } else if (marketCap >= 1000000) {
                  marketCapFormatted = `₹${(marketCap / 1000000).toFixed(2)} million`;
                } else {
                  marketCapFormatted = `₹${marketCap.toLocaleString()}`;
                }
              }
            } catch (err) {
              console.error("Error formatting market cap:", err);
            }

            // Use ₹ symbol for Indian stocks (default to ₹ for all stocks in our app)
            const currencySymbol = "₹";

            // Safely format price data with fallbacks
            const formatPrice = (value) => {
              try {
                return value !== undefined && !isNaN(Number(value))
                  ? `${currencySymbol}${Number(value).toFixed(2)}`
                  : 'N/A';
              } catch (err) {
                return 'N/A';
              }
            };

            botResponse = {
              id: uuidv4(),
              text: `📊 Here's the latest data for ${result.symbol || 'this stock'}:

• Price: ${formatPrice(data.price)}
• Daily High: ${formatPrice(data.dayHigh)}
• Daily Low: ${formatPrice(data.dayLow)}
• Market Cap: ${marketCapFormatted}
• P/E Ratio: ${data.peRatio ? Number(data.peRatio).toFixed(2) : 'N/A'}
• Volume: ${data.volume ? Number(data.volume).toLocaleString() : 'N/A'}

Remember that market conditions change quickly, so always verify before making decisions! 📈`,
              sender: "bot",
              timestamp: new Date(),
              stockData: true,
              isFallback: result.isFallbackData
            };
          } else if (result.type === 'topGainers') {
            // Format top gainers response with error handling
            try {
              const gainers = Array.isArray(result.data) ? result.data : [];
              let gainersText = "🔥 Today's top performers in the market:\n\n";

              if (gainers.length > 0) {
                gainers.forEach((stock, index) => {
                  const symbol = stock.symbol || 'Unknown';
                  const companyName = stock.companyName || symbol;
                  const price = !isNaN(Number(stock.price)) ? Number(stock.price).toFixed(2) : 'N/A';
                  const changePercent = !isNaN(Number(stock.changePercent)) ? Number(stock.changePercent).toFixed(2) : 'N/A';

                  gainersText += `${index + 1}. ${companyName} (${symbol}): ₹${price} (↑${changePercent}%)\n`;
                });
              } else {
                gainersText += "Sorry, I couldn't retrieve the top gainers at the moment.\n";
              }

              gainersText += "\nThese stocks are showing strong momentum today! Remember that past performance doesn't guarantee future results. 📈";

              botResponse = {
                id: uuidv4(),
                text: gainersText,
                sender: "bot",
                timestamp: new Date(),
                topGainers: true,
                isFallback: result.isFallbackData
              };
            } catch (err) {
              console.error("Error formatting top gainers:", err);
              throw new Error("Failed to format top gainers data");
            }
          }
        } catch (formatError) {
          console.error("Error formatting response:", formatError);
          // If there's an error in formatting, create a generic response
          botResponse = {
            id: uuidv4(),
            text: "I found some information for you, but had trouble formatting it. Let me try to help you in another way. Could you rephrase your question?",
            sender: "bot",
            timestamp: new Date(),
            isFallback: true
          };
        }

        if (botResponse) {
          setMessages(prevMessages => [...prevMessages, botResponse]);
        } else {
          // Handle unknown response type with a fallback
          const fallbackResponse = {
            id: uuidv4(),
            text: result.message || "I received your message but I'm not sure how to display the response. Let me try to help you with something else.",
            sender: "bot",
            timestamp: new Date(),
            isFallback: true
          };
          setMessages(prevMessages => [...prevMessages, fallbackResponse]);
        }

        // Update suggested questions based on the conversation
        updateSuggestedQuestions(text);
      } else {
        throw new Error("Failed to get response from chatbot");
      }
    } catch (err) {
      console.error("Error sending message:", err);

      // Generate a helpful response based on the query
      const fallbackResponse = {
        id: uuidv4(),
        text: generateContextualResponse(text),
        sender: "bot",
        timestamp: new Date(),
        isFallback: true
      };

      setMessages(prevMessages => [...prevMessages, fallbackResponse]);

      // Update suggested questions even in case of error
      updateSuggestedQuestions(text);
    } finally {
      setIsTyping(false);
    }
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();

    if (inputValue.trim() === "") return;

    // Add user message
    const userMessage = {
      id: uuidv4(),
      text: inputValue,
      sender: "user",
      timestamp: new Date()
    };

    setMessages([...messages, userMessage]);

    // Send message to chatbot API
    sendMessage(inputValue);

    // Clear input
    setInputValue("");
  };

  // Handle suggested question click
  const handleSuggestedQuestion = (question) => {
    // Add user message
    const userMessage = {
      id: uuidv4(),
      text: question,
      sender: "user",
      timestamp: new Date()
    };

    // First update the messages state
    setMessages(prevMessages => [...prevMessages, userMessage]);

    // Use setTimeout to ensure the state is updated before sending
    setTimeout(() => {
      // Send message to chatbot API
      sendMessage(question);
    }, 50);

    // Also update the input field for better UX
    setInputValue(question);
  };

  // Update suggested questions based on conversation context
  const updateSuggestedQuestions = (userInput) => {
    const userQuestion = userInput.toLowerCase();

    if (userQuestion.includes("market") || userQuestion.includes("trend")) {
      setSuggestedQuestions([
        "Which sectors are performing well?",
        "How do interest rates affect the market?",
        "What's the outlook for tech stocks?",
        "Should I invest during market volatility?"
      ]);
    } else if (userQuestion.includes("analyze") || userQuestion.includes("research")) {
      setSuggestedQuestions([
        "What are key financial ratios to look at?",
        "How do I read a balance sheet?",
        "What is fundamental analysis?",
        "How important is a company's management team?"
      ]);
    } else if (userQuestion.includes("options")) {
      setSuggestedQuestions([
        "What is a call option?",
        "What is a put option?",
        "How do I calculate options premium?",
        "What are covered calls?"
      ]);
    } else if (userQuestion.includes("stock") || userQuestion.includes("share")) {
      setSuggestedQuestions([
        "Show me Zomato stock data",
        "What's the current price of MSFT?",
        "Tell me about AMZN stock",
        "Show me TSLA performance"
      ]);
    } else {
      setSuggestedQuestions([
        "Show me today's top gainers",
        "What's the difference between stocks and bonds?",
        "How do dividends work?",
        "What are ETFs?"
      ]);
    }
  };

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Format message text with line breaks, quotes, bullet points, and hashes
  const formatMessageText = (text) => {
    if (!text) return null;

    try {
      // First handle line breaks
      const lines = text.split('\n');

    return lines.map((line, i) => {
      // Skip empty lines but preserve the break
      if (line.trim() === '') {
        return <React.Fragment key={i}><br /></React.Fragment>;
      }

      // Handle bullet points (e.g., • Item or * Item or - Item)
      if (line.trim().match(/^(•|\*|\-)\s+/)) {
        const bulletContent = line.trim().replace(/^(•|\*|\-)\s+/, '');
        return (
          <React.Fragment key={i}>
            <div className="bullet-point-row">
              <span className="bullet-point">•</span>
              <span className="bullet-content">{bulletContent}</span>
            </div>
            {i < lines.length - 1 && <br />}
          </React.Fragment>
        );
      }

      // Handle headers with hash (e.g., # Header)
      if (line.match(/^#+\s/)) {
        try {
          const headerMatch = line.match(/^(#+)\s/);
          if (headerMatch && headerMatch[1]) {
            const headerLevel = headerMatch[1].length;
            const headerText = line.replace(/^#+\s/, '');
            return (
              <React.Fragment key={i}>
                <span className={`header-${headerLevel}`}>{headerText}</span>
                {i < lines.length - 1 && <br />}
              </React.Fragment>
            );
          }
        } catch (err) {
          console.error("Error parsing header:", err);
          // Fallback for header parsing errors
          return (
            <React.Fragment key={i}>
              <span style={{ fontWeight: 'bold' }}>{line}</span>
              {i < lines.length - 1 && <br />}
            </React.Fragment>
          );
        }
      }

      // Handle stock data formatting (e.g., Price: $100.00)
      if (line.match(/^(Price|Daily High|Daily Low|Market Cap|P\/E Ratio|Volume):/)) {
        try {
          const parts = line.split(':');
          const label = parts[0].trim();
          const value = parts.slice(1).join(':').trim(); // Handle colons in the value
          return (
            <React.Fragment key={i}>
              <div className="stock-data-row">
                <span className="stock-data-label">{label}:</span>
                <span className="stock-data-value">{value}</span>
              </div>
              {i < lines.length - 1 && <br />}
            </React.Fragment>
          );
        } catch (err) {
          console.error("Error parsing stock data:", err);
          // Fallback for stock data parsing errors
          return (
            <React.Fragment key={i}>
              <div>{line}</div>
              {i < lines.length - 1 && <br />}
            </React.Fragment>
          );
        }
      }

      // Process other markdown-style formatting
      let processedLine = line;

      try {
        // Handle bold text with asterisks (e.g., *bold*)
        processedLine = processedLine.replace(
          /\*([^*]+)\*/g,
          '<strong>$1</strong>'
        );

        // Handle quotes (e.g., "quote")
        processedLine = processedLine.replace(
          /"([^"]+)"/g,
          '<span class="quoted-text">"$1"</span>'
        );
      } catch (err) {
        console.error("Error formatting text:", err);
        // If formatting fails, just use the original line
        processedLine = line;
      }

      return (
        <React.Fragment key={i}>
          <span dangerouslySetInnerHTML={{ __html: processedLine }} />
          {i < lines.length - 1 && <br />}
        </React.Fragment>
      );
    });
    } catch (error) {
      console.error("Error formatting message:", error);
      // Return the plain text as fallback
      return <span>{text}</span>;
    }
  };

  return (
    <>
      {/* Chat toggle button */}
      <motion.button
        className="chat-toggle-btn"
        onClick={toggleChat}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        {isOpen ? <FiX /> : <FiMessageSquare />}
      </motion.button>

      {/* Chat window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="chat-window"
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ duration: 0.3 }}
          >
            <div className="chat-header">
              <div className="chat-title">
                <FiCpu className="bot-icon" />
                <h3>Trading Assistant</h3>
              </div>
              <button className="close-btn" onClick={toggleChat}>
                <FiX />
              </button>
            </div>

            <div className="chat-messages">
              {error && (
                <div className="error-message">
                  <FiAlertCircle />
                  <span>{error}</span>
                </div>
              )}

              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`message ${message.sender === "bot" ? "bot" : "user"}`}
                >
                  <div className="message-avatar">
                    {message.sender === "bot" ? <FiCpu /> : <FiUser />}
                  </div>
                  <div className="message-content">
                    <div className={`message-text ${message.isError ? 'error' : ''}`}>
                      {formatMessageText(message.text)}
                    </div>
                    <div className="message-time">{formatTimestamp(message.timestamp)}</div>
                  </div>
                </div>
              ))}

              {isTyping && (
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
              )}

              <div ref={messagesEndRef} />
            </div>

            <div className="suggested-questions">
              <div className="questions-header" onClick={() => setShowSuggestions(!showSuggestions)}>
                <h4>Suggested Questions</h4>
                {showSuggestions ? <FiChevronUp /> : <FiChevronDown />}
              </div>
              {showSuggestions && (
                <div className="questions-list">
                  {suggestedQuestions.map((question, index) => (
                    <button
                      key={index}
                      className="question-btn"
                      onClick={() => handleSuggestedQuestion(question)}
                    >
                      {question}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <form className="chat-input" onSubmit={handleSubmit}>
              <input
                type="text"
                placeholder="Type your question here..."
                value={inputValue}
                onChange={handleInputChange}
                disabled={isTyping || !sessionId}
              />
              <button type="submit" disabled={inputValue.trim() === "" || isTyping || !sessionId}>
                <FiSend />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default TradingAssistant;
