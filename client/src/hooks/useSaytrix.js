import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { saytrixAPI } from '../services/api';
import { useVoice } from '../contexts/VoiceContext';

const useSaytrix = () => {
  const navigate = useNavigate();
  const { isListening, startListening, stopListening, speak, transcript } = useVoice();
  
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [confidence, setConfidence] = useState('high');
  const [aiMode, setAiMode] = useState('casual');
  const [isSpeaking, setIsSpeaking] = useState(false);

  const messagesEndRef = useRef(null);
  const synthRef = useRef(null);

  useEffect(() => {
    const welcomeMessage = {
      id: 'welcome_' + Date.now(),
      type: 'assistant',
      content: '🚀 Hello! I\'m Saytrix, your AI-powered stock market assistant. I can help you with:\n\n📊 Real-time stock prices and data\n📈 Market analysis and trends\n🏢 Company information and fundamentals\n⭐ Top gainers and losers\n📰 Latest market news\n🎓 Stock market education\n\nWhat would you like to know about the stock market today?\n\n💡 Try using voice input by clicking the microphone button!',
      timestamp: new Date(),
      suggestions: [
        'Show me NIFTY performance',
        "What are today's top gainers?",
        'Tell me about RELIANCE stock',
        'Latest market news',
      ],
      confidence: 'high',
      cardType: 'welcome',
    };
    setMessages([welcomeMessage]);
    initializeSpeechSynthesis();
  }, []);

  // Listen for voice transcript events
  useEffect(() => {
    const handleVoiceTranscript = (event) => {
      const { transcript } = event.detail;
      setInputText(transcript);
      setTimeout(() => {
        processVoiceCommand(transcript);
      }, 300);
    };

    window.addEventListener('voiceTranscript', handleVoiceTranscript);
    return () => {
      window.removeEventListener('voiceTranscript', handleVoiceTranscript);
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const initializeSpeechSynthesis = () => {
    if ('speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
    }
  };

  const sendMessage = useCallback(async (messageText = inputText, isVoiceInput = false) => {
    if (!messageText.trim() || isProcessing) return;

    setInputText('');
    setIsProcessing(true);
    setError(null);

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: messageText,
      timestamp: new Date(),
      confidence: isVoiceInput ? confidence : 'high',
    };

    setMessages((prev) => [...prev, userMessage]);
    
    try {
      const response = await saytrixAPI.sendMessage(messageText, 'offline_session_id');

      if (response.success) {
        const assistantMessage = {
          id: Date.now() + 1,
          type: 'assistant',
          content: response.data.response,
          timestamp: new Date(),
          suggestions: response.data.suggestions || [],
          stockData: response.data.stockData,
          cardType: determineCardType(response.data.response, response.data.stockData),
        };
        setMessages((prev) => [...prev, assistantMessage]);

        if (isVoiceInput) {
          speakText(assistantMessage.content);
        }
      } else {
        throw new Error('Backend response failed');
      }
    } catch (apiError) {
      setError('Server connection failed. Using offline mode with limited functionality.');
      
      await new Promise(resolve => setTimeout(resolve, 500));

      const fallbackMessage = {
        id: Date.now() + 1,
        type: 'assistant',
        content: generateFallbackResponse(messageText),
        timestamp: new Date(),
        suggestions: generateSuggestions(messageText),
        cardType: determineCardTypeFromInput(messageText),
      };

      setMessages((prev) => [...prev, fallbackMessage]);
      
      if (isVoiceInput) {
        speakText(fallbackMessage.content);
      }
    } finally {
      setIsProcessing(false);
    }
  }, [inputText, isProcessing, confidence]);

  const processVoiceCommand = useCallback(async (transcript) => {
    if (isProcessing) return;
    
    const lowerTranscript = transcript.toLowerCase().trim();
    
    // Check for navigation commands first
    const navigationResult = processNavigationCommand(lowerTranscript);
    if (navigationResult.handled) {
      // Show navigation message
      const navMessage = {
        id: Date.now(),
        type: 'assistant',
        content: `🧭 **Navigation Command**\n\n${navigationResult.message}`,
        timestamp: new Date(),
        cardType: 'navigation'
      };
      setMessages(prev => [...prev, navMessage]);
      
      // Speak confirmation
      speak(navigationResult.message);
      return;
    }
    
    setConfidence(determineConfidence(transcript));
    await sendMessage(transcript, true);
  }, [isProcessing, navigate, speak]);

  const processNavigationCommand = (command) => {
    // Navigation patterns
    const navCommands = {
      // Charts/Trading
      'charts': { path: '/charts', message: 'Opening charts page' },
      'chart': { path: '/charts', message: 'Opening charts page' },
      'trading': { path: '/trading', message: 'Opening trading page' },
      'trade': { path: '/trading', message: 'Opening trading page' },
      
      // Portfolio & Dashboard
      'dashboard': { path: '/dashboard', message: 'Going to dashboard' },
      'home': { path: '/dashboard', message: 'Going to home page' },
      'portfolio': { path: '/portfolio', message: 'Opening portfolio' },
      
      // Orders & History
      'orders': { path: '/orders', message: 'Opening orders page' },
      'order': { path: '/orders', message: 'Opening orders page' },
      'history': { path: '/history', message: 'Opening history page' },
      'trades': { path: '/trades', message: 'Opening trades page' },
      
      // Market Data
      'watchlist': { path: '/watchlist', message: 'Opening watchlist' },
      'news': { path: '/news', message: 'Opening news page' },
      'notifications': { path: '/notifications', message: 'Opening notifications' },
      
      // Settings & Profile
      'profile': { path: '/profile', message: 'Opening profile page' },
      'settings': { path: '/settings', message: 'Opening settings page' },
      'saytrix': { path: '/saytrix', message: 'Opening Saytrix AI chat' }
    };
    
    // Check for direct navigation commands
    for (const [keyword, config] of Object.entries(navCommands)) {
      if (command.includes(keyword)) {
        navigate(config.path);
        return { handled: true, message: config.message };
      }
    }
    
    // Check for redirect/go/open commands
    const redirectPatterns = [
      /(?:redirect|go|open|take|navigate).*?(?:to|me to)?\s*(charts?|trading?|dashboard|home|portfolio|orders?|history|trades?|watchlist|news|notifications?|profile|settings|saytrix)/i,
      /(charts?|trading?|dashboard|home|portfolio|orders?|history|trades?|watchlist|news|notifications?|profile|settings|saytrix)\s*page/i
    ];
    
    for (const pattern of redirectPatterns) {
      const match = command.match(pattern);
      if (match) {
        const destination = match[1].toLowerCase();
        const config = navCommands[destination] || navCommands[destination.replace(/s$/, '')];
        if (config) {
          navigate(config.path);
          return { handled: true, message: config.message };
        }
      }
    }
    
    return { handled: false };
  };

  const speakText = (text) => {
    if (text) {
      setIsSpeaking(true);

      const cleanText = text
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/\*(.*?)\*/g, '$1')
        .replace(/₹/g, 'rupees')
        .replace(/[•]/g, '')
        .replace(/\n+/g, '. ')
        .substring(0, 200);

      // Use VoiceContext speak function
      speak(cleanText);
      
      // Set speaking to false after estimated time
      setTimeout(() => {
        setIsSpeaking(false);
      }, cleanText.length * 50); // Rough estimate
    }
  };

  // Voice functions are now handled by VoiceContext

  const determineConfidence = (content) => {
    if (content.includes('₹') || content.includes('stock') || content.includes('market')) {
      return 'high';
    } else if (content.includes('might') || content.includes('possibly') || content.includes('maybe')) {
      return 'medium';
    }
    return 'high';
  };
  
  const determineCardType = (content, stockData) => {
    if (stockData) {
      return 'stock-price';
    }
    if (content && (content.toLowerCase().includes('buy') || content.toLowerCase().includes('sell'))) {
      return 'recommendation';
    }
    return 'text';
  };
  
  const determineCardTypeFromInput = (input) => {
    const lowerInput = input.toLowerCase();
    if (lowerInput.includes('price') || lowerInput.includes('quote') || lowerInput.includes('₹')) {
      return 'stock-price';
    }
    return 'text';
  };
  
  const generateFallbackResponse = (input) => {
    const lowerInput = input.toLowerCase();
    if (lowerInput.includes('reliance') || lowerInput.includes('ril')) {
      return `**Reliance Industries (RELIANCE)**\n\n**Current Price:** ₹2,465 *(demo data)*\n\n**Company Overview:**\nReliance Industries is one of India's largest conglomerates with diversified business interests across multiple sectors.\n\n**Key Business Segments:**\n• Petrochemicals and Oil Refining\n• Telecommunications (Jio)\n• Retail (Reliance Retail)\n• Digital Services\n\n**Investment Highlights:**\n• Strong market position in each segment\n• Consistent dividend history\n• Blue-chip investment with long-term growth potential\n• Strategic focus on digital transformation\n\nWould you like to explore its **fundamentals** or **recent performance** in detail?`;
    }
    return `**Welcome to Saytrix!** 🚀\n\nI'm your AI-powered trading assistant here to help you navigate the Indian stock markets with confidence.\n\nNote: Currently displaying demo data for illustration purposes.\n\nReady to start your trading journey? Ask me anything about the markets!`;
  };

  const generateSuggestions = (input) => {
    const lowerInput = input.toLowerCase();
    if (lowerInput.includes('reliance') || lowerInput.includes('ril')) {
      return ['Tell me about TCS', 'Show HDFC Bank info', 'Compare IT stocks'];
    }
    return ['Market overview', 'Top stocks', 'Sector analysis', 'Trading tips'];
  };

  const clearChat = useCallback(() => {
    setMessages([]);
    setError(null);
    const welcomeMessage = {
      id: 'welcome_' + Date.now(),
      type: 'assistant',
      content: '🚀 Hello! I\'m Saytrix, your AI-powered stock market assistant. I can help you with...',
      timestamp: new Date(),
      suggestions: ['Show me NIFTY performance', 'What are today\'s top gainers?'],
      confidence: 'high',
      cardType: 'welcome',
    };
    setMessages([welcomeMessage]);
  }, []);

  const handleModeChange = useCallback((mode) => {
    setAiMode(mode);
    const modeMessage = {
      id: Date.now(),
      type: 'assistant',
      content: `🤖 **AI Mode Changed**\n\nSwitched to **${mode.charAt(0).toUpperCase() + mode.slice(1)} Mode**\n\n${mode === 'expert' ? '🎯 Expert mode provides detailed technical analysis and advanced trading insights.' : '😊 Casual mode offers friendly, easy-to-understand market information.'}`,
      timestamp: new Date(),
      cardType: 'text',
      suggestions: mode === 'expert' ? ['Technical analysis', 'Market trends', 'Risk assessment'] : ['Stock basics', 'Simple explanations', 'Market overview'],
    };
    setMessages(prev => [...prev, modeMessage]);
  }, []);

  return {
    messages,
    inputText,
    isProcessing,
    isListening,
    isSpeaking,
    error,
    confidence,
    aiMode,
    messagesEndRef,
    
    setInputText,
    setMessages,
    sendMessage: useCallback(() => sendMessage(inputText), [sendMessage, inputText]),
    startListening,
    stopListening,
    clearChat,
    handleModeChange,
    handleBuyStock: () => navigate('/trading'),
    handleSellStock: () => navigate('/trading'),
    handleSuggestionClick: (suggestion) => sendMessage(suggestion),
    handleRecentQuestionClick: (question) => sendMessage(question),
    setError,
  };
};

export default useSaytrix;