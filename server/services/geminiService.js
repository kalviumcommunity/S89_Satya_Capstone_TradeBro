const EnhancedGeminiService = require('./enhanced/EnhancedGeminiService');

class GeminiService {
  constructor() {
    this.enhancedService = new EnhancedGeminiService();
    console.log('🤖 Gemini Service initialized');
  }

  async processMessage(userMessage, userId = null) {
    try {
      const response = await this.enhancedService.processMessage(userMessage, userId);
      return response;
    } catch (error) {
      console.error('❌ Error in GeminiService:', error);
      return {
        success: false,
        message: '🔧 I\'m experiencing technical difficulties. Please try again in a moment.',
        type: 'error'
      };
    }
  }

  async testConnectivity() {
    return await this.enhancedService.testConnectivity();
  }

  getQuickSuggestions(input = '') {
    return [
      'Show me NIFTY performance',
      'What are today\'s top gainers?',
      'Tell me about RELIANCE stock',
      'Latest market news'
    ];
  }

  async testConnection() {
    const connectivity = await this.testConnectivity();
    return {
      success: connectivity.geminiAI,
      gemini: connectivity.geminiAI
    };
  }

  getModelInfo() {
    return {
      model: 'gemini-pro',
      provider: 'Google',
      available: true
    };
  }
}



const geminiServiceInstance = new GeminiService();

module.exports = geminiServiceInstance;
module.exports.default = geminiServiceInstance;
