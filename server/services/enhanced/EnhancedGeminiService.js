const { GoogleGenerativeAI } = require('@google/generative-ai');
const StockSymbolExtractor = require('./StockSymbolExtractor');
const MultilingualFormatter = require('./MultilingualFormatter');
const StockDataProvider = require('./StockDataProvider');
const MessageValidator = require('./MessageValidator');
const EducationalContentProvider = require('./EducationalContentProvider');

/**
 * Enhanced Gemini Service for Stock Trading Assistant
 * Modular, multilingual, and production-ready service with comprehensive features
 */
class EnhancedGeminiService {
  constructor() {
    this.initializeService();
    this.initializeComponents();
    this.initializeErrorHandling();
  }

  /**
   * Initialize the main service
   */
  initializeService() {
    this.apiKey = process.env.GEMINI_API_KEY;
    this.genAI = this.apiKey ? new GoogleGenerativeAI(this.apiKey) : null;
    this.model = this.genAI ? this.genAI.getGenerativeModel({ model: 'gemini-pro' }) : null;
    
    this.serviceConfig = {
      maxRetries: 3,
      timeout: 30000,
      fallbackEnabled: true,
      cacheEnabled: true,
      rateLimitEnabled: true
    };

    console.log('🚀 Enhanced Gemini Service initialized');
  }

  /**
   * Initialize modular components
   */
  initializeComponents() {
    this.symbolExtractor = new StockSymbolExtractor();
    this.formatter = new MultilingualFormatter();
    this.dataProvider = new StockDataProvider();
    this.validator = new MessageValidator();
    this.educationProvider = new EducationalContentProvider();

    console.log('📦 All service components loaded successfully');
  }

  /**
   * Initialize error handling and logging
   */
  initializeErrorHandling() {
    this.errorCodes = {
      INVALID_MESSAGE: 'INVALID_MESSAGE',
      API_ERROR: 'API_ERROR',
      RATE_LIMIT: 'RATE_LIMIT',
      NO_DATA: 'NO_DATA',
      VALIDATION_ERROR: 'VALIDATION_ERROR'
    };

    this.fallbackResponses = {
      en: {
        apiError: '🔧 I\'m experiencing technical difficulties. Please try again in a moment.',
        noData: '📊 I couldn\'t find data for that stock. Please check the symbol and try again.',
        invalidInput: '❓ I didn\'t understand that. Try asking about stock prices, news, or market information.',
        rateLimit: '⏰ You\'re asking questions too quickly. Please wait a moment before trying again.'
      },
      hi: {
        apiError: '🔧 तकनीकी समस्या हो रही है। कृपया थोड़ी देर बाद कोशिश करें।',
        noData: '📊 उस स्टॉक का डेटा नहीं मिला। कृपया सिंबल चेक करके दोबारा कोशिश करें।',
        invalidInput: '❓ मैं समझ नहीं पाया। स्टॉक की कीमत, समाचार या बाजार की जानकारी के बारे में पूछें।',
        rateLimit: '⏰ आप बहुत जल्दी-जल्दी सवाल पूछ रहे हैं। कृपया थोड़ा इंतजार करें।'
      }
    };
  }

  /**
   * Main method to process user messages
   */
  async processMessage(userMessage, userId = null) {
    try {
      console.log(`📝 Processing message: "${userMessage.substring(0, 50)}..."`);

      // Validate message
      const validation = this.validator.validateMessage(userMessage, userId);
      if (!validation.isValid) {
        return this.createErrorResponse(validation.errors[0], validation.language);
      }

      const { intent, confidence, sanitizedMessage, language } = validation;
      console.log(`🎯 Detected intent: ${intent} (confidence: ${confidence.toFixed(2)})`);
      console.log(`🌐 Language: ${language}`);

      // Route to appropriate handler based on intent
      const response = await this.routeToHandler(intent, sanitizedMessage, language, validation);
      
      // Add suggestions if confidence is low
      if (confidence < 0.7 && validation.suggestions.length > 0) {
        response.suggestions = validation.suggestions;
      }

      return response;
    } catch (error) {
      console.error('❌ Error processing message:', error);
      return this.createErrorResponse(this.errorCodes.API_ERROR, 'en');
    }
  }

  /**
   * Route message to appropriate handler based on intent
   */
  async routeToHandler(intent, message, language, validation) {
    try {
      switch (intent) {
        case 'stockQuery':
          return await this.handleStockQuery(message, language, validation.extractedData);
        
        case 'comparison':
          return await this.handleStockComparison(message, language, validation.extractedData);
        
        case 'topMovers':
          return await this.handleTopMovers(message, language);
        
        case 'news':
          return await this.handleNewsQuery(message, language, validation.extractedData);
        
        case 'educational':
          return await this.handleEducationalQuery(message, language, validation.extractedData);
        
        case 'greeting':
          return this.handleGreeting(language);
        
        case 'help':
          return this.handleHelpQuery(language);
        
        default:
          return await this.handleGeneralQuery(message, language);
      }
    } catch (error) {
      console.error(`❌ Error in ${intent} handler:`, error);
      return this.createErrorResponse(this.errorCodes.API_ERROR, language);
    }
  }

