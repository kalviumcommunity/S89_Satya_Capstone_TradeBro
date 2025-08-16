import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
    
    // Navigation commands
    if (lowerCommand.includes('dashboard') || lowerCommand.includes('home')) {
      navigate('/dashboard');
    } else if (lowerCommand.includes('chart') || lowerCommand.includes('charge')) {
      navigate('/charts');
    } else if (lowerCommand.includes('portfolio')) {
      navigate('/portfolio');
    } else if (lowerCommand.includes('watchlist') || lowerCommand.includes('watch list')) {
      navigate('/watchlist');
    } else if (lowerCommand.includes('orders') || lowerCommand.includes('order')) {
      navigate('/orders');
    } else if (lowerCommand.includes('history')) {
      navigate('/history');
    } else if (lowerCommand.includes('news')) {
      navigate('/news');
    } else if (lowerCommand.includes('notifications') || lowerCommand.includes('notification')) {
      navigate('/notifications');
    } else if (lowerCommand.includes('saytrix') || lowerCommand.includes('chat')) {
      navigate('/saytrix');
    } else if (lowerCommand.includes('profile')) {
      navigate('/profile');
    } else if (lowerCommand.includes('settings') || lowerCommand.includes('setting')) {
      navigate('/settings');
    } else if (lowerCommand.includes('trading') || lowerCommand.includes('trade')) {
      navigate('/trading');
    }
    
    // Market data commands
    if (lowerCommand.includes('price of') || lowerCommand.includes('show price')) {
      const stock = extractStock(lowerCommand);
      if (stock) {
        navigate(`/stock/${stock}`);
      }
    } else if (lowerCommand.includes('top gainers') || lowerCommand.includes('gainers')) {
      navigate('/dashboard');
    } else if (lowerCommand.includes('top losers') || lowerCommand.includes('losers')) {
      navigate('/dashboard');
    }
    
    // Trading commands
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
      
      console.log('Heard:', finalTranscript);
      setTranscript(finalTranscript);
      
      // More accurate wake word detection
      const wakeWords = ['saytrix', 'citrix', 'citric', 'matrix', 'tricks', 'se tric', 'say tricks'];
      const isWakeWord = wakeWords.some(word => 
        finalTranscript.toLowerCase().includes(word)
      );
      
      if (isWakeWord) {
        console.log('Wake word detected:', finalTranscript);
        recognition.stop();
        activateVoiceMode();
      }
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'not-allowed') {
        alert('Please allow microphone access to use voice commands.');
      }
      setIsListening(false);
      if (event.error !== 'aborted') {
        setTimeout(() => {
          startWakeWordDetection();
        }, 1000);
      }
    };

    recognition.onend = () => {
      console.log('Wake word detection ended');
      setIsListening(false);
      if (!isVoiceModeActive) {
        setTimeout(() => {
          startWakeWordDetection();
        }, 500);
      }
    };

    try {
      recognition.start();
      console.log('Voice recognition started - say "Saytrix" to activate');
    } catch (e) {
      if (e.name !== 'InvalidStateError') {
        console.log('Recognition start failed:', e);
        setIsListening(false);
      }
    }
  }, [recognition, isSupported, isListening, isVoiceModeActive]);

  // Activate voice command mode
  const activateVoiceMode = useCallback(() => {
    console.log('Voice mode activated');
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
        console.log('Voice command received:', finalTranscript);
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
          console.log('Command executed:', result);
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
      console.log('Voice mode recognition failed:', e);
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

  // Auto-start wake word detection
  useEffect(() => {
    if (isSupported && !isListening && !isVoiceModeActive) {
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
  }, [isSupported, startWakeWordDetection]);

  const value = {
    isListening,
    isVoiceModeActive,
    transcript,
    isSupported,
    triggerVoiceMode,
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
