/**
 * Enhanced Gemini Service - Production Ready
 * This replaces the old geminiService with the new modular implementation
 */

const EnhancedGeminiService = require('./enhanced/EnhancedGeminiService');

/**
 * Singleton instance of the enhanced service
 */
let serviceInstance = null;

/**
 * Get or create the enhanced Gemini service instance
 */
function getGeminiService() {
  if (!serviceInstance) {
    serviceInstance = new EnhancedGeminiService();
    console.log('✅ Enhanced Gemini Service initialized');
  }
  return serviceInstance;
}

/**
 * Main class that maintains backward compatibility while using enhanced features
 */
class GeminiService {
  constructor() {
    this.enhancedService = getGeminiService();
    console.log('🤖 Initializing Enhanced Gemini Service...');
    console.log('✅ Enhanced Gemini Service initialized successfully');
  }

  /**
   * Process user message - main entry point
   * @param {string} userMessage - User's input message
   * @param {string} userId - Optional user ID for rate limiting
   * @returns {Object} - Structured response
   */
  async processMessage(userMessage, userId = null) {
    try {
      console.log(`🔄 Processing message: "${userMessage.substring(0, 50)}..."`);

      const response = await this.enhancedService.processMessage(userMessage, userId);

      // Log the response type for monitoring
      console.log(`✅ Response type: ${response.type}, Success: ${response.success}`);

      return response;
    } catch (error) {
      console.error('❌ Error in GeminiService.processMessage:', error);
      return {
        success: false,
        message: '🔧 I\'m experiencing technical difficulties. Please try again in a moment.',
        type: 'error',
        error: error.message
      };
    }
  }

  /**
   * Extract stock symbol from message
   * @param {string} message - User message
   * @param {Array} regexMatch - Optional regex match
   * @returns {string|null} - Extracted symbol
   */
  extractStockSymbol(message, regexMatch = null) {
    try {
      return this.enhancedService.symbolExtractor.extractSymbol(message, regexMatch);
    } catch (error) {
      console.error('Error extracting stock symbol:', error);
      return null;
    }
  }
  /**
   * Format stock data for display
   * @param {Object} stockData - Stock data object
   * @param {string} language - Language preference
   * @returns {string} - Formatted response
   */
  formatStockData(stockData, language = 'en') {
    try {
      return this.enhancedService.formatter.formatStockData(stockData, language);
    } catch (error) {
      console.error('Error formatting stock data:', error);
      return 'Error formatting stock data';
    }
  }

  /**
   * Format stock comparison
   * @param {Object} stock1 - First stock data
   * @param {Object} stock2 - Second stock data
   * @param {string} language - Language preference
   * @returns {string} - Formatted comparison
   */
  formatStockComparison(stock1, stock2, language = 'en') {
    try {
      return this.enhancedService.formatter.formatStockComparison(stock1, stock2, language);
    } catch (error) {
      console.error('Error formatting stock comparison:', error);
      return 'Error formatting comparison';
    }
  }
  /**
   * Format top movers (gainers/losers)
   * @param {Array} movers - Array of stock movers
   * @param {string} type - 'gainers' or 'losers'
   * @param {string} language - Language preference
   * @returns {string} - Formatted response
   */
  formatTopMovers(movers, type, language = 'en') {
    try {
      return this.enhancedService.formatter.formatTopMovers(movers, type, language);
    } catch (error) {
      console.error('Error formatting top movers:', error);
      return 'Error formatting market movers';
    }
  }

  /**
   * Format news articles
   * @param {Array} news - Array of news articles
   * @param {string} symbol - Optional stock symbol
   * @param {string} language - Language preference
   * @returns {string} - Formatted news
   */
  formatNews(news, symbol = null, language = 'en') {
    try {
      return this.enhancedService.formatter.formatNews(news, symbol, language);
    } catch (error) {
      console.error('Error formatting news:', error);
      return 'Error formatting news';
    }
  }

