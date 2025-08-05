import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

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
      speak('Navigating to dashboard');
    } else if (lowerCommand.includes('charts') || lowerCommand.includes('chart')) {
      navigate('/charts');
      speak('Opening charts');
    } else if (lowerCommand.includes('portfolio')) {
      navigate('/portfolio');
      speak('Opening portfolio');
    } else if (lowerCommand.includes('watchlist') || lowerCommand.includes('watch list')) {
      navigate('/watchlist');
      speak('Opening watchlist');
    } else if (lowerCommand.includes('orders') || lowerCommand.includes('order')) {
      navigate('/orders');
      speak('Opening orders');
    } else if (lowerCommand.includes('history')) {
      navigate('/history');
      speak('Opening history');
    } else if (lowerCommand.includes('news')) {
      navigate('/news');
      speak('Opening news');
    } else if (lowerCommand.includes('notifications') || lowerCommand.includes('notification')) {
      navigate('/notifications');
      speak('Opening notifications');
    } else if (lowerCommand.includes('saytrix') || lowerCommand.includes('chat')) {
      navigate('/saytrix');
      speak('Opening Saytrix AI assistant');
    } else if (lowerCommand.includes('profile')) {
      navigate('/profile');
      speak('Opening profile');
    } else if (lowerCommand.includes('settings') || lowerCommand.includes('setting')) {
      navigate('/settings');
      speak('Opening settings');
    } else if (lowerCommand.includes('stop') || lowerCommand.includes('exit') || lowerCommand.includes('close')) {
      stopListening();
      speak('Voice mode deactivated');
    } else {
      speak('Command not recognized. Try saying dashboard, charts, portfolio, or other navigation commands.');
    }
  }, [navigate]);

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
    if (!recognition || !isSupported) return;

    setIsListening(true);
    
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
        
        // Check for wake word "Saytrix"
        if (finalTranscript.toLowerCase().includes('saytrix')) {
          console.log('Wake word detected:', finalTranscript);
          activateVoiceMode();
        }
      }
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'not-allowed') {
        alert('Microphone access denied. Please allow microphone access to use voice commands.');
      }
    };

    recognition.onend = () => {
      if (isListening && !isVoiceModeActive) {
        // Restart wake word detection
        setTimeout(() => {
          if (isListening) {
            recognition.start();
          }
        }, 100);
      }
    };

    recognition.start();
  }, [recognition, isSupported, isListening, isVoiceModeActive]);

  // Activate voice command mode
  const activateVoiceMode = useCallback(() => {
    setIsVoiceModeActive(true);
    speak('Saytrix activated. What would you like to do?');
    
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
        processVoiceCommand(finalTranscript);
        
        // Auto-deactivate after command
        setTimeout(() => {
          setIsVoiceModeActive(false);
          startWakeWordDetection();
        }, 2000);
      }
    };

    recognition.start();
  }, [recognition, processVoiceCommand, speak, startWakeWordDetection]);

  // Stop listening
  const stopListening = useCallback(() => {
    setIsListening(false);
    setIsVoiceModeActive(false);
    if (recognition) {
      recognition.stop();
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
        recognition.stop();
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
    activateVoiceMode
  };

  return (
    <VoiceContext.Provider value={value}>
      {children}
    </VoiceContext.Provider>
  );
};

export default VoiceContext;
