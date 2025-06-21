import { useState, useEffect, useRef, useCallback } from 'react';

const useGlobalVoiceCommand = ({
  onWakeWordDetected,
  wakeWords = [
    'saytrix',
    'say trix',
    'citrix',      // Common misrecognition
    'citric',      // Common misrecognition
    'say tricks',  // Alternative pronunciation
    'say trics',   // Alternative pronunciation
    'saitrix',     // Alternative spelling
    'saytrics'     // Alternative spelling
  ],
  isEnabled = true
}) => {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [error, setError] = useState(null);
  const [lastCommand, setLastCommand] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [isInVoiceSession, setIsInVoiceSession] = useState(false);

  const recognitionRef = useRef(null);
  const isActiveRef = useRef(false);
  const restartTimeoutRef = useRef(null);
  const confidenceThreshold = 0.3; // Lowered threshold for better detection

  // Calculate similarity between two strings (Levenshtein distance)
  const calculateSimilarity = useCallback((str1, str2) => {
    const matrix = [];
    const len1 = str1.length;
    const len2 = str2.length;

    for (let i = 0; i <= len2; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= len1; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= len2; i++) {
      for (let j = 1; j <= len1; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    const distance = matrix[len2][len1];
    const maxLen = Math.max(len1, len2);
    return (maxLen - distance) / maxLen;
  }, []);

  // Enhanced wake word detection
  const detectWakeWord = useCallback((transcript) => {
    const lowerTranscript = transcript.toLowerCase().trim();

    // Direct match
    for (const wakeWord of wakeWords) {
      if (lowerTranscript.includes(wakeWord)) {
        return {
          detected: true,
          matchedWord: wakeWord,
          confidence: 1.0,
          method: 'direct'
        };
      }
    }

    // Fuzzy matching for similar words
    const words = lowerTranscript.split(' ');
    for (const word of words) {
      for (const wakeWord of wakeWords) {
        const similarity = calculateSimilarity(word, wakeWord);
        if (similarity >= 0.7) { // 70% similarity threshold
          return {
            detected: true,
            matchedWord: wakeWord,
            confidence: similarity,
            method: 'fuzzy',
            originalWord: word
          };
        }
      }
    }

    // Check for partial matches in longer phrases
    for (const wakeWord of wakeWords) {
      const similarity = calculateSimilarity(lowerTranscript, wakeWord);
      if (similarity >= 0.6) { // 60% similarity for full transcript
        return {
          detected: true,
          matchedWord: wakeWord,
          confidence: similarity,
          method: 'partial'
        };
      }
    }

    return { detected: false };
  }, [wakeWords, calculateSimilarity]);

  // Initialize speech recognition
  useEffect(() => {
    console.log('🔧 Initializing speech recognition...');
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.error('❌ Speech recognition not supported in this browser');
      setIsSupported(false);
      setError('Speech recognition not supported in this browser');
      return;
    }

    console.log('✅ Speech recognition API available');

    // Request microphone permission first
    const requestMicrophonePermission = async () => {
      try {
        console.log('🎤 Requesting microphone permission...');
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop()); // Stop the stream immediately
        console.log('✅ Microphone permission granted');

        // Now create recognition instance
        try {
          recognitionRef.current = new SpeechRecognition();
          recognitionRef.current.continuous = true;
          recognitionRef.current.interimResults = true;
          recognitionRef.current.lang = 'en-US';
          recognitionRef.current.maxAlternatives = 5; // Get more alternatives for better matching
          console.log('✅ Speech recognition instance created successfully');
          setIsSupported(true);
          setError(null);
        } catch (err) {
          console.error('❌ Failed to create speech recognition instance:', err);
          setIsSupported(false);
          setError('Failed to create speech recognition instance: ' + err.message);
        }
      } catch (err) {
        console.error('❌ Microphone permission denied:', err);
        setIsSupported(false);
        setError('Microphone permission required for voice commands: ' + err.message);
      }
    };

    requestMicrophonePermission();

    // Event handlers - only set if recognition instance exists
    if (recognitionRef.current) {
      recognitionRef.current.onstart = () => {
        console.log('🎤 Global voice command listening started');
        setIsListening(true);
        setError(null);
        isActiveRef.current = true;
      };

      recognitionRef.current.onresult = (event) => {
      if (!isActiveRef.current) return;

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript.toLowerCase().trim();
        const confidence = event.results[i][0].confidence || 0.8; // Default confidence if not provided

        if (event.results[i].isFinal) {
          setConfidence(confidence);

          // Check for end commands during voice session
          if (isInVoiceSession && (
            transcript.includes('end') ||
            transcript.includes('stop') ||
            transcript.includes('goodbye') ||
            transcript.includes('bye')
          )) {
            console.log('🛑 End command detected:', transcript);
            setIsInVoiceSession(false);

            // Notify about session end
            if (window.saytrixEndVoiceSession) {
              window.saytrixEndVoiceSession();
            }
            return;
          }

          // Check for wake words (only when not in voice session)
          if (!isInVoiceSession) {
            console.log(`🔍 Checking transcript: "${transcript}" (confidence: ${confidence})`);

            // Use enhanced wake word detection
            const wakeWordResult = detectWakeWord(transcript);

            console.log(`🎯 Wake word result: ${wakeWordResult.detected ? wakeWordResult.matchedWord : 'NONE'}, confidence: ${confidence}, threshold: ${confidenceThreshold}`);

            if (wakeWordResult.detected && confidence >= confidenceThreshold) {
              const matchInfo = wakeWordResult.originalWord ?
                `"${wakeWordResult.originalWord}" → "${wakeWordResult.matchedWord}"` :
                `"${wakeWordResult.matchedWord}"`;

              console.log(`🎉 WAKE WORD DETECTED: ${matchInfo} (${wakeWordResult.method} match, similarity: ${wakeWordResult.confidence.toFixed(2)}, speech confidence: ${confidence})`);
              setLastCommand(transcript);
              setIsInVoiceSession(true);

              // Extract any additional command after the wake word
              const commandPart = transcript.replace(wakeWordResult.matchedWord.toLowerCase(), '').trim();

              if (onWakeWordDetected) {
                onWakeWordDetected({
                  wakeWord: wakeWordResult.matchedWord,
                  fullCommand: transcript,
                  additionalCommand: commandPart,
                  confidence: confidence,
                  similarity: wakeWordResult.confidence,
                  method: wakeWordResult.method,
                  originalWord: wakeWordResult.originalWord
                });
              }
            } else if (wakeWordResult.detected) {
              console.log(`⚠️ Wake word detected but speech confidence too low: ${confidence} < ${confidenceThreshold}`);
            } else {
              // Check if it's close but not quite there
              const bestMatch = wakeWords.reduce((best, word) => {
                const similarity = calculateSimilarity(transcript, word);
                return similarity > best.similarity ? { word, similarity } : best;
              }, { word: '', similarity: 0 });

              if (bestMatch.similarity > 0.4) {
                console.log(`⚠️ Close match: "${transcript}" is ${(bestMatch.similarity * 100).toFixed(0)}% similar to "${bestMatch.word}"`);
              }
            }
          } else {
            // During voice session, send all speech as messages
            if (transcript.length > 2) { // Ignore very short utterances
              console.log('🎤 Voice message during session:', transcript);

              // Send message to chatbot
              if (window.saytrixSendMessage) {
                window.saytrixSendMessage(transcript);
              }
            }
          }
        }
        }
      };

      recognitionRef.current.onerror = (event) => {
      console.error('🚨 Global voice recognition error:', event.error);
      
      if (event.error === 'not-allowed') {
        setError('Microphone access denied. Please allow microphone access for voice commands.');
      } else if (event.error === 'no-speech') {
        // This is normal, just restart
        console.log('🔄 No speech detected, restarting...');
      } else if (event.error === 'network') {
        setError('Network error. Voice commands may not work properly.');
      } else {
        setError(`Voice recognition error: ${event.error}`);
      }
      
      // Auto-restart after error (except for permission errors)
      if (event.error !== 'not-allowed' && isActiveRef.current && isEnabled) {
        scheduleRestart();
        }
      };

      recognitionRef.current.onend = () => {
      console.log('🛑 Global voice recognition ended');
      setIsListening(false);
      
      // Auto-restart if still enabled and active
      if (isActiveRef.current && isEnabled) {
        scheduleRestart();
        }
      };
    } else {
      console.error('❌ Failed to set event handlers: recognition instance is null');
      setIsSupported(false);
      setError('Failed to initialize speech recognition');
    }

    return () => {
      cleanup();
    };
  }, [wakeWords, onWakeWordDetected, isEnabled]);

  // Schedule restart with delay to prevent rapid restarts
  const scheduleRestart = useCallback(() => {
    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
    }
    
    restartTimeoutRef.current = setTimeout(() => {
      if (isActiveRef.current && isEnabled && recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (err) {
          console.warn('Failed to restart voice recognition:', err);
        }
      }
    }, 1000); // 1 second delay
  }, [isEnabled]);

  // Start listening
  const startListening = useCallback(() => {
    console.log('🎤 Attempting to start voice listening...');
    console.log('  - isSupported:', isSupported);
    console.log('  - isEnabled:', isEnabled);
    console.log('  - recognitionRef.current:', !!recognitionRef.current);
    console.log('  - isActiveRef.current:', isActiveRef.current);

    if (!isSupported) {
      console.warn('❌ Cannot start: Speech recognition not supported');
      return false;
    }

    if (!recognitionRef.current) {
      console.warn('❌ Cannot start: Recognition instance not available');
      return false;
    }

    if (!isEnabled) {
      console.warn('❌ Cannot start: Voice commands disabled');
      return false;
    }

    if (isActiveRef.current) {
      console.log('⚠️ Already active, stopping first...');
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.warn('Error stopping existing recognition:', e);
      }
      // Wait a bit before restarting
      setTimeout(() => {
        if (isEnabled && recognitionRef.current) {
          startListening();
        }
      }, 500);
      return false;
    }

    try {
      console.log('🚀 Starting voice recognition...');
      isActiveRef.current = true;
      recognitionRef.current.start();
      return true;
    } catch (err) {
      console.error('❌ Failed to start global voice recognition:', err);
      setError('Failed to start voice recognition: ' + err.message);
      isActiveRef.current = false;
      return false;
    }
  }, [isSupported, isEnabled]);

  // Stop listening
  const stopListening = useCallback(() => {
    isActiveRef.current = false;
    
    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
      restartTimeoutRef.current = null;
    }
    
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (err) {
        console.warn('Error stopping voice recognition:', err);
      }
    }
    
    setIsListening(false);
  }, []);

  // Cleanup function
  const cleanup = useCallback(() => {
    stopListening();
    
    if (recognitionRef.current) {
      recognitionRef.current.onstart = null;
      recognitionRef.current.onresult = null;
      recognitionRef.current.onerror = null;
      recognitionRef.current.onend = null;
      recognitionRef.current = null;
    }
  }, [stopListening]);

  // Auto-start/stop based on isEnabled
  useEffect(() => {
    console.log('🔄 Voice command auto-start effect triggered');
    console.log('  - isEnabled:', isEnabled);
    console.log('  - isSupported:', isSupported);
    console.log('  - Should start:', isEnabled && isSupported);

    if (isEnabled && isSupported) {
      console.log('✅ Conditions met, starting voice listening...');
      // Use a timeout to ensure the recognition is properly initialized
      setTimeout(() => {
        if (recognitionRef.current && !isActiveRef.current) {
          try {
            console.log('🚀 Starting voice recognition (auto-start)...');
            isActiveRef.current = true;
            recognitionRef.current.start();
          } catch (err) {
            console.error('❌ Auto-start failed:', err);
            setError('Auto-start failed: ' + err.message);
            isActiveRef.current = false;
          }
        }
      }, 100);
    } else {
      console.log('❌ Conditions not met, stopping voice listening...');
      isActiveRef.current = false;
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (err) {
          console.warn('Error stopping voice recognition:', err);
        }
      }
      setIsListening(false);
    }

    return () => {
      if (!isEnabled) {
        console.log('🛑 Cleanup: stopping voice listening');
        isActiveRef.current = false;
        if (recognitionRef.current) {
          try {
            recognitionRef.current.stop();
          } catch (err) {
            console.warn('Error in cleanup stop:', err);
          }
        }
      }
    };
  }, [isEnabled, isSupported]);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return {
    isListening,
    isSupported,
    error,
    lastCommand,
    confidence,
    isInVoiceSession,
    startListening,
    stopListening,
    endVoiceSession: () => setIsInVoiceSession(false),
    isEnabled: isEnabled && isSupported
  };
};

export default useGlobalVoiceCommand;