  /**
   * Handle stock price queries
   */
  async handleStockQuery(message, language, extractedData) {
    try {
      // Extract symbol using multiple methods
      let symbol = extractedData?.symbol || this.symbolExtractor.extractSymbol(message);
      
      if (!symbol) {
        const suggestions = this.symbolExtractor.getSuggestions(message, 3);
        return {
          success: false,
          message: language === 'hi' ? 
            '🔍 कृपया एक वैध स्टॉक सिंबल बताएं।' : 
            '🔍 Please provide a valid stock symbol.',
          suggestions: suggestions.map(s => `${s.company} (${s.symbol})`),
          type: 'symbol_needed'
        };
      }

      console.log(`📈 Fetching data for symbol: ${symbol}`);
      let stockData = await this.dataProvider.getStockData(symbol);
      
      // Fallback to FMP API if no data
      if (!stockData) {
        stockData = await this.fetchStockDataFallback(symbol);
      }
      
      if (!stockData) {
        return {
          success: false,
          message: this.fallbackResponses[language].noData,
          type: 'no_data'
        };
      }

      const formattedResponse = this.formatter.formatStockData(stockData, language);
      
      return {
        success: true,
        message: formattedResponse,
        data: stockData,
        type: 'stock_data'
      };
    } catch (error) {
      console.error('❌ Error in stock query:', error);
      return this.createErrorResponse(this.errorCodes.API_ERROR, language);
    }
  }

  /**
   * Fallback stock data fetcher using FMP API
   */
  async fetchStockDataFallback(symbol) {
    const apiKeys = [
      process.env.FMP_API_KEY,
      process.env.FMP_API_KEY_2,
      process.env.FMP_API_KEY_3,
      process.env.FMP_API_KEY_4
    ].filter(Boolean);

    for (const apiKey of apiKeys) {
      try {
        const axios = require('axios');
        const response = await axios.get(
          `https://financialmodelingprep.com/api/v3/quote/${symbol}?apikey=${apiKey}`,
          { timeout: 5000 }
        );
        
        if (response.data && response.data[0]) {
          const data = response.data[0];
          return {
            symbol: data.symbol,
            name: data.name,
            price: data.price,
            change: data.change,
            changesPercentage: data.changesPercentage,
            dayLow: data.dayLow,
            dayHigh: data.dayHigh,
            marketCap: data.marketCap,
            volume: data.volume,
            timestamp: new Date().toISOString()
          };
        }
      } catch (error) {
        console.log(`FMP API key failed: ${apiKey.substring(0, 8)}...`);
        continue;
      }
    }
    return null;
  }

  /**
   * Handle stock comparison queries
   */
  async handleStockComparison(message, language, extractedData) {
    try {
      let symbol1 = extractedData?.symbol1;
      let symbol2 = extractedData?.symbol2;

      // If not extracted, try to find two symbols in message
      if (!symbol1 || !symbol2) {
        const symbols = this.validator.extractAllSymbols(message);
        if (symbols.length >= 2) {
          symbol1 = symbols[0];
          symbol2 = symbols[1];
        }
      }

      if (!symbol1 || !symbol2) {
        return {
          success: false,
          message: language === 'hi' ? 
            '🔍 कृपया दो स्टॉक सिंबल बताएं तुलना के लिए।' : 
            '🔍 Please provide two stock symbols for comparison.',
          type: 'symbols_needed'
        };
      }

      console.log(`⚖️ Comparing ${symbol1} vs ${symbol2}`);
      
      const [stock1Data, stock2Data] = await Promise.all([
        this.dataProvider.getStockData(symbol1),
        this.dataProvider.getStockData(symbol2)
      ]);

      if (!stock1Data || !stock2Data) {
        return {
          success: false,
          message: language === 'hi' ? 
            '📊 एक या दोनों स्टॉक का डेटा नहीं मिला।' : 
            '📊 Could not find data for one or both stocks.',
          type: 'partial_data'
        };
      }

      const formattedResponse = this.formatter.formatStockComparison(stock1Data, stock2Data, language);
      
      return {
        success: true,
        message: formattedResponse,
        data: { stock1: stock1Data, stock2: stock2Data },
        type: 'comparison'
      };
    } catch (error) {
      console.error('❌ Error in stock comparison:', error);
      return this.createErrorResponse(this.errorCodes.API_ERROR, language);
    }
  }

  /**
   * Handle top movers queries
   */
  async handleTopMovers(message, language) {
    try {
      const isLosers = /(?:loser|decline|down|fall|drop)/i.test(message);
      const type = isLosers ? 'losers' : 'gainers';
      
      console.log(`📊 Fetching top ${type}`);
      let movers = await this.dataProvider.getTopMovers(type);
      
      // Fallback to FMP API if no data
      if (!movers || movers.length === 0) {
        movers = await this.fetchTopMoversFallback(type);
      }
      
      const formattedResponse = this.formatter.formatTopMovers(movers, type, language);
      
      return {
        success: true,
        message: formattedResponse,
        data: movers,
        type: 'top_movers'
      };
    } catch (error) {
      console.error('❌ Error in top movers:', error);
      return this.createErrorResponse(this.errorCodes.API_ERROR, language);
    }
  }

