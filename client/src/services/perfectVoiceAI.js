import { GoogleGenerativeAI } from '@google/generative-ai';

class PerfectVoiceAI {
  constructor() {
    this.geminiApiKey = 'AIzaSyD502Fqn3f0P1alBXYIDBfz7nIKflBdt80';
    this.genAI = null;
    this.model = null;
    this.isInitialized = false;
    this.isListening = false;
    this.isInVoiceSession = false;
    this.speechRecognition = null;
    this.speechSynthesis = window.speechSynthesis;
    
    // Voice settings
    this.voiceSettings = {
      rate: 0.9,
      pitch: 1.1,
      volume: 1.0,
      voice: null
    };
    
    // Context for maintaining conversation
    this.conversationContext = [];
    this.userProfile = {
      name: 'User',
      preferences: {},
      portfolio: [],
      watchlist: []
    };
    
    // Event callbacks
    this.onWakeWordDetected = null;
    this.onVoiceMessage = null;
    this.onAIResponse = null;
    this.onError = null;
    this.onStatusChange = null;
    
    // Wake words with enhanced detection
    this.wakeWords = [
      'saytrix', 'say trix', 'citrix', 'citric', 'say tricks', 
      'say trics', 'saitrix', 'saytrics', 'computer', 'hey saytrix'
    ];
    
    this.initialize();
  }

  async initialize() {
    try {
      console.log('🚀 Initializing Perfect Voice AI with Gemini AI...');

      // Initialize Gemini AI directly
      console.log('🔄 Initializing client-side Gemini AI...');
      this.genAI = new GoogleGenerativeAI(this.geminiApiKey);
      this.model = this.genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
        systemInstruction: `You are Saytrix, an intelligent AI trading assistant for TradeBro platform. You help users with:
        - Stock market analysis and insights
        - Portfolio management advice
        - Trading strategies and recommendations
        - Market news and trends
        - Financial education

        Keep responses concise, helpful, and focused on trading/finance. Use a friendly but professional tone.
        Always prioritize user safety and remind them that trading involves risks.`
      });
      
      // Initialize speech recognition
      await this.initializeSpeechRecognition();
      
      // Initialize speech synthesis
      this.initializeSpeechSynthesis();
      
      this.isInitialized = true;
      console.log('✅ Perfect Voice AI initialized successfully');
      