  /**
   * Get educational content
   * @param {string} topic - Educational topic
   * @param {string} language - Language preference
   * @returns {Object} - Educational content result
   */
  getEducationalContent(topic, language = 'en') {
    try {
      return this.enhancedService.educationProvider.getContent(topic, language);
    } catch (error) {
      console.error('Error getting educational content:', error);
      return {
        found: false,
        error: 'Error retrieving educational content'
      };
    }
  }
  /**
   * Validate user message
   * @param {string} message - User message
   * @param {string} userId - Optional user ID
   * @returns {Object} - Validation result
   */
  validateMessage(message, userId = null) {
    try {
      return this.enhancedService.validator.validateMessage(message, userId);
    } catch (error) {
      console.error('Error validating message:', error);
      return {
        isValid: false,
        errors: ['Validation error occurred'],
        language: 'en'
      };
    }
  }

  /**
   * Test service connectivity
   * @returns {Object} - Connectivity status
   */
  async testConnectivity() {
    try {
      return await this.enhancedService.testConnectivity();
    } catch (error) {
      console.error('Error testing connectivity:', error);
      return {
        geminiAI: false,
        stockData: false,
        components: false,
        error: error.message
      };
    }
  }

  /**
   * Get service health status
   * @returns {Object} - Health status
   */
  async getHealthStatus() {
    try {
      const connectivity = await this.testConnectivity();
      const timestamp = new Date().toISOString();

      return {
        status: connectivity.components ? 'healthy' : 'degraded',
        timestamp,
        services: connectivity,
        version: '2.0.0-enhanced'
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message,
        version: '2.0.0-enhanced'
      };
    }
  }

  /**
   * Get quick suggestions based on input
   * @param {string} input - User input
   * @returns {Array} - Array of suggestions
   */
  getQuickSuggestions(input = '') {
    const lowerInput = input.toLowerCase();
    
    if (lowerInput.includes('stock') || lowerInput.includes('price')) {
      return ['Show top gainers', 'Show top losers', 'Market overview'];
    }
    if (lowerInput.includes('news')) {
      return ['Latest market news', 'Stock specific news', 'Economic updates'];
    }
    if (lowerInput.includes('compare')) {
      return ['Compare TCS vs INFY', 'Compare HDFC vs ICICI', 'Sector comparison'];
    }
    
    return [
      'Show me NIFTY performance',
      'What are today\'s top gainers?',
      'Tell me about RELIANCE stock',
      'Latest market news'
    ];
  }

  /**
   * Test connection to services
   * @returns {Object} - Connection status
   */
  async testConnection() {
    try {
      const connectivity = await this.testConnectivity();
      return {
        success: connectivity.geminiAI || connectivity.components,
        gemini: connectivity.geminiAI,
        stockData: connectivity.stockData,
        components: connectivity.components
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get model information
   * @returns {Object} - Model info
   */
  getModelInfo() {
    return {
      model: 'gemini-pro',
      provider: 'Google',
      version: '1.0',
      available: !!this.model
    };
  }
}



// Export both the class and a singleton instance for backward compatibility
const geminiServiceInstance = new GeminiService();

// Add backward compatibility methods
geminiServiceInstance.getQuickSuggestions = geminiServiceInstance.getQuickSuggestions || function(input = '') {
  const lowerInput = input.toLowerCase();
  
  if (lowerInput.includes('stock') || lowerInput.includes('price')) {
    return ['Show top gainers', 'Show top losers', 'Market overview'];
  }
  if (lowerInput.includes('news')) {
    return ['Latest market news', 'Stock specific news', 'Economic updates'];
  }
  if (lowerInput.includes('compare')) {
    return ['Compare TCS vs INFY', 'Compare HDFC vs ICICI', 'Sector comparison'];
  }
  
  return [
    'Show me NIFTY performance',
    'What are today\'s top gainers?',
    'Tell me about RELIANCE stock',
    'Latest market news'
  ];
};

module.exports = {
  GeminiService,
  geminiService: geminiServiceInstance,
  // For backward compatibility
  default: geminiServiceInstance,
  // Direct export for require() calls
  processMessage: geminiServiceInstance.processMessage.bind(geminiServiceInstance),
  getQuickSuggestions: geminiServiceInstance.getQuickSuggestions.bind(geminiServiceInstance),
  testConnection: geminiServiceInstance.testConnection.bind(geminiServiceInstance),
  getModelInfo: geminiServiceInstance.getModelInfo.bind(geminiServiceInstance)
};

// Also export as default for ES6 imports
module.exports.default = geminiServiceInstance;
