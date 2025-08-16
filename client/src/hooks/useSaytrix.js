import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { saytrixAPI } from '../services/api';
import VoiceCommandProcessor from '../utils/voiceCommandProcessor';

const useSaytrix = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [error, setError] = useState(null);
  const [confidence, setConfidence] = useState('high');
  const [onlyIndianStocks, setOnlyIndianStocks] = useState(true);
  const [aiMode, setAiMode] = useState('casual'); // casual or expert
  
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const synthRef = useRef(null);
  const voiceProcessorRef = useRef(new VoiceCommandProcessor());

  // Initialize session on mount
  useEffect(() => {
    initializeSession();
    initializeSpeechRecognition();
    initializeSpeechSynthesis();
  }, []);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Cleanup effect to prevent animation conflicts
  useEffect(() => {
    return () => {
      if (synthRef.current) {
        synthRef.current.cancel();
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (error) {
          console.log('Recognition cleanup');
        }
      }
      setIsSpeaking(false);
      setIsListening(false);
    };
  }, []);

  // Reset listening state when processing completes
  useEffect(() => {
    if (!isProcessing && isListening) {
      setIsListening(false);
    }
  }, [isProcessing, isListening]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const initializeSession = () => {
    // Create welcome message in pure offline mode
    const welcomeMessage = {
      id: 'welcome_' + Date.now(),
      type: 'assistant',
      content: '🚀 Hello! I\'m Saytrix, your AI-powered stock market assistant. I can help you with:\n\n📊 Real-time stock prices and data\n📈 Market analysis and trends\n🏢 Company information and fundamentals\n⭐ Top gainers and losers\n📰 Latest market news\n🎓 Stock market education\n\nWhat would you like to know about the stock market today?\n\n💡 Currently running in demo mode with sample data for showcase',
      timestamp: new Date(),
      suggestions: [
        'Show me NIFTY performance',
        'What are today\'s top gainers?',
        'Tell me about RELIANCE stock',
        'Latest market news'
      ],
      confidence: 'high',
      cardType: 'welcome'
    };

    setMessages([welcomeMessage]);
    setSessionId('offline_session_' + Date.now());
    console.log('Saytrix initialized in offline demo mode');
  };

  const initializeSpeechRecognition = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onstart = () => {
        setIsListening(true);
        setError(null);
      };

      recognitionRef.current.onresult = async (event) => {
        const transcript = event.results[0][0].transcript;
        const confidenceScore = event.results[0][0].confidence;
        setInputText(transcript);
        setConfidence(confidenceScore > 0.8 ? 'high' : confidenceScore > 0.6 ? 'medium' : 'low');

        // Immediately stop listening and reset state
        setIsListening(false);

        // Process voice command
        setTimeout(async () => {
          if (transcript.trim()) {
            await processVoiceCommand(transcript);
          }
        }, 300);
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        setError('Voice recognition failed. Please try again.');
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  };

  const initializeSpeechSynthesis = () => {
    if ('speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
    }
  };

  const sendMessage = useCallback(async (messageText = inputText) => {
    if (!messageText.trim() || isProcessing) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: messageText,
      timestamp: new Date(),
      confidence: confidence
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsProcessing(true);
    setError(null);

    // Ensure listening state is properly reset
    setIsListening(false);

    try {
      // Try backend API first
      const response = await saytrixAPI.sendMessage(messageText, sessionId);
      
      if (response.success) {
        const assistantMessage = {
          id: Date.now() + 1,
          type: 'assistant',
          content: response.data.response,
          timestamp: new Date(),
          confidence: 'high',
          cardType: response.data.stockData ? 'stock-price' : 'text',
          suggestions: response.data.suggestions || [],
          stockData: response.data.stockData
        };

        setMessages(prev => [...prev, assistantMessage]);
        setSessionId(response.data.sessionId);

        // Text-to-speech for assistant response
        if (synthRef.current && assistantMessage.content) {
          speakText(assistantMessage.content);
        }
      } else {
        throw new Error('Backend response failed');
      }
    } catch (error) {
      console.warn('Backend API failed, using fallback:', error);
      
      // Fallback to offline mode
      await new Promise(resolve => setTimeout(resolve, 800));

      const fallbackMessage = {
        id: Date.now() + 1,
        type: 'assistant',
        content: generateFallbackResponse(messageText),
        timestamp: new Date(),
        confidence: 'medium',
        cardType: determineCardTypeFromInput(messageText),
        suggestions: generateSuggestions(messageText)
      };

      setMessages(prev => [...prev, fallbackMessage]);

      // Text-to-speech for assistant response
      if (synthRef.current && fallbackMessage.content) {
        speakText(fallbackMessage.content);
      }
    } finally {
      setIsProcessing(false);
    }
  }, [inputText, sessionId, isProcessing, confidence]);

  const speakText = (text) => {
    if (synthRef.current && text) {
      setIsSpeaking(true);

      // Clean the text for speech (remove markdown and special characters)
      const cleanText = text
        .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold markdown
        .replace(/\*(.*?)\*/g, '$1') // Remove italic markdown
        .replace(/₹/g, 'rupees') // Convert currency symbol
        .replace(/[•]/g, '') // Remove bullet points
        .replace(/\n+/g, '. ') // Replace newlines with periods
        .substring(0, 200); // Limit length for better UX

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 0.8;

      utterance.onend = () => {
        setIsSpeaking(false);
      };

      utterance.onerror = () => {
        setIsSpeaking(false);
      };

      // Cancel any existing speech before starting new one
      synthRef.current.cancel();
      synthRef.current.speak(utterance);
    }
  };

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start();

        // Auto-stop listening after 10 seconds to prevent infinite animation
        setTimeout(() => {
          if (recognitionRef.current) {
            try {
              recognitionRef.current.stop();
            } catch (error) {
              console.log('Auto-stop recognition');
            }
            setIsListening(false);
          }
        }, 10000);
      } catch (error) {
        console.error('Failed to start voice recognition:', error);
        setError('Voice recognition is not available.');
        setIsListening(false);
      }
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (error) {
        console.log('Recognition already stopped');
      }
      // Always reset the listening state regardless of current state
      setIsListening(false);
    }
  }, []);

  const processVoiceCommand = useCallback(async (transcript) => {
    try {
      // Process the voice command
      const command = voiceProcessorRef.current.processCommand(transcript);
      console.log('Voice command processed:', command);
      
      // Create context for command execution
      const context = {
        navigate,
        sendMessage: async (message) => {
          await sendMessage(message);
        },
        setMessages,
        setError
      };
      
      // Execute the command
      const result = await voiceProcessorRef.current.executeCommand(command, context);
      console.log('Command execution result:', result);
      
      // Show voice command feedback
      if (result.success && result.message) {
        const feedbackMessage = {
          id: Date.now(),
          type: 'assistant',
          content: `🎤 **Voice Command Executed**\n\n${result.message}`,
          timestamp: new Date(),
          cardType: 'text',
          suggestions: ['Continue with voice', 'Type a message', 'Clear chat']
        };
        
        setMessages(prev => [...prev, feedbackMessage]);
      }
      
    } catch (error) {
      console.error('Voice command processing error:', error);
      setError('Failed to process voice command. Please try again.');
    }
  }, [navigate, sendMessage, setMessages, setError]);

  const clearChat = useCallback(() => {
    setMessages([]);
    setError(null);
    initializeSession();
  }, []);

  const determineConfidence = (content) => {
    // Simple confidence determination based on content
    if (content.includes('₹') || content.includes('stock') || content.includes('market')) {
      return 'high';
    } else if (content.includes('might') || content.includes('possibly') || content.includes('maybe')) {
      return 'medium';
    }
    return 'high';
  };

  const determineCardType = (message) => {
    if (message.stockData) {
      if (message.stockData.price) return 'stock-price';
      if (message.stockData.chart) return 'chart';
      if (message.stockData.company) return 'company-info';
    }
    if (message.content && (message.content.toLowerCase().includes('buy') || message.content.toLowerCase().includes('sell'))) {
      return 'recommendation';
    }
    if (message.content && (message.content.toLowerCase().includes('alert') || message.content.toLowerCase().includes('notification'))) {
      return 'alert';
    }
    return 'text';
  };

  const determineCardTypeFromInput = (input) => {
    const lowerInput = input.toLowerCase();

    if (lowerInput.includes('price') || lowerInput.includes('quote') || lowerInput.includes('₹')) {
      return 'stock-price';
    }
    if (lowerInput.includes('chart') || lowerInput.includes('graph') || lowerInput.includes('technical')) {
      return 'chart';
    }
    if (lowerInput.includes('company') || lowerInput.includes('about') || lowerInput.includes('info')) {
      return 'company-info';
    }
    if (lowerInput.includes('buy') || lowerInput.includes('sell') || lowerInput.includes('recommend')) {
      return 'recommendation';
    }
    return 'text';
  };

  const generateFallbackResponse = (input) => {
    const lowerInput = input.toLowerCase();

    if (lowerInput.includes('reliance') || lowerInput.includes('ril')) {
      return `**Reliance Industries (RELIANCE)**

**Current Price:** ₹2,465 *(demo data)*

**Company Overview:**
Reliance Industries is one of India's largest conglomerates with diversified business interests across multiple sectors.

**Key Business Segments:**
• Petrochemicals and Oil Refining
• Telecommunications (Jio)
• Retail (Reliance Retail)
• Digital Services

**Investment Highlights:**
• Strong market position in each segment
• Consistent dividend history
• Blue-chip investment with long-term growth potential
• Strategic focus on digital transformation

Would you like to explore its **fundamentals** or **recent performance** in detail?`;
    } else if (lowerInput.includes('tcs')) {
      return `**Tata Consultancy Services (TCS)**

**Current Price:** ₹3,185 *(demo data)*

**Company Profile:**
India's largest IT services company with a strong global presence and reputation for excellence.

**Key Strengths:**
• Market leader in IT services and consulting
• Consistent revenue growth and profitability
• Strong client relationships across industries
• Robust dividend track record

**Investment Appeal:**
• Stability in volatile markets
• Growth prospects in digital transformation
• Strong balance sheet and cash flows
• Popular choice for long-term investors`;
    } else if (lowerInput.includes('nifty') || lowerInput.includes('sensex')) {
      return `**Market Indices Overview**

**Current Levels:** *(demo data)*
• NIFTY 50: ~19,750
• SENSEX: ~66,500

**Market Performance:**
Both indices have shown **resilience** despite global uncertainties and continue to attract investor interest.

**Key Driving Sectors:**
• Banking and Financial Services
• Information Technology
• Consumer Goods and FMCG

**Market Sentiment:**
*Cautiously optimistic* with focus on domestic consumption and policy support measures.`;
    } else if (lowerInput.includes('portfolio')) {
      return `**Portfolio Analysis** *(demo data)*

**Current Allocation:**
• Large Cap: 40%
• Mid Cap: 30%
• Small Cap: 20%
• Bonds: 10%

**Portfolio Metrics:**
• **Total Value:** ₹2,84,765
• **Overall Gain:** +12.5%
• **Risk Level:** Moderate

**Recommendations:**
1. **Rebalance** if any sector exceeds 25% allocation
2. **Review** small cap exposure for risk management
3. **Consider** adding defensive stocks for stability

Would you like **specific recommendations** for optimization?`;
    } else if (lowerInput.includes('news') || lowerInput.includes('market')) {
      return `**Today's Market Highlights** *(demo data)*

**Sector Performance:**
• **Banking:** Rally on RBI policy optimism
• **IT Sector:** Facing headwinds from global slowdown
• **Auto Sector:** Mixed signals with EV adoption trends

**Investment Flows:**
• **FII Activity:** Cautious approach continues
• **DII Buying:** Strong domestic institutional support

**Overall Trend:**
Market sentiment remains **cautiously optimistic** with focus on domestic growth drivers.`;
    } else if (lowerInput.includes('buy') || lowerInput.includes('sell')) {
      return `**Trading Recommendations** *(demo analysis)*

**BUY Recommendations:**
• **Banking Stocks** - Policy support and credit growth
• **Infrastructure** - Government capex focus

**HOLD Positions:**
• **IT Stocks** - Long-term digital transformation play
• **FMCG** - Defensive characteristics

**SELL/REDUCE:**
• **Overvalued Small Caps** - Risk management
• **Cyclical Stocks** - Economic uncertainty

**Important Disclaimer:**
*Always conduct your own research and consider your risk tolerance. This is for educational purposes only.*`;
    } else if (lowerInput.includes('gainers') || lowerInput.includes('top')) {
      return `**Market Movers Today** *(demo data)*

**Top Gainers:**
• HDFCBANK: +3.2%
• ICICIBANK: +2.8%
• BAJFINANCE: +2.5%

**Top Losers:**
• TECHM: -2.1%
• WIPRO: -1.8%
• INFY: -1.2%

**Sector Trends:**
• **Banking Sector:** Outperforming on policy optimism
• **IT Sector:** Under pressure from global concerns

The **banking rally** is driving overall market sentiment today.`;
    } else {
      return `**Welcome to Saytrix!** 🚀

I'm your AI-powered trading assistant here to help you navigate the Indian stock markets with confidence.

What I Can Help You With:
• Stock Analysis - Detailed company research and insights
• Market Insights - Real-time market trends and news
• Portfolio Management - Optimization and risk analysis
• Trading Strategies - Data-driven investment recommendations

Quick Start Commands:
• "Tell me about Reliance"
• "Show me top gainers today"
• "Analyze my portfolio"
• "What's the market sentiment?"

Note: Currently displaying demo data for illustration purposes.

Ready to start your trading journey? Ask me anything about the markets!`;
    }
  };

  const generateSuggestions = (input) => {
    const lowerInput = input.toLowerCase();

    if (lowerInput.includes('reliance') || lowerInput.includes('ril')) {
      return ['Tell me about TCS', 'Show HDFC Bank info', 'Compare IT stocks'];
    } else if (lowerInput.includes('nifty') || lowerInput.includes('sensex')) {
      return ['Top gainers today', 'Banking stocks', 'IT sector performance'];
    } else if (lowerInput.includes('portfolio')) {
      return ['Risk analysis', 'Sector allocation', 'Diversification tips'];
    } else {
      return ['Market overview', 'Top stocks', 'Sector analysis', 'Trading tips'];
    }
  };

  return {
    // State
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
    
    // Actions
    setInputText,
    sendMessage,
    startListening,
    stopListening,
    clearChat,
    setOnlyIndianStocks,
    setAiMode,
    setError
  };
};

export default useSaytrix;
