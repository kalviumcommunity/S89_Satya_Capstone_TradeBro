/**
 * Enhanced Message Validator for Stock Trading Assistant
 * Validates user inputs, detects intent, and provides smart suggestions
 */
class MessageValidator {
  constructor() {
    this.initializeValidationRules();
    this.initializeIntentPatterns();
  }

  /**
   * Initialize validation rules and patterns
   */
  initializeValidationRules() {
    this.validationRules = {
      minLength: 2,
      maxLength: 1000,
      allowedCharacters: /^[\w\s\-.,!?@#$%&*()+=[\]{}|;:'"<>/\\`~₹]+$/,
      suspiciousPatterns: [
        /(?:hack|crack|exploit|vulnerability)/i,
        /(?:password|login|credential)/i,
        /(?:spam|scam|fraud)/i,
        /(?:virus|malware|trojan)/i
      ],
      spamPatterns: [
        /(.)\1{10,}/, // Repeated characters
        /[A-Z]{20,}/, // Excessive caps
        /[!@#$%^&*]{5,}/, // Excessive special chars
      ]
    };
  }

  /**
   * Initialize intent detection patterns
   */
  initializeIntentPatterns() {
    this.intentPatterns = {
      stockQuery: {
        patterns: [
          /(?:price|quote|value|cost|worth)\s+(?:of\s+)?([A-Z]{2,10}|[a-zA-Z\s]+)/i,
          /(?:what|how|tell|show|give)\s+(?:is|me|about)?\s*(?:the\s+)?(?:price|quote|value|cost|worth)\s+(?:of\s+)?([A-Z]{2,10}|[a-zA-Z\s]+)/i,
          /([A-Z]{2,10})\s+(?:stock|share|price|quote|data|info|information)/i,
          /(?:stock|share|company)\s+([A-Z]{2,10}|[a-zA-Z\s]+)/i
        ],
        confidence: 0.9
      },
      
      comparison: {
        patterns: [
          /(?:compare|vs|versus|difference)\s+([A-Z]{2,10}|[a-zA-Z\s]+)\s+(?:and|with|vs|versus)\s+([A-Z]{2,10}|[a-zA-Z\s]+)/i,
          /([A-Z]{2,10}|[a-zA-Z\s]+)\s+(?:vs|versus|compared to)\s+([A-Z]{2,10}|[a-zA-Z\s]+)/i
        ],
        confidence: 0.95
      },
      
      topMovers: {
        patterns: [
          /(?:top|best|highest)\s+(?:gainers?|winners?|performers?)/i,
          /(?:top|worst|biggest)\s+(?:losers?|decliners?)/i,
          /(?:market\s+)?(?:movers?|leaders?)/i,
          /(?:stocks?\s+)?(?:up|down)\s+(?:today|most)/i
        ],
        confidence: 0.85
      },
      
      news: {
        patterns: [
          /(?:news|updates?|headlines?)\s+(?:about|for|on)?\s*([A-Z]{2,10}|[a-zA-Z\s]+)?/i,
          /(?:latest|recent|current)\s+(?:news|updates?|headlines?)/i,
          /(?:market|stock)\s+(?:news|updates?)/i
        ],
        confidence: 0.8
      },
      
      educational: {
        patterns: [
          /(?:what\s+is|explain|define|meaning\s+of)\s+([a-zA-Z\s]+)/i,
          /(?:how\s+(?:to|does)|why\s+(?:is|does))\s+([a-zA-Z\s]+)/i,
          /(?:learn|understand|know)\s+(?:about\s+)?([a-zA-Z\s]+)/i,
          /(?:pe\s+ratio|market\s+cap|eps|dividend|beta|volatility)/i
        ],
        confidence: 0.75
      },
      
      greeting: {
        patterns: [
          /^(?:hi|hello|hey|good\s+(?:morning|afternoon|evening)|namaste)/i,
          /^(?:how\s+are\s+you|what's\s+up|sup)/i
        ],
        confidence: 0.9
      },
      
      help: {
        patterns: [
          /(?:help|assist|support|guide)/i,
          /(?:what\s+can\s+you\s+do|how\s+to\s+use)/i,
          /(?:commands?|features?|options?)/i
        ],
        confidence: 0.8
      }
    };

    // Hindi patterns
    this.hindiIntentPatterns = {
      stockQuery: {
        patterns: [
          /(?:कीमत|भाव|दाम|मूल्य)\s+([A-Z]{2,10}|[a-zA-Z\s]+)/i,
          /([A-Z]{2,10}|[a-zA-Z\s]+)\s+(?:का|की|के)\s+(?:कीमत|भाव|दाम|मूल्य)/i
        ],
        confidence: 0.9
      },
      
      greeting: {
        patterns: [
          /^(?:नमस्ते|हैलो|हाय|प्रणाम)/i,
          /^(?:कैसे\s+हैं|क्या\s+हाल)/i
        ],
        confidence: 0.9
      }
    };
  }

  /**
   * Validate user message comprehensively
   */
  validateMessage(userMessage, userId = null) {
    const validation = {
      isValid: true,
      errors: [],
      warnings: [],
      intent: null,
      confidence: 0,
      suggestions: [],
      language: 'en',
      sanitizedMessage: userMessage
    };

    try {
      // Basic validation
      this.performBasicValidation(userMessage, validation);
      
      if (!validation.isValid) {
        return validation;
      }

      // Detect language
      validation.language = this.detectLanguage(userMessage);

      // Sanitize message
      validation.sanitizedMessage = this.sanitizeMessage(userMessage);

      // Detect intent
      const intentResult = this.detectIntent(validation.sanitizedMessage, validation.language);
      validation.intent = intentResult.intent;
      validation.confidence = intentResult.confidence;
      validation.extractedData = intentResult.extractedData;

      // Generate suggestions
      validation.suggestions = this.generateSuggestions(validation.intent, validation.sanitizedMessage);

      // Security checks
      this.performSecurityChecks(userMessage, validation);

      return validation;
    } catch (error) {
      console.error('Error in message validation:', error);
      validation.isValid = false;
      validation.errors.push('Validation error occurred');
      return validation;
    }
  }

  /**
   * Perform basic message validation
   */
  performBasicValidation(message, validation) {
    // Check if message exists
    if (!message || typeof message !== 'string') {
      validation.isValid = false;
      validation.errors.push('Message is required and must be a string');
      return;
    }

    // Check length
    const trimmedMessage = message.trim();
    if (trimmedMessage.length < this.validationRules.minLength) {
      validation.isValid = false;
      validation.errors.push(`Message too short. Minimum ${this.validationRules.minLength} characters required.`);
      return;
    }

    if (trimmedMessage.length > this.validationRules.maxLength) {
      validation.isValid = false;
      validation.errors.push(`Message too long. Maximum ${this.validationRules.maxLength} characters allowed.`);
      return;
    }

    // Check for spam patterns
    for (const pattern of this.validationRules.spamPatterns) {
      if (pattern.test(trimmedMessage)) {
        validation.isValid = false;
        validation.errors.push('Message appears to be spam');
        return;
      }
    }
  }

  /**
   * Detect user intent from message
   */
  detectIntent(message, language = 'en') {
    const patterns = language === 'hi' ? 
      { ...this.intentPatterns, ...this.hindiIntentPatterns } : 
      this.intentPatterns;

    let bestMatch = { intent: 'general', confidence: 0 };

    for (const [intentName, intentData] of Object.entries(patterns)) {
      for (const pattern of intentData.patterns) {
        const match = message.match(pattern);
        if (match) {
          const confidence = intentData.confidence * this.calculateMatchQuality(match, message);
          if (confidence > bestMatch.confidence) {
            bestMatch = {
              intent: intentName,
              confidence,
              extractedData: this.extractDataFromMatch(match, intentName)
            };
          }
        }
      }
    }

    return bestMatch;
  }

  /**
   * Calculate match quality based on various factors
   */
  calculateMatchQuality(match, message) {
    let quality = 1.0;

    // Reduce quality if match is very small compared to message
    const matchLength = match[0].length;
    const messageLength = message.length;
    const coverage = matchLength / messageLength;
    
    if (coverage < 0.3) {
      quality *= 0.8;
    }

    // Boost quality if match is at the beginning or end
    const matchIndex = message.indexOf(match[0]);
    if (matchIndex === 0 || matchIndex + matchLength === messageLength) {
      quality *= 1.1;
    }

    return Math.min(quality, 1.0);
  }

  /**
   * Extract relevant data from regex matches
   */
  extractDataFromMatch(match, intent) {
    const extracted = {};

    switch (intent) {
      case 'stockQuery':
        if (match[1]) {
          extracted.symbol = match[1].trim().toUpperCase();
        }
        break;
      
      case 'comparison':
        if (match[1] && match[2]) {
          extracted.symbol1 = match[1].trim().toUpperCase();
          extracted.symbol2 = match[2].trim().toUpperCase();
        }
        break;
      
      case 'news':
        if (match[1]) {
          extracted.symbol = match[1].trim().toUpperCase();
        }
        break;
      
      case 'educational':
        if (match[1]) {
          extracted.topic = match[1].trim().toLowerCase();
        }
        break;
    }

    return extracted;
  }

  /**
   * Detect language from message
   */
  detectLanguage(message) {
    // Check for Hindi characters
    const hindiPattern = /[\u0900-\u097F]/;
    if (hindiPattern.test(message)) {
      return 'hi';
    }

    // Check for common Hindi words in Roman script
    const hindiRomanWords = /\b(?:kya|hai|ka|ki|ke|me|se|ko|stock|share|price|keemat|bhav)\b/i;
    if (hindiRomanWords.test(message)) {
      return 'hi';
    }

    return 'en';
  }

  /**
   * Sanitize message for processing
   */
  sanitizeMessage(message) {
    return message
      .trim()
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/[^\w\s\-.,!?@#$%&*()+=[\]{}|;:'"<>/\\`~₹]/g, '') // Remove unwanted chars
      .substring(0, this.validationRules.maxLength); // Ensure max length
  }

  /**
   * Perform security checks
   */
  performSecurityChecks(message, validation) {
    // Check for suspicious patterns
    for (const pattern of this.validationRules.suspiciousPatterns) {
      if (pattern.test(message)) {
        validation.warnings.push('Message contains potentially suspicious content');
        break;
      }
    }

    // Check for potential injection attempts
    const injectionPatterns = [
      /<script|javascript:|data:/i,
      /union\s+select|drop\s+table|insert\s+into/i,
      /\$\{|\#\{|<%|%>/
    ];

    for (const pattern of injectionPatterns) {
      if (pattern.test(message)) {
        validation.isValid = false;
        validation.errors.push('Message contains potentially malicious content');
        return;
      }
    }
  }

  /**
   * Generate helpful suggestions based on intent
   */
  generateSuggestions(intent, message) {
    const suggestions = [];

    switch (intent) {
      case 'general':
        suggestions.push(
          'Try asking about a specific stock: "RELIANCE price"',
          'Get market movers: "top gainers today"',
          'Compare stocks: "TCS vs INFY"',
          'Get news: "latest market news"'
        );
        break;
      
      case 'stockQuery':
        suggestions.push(
          'You can also ask for comparisons: "AAPL vs GOOGL"',
          'Get news for this stock: "AAPL news"',
          'Learn about metrics: "what is P/E ratio"'
        );
        break;
      
      case 'help':
        suggestions.push(
          'Stock prices: "RELIANCE price"',
          'Market movers: "top gainers"',
          'Stock comparison: "TCS vs INFY"',
          'Market news: "latest news"',
          'Learn: "what is market cap"'
        );
        break;
    }

    return suggestions;
  }

  /**
   * Extract all potential stock symbols from message
   */
  extractAllSymbols(message) {
    const symbols = [];
    const symbolPatterns = [
      /\b([A-Z]{2,10})\b/g,
      /\b([A-Z]+\.[A-Z]{2,3})\b/g,
      /\b([A-Z]+-[A-Z]+)\b/g
    ];

    for (const pattern of symbolPatterns) {
      let match;
      while ((match = pattern.exec(message)) !== null) {
        const symbol = match[1];
        if (this.validateStockSymbol(symbol).valid && !this.isCommonWord(symbol)) {
          symbols.push(symbol);
        }
      }
    }

    return [...new Set(symbols)]; // Remove duplicates
  }

  /**
   * Validate stock symbol format
   */
  validateStockSymbol(symbol) {
    if (!symbol || typeof symbol !== 'string') {
      return { valid: false, error: 'Symbol must be a string' };
    }

    const cleanSymbol = symbol.trim().toUpperCase();
    
    if (cleanSymbol.length < 1 || cleanSymbol.length > 15) {
      return { valid: false, error: 'Symbol must be 1-15 characters long' };
    }

    if (!/^[A-Z0-9.-]+$/.test(cleanSymbol)) {
      return { valid: false, error: 'Symbol contains invalid characters' };
    }

    return { valid: true, symbol: cleanSymbol };
  }

  /**
   * Check if word is a common English word (not a stock symbol)
   */
  isCommonWord(word) {
    const commonWords = [
      'THE', 'AND', 'OR', 'BUT', 'FOR', 'WITH', 'TO', 'FROM', 'BY', 'AT',
      'IN', 'ON', 'OF', 'IS', 'ARE', 'WAS', 'WERE', 'BEEN', 'HAVE', 'HAS',
      'HAD', 'DO', 'DOES', 'DID', 'WILL', 'WOULD', 'COULD', 'SHOULD',
      'CAN', 'MAY', 'MIGHT', 'MUST', 'SHALL', 'WHAT', 'WHEN', 'WHERE',
      'WHO', 'WHY', 'HOW', 'WHICH', 'THIS', 'THAT', 'THESE', 'THOSE',
      'STOCK', 'SHARE', 'PRICE', 'MARKET', 'NEWS', 'TODAY', 'NOW'
    ];
    return commonWords.includes(word.toUpperCase());
  }
}

module.exports = MessageValidator;
