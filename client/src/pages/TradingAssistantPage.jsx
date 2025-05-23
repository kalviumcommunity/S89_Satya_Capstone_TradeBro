import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiSend, FiUser, FiCpu, FiChevronDown, FiChevronUp,
  FiAlertCircle, FiTrendingUp, FiBarChart2, FiPieChart,
  FiRefreshCw, FiClock, FiInfo, FiHelpCircle, FiDollarSign,
  FiGift, FiShoppingCart, FiBell, FiZap, FiMessageSquare
} from "react-icons/fi";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import { useAuth } from "../context/AuthContext";
import { usePusher } from "../context/PusherContext.jsx";
import { useToast } from "../context/ToastContext";
import PageLayout from "../components/PageLayout";
import { API_ENDPOINTS } from "../config/apiConfig";
import "../styles/pages/TradingAssistantPage.css";

const TradingAssistantPage = () => {
  const { isAuthenticated, user } = useAuth();
  const { channel } = usePusher();
  const { addToast, success, error: showError, info, warning } = useToast();
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "👋 Hi there! I'm your TradeBro assistant powered by Google's Gemini 2.0. You currently have ₹10,000 in virtual money to practice trading. Feel free to ask me anything about stocks, trading strategies, or market trends. How can I help you today?",
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
  const [errorMessage, setErrorMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [virtualMoney, setVirtualMoney] = useState({
    balance: 10000,
    lastLoginReward: null,
    portfolio: []
  });
  const [showRewardAnimation, setShowRewardAnimation] = useState(false);
  const [modelInfo, setModelInfo] = useState({
    name: "Gemini 2.0 Flash",
    provider: "Google",
    isActive: false
  });
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);

  // Function to fetch virtual money data
  const fetchVirtualMoneyData = async () => {
    try {
      // Only fetch data if user is authenticated
      if (isAuthenticated && user) {
        try {
          // Add authorization header with token
          const token = localStorage.getItem('token');
          const headers = token ? { Authorization: `Bearer ${token}` } : {};

<<<<<<< HEAD
          const response = await axios.get(API_ENDPOINTS.VIRTUAL_MONEY.ACCOUNT, {
=======
          const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/virtual-money/account`, {
>>>>>>> b1a8bb87a9f2e1b3c2ce0c8518a40cf83a513f40
            headers,
            timeout: 5000
          });

          if (response.data.success) {
            setVirtualMoney(response.data.data);
            console.log("Successfully fetched virtual money data from API for user:", user.email);

            // Store in local storage as backup
            localStorage.setItem(`virtualMoney_${user.id}`, JSON.stringify(response.data.data));
          }
        } catch (apiError) {
          console.log("Backend API not available, using local storage data", apiError);

          // Try to get user-specific data from local storage
          const storedData = localStorage.getItem(`virtualMoney_${user.id}`);
          if (storedData) {
            const parsedData = JSON.parse(storedData);
            setVirtualMoney(parsedData);
            console.log("Using user-specific data from local storage for:", user.email);
          }
        }
      } else {
        // For non-authenticated users, use generic data from local storage
        const storedData = localStorage.getItem('virtualMoney');
        if (storedData) {
          const parsedData = JSON.parse(storedData);
          setVirtualMoney(parsedData);
          console.log("Using generic data from local storage for non-authenticated user");
        }
      }
    } catch (err) {
      console.error("Error in virtual money handling:", err);
      // Continue with default mock data
    }
  };

  // Function to claim daily login reward
  const claimDailyReward = async () => {
    try {
      let rewardClaimed = false;
      let rewardAmount = 1; // Default reward amount

      // Only proceed if user is authenticated
      if (isAuthenticated && user) {
        try {
          // Add authorization header with token
          const token = localStorage.getItem('token');
          const headers = token ? { Authorization: `Bearer ${token}` } : {};

<<<<<<< HEAD
          const response = await axios.post(API_ENDPOINTS.VIRTUAL_MONEY.CLAIM_REWARD, {}, {
=======
          const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/virtual-money/claim-reward`, {}, {
>>>>>>> b1a8bb87a9f2e1b3c2ce0c8518a40cf83a513f40
            headers,
            timeout: 5000
          });

          if (response.data.success) {
            rewardAmount = response.data.data.rewardAmount || 1;
            rewardClaimed = true;
            console.log("Successfully claimed reward from API for user:", user.email);
          }
        } catch (apiError) {
          console.log("Backend API not available or error claiming reward", apiError);

          // Check if we got a 400 response (already claimed)
          if (apiError.response && apiError.response.status === 400) {
            console.log("Already claimed reward today (from API response)");
            return false;
          }

          // Local implementation for claiming reward
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          if (!virtualMoney.lastLoginReward || new Date(virtualMoney.lastLoginReward) < today) {
            rewardClaimed = true;
          } else {
            console.log("Already claimed reward today (from local check)");
            return false;
          }
        }
      } else {
        // For non-authenticated users, use local implementation
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (!virtualMoney.lastLoginReward || new Date(virtualMoney.lastLoginReward) < today) {
          rewardClaimed = true;
        } else {
          console.log("Already claimed reward today (from local check)");
          return false;
        }
      }

      if (rewardClaimed) {
        // Update virtual money state
        const updatedVirtualMoney = {
          ...virtualMoney,
          balance: virtualMoney.balance + rewardAmount,
          lastLoginReward: new Date()
        };

        setVirtualMoney(updatedVirtualMoney);

        // Save to local storage for offline use
        if (isAuthenticated && user) {
          localStorage.setItem(`virtualMoney_${user.id}`, JSON.stringify(updatedVirtualMoney));
        } else {
          localStorage.setItem('virtualMoney', JSON.stringify(updatedVirtualMoney));
        }

        // Show animation
        setShowRewardAnimation(true);
        setTimeout(() => {
          setShowRewardAnimation(false);
        }, 3000);

        return true;
      }

      return false;
    } catch (err) {
      console.error("Error claiming daily reward:", err);
      return false;
    }
  };

  // Listen for notifications from Pusher
  useEffect(() => {
    if (channel && isAuthenticated) {
      // Listen for notification events
      const handleNotification = (data) => {
        // If the notification is related to trading, add it as a message in the chat
        if (data.type === 'trade' || data.type === 'market') {
          setMessages(prevMessages => [
            ...prevMessages,
            {
              id: uuidv4(),
              text: `📢 ${data.message}`,
              sender: "bot",
              timestamp: new Date(),
              isNotification: true
            }
          ]);
        }
      };

      // Listen for custom events dispatched by PusherContext
      window.addEventListener('new-notification', (event) => handleNotification(event.detail));

      // Clean up on unmount
      return () => {
        window.removeEventListener('new-notification', (event) => handleNotification(event.detail));
      };
    }
  }, [channel, isAuthenticated]);

  // Start a chat session when the component mounts
  useEffect(() => {
    const startChatSession = async () => {
      try {
        setIsLoading(true);
        const clientSessionId = uuidv4();

        // Try to connect to the backend
        let backendAvailable = false;
        try {
          console.log("Attempting to start chat session at:", API_ENDPOINTS.CHATBOT.START);
          // Try to start a chat session regardless of authentication status
          const response = await axios.post(API_ENDPOINTS.CHATBOT.START, {
            sessionId: clientSessionId,
            user: isAuthenticated && user ? user.email : null
          }, { timeout: 5000 }); // Increased timeout for better reliability

          if (response.data.success) {
            setSessionId(response.data.sessionId);
            console.log("Chat session started with ID:", response.data.sessionId);
            backendAvailable = true;

            // Set model info as active
            setModelInfo(prev => ({
              ...prev,
              isActive: true
            }));

            // Show success toast
            success("Connected to Gemini 2.0 AI", 3000);
          } else {
            console.error("Failed to start chat session:", response.data);
            // Set a local session ID as fallback
            setSessionId(clientSessionId);

            // Show warning toast
            warning("Using fallback mode - limited AI capabilities", 5000);
          }
        } catch (error) {
          // Log detailed error information
          console.error("Backend API error during chat initialization:", error.message);
          if (error.response) {
            console.error("Response status:", error.response.status);
            console.error("Response data:", error.response.data);
          }

          // Show appropriate toast message based on error type
          if (error.response && error.response.status === 404) {
            console.log("Backend API not available (404 Not Found), using offline mode for chat");
            showError("Chatbot API endpoint not found - using offline mode", 5000);
          } else if (error.code === 'ECONNABORTED') {
            console.log("Backend API timeout, using offline mode for chat");
            warning("Request timed out - using offline mode", 5000);
          } else {
            console.log("Backend API error, using offline mode for chat:", error.message);
            showError("Could not connect to AI service - using offline mode", 5000);
          }

          // Set a local session ID
          setSessionId(clientSessionId);
        }

        // Fetch virtual money data
        await fetchVirtualMoneyData();

        // Check if user can claim daily reward
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Only auto-claim if not already claimed today and not already shown animation
        const hasClaimedToday = virtualMoney.lastLoginReward &&
                               new Date(virtualMoney.lastLoginReward).setHours(0,0,0,0) === today.getTime();

        // Store in session storage to prevent showing animation multiple times in the same session
        const hasShownAnimationToday = sessionStorage.getItem('rewardAnimationShown') === today.toDateString();

        if (!hasClaimedToday && !hasShownAnimationToday) {
          // Auto-claim reward on first load
          setTimeout(async () => {
            try {
              const claimed = await claimDailyReward();
              if (claimed) {
                // Mark that we've shown the animation today
                sessionStorage.setItem('rewardAnimationShown', today.toDateString());

                // Show success toast
                success("Daily reward claimed: +₹1", 3000);
              }
            } catch (error) {
              console.error("Error auto-claiming reward:", error);
            }
          }, 2000);
        }

        // If backend is not available, add a welcome message instead of offline mode message
        if (!backendAvailable) {
          setMessages(prevMessages => [
            ...prevMessages,
            {
              id: uuidv4(),
              text: "Welcome to TradeBro! I'm your trading assistant, ready to help with all your trading and investment questions. You have ₹" + virtualMoney.balance.toLocaleString() + " in virtual money to practice trading. I'm currently in offline mode with limited capabilities, but I'll do my best to assist you!",
              sender: "bot",
              timestamp: new Date(),
              isOffline: true
            }
          ]);
        }
      } catch (err) {
        console.error("Error in chat initialization:", err);
        setMessages(prevMessages => [
          ...prevMessages,
          {
            id: uuidv4(),
            text: "I'm having trouble initializing my systems. Please refresh the page if the issue persists.",
            sender: "bot",
            timestamp: new Date(),
            isError: true
          }
        ]);

        // Show error toast
        showError("Failed to initialize chat system", 5000);
      } finally {
        // Add a slight delay for better UX
        setTimeout(() => {
          setIsLoading(false);
        }, 1500);
      }
    };

    if (!sessionId) {
      startChatSession();
    }

    // Clean up function to end the chat session when component unmounts
    return () => {
      if (sessionId) {
        axios.post(API_ENDPOINTS.CHATBOT.END, { sessionId })
          .then(() => console.log("Chat session ended"))
          .catch(err => console.error("Error ending chat session:", err));
      }
    };
  }, [sessionId, isAuthenticated, user, success, showError, info, warning, addToast]);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Handle input change
  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  // Send message to chatbot API
  const sendMessage = async (text) => {
    if (!sessionId) {
      setErrorMessage("Chat session not initialized");
      showError("Chat session not initialized", 3000);
      return;
    }

    setIsTyping(true);

    try {
      // Try to connect to the backend
      let botResponse;

      try {
        console.log("Attempting to send message to:", API_ENDPOINTS.CHATBOT.MESSAGE);
        // Try to send message regardless of authentication status
        const response = await axios.post(API_ENDPOINTS.CHATBOT.MESSAGE, {
          sessionId,
          message: text,
          user: isAuthenticated && user ? user.email : null
        }, { timeout: 12000 }); // Increased timeout for complex queries

        if (response.data.success) {
          // Handle different response types
          if (response.data.type === 'text') {
            botResponse = {
              id: uuidv4(),
              text: response.data.message,
              sender: "bot",
              timestamp: new Date(),
              fromGemini: true
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
                                (response.data.symbol && response.data.symbol.endsWith(".NS")) ||
                                (response.data.symbol && response.data.symbol.endsWith(".BO"));
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
              timestamp: new Date(),
              stockData: true,
              fromGemini: true
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
              timestamp: new Date(),
              topGainers: true,
              fromGemini: true
            };
          }

          // Update model info to show it's active
          if (!modelInfo.isActive) {
            setModelInfo(prev => ({
              ...prev,
              isActive: true
            }));
          }
        } else {
          console.error("Failed to get response:", response.data);
          // Handle unsuccessful response
          botResponse = {
            id: uuidv4(),
            text: "I'm sorry, I couldn't process your request properly. Please try again.",
            sender: "bot",
            timestamp: new Date(),
            isError: true
          };

          // Show warning toast
          warning("AI had trouble processing your request", 3000);
        }
      } catch (apiError) {
        // Log detailed error information
        console.error("Backend API error:", apiError.message);
        if (apiError.response) {
          console.error("Response status:", apiError.response.status);
          console.error("Response data:", apiError.response.data);
        }

        // Show appropriate toast message based on error type
        if (apiError.response && apiError.response.status === 404) {
          console.log("Backend API not available (404 Not Found), using mock response for chat");
          showError("Chatbot API endpoint not found - using offline mode", 5000);
        } else if (apiError.code === 'ECONNABORTED') {
          console.log("Backend API timeout, using mock response for chat");
          warning("Request timed out - using offline mode", 5000);
        } else {
          console.log("Backend API error, using mock response for chat", apiError);
          info("Using offline mode - limited responses available", 3000);
        }

        // Update model info to show it's not active
        setModelInfo(prev => ({
          ...prev,
          isActive: false
        }));

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

        botResponse = {
          id: uuidv4(),
          text: responseText,
          sender: "bot",
          timestamp: new Date(),
          isMockResponse: true,
          isOffline: true
        };

        // Show offline mode toast
        info("Using offline mode - limited responses available", 3000);
      }

      // Add the response to messages
      if (botResponse) {
        setMessages(prevMessages => [...prevMessages, botResponse]);
      } else {
        // Handle case where no botResponse was created
        const fallbackResponse = {
          id: uuidv4(),
          text: "I received your message but I'm not sure how to display the response. Let me try to help you with something else.",
          sender: "bot",
          timestamp: new Date(),
          isFallback: true
        };
        setMessages(prevMessages => [...prevMessages, fallbackResponse]);
      }

      // Update suggested questions based on the conversation
      updateSuggestedQuestions(text);

    } catch (err) {
      console.error("Error in message handling:", err);
      const errorResponse = {
        id: uuidv4(),
        text: "I apologize, but I'm experiencing a temporary issue processing your request. Please try again in a moment.",
        sender: "bot",
        timestamp: new Date(),
        isError: true
      };

      setMessages(prevMessages => [...prevMessages, errorResponse]);

      // Show error toast
      showError("Error processing your message", 3000);
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

    // Show animation for better UX
    info("Processing your question...", 1500);

    // Use setTimeout to ensure the state is updated before sending
    setTimeout(() => {
      // Send message to chatbot API
      sendMessage(question);
    }, 100);

    // Also update the input field for better UX
    setInputValue("");
  };

  // Update suggested questions based on conversation context
  const updateSuggestedQuestions = (userInput) => {
    const userQuestion = userInput.toLowerCase();

    // Add animation to the questions update
    const questionsContainer = document.querySelector('.questions-list');
    if (questionsContainer) {
      questionsContainer.classList.add('updating');
      setTimeout(() => {
        questionsContainer.classList.remove('updating');
      }, 500);
    }

    if (userQuestion.includes("market") || userQuestion.includes("trend")) {
      setSuggestedQuestions([
        "Which sectors are performing well?",
        "How do interest rates affect the market?",
        "What's the outlook for tech stocks?",
        "Should I invest during market volatility?",
        "Compare bull and bear markets"
      ]);
    } else if (userQuestion.includes("analyze") || userQuestion.includes("research")) {
      setSuggestedQuestions([
        "What are key financial ratios to look at?",
        "How do I read a balance sheet?",
        "What is fundamental analysis?",
        "How important is a company's management team?",
        "Explain technical vs fundamental analysis"
      ]);
    } else if (userQuestion.includes("options") || userQuestion.includes("derivative")) {
      setSuggestedQuestions([
        "What is a call option?",
        "What is a put option?",
        "How do I calculate options premium?",
        "What are covered calls?",
        "Explain options trading for beginners"
      ]);
    } else if (userQuestion.includes("stock") || userQuestion.includes("share") || userQuestion.match(/\b[A-Z]{2,5}\b/)) {
      setSuggestedQuestions([
        "Show me Zomato stock data",
        "What's the current price of MSFT?",
        "Tell me about AMZN stock",
        "Show me TSLA performance",
        "Compare AAPL and GOOGL"
      ]);
    } else if (userQuestion.includes("invest") || userQuestion.includes("portfolio")) {
      setSuggestedQuestions([
        "How to build a diversified portfolio?",
        "What is dollar-cost averaging?",
        "Long-term vs short-term investing",
        "How to rebalance a portfolio?",
        "Explain risk management strategies"
      ]);
    } else if (userQuestion.includes("dividend") || userQuestion.includes("income")) {
      setSuggestedQuestions([
        "What are dividend stocks?",
        "How do dividend yields work?",
        "Best dividend stocks to consider",
        "Dividend reinvestment plans explained",
        "Tax implications of dividends"
      ]);
    } else {
      setSuggestedQuestions([
        "Show me today's top gainers",
        "What's the difference between stocks and bonds?",
        "How do dividends work?",
        "What are ETFs?",
        "Explain market capitalization"
      ]);
    }
  };

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Format message text with line breaks, quotes, bullet points, tables, and hashes
  const formatMessageText = (text) => {
    if (!text) return null;

    try {
      // Check if the text contains a table
      if (text.includes('|')) {
        return formatTableMessage(text);
      }

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
                <span className="bullet-content">{formatInlineText(bulletContent)}</span>
              </div>
              {i < lines.length - 1 && <br />}
            </React.Fragment>
          );
        }

        // Handle headers with hash (e.g., # Header)
        if (line.match(/^#+\s/)) {
          const headerLevel = line.match(/^(#+)\s/)[1].length;
          const headerText = line.replace(/^#+\s/, '');
          return (
            <React.Fragment key={i}>
              <span className={`header-${headerLevel}`}>{formatInlineText(headerText)}</span>
              {i < lines.length - 1 && <br />}
            </React.Fragment>
          );
        }

        // Handle stock data formatting (e.g., Price: $100.00)
        if (line.match(/^(Price|Daily High|Daily Low|Market Cap|P\/E Ratio|Volume):/)) {
          const parts = line.split(':');
          const label = parts[0].trim();
          const value = parts.slice(1).join(':').trim(); // Handle colons in the value
          return (
            <React.Fragment key={i}>
              <div className="stock-data-row">
                <span className="stock-data-label">{label}:</span>
                <span className="stock-data-value">{formatInlineText(value)}</span>
              </div>
              {i < lines.length - 1 && <br />}
            </React.Fragment>
          );
        }

        // For regular lines, use the inline text formatter
        return (
          <React.Fragment key={i}>
            <span>{formatInlineText(line)}</span>
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

  // Format inline text elements (bold, italic, quotes)
  const formatInlineText = (text) => {
    if (!text) return null;

    try {
      // Create a temporary element to safely parse HTML
      const tempDiv = document.createElement('div');

      // Process markdown-style formatting
      let processedText = text;

      // Handle bold text with asterisks (e.g., *bold*)
      processedText = processedText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      processedText = processedText.replace(/\*(.*?)\*/g, '<strong>$1</strong>');

      // Handle italic text with underscores (e.g., _italic_)
      processedText = processedText.replace(/_(.*?)_/g, '<em>$1</em>');

      // Handle quotes (e.g., "quote")
      processedText = processedText.replace(/"([^"]+)"/g, '<span class="quoted-text">"$1"</span>');

      // Set the processed text to the temporary element
      tempDiv.innerHTML = processedText;

      // Return the formatted content
      return <span dangerouslySetInnerHTML={{ __html: tempDiv.innerHTML }} />;
    } catch (error) {
      console.error("Error formatting inline text:", error);
      // Return the plain text as fallback
      return text;
    }
  };

  // Format message containing a table
  const formatTableMessage = (text) => {
    try {
      // Split the text into lines
      const lines = text.split('\n');

      // Find table start and end indices
      let tableStartIndex = -1;
      let tableEndIndex = -1;

      for (let i = 0; i < lines.length; i++) {
        if (lines[i].trim().startsWith('|') && tableStartIndex === -1) {
          tableStartIndex = i;
        } else if (tableStartIndex !== -1 && !lines[i].trim().startsWith('|') && tableEndIndex === -1) {
          tableEndIndex = i - 1;
          break;
        }
      }

      // If we found the start but not the end, set end to the last line
      if (tableStartIndex !== -1 && tableEndIndex === -1) {
        tableEndIndex = lines.length - 1;
      }

      // If no table was found, format normally
      if (tableStartIndex === -1) {
        return lines.map((line, i) => (
          <React.Fragment key={i}>
            {formatInlineText(line)}
            {i < lines.length - 1 && <br />}
          </React.Fragment>
        ));
      }

      // Format content before the table
      const beforeTable = lines.slice(0, tableStartIndex).map((line, i) => (
        <React.Fragment key={`before-${i}`}>
          {formatInlineText(line)}
          <br />
        </React.Fragment>
      ));

      // Format the table
      const tableLines = lines.slice(tableStartIndex, tableEndIndex + 1);
      const tableRows = tableLines.map(line =>
        line.trim().split('|').filter(cell => cell.trim() !== '')
      );

      // Check if the second row contains separator (e.g., |:---|:---|)
      const hasSeparator = tableRows.length > 1 &&
                          tableRows[1].some(cell => cell.trim().match(/^:?-+:?$/));

      // Determine header row index and data rows
      const headerRowIndex = 0;
      const dataStartIndex = hasSeparator ? 2 : 1;

      const table = (
        <table className="chat-table">
          <thead>
            <tr>
              {tableRows[headerRowIndex].map((cell, i) => (
                <th key={i}>{formatInlineText(cell.trim())}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tableRows.slice(dataStartIndex).map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex}>{formatInlineText(cell.trim())}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      );

      // Format content after the table
      const afterTable = lines.slice(tableEndIndex + 1).map((line, i) => (
        <React.Fragment key={`after-${i}`}>
          {formatInlineText(line)}
          {i < lines.length - tableEndIndex - 2 && <br />}
        </React.Fragment>
      ));

      // Combine everything
      return (
        <>
          {beforeTable}
          {table}
          <br />
          {afterTable}
        </>
      );
    } catch (error) {
      console.error("Error formatting table message:", error);
      // Return the plain text as fallback
      return <span>{text}</span>;
    }
  };

  return (
    <PageLayout>
      <div className="trading-assistant-page">
        <div className="assistant-header">
          <motion.div
            className="header-content"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1>Trading Assistant</h1>
            <p>Ask about stocks, market trends, or trading strategies</p>
          </motion.div>
        </div>

        <div className="assistant-container">
          {isLoading ? (
            <div className="loading-container">
              <div className="pulse-loader">
                <div className="pulse-circle"></div>
                <div className="pulse-circle"></div>
                <div className="pulse-circle"></div>
              </div>
              <p>Initializing Trading Assistant...</p>
            </div>
          ) : (
            <div className="chat-interface">
              <div className="chat-sidebar">
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
                  <div className="reward-section">
                    <button
                      className={`claim-reward-btn ${virtualMoney.lastLoginReward && new Date(virtualMoney.lastLoginReward).setHours(0,0,0,0) === new Date().setHours(0,0,0,0) ? 'claimed' : ''}`}
                      onClick={claimDailyReward}
                      disabled={virtualMoney.lastLoginReward && new Date(virtualMoney.lastLoginReward).setHours(0,0,0,0) === new Date().setHours(0,0,0,0)}
                    >
                      <FiGift /> {virtualMoney.lastLoginReward && new Date(virtualMoney.lastLoginReward).setHours(0,0,0,0) === new Date().setHours(0,0,0,0) ? 'Reward Claimed' : 'Claim Daily Reward'}
                    </button>
                    <p className="reward-info">Login daily to earn ₹1!</p>
                  </div>
                  <AnimatePresence>
                    {showRewardAnimation && (
                      <motion.div
                        className="reward-animation"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                      >
                        <FiGift className="reward-icon" />
                        <span>+₹1</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>

                <motion.div
                  className="sidebar-section"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.25 }}
                >
                  <h3><FiMessageSquare /> Quick Tips</h3>
                  <ul className="capabilities-list">
                    <motion.li
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      <span className="capability-icon">📊</span>
                      <span>Ask about stock prices</span>
                    </motion.li>
                    <motion.li
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 }}
                    >
                      <span className="capability-icon">📈</span>
                      <span>Get market trends</span>
                    </motion.li>
                    <motion.li
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 }}
                    >
                      <span className="capability-icon">🧠</span>
                      <span>Learn trading strategies</span>
                    </motion.li>
                  </ul>
                </motion.div>
              </div>

              <div className="chat-main" ref={chatContainerRef}>
                <div className="chat-messages">
                  {errorMessage && (
                    <div className="error-message">
                      <FiAlertCircle />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  <AnimatePresence>
                    {messages.map((message, index) => (
                      <motion.div
                        key={message.id}
                        className={`message ${message.sender === "bot" ? "bot" : "user"}
                                  ${message.stockData ? "stock-data" : ""}
                                  ${message.topGainers ? "top-gainers" : ""}
                                  ${message.isNotification ? "notification" : ""}
                                  ${message.fromGemini ? "from-gemini" : ""}
                                  ${message.isMockResponse ? "mock-response" : ""}`}
                        initial={{ opacity: 0, y: 20, scale: 0.8 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                      >
                        <div className="message-avatar">
                          {message.sender === "bot" ? (
                            <FiCpu />
                          ) : (
                            <FiUser />
                          )}
                        </div>
                        <div className="message-content">
                          {message.fromGemini && (
                            <div className="message-source">
                              <span className="gemini-badge">Gemini 2.0</span>
                            </div>
                          )}
                          <div className={`message-text
                                        ${message.isError ? 'error' : ''}
                                        ${message.isOffline ? 'offline' : ''}
                                        ${message.isMockResponse ? 'mock-response' : ''}`}>
                            {formatMessageText(message.text)}
                          </div>
                          <div className="message-meta">
                            <div className="message-time">{formatTimestamp(message.timestamp)}</div>
                            {message.fromGemini && (
                              <div className="message-model">
                                <FiZap className="model-icon" />
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {isTyping && (
                    <motion.div
                      className="message bot"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                    >
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
                    </motion.div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                <div className="chat-controls">
                  <div className="suggested-questions">
                    <div className="questions-header" onClick={() => setShowSuggestions(!showSuggestions)}>
                      <h4>Suggested Questions</h4>
                      {showSuggestions ? <FiChevronUp /> : <FiChevronDown />}
                    </div>
                    <AnimatePresence>
                      {showSuggestions && (
                        <motion.div
                          className="questions-list"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          {suggestedQuestions.map((question, index) => (
                            <motion.button
                              key={index}
                              className="question-btn"
                              onClick={() => handleSuggestedQuestion(question)}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.3, delay: index * 0.05 }}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              {question}
                            </motion.button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <form className="chat-input" onSubmit={handleSubmit}>
                    <input
                      type="text"
                      placeholder="Ask me about stocks, trading, or market trends..."
                      value={inputValue}
                      onChange={handleInputChange}
                      disabled={isTyping || !sessionId}
                    />
                    <motion.button
                      type="submit"
                      disabled={inputValue.trim() === "" || isTyping || !sessionId}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <FiSend />
                    </motion.button>
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
};

export default TradingAssistantPage;