      if (this.onStatusChange) {
        this.onStatusChange('initialized', 'Perfect Voice AI ready');
      }
      
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize Perfect Voice AI:', error);
      if (this.onError) {
        this.onError(`Initialization failed: ${error.message}`);
      }
      return false;
    }
  }

  async initializeSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      throw new Error('Speech Recognition not supported in this browser');
    }
    
    this.speechRecognition = new SpeechRecognition();
    this.speechRecognition.continuous = true;
    this.speechRecognition.interimResults = true;
    this.speechRecognition.lang = 'en-US';
    this.speechRecognition.maxAlternatives = 5;
    
    this.speechRecognition.onstart = () => {
      console.log('🎤 Speech recognition started');
      this.isListening = true;
      if (this.onStatusChange) {
        this.onStatusChange('listening', 'Listening for voice commands');
      }
    };
    
    this.speechRecognition.onresult = (event) => {
      this.handleSpeechResult(event);
    };
    
    this.speechRecognition.onerror = (event) => {
      console.error('❌ Speech recognition error:', event.error);
      if (this.onError) {
        this.onError(`Speech recognition error: ${event.error}`);
      }

      // Auto-restart on certain errors, but avoid restarting if already running
      if (event.error !== 'not-allowed' && event.error !== 'aborted' && this.isListening) {
        setTimeout(() => {
          if (this.isListening && !this.isRecognitionActive()) {
            try {
              this.speechRecognition.start();
            } catch (startError) {
              console.warn('⚠️ Failed to restart speech recognition:', startError.message);
            }
          }
        }, 1000);
      }
    };
    
    this.speechRecognition.onend = () => {
      console.log('🛑 Speech recognition ended');

      // Auto-restart if still supposed to be listening
      if (this.isListening) {
        setTimeout(() => {
          if (this.isListening && !this.isRecognitionActive()) {
            try {
              this.speechRecognition.start();
            } catch (startError) {
              console.warn('⚠️ Failed to restart speech recognition:', startError.message);
            }
          }
        }, 1000);
      }
    };
  }

  initializeSpeechSynthesis() {
    // Get available voices and select the best one
    const voices = this.speechSynthesis.getVoices();
    
    // Prefer female voices with good quality
    const preferredVoices = [
      'Google UK English Female',
      'Microsoft Zira Desktop',
      'Google US English',
      'Microsoft David Desktop'
    ];
    
    for (const voiceName of preferredVoices) {
      const voice = voices.find(v => v.name.includes(voiceName));
      if (voice) {
        this.voiceSettings.voice = voice;
        break;
      }
    }
    
    // Fallback to first available voice
    if (!this.voiceSettings.voice && voices.length > 0) {
      this.voiceSettings.voice = voices[0];
    }
    
    console.log('🔊 Speech synthesis initialized with voice:', this.voiceSettings.voice?.name || 'Default');
  }

  // Helper method to check if recognition is active
  isRecognitionActive() {
    if (!this.speechRecognition) {
      return false;
    }

    // Check various states that indicate active recognition
    try {
      // Some browsers don't have readyState property
      if (this.speechRecognition.readyState !== undefined) {
        return this.speechRecognition.readyState === 'listening';
      }

      // Fallback: check if we can start (if we can't, it's probably already running)
      const testRecognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
      testRecognition.start();
      testRecognition.stop();
      return false; // If we got here, no other recognition is running
    } catch (error) {
      if (error.name === 'InvalidStateError') {
        return true; // Another recognition is already running
      }
      return false;
    }
  }

  async startListening() {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (this.isListening) {
      console.log('⚠️ Already listening');
      return;
    }

    try {
      // Check if recognition is already active
      if (this.isRecognitionActive()) {
        console.log('🔄 Speech recognition already active, skipping start');
        this.isListening = true;
        return;
      }

      console.log('🎤 Starting voice listening...');
      this.isListening = true;

      // Add a small delay to prevent conflicts and check again
      setTimeout(() => {
        if (this.isListening && this.speechRecognition && !this.isRecognitionActive()) {
          try {
            this.speechRecognition.start();
          } catch (startError) {
            if (startError.name === 'InvalidStateError') {
              console.log('🔄 Speech recognition already started by another process');
              // Don't throw error, just update state
              this.isListening = true;
            } else {
              throw startError;
            }
          }
        }
      }, 100);
    } catch (error) {
      console.error('❌ Failed to start listening:', error);
      if (this.onError) {
        this.onError(`Failed to start listening: ${error.message}`);
      }

      // Handle specific error cases
      if (error.name === 'InvalidStateError') {
        console.log('🔄 Speech recognition already running, updating state');
        this.isListening = true;
      } else {
        this.isListening = false;
      }
    }
  }

  async stopListening() {
    if (!this.isListening) {
      console.log('⚠️ Not currently listening');
      return;
    }
    
    try {
      console.log('🛑 Stopping voice listening...');
      this.isListening = false;
      this.speechRecognition.stop();
      
      if (this.onStatusChange) {
        this.onStatusChange('stopped', 'Voice listening stopped');
      }
    } catch (error) {
      console.error('❌ Failed to stop listening:', error);
    }
  }

  handleSpeechResult(event) {
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const result = event.results[i];
      const transcript = result[0].transcript.toLowerCase().trim();
      const confidence = result[0].confidence || 0.8;
      const isFinal = result.isFinal;
      
      if (isFinal) {
        console.log(`🎯 Speech final: "${transcript}" (confidence: ${confidence.toFixed(2)})`);
        
        if (!this.isInVoiceSession) {
          // Check for wake words
          const wakeWordResult = this.detectWakeWord(transcript);
          
          if (wakeWordResult.detected && confidence >= 0.3) {
            console.log(`🎉 Wake word detected: ${wakeWordResult.matchedWord}`);
            this.handleWakeWordDetection({
              wakeWord: 'saytrix',
              originalWakeWord: wakeWordResult.matchedWord,
              confidence: wakeWordResult.confidence,
              method: 'perfect-voice-ai',
              fullCommand: transcript,
              speechConfidence: confidence
            });
          }
        } else {
          // In voice session - process as voice message
          if (transcript.length > 2) {
            console.log(`💬 Voice message: "${transcript}"`);
            this.processVoiceCommand(transcript);
          }
        }
      }
    }
  }

  detectWakeWord(transcript) {
    const lowerTranscript = transcript.toLowerCase().trim();
    
    // Direct match
    for (const wakeWord of this.wakeWords) {
      if (lowerTranscript.includes(wakeWord)) {
        return {
          detected: true,
          matchedWord: wakeWord,
          confidence: 1.0,
          method: 'direct'
        };
      }
    }
    
    // Fuzzy matching
    const words = lowerTranscript.split(' ');
    for (const word of words) {
      for (const wakeWord of this.wakeWords) {
        const similarity = this.calculateSimilarity(word, wakeWord);
        if (similarity >= 0.7) {
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
    
    return { detected: false };
  }

  calculateSimilarity(str1, str2) {
    const matrix = [];
    const len1 = str1.length;
    const len2 = str2.length;
    
    for (let i = 0; i <= len2; i++) matrix[i] = [i];
    for (let j = 0; j <= len1; j++) matrix[0][j] = j;
    
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
  }

  handleWakeWordDetection(wakeWordData) {
    console.log('🎯 Wake word detected by Perfect Voice AI:', wakeWordData);
    
    // Enter voice session mode
    this.isInVoiceSession = true;
    
    if (this.onWakeWordDetected) {
      this.onWakeWordDetected(wakeWordData);
    }
    
    // Speak greeting
    const greetings = [
      "Hello! I'm Saytrix, your AI trading assistant powered by Gemini. How can I help you today?",
      "Hi there! Saytrix here, ready to assist with your trading and market questions using advanced AI!",
      "Great! I'm listening. What would you like to know about the markets? I'm powered by Gemini AI to give you the best insights.",
      "Perfect! Saytrix is now active. Ask me anything about stocks, trading, or your portfolio - I'm here to help with intelligent analysis!"
    ];
    
    const greeting = greetings[Math.floor(Math.random() * greetings.length)];
    this.speakLegacy(greeting);
    
    if (this.onStatusChange) {
      this.onStatusChange('wake-word-detected', `Wake word "${wakeWordData.wakeWord}" detected`);
    }
  }

  async processVoiceCommand(command) {
    try {
      console.log(`🤖 Processing voice command: "${command}"`);
      
      // Check for end commands
      if (this.isEndCommand(command)) {
        await this.endVoiceSession();
        return;
      }
      
      // Add to conversation context
      this.conversationContext.push({
        role: 'user',
        content: command,
        timestamp: new Date().toISOString()
      });
      
      // Generate AI response
      const aiResponse = await this.generateAIResponse(command);
      
      // Add AI response to context
      this.conversationContext.push({
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date().toISOString()
      });
      
      // Speak the response with perfect audio
      await this.speakLegacy(aiResponse);
      
      if (this.onAIResponse) {
        this.onAIResponse({
          userCommand: command,
          aiResponse: aiResponse,
          timestamp: new Date().toISOString()
        });
      }
      
    } catch (error) {
      console.error('❌ Error processing voice command:', error);
      const errorResponse = "I'm sorry, I encountered an error processing your request. Could you please try again?";

      try {
        await this.speakLegacy(errorResponse);
      } catch (speechError) {
        console.error('❌ Error speaking error message:', speechError);
      }

      if (this.onError) {
        this.onError(`Command processing error: ${error.message}`);
      }
    }
  }

  async generateAIResponse(userInput) {
    try {
      console.log('🔄 Generating AI response with Gemini AI...');

      if (!this.model) {
        throw new Error('Gemini AI model not initialized');
      }

      // Prepare conversation history for Gemini
      const chatHistory = this.conversationContext.slice(-10).map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      }));

      // Create chat session with history
      const chat = this.model.startChat({
        history: chatHistory,
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 200, // Keep responses concise for voice
        },
      });

      // Generate response
      const result = await chat.sendMessage(userInput);
      const response = await result.response;
      const aiResponse = response.text();

      console.log('✅ AI Response from Gemini:', aiResponse);
      return aiResponse;

    } catch (error) {
      console.error('❌ Error generating AI response with Gemini:', error);
      console.error('❌ Error details:', error.message);

      // Fallback to local responses
      return this.generateFallbackResponse(userInput);
    }
  }

  generateFallbackResponse(userInput) {
    const input = userInput.toLowerCase();

    // Enhanced fallback responses with more trading context
    if (input.includes('price') || input.includes('stock') || input.includes('quote')) {
      return "I can help you check stock prices and quotes. Please specify which stock you're interested in, and I'll get the latest market information for you.";
    } else if (input.includes('portfolio') || input.includes('holdings')) {
      return "I can assist with portfolio analysis and management. Would you like me to review your current holdings, calculate returns, or suggest optimization strategies?";
    } else if (input.includes('market') || input.includes('nifty') || input.includes('sensex') || input.includes('index')) {
      return "The Indian markets are quite dynamic today. I can provide you with the latest market updates, index movements, and sector analysis. What specific information would you like?";
    } else if (input.includes('buy') || input.includes('sell') || input.includes('trade')) {
      return "For trading decisions, I recommend analyzing the stock's fundamentals, technical indicators, and market trends. Would you like me to help you evaluate a specific stock or trading strategy?";
    } else if (input.includes('news') || input.includes('update')) {
      return "I can provide you with the latest market news and updates. Would you like general market news or information about specific stocks or sectors?";
    } else if (input.includes('analysis') || input.includes('research')) {
      return "I can help with stock analysis and market research. Please specify which company or sector you'd like me to analyze for you.";
    } else if (input.includes('help') || input.includes('what can you do')) {
      return "I'm Saytrix, your AI trading assistant. I can help with stock prices, portfolio analysis, market news, trading strategies, and financial education. What would you like to explore?";
    } else {
      return "I'm here to help with all your trading and investment questions. You can ask me about stock prices, market analysis, portfolio management, or trading strategies. What would you like to know?";
    }
  }

  isEndCommand(command) {
    const endCommands = ['goodbye', 'bye', 'stop', 'exit', 'end', 'quit', 'thank you', 'thanks'];
    const lowerCommand = command.toLowerCase();
    return endCommands.some(cmd => lowerCommand.includes(cmd));
  }

  async endVoiceSession() {
    console.log('🔚 Ending voice session');
    this.isInVoiceSession = false;

    const farewells = [
      "Goodbye! Feel free to say Saytrix anytime to start a new conversation.",
      "Thanks for using Saytrix! I'm always here when you need market insights.",
      "Have a great trading day! Say Saytrix whenever you need assistance.",
      "Farewell! Remember, I'm just a voice command away for all your trading questions."
    ];

    const farewell = farewells[Math.floor(Math.random() * farewells.length)];

    try {
      await this.speakLegacy(farewell);
    } catch (error) {
      console.error('❌ Error speaking farewell message:', error);
    }

    if (this.onStatusChange) {
      this.onStatusChange('session-ended', 'Voice session ended');
    }
  }

  // Enhanced speak method for perfect audio functionality
  speakLegacy(text) {
    return new Promise((resolve, reject) => {
      try {
        if (!text || !this.speechSynthesis) {
          console.warn('⚠️ PerfectVoiceAI: No text or speech synthesis not available');
          resolve();
          return;
        }

        // Clean the text for better speech synthesis
        const cleanText = text
          .replace(/[*#`]/g, '') // Remove markdown
          .replace(/\n+/g, '. ') // Replace newlines with periods
          .replace(/\s+/g, ' ') // Normalize spaces
          .replace(/₹/g, 'rupees') // Convert currency symbol to word
          .replace(/\$/g, 'dollars') // Convert currency symbol to word
          .replace(/\%/g, 'percent') // Convert percentage symbol to word
          .trim();

        if (!cleanText) {
          console.warn('⚠️ PerfectVoiceAI: No clean text available for speech');
          resolve();
          return;
        }

        console.log('🔊 PerfectVoiceAI attempting to speak:', cleanText.substring(0, 100) + '...');

        // Cancel any ongoing speech first to prevent conflicts
        if (this.speechSynthesis.speaking || this.speechSynthesis.pending) {
          this.speechSynthesis.cancel();
          // Wait a bit before starting new speech
          setTimeout(() => this.speakTextPerfect(cleanText, resolve, reject), 300);
          return;
        }

        this.speakTextPerfect(cleanText, resolve, reject);

      } catch (error) {
        console.error('❌ PerfectVoiceAI error in speech synthesis:', error);
        reject(error);
      }
    });
  }

  speakTextPerfect(cleanText, resolve, reject) {
    try {
      const utterance = new SpeechSynthesisUtterance(cleanText);

      // Enhanced voice settings for better quality
      utterance.rate = this.voiceSettings.rate || 0.9;
      utterance.pitch = this.voiceSettings.pitch || 1.0;
      utterance.volume = this.voiceSettings.volume || 0.8;

      // Try to use a high-quality voice
      const voices = this.speechSynthesis.getVoices();
      let selectedVoice = this.voiceSettings.voice;

      if (!selectedVoice && voices.length > 0) {
        // Prefer English voices with good quality
        selectedVoice = voices.find(voice =>
          voice.lang.startsWith('en') &&
          (voice.name.includes('Google') || voice.name.includes('Microsoft') || voice.name.includes('Natural'))
        ) || voices.find(voice => voice.lang.startsWith('en')) || voices[0];

        this.voiceSettings.voice = selectedVoice;
      }

      if (selectedVoice) {
        utterance.voice = selectedVoice;
        console.log('🎤 PerfectVoiceAI using voice:', selectedVoice.name);
      }

      utterance.onstart = () => {
        console.log('🔊 PerfectVoiceAI started speaking');
      };

      utterance.onend = () => {
        console.log('✅ PerfectVoiceAI speech completed successfully');
        if (resolve) resolve();
      };

      utterance.onerror = (event) => {
        // Suppress interrupted errors as they're expected when canceling speech
        if (event.error === 'interrupted' || event.error === 'canceled') {
          console.log('🔄 PerfectVoiceAI speech was interrupted (normal behavior)');
          if (resolve) resolve();
          return;
        }
        console.error('❌ PerfectVoiceAI speech synthesis error:', event.error);
        if (reject) reject(new Error(event.error));
      };

      // Ensure speech synthesis is ready
      if (this.speechSynthesis.getVoices().length === 0) {
        // Wait for voices to load
        this.speechSynthesis.addEventListener('voiceschanged', () => {
          this.speechSynthesis.speak(utterance);
          console.log('🎯 PerfectVoiceAI speech synthesis initiated (after voices loaded)');
        }, { once: true });
      } else {
        this.speechSynthesis.speak(utterance);
        console.log('🎯 PerfectVoiceAI speech synthesis initiated');
      }

    } catch (error) {
      console.error('❌ PerfectVoiceAI error in speakTextPerfect:', error);
      if (reject) reject(error);
    }
  }

  // Event handler setters
  setOnWakeWordDetected(callback) { this.onWakeWordDetected = callback; }
  setOnVoiceMessage(callback) { this.onVoiceMessage = callback; }
  setOnAIResponse(callback) { this.onAIResponse = callback; }
  setOnError(callback) { this.onError = callback; }
  setOnStatusChange(callback) { this.onStatusChange = callback; }

  // Getters
  getIsInitialized() { return this.isInitialized; }
  getIsListening() { return this.isListening; }
  getIsInVoiceSession() { return this.isInVoiceSession; }
  getConversationContext() { return this.conversationContext; }

  // Update user profile
  updateUserProfile(profile) {
    this.userProfile = { ...this.userProfile, ...profile };
  }

  // Clear conversation context
  clearContext() {
    this.conversationContext = [];
  }

  // Voice Settings Methods for VoiceSettings component compatibility
  getVoices() {
    if (!this.speechSynthesis) {
      return [];
    }
    return this.speechSynthesis.getVoices();
  }

  getPreferredVoice() {
    return this.voiceSettings.voice;
  }

  setPreferredVoice(voiceName) {
    const voices = this.getVoices();
    const voice = voices.find(v => v.name === voiceName);
    if (voice) {
      this.voiceSettings.voice = voice;
      console.log('🎤 Voice changed to:', voice.name);
    }
  }

  setSettings(settings) {
    this.voiceSettings = { ...this.voiceSettings, ...settings };
    console.log('🔧 Voice settings updated:', this.voiceSettings);
  }

  stop() {
    if (this.speechSynthesis && (this.speechSynthesis.speaking || this.speechSynthesis.pending)) {
      this.speechSynthesis.cancel();
      console.log('🛑 Speech synthesis stopped');
    }
  }

  // Enhanced speak method with options for VoiceSettings compatibility
  async speak(text, options = {}) {
    return new Promise((resolve, reject) => {
      try {
        if (!text || !this.speechSynthesis) {
          console.warn('⚠️ PerfectVoiceAI: No text or speech synthesis not available');
          resolve();
          return;
        }

        // Clean the text for better speech synthesis
        const cleanText = text
          .replace(/[*#`]/g, '') // Remove markdown
          .replace(/\n+/g, '. ') // Replace newlines with periods
          .replace(/\s+/g, ' ') // Normalize spaces
          .trim();

        if (!cleanText) {
          console.warn('⚠️ PerfectVoiceAI: No clean text available for speech');
          resolve();
          return;
        }

        console.log('🔊 PerfectVoiceAI attempting to speak:', cleanText.substring(0, 100) + '...');

        // Cancel any ongoing speech first to prevent conflicts
        if (this.speechSynthesis.speaking || this.speechSynthesis.pending) {
          this.speechSynthesis.cancel();
          // Wait a bit before starting new speech
          setTimeout(() => this.speakTextWithOptions(cleanText, options, resolve, reject), 200);
          return;
        }

        this.speakTextWithOptions(cleanText, options, resolve, reject);

      } catch (error) {
        console.error('❌ PerfectVoiceAI error in speech synthesis:', error);
        reject(error);
      }
    });
  }

  speakTextWithOptions(cleanText, options, resolve, reject) {
    try {
      const utterance = new SpeechSynthesisUtterance(cleanText);

      // Use options if provided, otherwise use default settings
      utterance.rate = options.rate || this.voiceSettings.rate;
      utterance.pitch = options.pitch || this.voiceSettings.pitch;
      utterance.volume = options.volume || this.voiceSettings.volume;

      if (this.voiceSettings.voice) {
        utterance.voice = this.voiceSettings.voice;
        console.log('🎤 PerfectVoiceAI using voice:', this.voiceSettings.voice.name);
      }

      utterance.onstart = () => {
        console.log('🔊 PerfectVoiceAI started speaking');
      };

      utterance.onend = () => {
        console.log('✅ PerfectVoiceAI speech completed');
        if (options.onEnd) options.onEnd();
        resolve();
      };

      utterance.onerror = (event) => {
        // Suppress interrupted errors as they're expected when canceling speech
        if (event.error === 'interrupted' || event.error === 'canceled') {
          console.log('🔄 PerfectVoiceAI speech was interrupted (normal behavior)');
          resolve();
          return;
        }
        console.error('❌ PerfectVoiceAI speech synthesis error:', event.error);
        if (options.onError) options.onError(event);
        reject(new Error(event.error));
      };

      this.speechSynthesis.speak(utterance);
      console.log('🎯 PerfectVoiceAI speech synthesis initiated');

    } catch (error) {
      console.error('❌ PerfectVoiceAI error in speakTextWithOptions:', error);
      reject(error);
    }
  }

  // Test Gemini AI connection
  async testGeminiConnection() {
    try {
      if (!this.model) {
        throw new Error('Gemini AI model not initialized');
      }

      const testPrompt = "Say 'Hello, I am Saytrix AI assistant' in a brief response.";
      const result = await this.model.generateContent(testPrompt);
      const response = await result.response;
      const text = response.text();

      console.log('✅ Gemini AI test successful:', text);
      return { success: true, response: text };
    } catch (error) {
      console.error('❌ Gemini AI test failed:', error);
      return { success: false, error: error.message };
    }
  }

  // Get service status
  getServiceStatus() {
    return {
      initialized: this.isInitialized,
      listening: this.isListening,
      inVoiceSession: this.isInVoiceSession,
      conversationLength: this.conversationContext.length,
      voiceSettings: this.voiceSettings,
      geminiModel: this.model ? '✅ Initialized' : '❌ Not initialized',
      apiKeys: {
        gemini: this.geminiApiKey ? '✅ Set' : '❌ Missing'
      }
    };
  }
}

// Create singleton instance
const perfectVoiceAI = new PerfectVoiceAI();

export default perfectVoiceAI;
