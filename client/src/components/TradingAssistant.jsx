import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiMessageSquare, FiX, FiSend, FiUser, FiCpu, FiChevronDown, FiChevronUp, FiAlertCircle } from "react-icons/fi";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import "./TradingAssistant.css";

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
      try {
        const clientSessionId = uuidv4();
        const response = await axios.post("http://localhost:5000/api/chatbot/start", {
          sessionId: clientSessionId
        });

        if (response.data.success) {
          setSessionId(response.data.sessionId);
          console.log("Chat session started with ID:", response.data.sessionId);
        } else {
          setError("Failed to start chat session");
          console.error("Failed to start chat session:", response.data);
        }
      } catch (err) {
        // Instead of showing an error banner, add a friendly message to the chat
        console.error("Error starting chat session:", err);

        // Add a user-friendly message to the chat instead of setting error state
        setMessages(prevMessages => [
          ...prevMessages,
          {
            id: uuidv4(),
            text: "I'm having trouble initializing my systems. Please try closing and reopening the chat, or refresh the page if the issue persists.",
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
        axios.post("http://localhost:5000/api/chatbot/end", { sessionId })
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

    try {
      const response = await axios.post("http://localhost:5000/api/chatbot/message", {
        sessionId,
        message: text
      });

      if (response.data.success) {
        let botResponse;

        // Handle different response types
        if (response.data.type === 'text') {
          botResponse = {
            id: uuidv4(),
            text: response.data.message,
            sender: "bot",
            timestamp: new Date()
          };
        } else if (response.data.type === 'stockData') {
          // Format stock data response
          const data = response.data.data;

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
          const isIndianStock = response.data.symbol === "ZOMATO" ||
                               response.data.symbol.endsWith(".NS") ||
                               response.data.symbol.endsWith(".BO");
          const currencySymbol = isIndianStock ? "₹" : "$";

          botResponse = {
            id: uuidv4(),
            text: `📊 Here's the latest data for ${response.data.symbol}:

• Price: ${currencySymbol}${data.price.toFixed(2)}
• Daily High: ${currencySymbol}${data.dayHigh.toFixed(2)}
• Daily Low: ${currencySymbol}${data.dayLow.toFixed(2)}
• Market Cap: ${marketCapFormatted}
• P/E Ratio: ${data.peRatio ? data.peRatio.toFixed(2) : 'N/A'}
• Volume: ${data.volume.toLocaleString()}

Remember that market conditions change quickly, so always verify before making decisions! 📈`,
            sender: "bot",
            timestamp: new Date()
          };
        } else if (response.data.type === 'topGainers') {
          // Format top gainers response
          const gainers = response.data.data;
          let gainersText = "🔥 Today's top performers in the market:\n\n";

          gainers.forEach((stock, index) => {
            gainersText += `${index + 1}. ${stock.companyName} (${stock.symbol}): $${stock.price.toFixed(2)} (↑${stock.changePercent.toFixed(2)}%)\n`;
          });

          gainersText += "\nThese stocks are showing strong momentum today! Remember that past performance doesn't guarantee future results. 📈";

          botResponse = {
            id: uuidv4(),
            text: gainersText,
            sender: "bot",
            timestamp: new Date()
          };
        }

        setMessages(prevMessages => [...prevMessages, botResponse]);

        // Update suggested questions based on the conversation
        updateSuggestedQuestions(text);
      } else {
        setError("Failed to get response from chatbot");
        console.error("Failed to get response:", response.data);
      }
    } catch (err) {
      console.error("Error sending message:", err);

      // Don't set the error state to avoid showing the error banner
      // setError("Error communicating with chatbot service");

      // Add a more friendly fallback error message as a regular bot message
      const errorResponse = {
        id: uuidv4(),
        text: "I apologize, but I'm experiencing a temporary connection issue with my data sources. Please try your question again in a moment or ask something else.",
        sender: "bot",
        timestamp: new Date(),
        isError: true
      };

      setMessages(prevMessages => [...prevMessages, errorResponse]);
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

    setMessages([...messages, userMessage]);

    // Send message to chatbot API
    sendMessage(question);
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

  // Format message text with line breaks, quotes, and hashes
  const formatMessageText = (text) => {
    // First handle line breaks
    const lines = text.split('\n');

    return lines.map((line, i) => {
      // Process markdown-style formatting
      let processedLine = line;

      // Handle bold text with asterisks (e.g., *bold*)
      processedLine = processedLine.replace(
        /\*(.*?)\*/g,
        '<strong>$1</strong>'
      );

      // Handle quotes (e.g., "quote")
      processedLine = processedLine.replace(
        /"(.*?)"/g,
        '<span class="quoted-text">"$1"</span>'
      );

      // Handle headers with hash (e.g., # Header)
      if (processedLine.match(/^#+\s/)) {
        const headerLevel = processedLine.match(/^(#+)\s/)[1].length;
        const headerText = processedLine.replace(/^#+\s/, '');
        return (
          <React.Fragment key={i}>
            <span className={`header-${headerLevel}`}>{headerText}</span>
            {i < lines.length - 1 && <br />}
          </React.Fragment>
        );
      }

      return (
        <React.Fragment key={i}>
          <span dangerouslySetInnerHTML={{ __html: processedLine }} />
          {i < lines.length - 1 && <br />}
        </React.Fragment>
      );
    });
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
