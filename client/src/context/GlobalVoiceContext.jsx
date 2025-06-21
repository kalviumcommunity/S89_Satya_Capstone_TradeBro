import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import perfectVoiceAI from '../services/perfectVoiceAI';

const GlobalVoiceContext = createContext();

export const useGlobalVoice = () => {
  const context = useContext(GlobalVoiceContext);
  if (!context) {
    throw new Error('useGlobalVoice must be used within a GlobalVoiceProvider');
  }
  return context;
};

export const GlobalVoiceProvider = ({ children }) => {
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
  const [isSaytrixOpen, setIsSaytrixOpen] = useState(false);
  const [shouldOpenSaytrix, setShouldOpenSaytrix] = useState(false);
  const [lastVoiceCommand, setLastVoiceCommand] = useState(null);
  const [voiceResponse, setVoiceResponse] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isInVoiceSession, setIsInVoiceSession] = useState(false);
  const [serviceStatus, setServiceStatus] = useState(null);
  const [confidence, setConfidence] = useState(0);
  const [error, setError] = useState(null);
  const [aiResponses, setAiResponses] = useState([]);
  const [conversationHistory, setConversationHistory] = useState([]);

  // Safe navigation hooks with error handling
  let navigate, location;
  try {
    navigate = useNavigate();
    location = useLocation();
  } catch (error) {
    console.warn('⚠️ Router hooks not available, navigation disabled:', error);
    navigate = () => {};
    location = { pathname: '/' };
  }

  // Voice responses for different wake word scenarios (defined first)
  const getVoiceResponse = useCallback((command) => {
    const responses = {
      greeting: [
        "Hello! I'm Saytrix, your AI stock market assistant. How can I help you today?",
        "Hi there! Saytrix here, ready to assist you with all your stock market needs!",
        "Hey! Saytrix at your service. What would you like to know about the markets?"
      ],
      withCommand: [
        "Sure! Let me help you with that.",
        "Got it! Processing your request now.",
        "Absolutely! I'm on it."
      ]
    };

    if (command && command.additionalCommand && command.additionalCommand.length > 3) {
      return responses.withCommand[Math.floor(Math.random() * responses.withCommand.length)];
    } else {
      return responses.greeting[Math.floor(Math.random() * responses.greeting.length)];
    }
  }, []);

  // Enhanced real-time wake word detection with immediate feedback
  const handleWakeWordDetected = useCallback(async (command) => {
    console.log('🎯 Real-time wake word detected:', command);
    setLastVoiceCommand(command);
    setIsInVoiceSession(true);
    setConfidence(command.confidence || 1.0);

    // Show enhanced real-time notification
    if (window.showNotification) {
      window.showNotification({
        type: 'success',
        title: '🎤 Saytrix Activated',
        message: `Wake word "${command.wakeWord}" detected - I'm listening for your command`,
        duration: 3000
      });
    }

    // Open Saytrix if not already open
    if (!isSaytrixOpen) {
      setShouldOpenSaytrix(true);

      // If we're not on the Saytrix page, navigate there (with error handling)
      try {
        if (location.pathname !== '/saytrix' && location.pathname !== '/chatbot' && navigate) {
          navigate('/saytrix');
        }
      } catch (error) {
        console.warn('⚠️ Navigation failed:', error);
      }
    }

    // Immediate audio acknowledgment using built-in speech synthesis
    try {
      const utterance = new SpeechSynthesisUtterance("Yes?");
      utterance.rate = 1.1;
      utterance.pitch = 1.1;
      speechSynthesis.speak(utterance);
    } catch (error) {
      console.warn('Quick response failed:', error);
    }

    // Generate and speak detailed welcome response after brief pause
    setTimeout(async () => {
      const response = getVoiceResponse(command);
      setVoiceResponse(response);
      try {
        await perfectVoiceAI.speak(response);
      } catch (error) {
        console.warn('Welcome response failed:', error);
        // Fallback to simple browser speech synthesis
        if ('speechSynthesis' in window) {
          try {
            const utterance = new SpeechSynthesisUtterance(response);
            utterance.rate = 0.8;
            utterance.pitch = 1.0;
            utterance.volume = 1.0;
            utterance.onstart = () => console.log('🎤 Fallback speech started');
            utterance.onend = () => console.log('✅ Fallback speech completed');
            utterance.onerror = (e) => console.warn('⚠️ Fallback speech error:', e.error);
            window.speechSynthesis.speak(utterance);
          } catch (fallbackError) {
            console.warn('⚠️ Fallback speech also failed:', fallbackError);
          }
        }
      }
    }, 1000);

    // If there's an additional command, it will be processed by the AI
    if (command.additionalCommand && command.additionalCommand.length > 3) {
      console.log('Additional command will be processed:', command.additionalCommand);
    }
  }, [isSaytrixOpen, location.pathname, navigate, getVoiceResponse]);

  // Handle AI responses (defined early to avoid circular dependency)
  const handleAIResponse = useCallback((responseData) => {
    console.log('🤖 AI Response received:', responseData);

    setAiResponses(prev => [...prev, responseData]);
    setConversationHistory(prev => [
      ...prev,
      {
        type: 'user',
        content: responseData.userCommand,
        timestamp: responseData.timestamp
      },
      {
        type: 'ai',
        content: responseData.aiResponse,
        timestamp: responseData.timestamp
      }
    ]);

    // Send AI response to Saytrix page if available
    if (window.saytrixSendMessage && responseData.userCommand) {
      // Send the user command to Saytrix page to get proper API response
      console.log('🔄 Forwarding voice command to Saytrix page for proper API processing');
      window.saytrixSendMessage(responseData.userCommand);
    }

    // Show notification for AI response
    if (window.showNotification) {
      window.showNotification({
        type: 'info',
        title: 'Saytrix Response',
        message: responseData.aiResponse.substring(0, 100) + (responseData.aiResponse.length > 100 ? '...' : ''),
        duration: 5000
      });
    }
  }, []);

  // Handle status changes from Perfect Voice AI service (defined early)
  const handleStatusChange = useCallback((status, message) => {
    console.log(`📊 Perfect Voice AI status: ${status} - ${message}`);

    setIsListening(perfectVoiceAI.getIsListening());
    setIsInVoiceSession(perfectVoiceAI.getIsInVoiceSession());
    setServiceStatus(perfectVoiceAI.getServiceStatus());

    if (status.includes('error')) {
      setError(message);
    } else {
      setError(null);
    }
  }, []);

  // Handle voice errors (defined early)
  const handleVoiceError = useCallback((error) => {
    console.error('❌ Voice service error:', error);
    setError(error);

    // Show notification
    if (window.showNotification) {
      window.showNotification({
        type: 'error',
        title: 'Voice Error',
        message: error,
        duration: 5000
      });
    }
  }, []);

  // Handle voice messages during session (defined early)
  const handleVoiceMessage = useCallback((message) => {
    console.log('🎤 Voice message received:', message);

    // Update conversation history
    setConversationHistory(prev => [
      ...prev,
      {
        type: 'user',
        content: message,
        timestamp: new Date().toISOString()
      }
    ]);

    // Ensure we're on the Saytrix page for data display
    if (location.pathname !== '/saytrix' && location.pathname !== '/chatbot' && navigate) {
      console.log('🧭 Navigating to Saytrix page for voice command processing');
      navigate('/saytrix');
    }

    // Send message to Saytrix page for proper API processing and data display
    if (window.saytrixSendMessage) {
      console.log('📤 Sending voice message to Saytrix page for API processing');
      window.saytrixSendMessage(message);
    } else {
      console.warn('⚠️ Saytrix message sender not available, retrying in 1 second...');
      // Retry after a short delay to ensure Saytrix page is loaded
      setTimeout(() => {
        if (window.saytrixSendMessage) {
          console.log('📤 Retrying: Sending voice message to Saytrix page');
          window.saytrixSendMessage(message);
        } else {
          console.error('❌ Saytrix message sender still not available');
        }
      }, 1000);
    }
  }, [location.pathname, navigate]);

  // Enhanced real-time speak response with intelligent prioritization
  const speakResponse = useCallback(async (text, options = {}) => {
    if (!text) {
      console.warn('⚠️ No text provided for speech');
      return;
    }

    try {
      console.log('🔊 Real-time voice response:', text.substring(0, 100) + '...');

      // Determine context and emotion from text
      const context = analyzeResponseContext(text);

      // Intelligent response prioritization
      const priority = determinePriority(text, context);

      const speechOptions = {
        profile: context.profile,
        queue: priority === 'urgent' ? false : (options.queue !== false),
        interrupt: priority === 'urgent',
        priority: priority,
        onStart: () => {
          // Visual feedback - show speaking indicator with text preview
          if (window.showSpeakingIndicator) {
            window.showSpeakingIndicator(true, text);
          }

          // Real-time status update
          console.log(`🎤 Speaking with ${context.emotion} emotion, ${priority} priority`);

          // Trigger any additional start callbacks
          if (options.onStart) options.onStart();
        },
        onEnd: () => {
          // Hide speaking indicator
          if (window.showSpeakingIndicator) {
            window.showSpeakingIndicator(false);
          }

          // Trigger any additional end callbacks
          if (options.onEnd) options.onEnd();
        },
        onError: (error) => {
          console.error('❌ Real-time speech synthesis error:', error);
          if (window.showSpeakingIndicator) {
            window.showSpeakingIndicator(false);
          }

          // Trigger any additional error callbacks
          if (options.onError) options.onError(error);
        },
        onBoundary: (event) => {
          // Real-time word tracking for advanced features
          if (options.onWordSpoken) {
            options.onWordSpoken(event);
          }
        },
        ...options
      };

      // Use enhanced Perfect Voice AI for better speech quality
      try {
        await perfectVoiceAI.speakLegacy(text);
        if (speechOptions.onEnd) speechOptions.onEnd();
      } catch (perfectVoiceError) {
        console.warn('⚠️ Perfect Voice AI failed, falling back to built-in synthesis:', perfectVoiceError);

        // Fallback to built-in speech synthesis
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = speechOptions.rate || 0.9;
        utterance.pitch = speechOptions.pitch || 1.0;
        utterance.volume = speechOptions.volume || 0.8;

        if (speechOptions.onStart) utterance.onstart = speechOptions.onStart;
        if (speechOptions.onEnd) utterance.onend = speechOptions.onEnd;
        if (speechOptions.onError) utterance.onerror = speechOptions.onError;

        speechSynthesis.speak(utterance);
      }

      console.log('✅ Real-time voice response completed');
    } catch (error) {
      console.error('❌ Real-time voice response error:', error);

      // Show user-friendly notification if available
      if (window.showNotification) {
        window.showNotification({
          type: 'warning',
          title: 'Voice Response',
          message: 'Audio response temporarily unavailable',
          duration: 2000
        });
      }
    }
  }, []);

  // Determine response priority for intelligent handling
  const determinePriority = useCallback((text, context) => {
    const lowerText = text.toLowerCase();

    // Urgent priority
    if (lowerText.includes('alert') || lowerText.includes('warning') ||
        lowerText.includes('urgent') || lowerText.includes('error') ||
        lowerText.includes('stop') || lowerText.includes('danger')) {
      return 'urgent';
    }

    // High priority
    if (lowerText.includes('important') || lowerText.includes('attention') ||
        context.emotion === 'excited' || lowerText.includes('breaking')) {
      return 'high';
    }

    // Low priority
    if (lowerText.includes('by the way') || lowerText.includes('also') ||
        lowerText.includes('additionally') || context.emotion === 'calm') {
      return 'low';
    }

    return 'normal';
  }, []);

  // Analyze response context for intelligent voice selection
  const analyzeResponseContext = useCallback((text) => {
    const lowerText = text.toLowerCase();

    // Detect emotions and contexts
    if (lowerText.includes('congratulations') || lowerText.includes('great job') || lowerText.includes('excellent')) {
      return { emotion: 'happy', profile: 'friendly' };
    }

    if (lowerText.includes('warning') || lowerText.includes('alert') || lowerText.includes('urgent')) {
      return { emotion: 'excited', profile: 'urgent' };
    }

    if (lowerText.includes('sorry') || lowerText.includes('unfortunately') || lowerText.includes('error')) {
      return { emotion: 'calm', profile: 'calm' };
    }

    if (lowerText.includes('stock') || lowerText.includes('market') || lowerText.includes('trading') || lowerText.includes('price')) {
      return { emotion: 'confident', profile: 'professional' };
    }

    if (lowerText.includes('hello') || lowerText.includes('welcome') || lowerText.includes('hi there')) {
      return { emotion: 'happy', profile: 'friendly' };
    }

    return { emotion: 'neutral', profile: 'default' };
  }, []);



  // Initialize Perfect Voice AI service with conflict management
  useEffect(() => {
    console.log('🚀 Initializing Perfect Voice AI Service with conflict management...');

    // Stop any existing speech recognition to prevent conflicts
    if (window.speechRecognition) {
      window.speechRecognition.stop();
    }

    // Set up event handlers for Perfect Voice AI
    perfectVoiceAI.setOnWakeWordDetected(handleWakeWordDetected);
    perfectVoiceAI.setOnVoiceMessage(handleVoiceMessage);
    perfectVoiceAI.setOnAIResponse(handleAIResponse);
    perfectVoiceAI.setOnError(handleVoiceError);
    perfectVoiceAI.setOnStatusChange(handleStatusChange);

    // Update initial status
    setServiceStatus(perfectVoiceAI.getServiceStatus());

    return () => {
      perfectVoiceAI.stopListening();
    };
  }, []);







  // Handle end voice session
  const handleEndVoiceSession = useCallback(() => {
    console.log('🎤 Ending voice session');
    setIsInVoiceSession(false);
    setConfidence(0);

    // End session in Perfect Voice AI
    perfectVoiceAI.endVoiceSession();

    // The Perfect Voice AI will handle the farewell message automatically
  }, []);



  // Auto-start voice listening when enabled
  useEffect(() => {
    if (isVoiceEnabled) {
      console.log('🎤 Starting Perfect Voice AI for wake word detection...');
      perfectVoiceAI.startListening().catch(console.error);
    } else {
      console.log('🛑 Stopping Perfect Voice AI...');
      perfectVoiceAI.stopListening().catch(console.error);
    }
  }, [isVoiceEnabled]);

  // Enhanced real-time voice commands toggle
  const toggleVoiceCommands = useCallback(async () => {
    const newState = !isVoiceEnabled;
    setIsVoiceEnabled(newState);

    try {
      if (newState) {
        console.log('🎤 Enabling real-time voice commands...');

        // Stop any conflicting services first
        if (window.speechRecognition) {
          window.speechRecognition.stop();
        }
        await new Promise(resolve => setTimeout(resolve, 500));

        // Start Perfect Voice AI service for wake word detection
        await perfectVoiceAI.startListening();

        // Provide audio feedback using built-in speech synthesis
        const utterance = new SpeechSynthesisUtterance("Voice commands activated.");
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        speechSynthesis.speak(utterance);

        console.log('✅ Real-time voice commands enabled successfully');
      } else {
        console.log('🔇 Disabling real-time voice commands...');

        // Stop all voice services
        await perfectVoiceAI.stopListening();

        // Provide audio feedback using built-in speech synthesis
        const utterance = new SpeechSynthesisUtterance("Voice commands deactivated.");
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        speechSynthesis.speak(utterance);

        console.log('✅ Real-time voice commands disabled successfully');
      }
    } catch (error) {
      console.error('❌ Error toggling voice commands:', error);

      if (window.showNotification) {
        window.showNotification({
          type: 'error',
          title: 'Voice Commands',
          message: `Failed to ${newState ? 'enable' : 'disable'} voice commands`,
          duration: 3000
        });
      }
    }
  }, [isVoiceEnabled]);

  // Enhanced real-time start listening
  const startListening = useCallback(async () => {
    try {
      console.log('🎤 Starting real-time voice listening...');

      if (!isVoiceEnabled) {
        setIsVoiceEnabled(true);
      }

      // Stop any conflicting services first
      if (window.speechRecognition) {
        window.speechRecognition.stop();
      }
      await new Promise(resolve => setTimeout(resolve, 500));

      // Start Perfect Voice AI service
      await perfectVoiceAI.startListening();

      // Provide immediate audio feedback using built-in speech synthesis
      const utterance = new SpeechSynthesisUtterance("Voice assistant ready.");
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      speechSynthesis.speak(utterance);

      console.log('✅ Real-time voice listening started successfully');

    } catch (error) {
      console.error('❌ Error starting voice listening:', error);

      if (window.showNotification) {
        window.showNotification({
          type: 'error',
          title: 'Voice Listening',
          message: 'Failed to start voice listening',
          duration: 3000
        });
      }
    }
  }, [isVoiceEnabled]);

  // Enhanced real-time stop listening
  const stopListening = useCallback(async () => {
    try {
      console.log('🛑 Stopping real-time voice listening...');

      // Stop all voice services
      await perfectVoiceAI.stopListening();

      // End voice session if active
      if (isInVoiceSession) {
        setIsInVoiceSession(false);
        setConfidence(0);
      }

      // Provide audio feedback using built-in speech synthesis
      const utterance = new SpeechSynthesisUtterance("Voice listening stopped.");
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      speechSynthesis.speak(utterance);

      console.log('✅ Real-time voice listening stopped successfully');

    } catch (error) {
      console.error('❌ Error stopping voice listening:', error);
    }
  }, [isInVoiceSession]);

  // Clear conversation history
  const clearConversationHistory = useCallback(() => {
    setConversationHistory([]);
    setAiResponses([]);
    perfectVoiceAI.clearContext();
    console.log('🧹 Conversation history cleared');
  }, []);

  // Register Saytrix open/close handlers
  const registerSaytrixHandlers = useCallback((openHandler, closeHandler) => {
    window.saytrixOpenSaytrix = openHandler;
    window.saytrixCloseSaytrix = closeHandler;
  }, []);

  // Register message sender
  const registerMessageSender = useCallback((sendMessageHandler) => {
    window.saytrixSendMessage = sendMessageHandler;
  }, []);

  // Enhanced voice response handler for real-time chatbot integration
  const registerVoiceResponseHandler = useCallback(() => {
    window.saytrixSpeakResponse = async (text, options = {}) => {
      if (isInVoiceSession && text) {
        console.log('🎤 Saytrix real-time voice response:', text.substring(0, 50) + '...');

        try {
          // Enhanced real-time speech with intelligent options
          await speakResponse(text, {
            queue: options.interrupt === true ? false : true,
            priority: options.priority || 'normal',
            ...options
          });
        } catch (error) {
          console.error('❌ Error in saytrix voice response:', error);

          // Show subtle error notification
          if (window.showNotification) {
            window.showNotification({
              type: 'warning',
              title: 'Voice Response',
              message: 'Audio response temporarily unavailable',
              duration: 2000
            });
          }
        }
      } else if (!isInVoiceSession) {
        console.log('💬 Voice response available - activate voice session to hear responses');
      }
    };

    // Enhanced voice control functions
    window.saytrixStopSpeaking = () => {
      speechSynthesis.cancel();
      console.log('🛑 Voice response stopped by user');
    };

    window.saytrixPauseSpeaking = () => {
      speechSynthesis.pause();
      console.log('⏸️ Voice response paused by user');
    };

    window.saytrixResumeSpeaking = () => {
      speechSynthesis.resume();
      console.log('▶️ Voice response resumed by user');
    };

    return () => {
      window.saytrixSpeakResponse = null;
      window.saytrixStopSpeaking = null;
      window.saytrixPauseSpeaking = null;
      window.saytrixResumeSpeaking = null;
    };
  }, [isInVoiceSession, speakResponse]);

  // Register end voice session handler
  useEffect(() => {
    window.saytrixEndVoiceSession = handleEndVoiceSession;

    return () => {
      window.saytrixEndVoiceSession = null;
    };
  }, [handleEndVoiceSession]);

  // Register voice response handler
  useEffect(() => {
    return registerVoiceResponseHandler();
  }, [registerVoiceResponseHandler]);

  // Update Saytrix state
  const updateSaytrixState = useCallback((isOpen) => {
    setIsSaytrixOpen(isOpen);
    if (isOpen && shouldOpenSaytrix) {
      setShouldOpenSaytrix(false);
    }
  }, [shouldOpenSaytrix]);

  // Load voices when available and set up global error handling
  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      console.log('Available voices:', voices.map(v => v.name));
    };

    if (window.speechSynthesis) {
      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    // Global error handler for speech recognition conflicts
    const handleGlobalError = (event) => {
      if (event.error && event.error.message) {
        const message = event.error.message.toLowerCase();
        if (message.includes('recognition has already started') ||
            message.includes('speech recognition') ||
            message.includes('aborted')) {
          console.warn('🚨 Global speech recognition conflict detected:', event.error.message);

          // Stop all speech recognition instances
          perfectVoiceAI.stopListening();

          // Show user notification
          if (window.showNotification) {
            window.showNotification({
              type: 'warning',
              title: 'Voice Recognition Conflict',
              message: 'Multiple voice services detected. Restarting voice recognition...',
              duration: 3000
            });
          }

          // Restart after a delay
          setTimeout(() => {
            if (isVoiceEnabled) {
              console.log('🔄 Restarting voice recognition after conflict resolution...');
              // Only restart the primary service
              perfectVoiceAI.startListening().catch(console.error);
            }
          }, 2000);
        }
      }
    };

    // Add global error listener
    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', (event) => {
      if (event.reason && event.reason.message) {
        const message = event.reason.message.toLowerCase();
        if (message.includes('speech recognition') || message.includes('aborted')) {
          console.warn('🚨 Unhandled speech recognition error:', event.reason.message);
          perfectVoiceAI.stopListening();
        }
      }
    });

    return () => {
      window.removeEventListener('error', handleGlobalError);
    };
  }, [isVoiceEnabled]);

  // Show voice status in console
  useEffect(() => {
    console.log('🎤 Voice Command Status Update:');
    console.log('  - Enabled:', isVoiceEnabled);
    console.log('  - Listening:', isListening);
    console.log('  - Voice session active:', isInVoiceSession);
    console.log('  - Service status:', serviceStatus);
    console.log('  - Error:', error);

    if (isVoiceEnabled && serviceStatus) {
      if (serviceStatus.browserSpeechEnabled) {
        console.log('✅ Voice commands should be working - try saying "Saytrix"');
      } else {
        console.warn('⚠️ No voice services available');
      }
    } else if (!isVoiceEnabled) {
      console.warn('⚠️ Voice commands disabled');
    }
  }, [isVoiceEnabled, isListening, isInVoiceSession, serviceStatus, error]);

  const value = {
    // Voice command state
    isVoiceEnabled,
    isListening: isListening,
    isSupported: serviceStatus ? serviceStatus.browserSpeechEnabled : false,
    error: error,
    lastCommand: lastVoiceCommand,
    confidence: confidence,
    isInVoiceSession: isInVoiceSession,
    serviceStatus,

    // Saytrix state
    isSaytrixOpen,
    shouldOpenSaytrix,
    voiceResponse,
    // Legacy chatbot compatibility
    isChatbotOpen: isSaytrixOpen,
    shouldOpenChatbot: shouldOpenSaytrix,

    // Actions
    toggleVoiceCommands,
    speakResponse,
    updateSaytrixState,
    registerSaytrixHandlers,
    registerMessageSender,
    handleEndVoiceSession,
    // Legacy chatbot compatibility
    updateChatbotState: updateSaytrixState,
    registerChatbotHandlers: registerSaytrixHandlers,

    // Voice command controls
    startListening,
    stopListening,

    // Services
    perfectVoiceAI
  };

  return (
    <GlobalVoiceContext.Provider value={value}>
      {children}
    </GlobalVoiceContext.Provider>
  );
};

export default GlobalVoiceContext;