  /**
   * Fallback top movers fetcher using FMP API
   */
  async fetchTopMoversFallback(type) {
    const apiKeys = [
      process.env.FMP_API_KEY,
      process.env.FMP_API_KEY_2,
      process.env.FMP_API_KEY_3,
      process.env.FMP_API_KEY_4
    ].filter(Boolean);

    const endpoint = type === 'gainers' ? 'stock_market/gainers' : 'stock_market/losers';

    for (const apiKey of apiKeys) {
      try {
        const axios = require('axios');
        const response = await axios.get(
          `https://financialmodelingprep.com/api/v3/${endpoint}?apikey=${apiKey}`,
          { timeout: 5000 }
        );
        
        if (response.data && Array.isArray(response.data)) {
          return response.data.slice(0, 10).map(stock => ({
            symbol: stock.symbol,
            name: stock.name,
            price: stock.price,
            change: stock.change,
            changesPercentage: stock.changesPercentage
          }));
        }
      } catch (error) {
        console.log(`FMP API key failed for ${type}: ${apiKey.substring(0, 8)}...`);
        continue;
      }
    }
    return [];
  }

  /**
   * Handle educational queries
   */
  async handleEducationalQuery(message, language, extractedData) {
    try {
      const topic = extractedData?.topic || message.toLowerCase();
      
      console.log(`📚 Providing education on: ${topic}`);
      const contentResult = this.educationProvider.getContent(topic, language);
      
      if (contentResult.found) {
        const formattedResponse = this.formatter.formatEducationalContent(
          contentResult.content.title, 
          contentResult.content, 
          language
        );
        
        return {
          success: true,
          message: formattedResponse,
          data: contentResult.content,
          type: 'educational'
        };
      } else {
        return {
          success: false,
          message: contentResult.message,
          suggestions: contentResult.suggestions,
          type: 'educational_not_found'
        };
      }
    } catch (error) {
      console.error('❌ Error in educational query:', error);
      return this.createErrorResponse(this.errorCodes.API_ERROR, language);
    }
  }

  /**
   * Handle greeting messages
   */
  handleGreeting(language) {
    const greetings = {
      en: `👋 Hello! I'm your AI stock trading assistant. I can help you with:

📈 Stock prices and data
📊 Market comparisons  
📰 Latest market news
🔥 Top gainers and losers
📚 Financial education

What would you like to know about the markets today?`,
      
      hi: `👋 नमस्ते! मैं आपका AI स्टॉक ट्रेडिंग असिस्टेंट हूं। मैं आपकी मदद कर सकता हूं:

📈 स्टॉक की कीमतें और डेटा
📊 बाजार की तुलना
📰 नवीनतम बाजार समाचार  
🔥 टॉप गेनर्स और लूज़र्स
📚 वित्तीय शिक्षा

आज बाजार के बारे में आप क्या जानना चाहते हैं?`
    };

    return {
      success: true,
      message: greetings[language],
      type: 'greeting'
    };
  }

  /**
   * Create standardized error response
   */
  createErrorResponse(errorCode, language = 'en') {
    const errorMessages = this.fallbackResponses[language] || this.fallbackResponses.en;
    
    let message;
    switch (errorCode) {
      case this.errorCodes.INVALID_MESSAGE:
        message = errorMessages.invalidInput;
        break;
      case this.errorCodes.RATE_LIMIT:
        message = errorMessages.rateLimit;
        break;
      case this.errorCodes.NO_DATA:
        message = errorMessages.noData;
        break;
      default:
        message = errorMessages.apiError;
    }

    return {
      success: false,
      message,
      error: errorCode,
      type: 'error'
    };
  }

  /**
   * Test API connectivity
   */
  async testConnectivity() {
    try {
      console.log('🔍 Testing service connectivity...');
      
      const tests = {
        geminiAI: false,
        stockData: false,
        components: false
      };

      // Test Gemini AI
      if (this.model) {
        try {
          await this.model.generateContent('Test connection');
          tests.geminiAI = true;
        } catch (error) {
          console.log('⚠️ Gemini AI not available');
        }
      }

      // Test stock data
      try {
        const testData = await this.dataProvider.getStockData('RELIANCE');
        tests.stockData = !!testData;
      } catch (error) {
        console.log('⚠️ Stock data provider issues');
      }

      // Test components
      tests.components = !!(
        this.symbolExtractor && 
        this.formatter && 
        this.validator && 
        this.educationProvider
      );

      console.log('✅ Connectivity test completed:', tests);
      return tests;
    } catch (error) {
      console.error('❌ Connectivity test failed:', error);
      return { geminiAI: false, stockData: false, components: false };
    }
  }
}

module.exports = EnhancedGeminiService;
