import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { saytrixAPI } from '../services/api';

const useSaytrix = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [confidence, setConfidence] = useState('high');
  const [aiMode, setAiMode] = useState('casual');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const synthRef = useRef(null);

  useEffect(() => {
    const welcomeMessage = {
      id: 'welcome_' + Date.now(),
      type: 'assistant',
      content: '🚀 Hello! I\'m Saytrix, your AI-powered stock market assistant. I can help you with:\n\n📊 Real-time stock prices and data\n📈 Market analysis and trends\n🏢 Company information and fundamentals\n⭐ Top gainers and losers\n📰 Latest market news\n🎓 Stock market education\n\nWhat would you like to know about the stock market today?\n\n💡 Currently running in demo mode with sample data for showcase',
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
    initializeSpeechRecognition();
    initializeSpeechSynthesis();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current.onresult = async (event) => {
        const transcript = event.results[0][0].transcript;
        const confidenceScore = event.results[0][0].confidence;
        setInputText(transcript);
        setConfidence(confidenceScore > 0.8 ? 'high' : confidenceScore > 0.6 ? 'medium' : 'low');
        setIsListening(false);
        
        setTimeout(async () => {
          if (transcript.trim()) {
            await processVoiceCommand(transcript);
          }
        }, 300);
      };

      recognitionRef.current.onerror = (event) => {
        setIsListening(false);
        setError('Voice recognition failed. Please try again.');
      };
    }
  };

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
    
    setInputText(transcript);
    setConfidence(determineConfidence(transcript));
    
    sendMessage(transcript, true);
  }, [sendMessage, isProcessing]);

  const speakText = (text) => {
    if (synthRef.current && text) {
      setIsSpeaking(true);

      const cleanText = text
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/\*(.*?)\*/g, '$1')
        .replace(/₹/g, 'rupees')
        .replace(/[•]/g, '')
        .replace(/\n+/g, '. ')
        .substring(0, 200);

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

      synthRef.current.cancel();
      synthRef.current.speak(utterance);
    }
  };

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start();
        
        setTimeout(() => {
          if (recognitionRef.current && isListening) {
            try {
              recognitionRef.current.stop();
            } catch (error) {
              console.log('Auto-stop recognition');
            }
          }
        }, 10000);
      } catch (error) {
        setError('Voice recognition failed. Please try again.');
        setIsListening(false);
      }
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      try {
        recognitionRef.current.stop();
      } catch (error) {
        console.log('Stop recognition');
      }
      setIsListening(false);
    }
  }, [isListening]);

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
    setAiMode: handleModeChange,
    setError,
  };
};

export default useSaytrix;