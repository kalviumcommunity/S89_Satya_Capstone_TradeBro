import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiMessageSquare, FiX, FiSend, FiUser, FiCpu, FiChevronDown, FiChevronUp, FiAlertCircle } from "react-icons/fi";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import { safeApiCall, createDummyData } from "../utils/apiUtils";
import API_ENDPOINTS from "../config/apiConfig";
import "../styles/components/TradingAssistant.css";

const TradingAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "👋 Hi there! I'm your TradeBro assistant. Feel free to ask me anything about stocks, trading strategies, or market trends. How can I help you today?",
      sender: "bot",
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [suggestedQuestions, setSuggestedQuestions] = useState([
    "What are the current market trends?",
    "Tell me about Zomato stock",
    "Explain options trading",
    "What's the difference between limit and market orders?"
  ]);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [sessionId, setSessionId] = useState(null);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);

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
      setError("Chat session not initialized");
      return;
    }

    setIsTyping(true);

    // Create fallback data for chat messages
    const fallbackData = createDummyData(() => {
      // Generate a helpful response based on the query
      let responseText;

      if (text.toLowerCase().includes("stock") || text.toLowerCase().includes("price")) {
        responseText = `I'd be happy to help you with information about stocks and the market.

The stock market has been quite volatile lately, with tech stocks showing strong performance. If you're interested in a specific stock, you can ask me about it, and I'll provide you with the latest information.

Some popular stocks to consider:
• Apple (AAPL)
• Microsoft (MSFT)
• Amazon (AMZN)
• Tesla (TSLA)
• Google (GOOGL)

What specific information would you like to know?`;
      } else if (text.toLowerCase().includes("market") || text.toLowerCase().includes("trend")) {
        responseText = `The market has been showing interesting trends lately. Tech stocks continue to perform well, while energy and financial sectors have been more volatile.

Key market indicators:
• S&P 500: Showing moderate growth
• NASDAQ: Technology-driven growth
• Dow Jones: Mixed performance
• VIX: Volatility has been decreasing

Would you like more specific information about any particular sector or trend?`;
      } else if (text.toLowerCase().includes("help") || text.toLowerCase().includes("what can you do")) {
        responseText = `I'm your TradeBro assistant, and I'm here to help you with all things related to trading and investing. Here's what I can do:

1. Provide real-time stock information
2. Analyze market trends
3. Explain trading concepts
4. Offer investment strategies
5. Answer financial questions

Just ask me anything related to trading, and I'll do my best to assist you!`;
      } else {
        responseText = `Thanks for your question! As your TradeBro assistant, I'm here to help with all your trading needs.

Based on your question, I'd recommend exploring some of the key features of our platform:

• Real-time stock tracking
• Portfolio management
• Market analysis tools
• Trading strategies

Would you like me to explain any of these features in more detail?`;
      }

      return {
        success: true,
        type: 'text',
        message: responseText,
        isFallbackData: false
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
        timeout: 5000
      });

      if (result && result.success) {
        let botResponse;

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
          const data = result.data;

          // Format market cap to be more readable
          let marketCapFormatted;
          if (data.marketCap >= 1000000000000) {
            marketCapFormatted = `$${(data.marketCap / 1000000000000).toFixed(2)} trillion`;
          } else if (data.marketCap >= 1000000000) {
            marketCapFormatted = `$${(data.marketCap / 1000000000).toFixed(2)} billion`;
          } else if (data.marketCap >= 1000000) {
            marketCapFormatted = `$${(data.marketCap / 1000000).toFixed(2)} million`;
          } else {
            marketCapFormatted = `$${data.marketCap.toLocaleString()}`;
          }

          // Use ₹ symbol for Indian stocks
          const isIndianStock = result.symbol === "ZOMATO" ||
                               (result.symbol && result.symbol.endsWith(".NS")) ||
                               (result.symbol && result.symbol.endsWith(".BO"));
          const currencySymbol = isIndianStock ? "₹" : "$";

          botResponse = {
            id: uuidv4(),
            text: `📊 Here's the latest data for ${result.symbol}:

• Price: ${currencySymbol}${data.price.toFixed(2)}
• Daily High: ${currencySymbol}${data.dayHigh.toFixed(2)}
• Daily Low: ${currencySymbol}${data.dayLow.toFixed(2)}
• Market Cap: ${marketCapFormatted}
• P/E Ratio: ${data.peRatio ? data.peRatio.toFixed(2) : 'N/A'}
• Volume: ${data.volume.toLocaleString()}

Remember that market conditions change quickly, so always verify before making decisions! 📈`,
            sender: "bot",
            timestamp: new Date(),
            stockData: true,
            isFallback: result.isFallbackData
          };
        } else if (result.type === 'topGainers') {
          // Format top gainers response
          const gainers = result.data;
          let gainersText = "🔥 Today's top performers in the market:\n\n";

          gainers.forEach((stock, index) => {
            gainersText += `${index + 1}. ${stock.companyName} (${stock.symbol}): $${stock.price.toFixed(2)} (↑${stock.changePercent.toFixed(2)}%)\n`;
          });

          gainersText += "\nThese stocks are showing strong momentum today! Remember that past performance doesn't guarantee future results. 📈";

          botResponse = {
            id: uuidv4(),
            text: gainersText,
            sender: "bot",
            timestamp: new Date(),
            topGainers: true,
            isFallback: result.isFallbackData
          };
        }

        if (botResponse) {
          setMessages(prevMessages => [...prevMessages, botResponse]);
        } else {
          throw new Error("Unknown response type");
        }

        // Update suggested questions based on the conversation
        updateSuggestedQuestions(text);
      } else {
        throw new Error("Failed to get response from chatbot");
      }
    } catch (err) {
      console.error("Error sending message:", err);

      // Generate a helpful response based on the query
      let fallbackResponse;

      if (text.toLowerCase().includes("stock") || text.toLowerCase().includes("price")) {
        fallbackResponse = {
          id: uuidv4(),
          text: `I'd be happy to help you with information about stocks and the market.

The stock market has been quite volatile lately, with tech stocks showing strong performance. If you're interested in a specific stock, you can ask me about it, and I'll provide you with the latest information.

Some popular stocks to consider:
• Apple (AAPL)
• Microsoft (MSFT)
• Amazon (AMZN)
• Tesla (TSLA)
• Google (GOOGL)

What specific information would you like to know?`,
          sender: "bot",
          timestamp: new Date(),
          isFallback: false
        };
      } else if (text.toLowerCase().includes("market") || text.toLowerCase().includes("trend")) {
        fallbackResponse = {
          id: uuidv4(),
          text: `The market has been showing interesting trends lately. Tech stocks continue to perform well, while energy and financial sectors have been more volatile.

Key market indicators:
• S&P 500: Showing moderate growth
• NASDAQ: Technology-driven growth
• Dow Jones: Mixed performance
• VIX: Volatility has been decreasing

Would you like more specific information about any particular sector or trend?`,
          sender: "bot",
          timestamp: new Date(),
          isFallback: false
        };
      } else if (text.toLowerCase().includes("help") || text.toLowerCase().includes("what can you do")) {
        fallbackResponse = {
          id: uuidv4(),
          text: `I'm your TradeBro assistant, and I'm here to help you with all things related to trading and investing. Here's what I can do:

1. Provide real-time stock information
2. Analyze market trends
3. Explain trading concepts
4. Offer investment strategies
5. Answer financial questions

Just ask me anything related to trading, and I'll do my best to assist you!`,
          sender: "bot",
          timestamp: new Date(),
          isFallback: false
        };
      } else {
        fallbackResponse = {
          id: uuidv4(),
          text: `Thanks for your question! As your TradeBro assistant, I'm here to help with all your trading needs.

Based on your question, I'd recommend exploring some of the key features of our platform:

• Real-time stock tracking
• Portfolio management
• Market analysis tools
• Trading strategies

Would you like me to explain any of these features in more detail?`,
          sender: "bot",
          timestamp: new Date(),
          isFallback: false
        };
      }

      setMessages(prevMessages => [...prevMessages, fallbackResponse]);
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
