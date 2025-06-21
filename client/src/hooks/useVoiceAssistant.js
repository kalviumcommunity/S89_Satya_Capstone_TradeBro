// useVoiceAssistant.js - Custom hook for voice assistant logic
import { useState, useEffect, useCallback, useRef } from 'react';
import voiceService from '../services/voiceService';

const useVoiceAssistant = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [error, setError] = useState(null);
  const [sessionHistory, setSessionHistory] = useState([]);
  const [isSupported, setIsSupported] = useState(false);
  const [lastCommand, setLastCommand] = useState(null);
  const [settings, setSettings] = useState({
    voiceEnabled: true,
    wakeWordEnabled: true,
    autoClose: true,
    speechRate: 1.0,
    speechPitch: 1.0,
    speechVolume: 0.8
  });

  const sessionRef = useRef(null);
  const timeoutRef = useRef(null);

  // Check browser support on mount
  useEffect(() => {
    const supported = voiceService.constructor.isSupported() && 
                     voiceService.constructor.isSynthesisSupported();
    setIsSupported(supported);
    
    if (!supported) {
      setError('Voice features are not supported in this browser');
    }
  }, []);

  // Show the voice assistant
  const showAssistant = useCallback(() => {
    if (!isSupported) {
      setError('Voice features are not supported in this browser');
      return;
    }
    
    setIsVisible(true);
    setError(null);
    
    // Clear any existing session
    voiceService.clearSessionContext();
    setSessionHistory([]);
  }, [isSupported]);

  // Hide the voice assistant
  const hideAssistant = useCallback(() => {
    setIsVisible(false);
    setIsListening(false);
    setIsProcessing(false);
    setIsSpeaking(false);
    setTranscript('');
    setConfidence(0);
    setError(null);
    
    // Stop any ongoing voice operations
    voiceService.stopListening();
    
    // Clear session
    voiceService.clearSessionContext();
    setSessionHistory([]);
  }, []);

  // Toggle assistant visibility
  const toggleAssistant = useCallback(() => {
    if (isVisible) {
      hideAssistant();
    } else {
      showAssistant();
    }
  }, [isVisible, hideAssistant, showAssistant]);

  // Start listening for voice commands
  const startListening = useCallback(async () => {
    if (!isSupported || isListening) return;

    try {
      setIsListening(true);
      setError(null);
      setTranscript('');
      setConfidence(0);

      // Set timeout for auto-stop
      timeoutRef.current = setTimeout(() => {
        stopListening();
      }, 30000); // 30 seconds timeout

      const result = await voiceService.startListening();
      
      if (result.transcript) {
        setTranscript(result.transcript);
        setConfidence(result.confidence);
        
        // Process the command
        await processCommand(result.transcript);
      }

    } catch (error) {
      console.error('Error starting voice recognition:', error);
      setError(error.message);
      setIsListening(false);
    }
  }, [isSupported, isListening]);

  // Stop listening
  const stopListening = useCallback(() => {
    if (!isListening) return;

    voiceService.stopListening();
    setIsListening(false);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, [isListening]);

  // Process voice command
  const processCommand = useCallback(async (transcript) => {
    if (!transcript.trim()) return;

    try {
      setIsProcessing(true);
      setError(null);

      const result = await voiceService.processVoiceCommand(transcript);

      if (result.success) {
        // Add to session history
        const commandEntry = {
          id: Date.now(),
          transcript,
          response: result.response,
          intent: result.intent,
          data: result.data,
          stockData: result.stockData,
          timestamp: new Date().toISOString()
        };

        setSessionHistory(prev => [commandEntry, ...prev.slice(0, 9)]); // Keep last 10
        setLastCommand(commandEntry);

        // Speak response if voice is enabled
        if (settings.voiceEnabled) {
          await speakResponse(result.response);
        }

        // Auto-close if enabled and command was successful
        if (settings.autoClose && result.intent === 'navigate') {
          setTimeout(() => {
            hideAssistant();
          }, 2000);
        }

        return result;

      } else {
        setError(result.error);
        
        if (settings.voiceEnabled) {
          await speakResponse(result.response || "Sorry, I couldn't process that command.");
        }
      }

    } catch (error) {
      console.error('Error processing command:', error);
      setError(error.message);
      
      if (settings.voiceEnabled) {
        await speakResponse("Sorry, I encountered an error processing your request.");
      }
    } finally {
      setIsProcessing(false);
      setIsListening(false);
    }
  }, [settings.voiceEnabled, settings.autoClose, hideAssistant]);

  // Speak response
  const speakResponse = useCallback(async (text) => {
    if (!settings.voiceEnabled || !text) return;

    try {
      setIsSpeaking(true);
      
      await voiceService.speakResponse(text, {
        rate: settings.speechRate,
        pitch: settings.speechPitch,
        volume: settings.speechVolume
      });

    } catch (error) {
      console.error('Error speaking response:', error);
    } finally {
      setIsSpeaking(false);
    }
  }, [settings]);

  // Update settings
  const updateSettings = useCallback((newSettings) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
    
    // Save to localStorage
    localStorage.setItem('saytrix-settings', JSON.stringify({ ...settings, ...newSettings }));
  }, [settings]);

  // Load settings from localStorage
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem('saytrix-settings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        setSettings(prev => ({ ...prev, ...parsed }));
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  }, []);

  // Save session history to localStorage
  useEffect(() => {
    if (sessionHistory.length > 0) {
      try {
        localStorage.setItem('saytrix-history', JSON.stringify(sessionHistory.slice(0, 5)));
      } catch (error) {
        console.error('Error saving session history:', error);
      }
    }
  }, [sessionHistory]);

  // Load session history from localStorage
  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem('saytrix-history');
      if (savedHistory) {
        const parsed = JSON.parse(savedHistory);
        setSessionHistory(parsed);
      }
    } catch (error) {
      console.error('Error loading session history:', error);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      voiceService.stopListening();
    };
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Ctrl+Shift+M to toggle assistant
      if (event.ctrlKey && event.shiftKey && event.key === 'M') {
        event.preventDefault();
        toggleAssistant();
      }
      
      // Escape to close assistant
      if (event.key === 'Escape' && isVisible) {
        event.preventDefault();
        hideAssistant();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [toggleAssistant, isVisible, hideAssistant]);

  return {
    // State
    isVisible,
    isListening,
    isProcessing,
    isSpeaking,
    transcript,
    confidence,
    error,
    sessionHistory,
    isSupported,
    lastCommand,
    settings,

    // Actions
    showAssistant,
    hideAssistant,
    toggleAssistant,
    startListening,
    stopListening,
    processCommand,
    speakResponse,
    updateSettings,

    // Computed
    isActive: isVisible && (isListening || isProcessing || isSpeaking),
    canListen: isSupported && !isListening && !isProcessing,
    status: isListening ? 'listening' : 
            isProcessing ? 'processing' : 
            isSpeaking ? 'speaking' : 
            error ? 'error' : 'idle'
  };
};

export default useVoiceAssistant;
