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

        // Handle navigation actions
        if (response.data.action && response.data.action.type === 'navigate') {
          setTimeout(() => {
            navigate(response.data.action.path);
          }, 1000);
        }

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

  useEffect(() => {
    const welcomeMessage = {
      id: 'welcome_' + Date.now(),
      type: 'assistant',
      content: `🚀 **Welcome to Saytrix!** 🚀

I'm your AI-powered trading assistant here to help you navigate the Indian stock markets with confidence.

Note: Currently displaying demo data for illustration purposes.

Ready to start your trading journey? Ask me anything about the markets!`,
      timestamp: new Date(),
      suggestions: [
        'Market overview',
        'Top stocks',
        'Sector analysis',
        'Trading tips'
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
        sendMessage(transcript, true);
      }, 300);
    };

    window.addEventListener('voiceTranscript', handleVoiceTranscript);
    return () => {
      window.removeEventListener('voiceTranscript', handleVoiceTranscript);
    };
  }, [sendMessage]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const initializeSpeechSynthesis = () => {
    if ('speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
    }
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

      speak(cleanText);
      
      setTimeout(() => {
        setIsSpeaking(false);
      }, cleanText.length * 50);
    }
  };

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
    
    if (lowerInput.includes('invest') || lowerInput.includes('investment')) {
      return `💰 **I'd be happy to help you with investing!**\n\n🎯 **Getting Started:**\n• Open a Demat account with a registered broker\n• Start with index funds or blue-chip stocks\n• Begin with small amounts you can afford to lose\n• Learn about SIP (Systematic Investment Plans)\n\n📚 **Key Concepts:**\n• P/E ratio, market cap, dividend yield\n• Risk management and diversification\n• Fundamental vs technical analysis\n\n⚠️ **Important:** This is a virtual platform for learning. Always do your own research for real investments.`;
    }
    
    if (lowerInput.includes('price') || lowerInput.includes('quote')) {
      return `📈 **Stock Price Information**\n\nI can help you with stock prices! However, I'm currently in offline mode with limited data.\n\n**Popular Indian Stocks:**\n• RELIANCE - ₹2,465 *(demo)*\n• TCS - ₹3,245 *(demo)*\n• HDFC Bank - ₹1,678 *(demo)*\n• Infosys - ₹1,456 *(demo)*\n\nWhich specific stock would you like to know about?`;
    }
    
    return `💡 I understand you're asking about: "${input}"\n\nI'm your AI stock market assistant and I can help with:\n\n📈 Stock prices and company information\n📊 Market trends and analysis\n🎓 Investment education and tips\n📰 Market news and updates\n💼 Trading strategies\n\nCould you be more specific about what you'd like to know?`;
  };

  const generateSuggestions = (input) => {
    return ['Market overview', 'Top stocks', 'Sector analysis', 'Trading tips'];
  };

  const clearChat = useCallback(() => {
    setMessages([]);
    setError(null);
    const welcomeMessage = {
      id: 'welcome_' + Date.now(),
      type: 'assistant',
      content: `🚀 **Welcome to Saytrix!** 🚀

I'm your AI-powered trading assistant here to help you navigate the Indian stock markets with confidence.

Note: Currently displaying demo data for illustration purposes.

Ready to start your trading journey? Ask me anything about the markets!`,
      timestamp: new Date(),
      suggestions: ['Market overview', 'Top stocks', 'Sector analysis', 'Trading tips'],
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
    handleSuggestionClick: (suggestion) => sendMessage(suggestion, false),
    handleRecentQuestionClick: (question) => sendMessage(question, false),
    setError,
  };
};

export default useSaytrix;