// VoiceCommandHandler.jsx - Speech recognition and command processing
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import voiceService from '../../services/voiceService';
import perfectVoiceAI from '../../services/perfectVoiceAI';

const VoiceCommandHandler = ({ 
  isActive = false,
  onCommandProcessed,
  onError,
  onStatusChange,
  onTranscriptUpdate
}) => {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [error, setError] = useState(null);
  
  const navigate = useNavigate();
  const timeoutRef = useRef(null);
  const isActiveRef = useRef(isActive);

  // Update ref when isActive changes
  useEffect(() => {
    isActiveRef.current = isActive;
  }, [isActive]);

  // Start voice recognition
  const startListening = useCallback(async () => {
    if (isListening || !isActiveRef.current) return;

    try {
      console.log('🎤 Starting voice command recognition...');
      setIsListening(true);
      setError(null);
      setTranscript('');
      onStatusChange && onStatusChange('listening');

      // Set timeout for automatic stop (30 seconds)
      timeoutRef.current = setTimeout(() => {
        stopListening();
      }, 30000);

      const result = await voiceService.startListening();
      
      if (result.transcript) {
        setTranscript(result.transcript);
        setConfidence(result.confidence);
        onTranscriptUpdate && onTranscriptUpdate(result.transcript, result.confidence);
        
        // Process the command
        await processVoiceCommand(result.transcript);
      }

    } catch (error) {
      console.error('Voice recognition error:', error);
      setError(error.message);
      onError && onError(error.message);
      setIsListening(false);
      onStatusChange && onStatusChange('error');
    }
  }, [isListening, onStatusChange, onTranscriptUpdate, onError]);

  // Stop voice recognition
  const stopListening = useCallback(() => {
    if (!isListening) return;

    console.log('🛑 Stopping voice command recognition...');
    voiceService.stopListening();
    setIsListening(false);
    onStatusChange && onStatusChange('stopped');

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, [isListening, onStatusChange]);

  // Process voice command with Gemini
  const processVoiceCommand = useCallback(async (transcript) => {
    if (!transcript.trim()) return;

    try {
      setIsProcessing(true);
      onStatusChange && onStatusChange('processing');

      console.log('🧠 Processing voice command:', transcript);
      
      const result = await voiceService.processVoiceCommand(transcript);

      if (result.success) {
        // Handle different intent types
        switch (result.intent) {
          case 'navigate':
            console.log('🧭 Navigation intent:', result.data);
            navigate(result.data);
            await speakResponse(`Navigating to ${result.data.replace('/', '')}`, {
              priority: 'high',
              queue: false
            });
            break;

          case 'stock_data':
            console.log('📈 Stock data intent:', result.stockData);
            await speakResponse(result.response, {
              priority: 'high',
              queue: false
            });
            break;

          case 'answer':
          default:
            console.log('💬 Answer intent:', result.response);
            await speakResponse(result.response, {
              priority: 'high',
              queue: false
            });
            break;
        }

        // Notify parent component
        onCommandProcessed && onCommandProcessed({
          transcript,
          intent: result.intent,
          response: result.response,
          data: result.data,
          stockData: result.stockData,
          suggestions: result.suggestions
        });

      } else {
        console.error('Command processing failed:', result.error);
        await speakResponse(result.response || "Sorry, I couldn't process that command.", {
          priority: 'high',
          queue: false
        });
        onError && onError(result.error);
      }

    } catch (error) {
      console.error('Error processing voice command:', error);
      await speakResponse("Sorry, I encountered an error processing your request.", {
        priority: 'high',
        queue: false
      });
      onError && onError(error.message);
    } finally {
      setIsProcessing(false);
      setIsListening(false);
      onStatusChange && onStatusChange('completed');
    }
  }, [navigate, onCommandProcessed, onError, onStatusChange]);

  // Enhanced speak response with perfect audio consistency
  const speakResponse = useCallback(async (text, options = {}) => {
    try {
      // Use perfectVoiceAI for enhanced speech synthesis
      await perfectVoiceAI.speakLegacy(text);
    } catch (perfectVoiceError) {
      console.warn('PerfectVoiceAI failed, using fallback:', perfectVoiceError);
      try {
        // Fallback to voice service
        await voiceService.speakResponse(text, {
          rate: options.rate || 0.9,
          pitch: options.pitch || 1.0,
          volume: options.volume || 0.8,
          ...options
        });
      } catch (fallbackError) {
        console.error('All speech synthesis methods failed:', fallbackError);
        // Last resort - basic speech synthesis
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.9;
        utterance.pitch = 1.0;
        utterance.volume = 0.8;
        speechSynthesis.speak(utterance);
      }
    }
  }, []);

  // Handle active state changes
  useEffect(() => {
    if (isActive && !isListening && !isProcessing) {
      // Auto-start listening when activated
      setTimeout(() => {
        if (isActiveRef.current) {
          startListening();
        }
      }, 500);
    } else if (!isActive && isListening) {
      // Stop listening when deactivated
      stopListening();
    }
  }, [isActive, isListening, isProcessing, startListening, stopListening]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopListening();
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [stopListening]);

  // Expose methods for external control
  React.useImperativeHandle(React.forwardRef(() => null), () => ({
    startListening,
    stopListening,
    isListening,
    isProcessing,
    transcript,
    confidence,
    error
  }));

  // This component doesn't render anything visible
  return null;
};

export default VoiceCommandHandler;
