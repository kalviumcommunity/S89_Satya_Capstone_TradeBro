/**
 * Global Speech Recognition Manager
 * Prevents conflicts between multiple speech recognition instances
 */

class SpeechRecognitionManager {
  constructor() {
    this.recognition = null;
    this.isListening = false;
    this.currentCallback = null;
    this.currentErrorCallback = null;
    this.isInitialized = false;
    this.initializeRecognition();
  }

  initializeRecognition() {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      console.warn('⚠️ Speech recognition not supported in this browser');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();
    
    // Configure recognition
    this.recognition.continuous = false;
    this.recognition.interimResults = false;
    this.recognition.lang = 'en-US';
    this.recognition.maxAlternatives = 1;

    // Set up event handlers
    this.recognition.onstart = () => {
      console.log('🎤 Global speech recognition started');
      this.isListening = true;
    };

    this.recognition.onresult = (event) => {
      if (event.results && event.results.length > 0) {
        const transcript = event.results[0][0].transcript;
        const confidence = event.results[0][0].confidence;
        console.log('🎤 Speech recognized:', transcript, 'Confidence:', confidence);
        
        if (this.currentCallback) {
          this.currentCallback(transcript, confidence);
        }
      }
      this.cleanup();
    };

    this.recognition.onerror = (event) => {
      console.error('❌ Global speech recognition error:', event.error);
      
      // Only log aborted errors, don't treat them as real errors
      if (event.error === 'aborted') {
        console.log('🔄 Speech recognition was aborted (this is normal when stopping manually)');
      } else {
        if (this.currentErrorCallback) {
          this.currentErrorCallback(event.error);
        }
      }
      this.cleanup();
    };

    this.recognition.onend = () => {
      console.log('🎤 Global speech recognition ended');
      this.cleanup();
    };

    this.isInitialized = true;
  }

  cleanup() {
    this.isListening = false;
    this.currentCallback = null;
    this.currentErrorCallback = null;
  }

  startListening(onResult, onError) {
    if (!this.isInitialized || !this.recognition) {
      console.error('❌ Speech recognition not initialized');
      if (onError) onError('not-supported');
      return false;
    }

    if (this.isListening) {
      console.log('🔄 Speech recognition already listening, stopping current session...');
      this.stopListening();
      
      // Wait a bit before starting new session
      setTimeout(() => {
        this.startListening(onResult, onError);
      }, 200);
      return false;
    }

    try {
      this.currentCallback = onResult;
      this.currentErrorCallback = onError;
      
      // Small delay to ensure any previous session is fully cleaned up
      setTimeout(() => {
        try {
          this.recognition.start();
          console.log('🎤 Starting global speech recognition...');
        } catch (startError) {
          console.error('❌ Error starting speech recognition:', startError);
          this.cleanup();
          if (onError) onError(startError.message);
        }
      }, 100);
      
      return true;
    } catch (error) {
      console.error('❌ Error preparing speech recognition:', error);
      this.cleanup();
      if (onError) onError(error.message);
      return false;
    }
  }

  stopListening() {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.abort(); // Use abort for immediate termination
        console.log('🛑 Stopping global speech recognition...');
      } catch (error) {
        console.error('❌ Error stopping speech recognition:', error);
      }
    }
    this.cleanup();
  }

  isCurrentlyListening() {
    return this.isListening;
  }

  isSupported() {
    return this.isInitialized && this.recognition !== null;
  }
}

// Create singleton instance
const speechRecognitionManager = new SpeechRecognitionManager();

export default speechRecognitionManager;
