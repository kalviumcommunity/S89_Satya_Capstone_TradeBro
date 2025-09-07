import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AIVoiceProcessor from '../utils/aiVoiceProcessor';

// Create the voice context
const VoiceContext = createContext();

// Custom hook to use the voice context
export const useVoice = () => {
  const context = useContext(VoiceContext);
  if (context === undefined) {
    throw new Error('useVoice must be used within a VoiceProvider');
  }
  return context;
};

// Voice provider component
export const VoiceProvider = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const aiProcessor = new AIVoiceProcessor(navigate);
  
  // Voice states
  const [isListening, setIsListening] = useState(false);
  const [isVoiceModeActive, setIsVoiceModeActive] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [recognition, setRecognition] = useState(null);
  const [isSupported, setIsSupported] = useState(false);

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      
      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = 'en-US';
      recognitionInstance.maxAlternatives = 1;
      
      setRecognition(recognitionInstance);
      setIsSupported(true);
    } else {
      console.warn('Speech recognition not supported in this browser');
      setIsSupported(false);
    }
  }, []);

  // Voice command processing
  const processVoiceCommand = useCallback((command) => {
    const lowerCommand = command.toLowerCase().trim();
    
    console.log('Processing voice command:', lowerCommand);
    
    // Enhanced navigation patterns
    const navigationCommands = {
      // Charts/Trading
      'charts': '/charts',
      'chart': '/charts', 
      'charge': '/charts',
      'trading': '/trading',
      'trade': '/trading',
      
      // Dashboard/Home
      'dashboard': '/dashboard',
      'home': '/dashboard',
      
      // Portfolio
      'portfolio': '/portfolio',
      
      // Orders & History
      'orders': '/orders',
      'order': '/orders',
      'history': '/history',
      'trades': '/trades',
      
      // Market Data
      'watchlist': '/watchlist',
      'watch list': '/watchlist',
      'news': '/news',
      'notifications': '/notifications',
      'notification': '/notifications',
      
      // AI & Settings
      'saytrix': '/saytrix',
      'chat': '/saytrix',
      'profile': '/profile',
      'settings': '/settings',
      'setting': '/settings'
    };
    
    // Check for redirect/navigation commands
    const redirectPatterns = [
      /(?:redirect|go|open|take|navigate).*?(?:to|me to)?\s*(\w+)/i,
      /(\w+)\s*page/i,
      /show\s*me\s*(\w+)/i
    ];
    
    // Direct keyword matching
    for (const [keyword, path] of Object.entries(navigationCommands)) {
      if (lowerCommand.includes(keyword)) {
        navigate(path);
        return;
      }
    }
    
    // Pattern-based matching
    for (const pattern of redirectPatterns) {
      const match = lowerCommand.match(pattern);
      if (match) {
        const destination = match[1].toLowerCase();
        if (navigationCommands[destination]) {
          navigate(navigationCommands[destination]);
          return;
        }
      }
    }
    
    // Stock-specific commands
    if (lowerCommand.includes('price of') || lowerCommand.includes('show price')) {
      const stock = extractStock(lowerCommand);
      if (stock) {
        navigate(`/stock/${stock}`);
        return;
      }
    }
    
    // Market data shortcuts
    if (lowerCommand.includes('top gainers') || lowerCommand.includes('gainers')) {
      navigate('/dashboard');
    } else if (lowerCommand.includes('top losers') || lowerCommand.includes('losers')) {
      navigate('/dashboard');
    }
    
    // Trading shortcuts
    if (lowerCommand.includes('buy') && (lowerCommand.includes('stock') || lowerCommand.includes('share'))) {
      navigate('/trading');
    } else if (lowerCommand.includes('sell') && (lowerCommand.includes('stock') || lowerCommand.includes('share'))) {
      navigate('/trading');
    }
  }, [navigate]);
  
  // Extract stock symbol from command
  const extractStock = useCallback((command) => {
    const stockPatterns = [
      /price of ([a-zA-Z]+)/i,
      /show price ([a-zA-Z]+)/i,
      /([a-zA-Z]+) price/i
    ];
    
    for (const pattern of stockPatterns) {
      const match = command.match(pattern);
      if (match) {
        return match[1].toUpperCase();
      }
    }
    return null;
  }, []);

  // Text-to-speech function
  const speak = useCallback((text) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 0.8;
      speechSynthesis.speak(utterance);
    }
  }, []);

  // Start listening for wake word
  const startWakeWordDetection = useCallback(() => {
    if (!recognition || !isSupported || isListening) return;

    setIsListening(true);
    
    recognition.onresult = (event) => {
      let finalTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          finalTranscript += transcript;
        }
      }
      
      setTranscript(finalTranscript);
      
      // More accurate wake word detection
      const wakeWords = ['saytrix', 'citrix', 'citric', 'matrix', 'tricks', 'se tric', 'say tricks'];
      const isWakeWord = wakeWords.some(word => 
        finalTranscript.toLowerCase().includes(word)
      );
      
      if (isWakeWord) {
        recognition.stop();
        activateVoiceMode();
      }
    };

    recognition.onerror = (event) => {
      if (event.error === 'network') {
        console.warn('Speech recognition network issue, retrying...');
      } else if (event.error === 'not-allowed') {
        console.warn('Microphone access denied');
      } else {
        console.warn('Speech recognition error:', event.error);
      }
      setIsListening(false);
      if (event.error !== 'aborted' && event.error !== 'not-allowed') {
        setTimeout(() => {
          startWakeWordDetection();
        }, 2000);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      if (!isVoiceModeActive) {
        setTimeout(() => {
          startWakeWordDetection();
        }, 500);
      }
    };

    try {
      recognition.start();
    } catch (e) {
      if (e.name !== 'InvalidStateError') {
        console.log('Recognition start failed:', e);
        setIsListening(false);
      }
    }
  }, [recognition, isSupported, isListening, isVoiceModeActive]);

  // Activate voice command mode
  const activateVoiceMode = useCallback(() => {
    setIsVoiceModeActive(true);
    speak('Yes?');
    
    if (!recognition) return;

    recognition.onresult = (event) => {
      let finalTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        }
      }
      
      if (finalTranscript) {
        setTranscript(finalTranscript);
        
        // Process with AI - use best alternative
        let bestTranscript = finalTranscript;
        if (event.results[0].length > 1) {
          bestTranscript = event.results[0][0].transcript;
          for (let i = 1; i < event.results[0].length; i++) {
            if (event.results[0][i].confidence > event.results[0][0].confidence) {
              bestTranscript = event.results[0][i].transcript;
            }
          }
        }
        
        aiProcessor.processCommand(bestTranscript).then(result => {
          if (result.success) {
            speak(result.message || 'Done');
          } else {
            speak('Could you repeat that?');
          }
        });
        
        // Deactivate and restart
        setIsVoiceModeActive(false);
        recognition.stop();
        setTimeout(() => {
          startWakeWordDetection();
        }, 500);
      }
    };

    try {
      recognition.start();
    } catch (e) {
      // Voice mode recognition failed
    }
  }, [recognition, processVoiceCommand, speak, startWakeWordDetection]);

  // Stop listening
  const stopListening = useCallback(() => {
    setIsListening(false);
    setIsVoiceModeActive(false);
    if (recognition) {
      try {
        recognition.stop();
      } catch (e) {
        // Ignore errors
      }
    }
  }, [recognition]);

  // Manual trigger (for button click)
  const triggerVoiceMode = useCallback(() => {
    if (!isSupported) {
      alert('Voice commands are not supported in this browser. Please use Chrome, Edge, or Safari.');
      return;
    }
    
    if (isVoiceModeActive) {
      stopListening();
    } else {
      activateVoiceMode();
    }
  }, [isSupported, isVoiceModeActive, activateVoiceMode, stopListening]);

  // Auto-start wake word detection (disabled on auth pages)
  useEffect(() => {
    const isAuthPage = location.pathname === '/login' || location.pathname === '/signup' || location.pathname === '/';
    
    if (isSupported && !isListening && !isVoiceModeActive && !isAuthPage) {
      startWakeWordDetection();
    }
    
    return () => {
      if (recognition) {
        try {
          recognition.stop();
        } catch (e) {
          // Ignore errors on cleanup
        }
      }
    };
  }, [isSupported, startWakeWordDetection, location.pathname]);

  // Add startListening function for manual voice input
  const startListening = useCallback(() => {
    if (!recognition || !isSupported) {
      console.warn('Speech recognition not available');
      return;
    }

    if (isListening) {
      stopListening();
      return;
    }

    setIsListening(true);
    
    recognition.onresult = (event) => {
      let finalTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        }
      }
      
      if (finalTranscript.trim()) {
        setTranscript(finalTranscript);
        // Trigger custom event for Saytrix to handle
        window.dispatchEvent(new CustomEvent('voiceTranscript', { 
          detail: { transcript: finalTranscript } 
        }));
      }
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    try {
      recognition.start();
    } catch (error) {
      console.error('Failed to start recognition:', error);
      setIsListening(false);
    }
  }, [recognition, isSupported, isListening, stopListening]);

  const value = {
    isListening,
    isVoiceModeActive,
    transcript,
    isSupported,
    triggerVoiceMode,
    startListening,
    stopListening,
    speak,
    activateVoiceMode,
    startWakeWordDetection,
    processVoiceCommand
  };

  return (
    <VoiceContext.Provider value={value}>
      {children}
    </VoiceContext.Provider>
  );
};

export default VoiceContext;
