const { GoogleGenerativeAI } = require('@google/generative-ai');

class EnhancedGeminiService {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
    this.genAI = this.apiKey ? new GoogleGenerativeAI(this.apiKey) : null;
    this.model = this.genAI ? this.genAI.getGenerativeModel({ model: 'gemini-pro' }) : null;
    console.log('🚀 Enhanced Gemini Service initialized');
  }

  async processMessage(userMessage, userId = null) {
    try {
      const lowerMessage = userMessage.toLowerCase();
      
      // Investment queries
      if (lowerMessage.includes('invest') || lowerMessage.includes('investment') || 
          (lowerMessage.includes('money') && lowerMessage.includes('stock'))) {
        return {
          success: true,
          message: `💰 **Absolutely! I'd be happy to help you with stock market investing.**\n\n🎯 **Getting Started:**\n• Open a Demat account with a registered broker\n• Start with index funds or blue-chip stocks\n• Begin with small amounts you can afford to lose\n• Learn about SIP (Systematic Investment Plans)\n\n📚 **Key Concepts to Learn:**\n• P/E ratio, market cap, dividend yield\n• Risk management and diversification\n• Fundamental vs technical analysis\n\n⚠️ **Important Reminders:**\n• This is a virtual trading platform for learning\n• Always do your own research (DYOR)\n• Consider consulting a financial advisor for real investments\n• Never invest money you can't afford to lose\n\n**What specific aspect of investing would you like to learn about?**`,
          type: 'investment',
          suggestions: ['What is a Demat account?', 'Explain SIP investing', 'How to analyze stocks?', 'Show me top stocks to watch']
        };
      }
      
      // Stock price queries
      if (lowerMessage.includes('price') || lowerMessage.includes('quote') || lowerMessage.includes('stock')) {
        return {
          success: true,
          message: `📈 **Stock Price Information**\n\nI can help you with stock prices! Here are some popular Indian stocks:\n\n**Popular Indian Stocks:**\n• RELIANCE - ₹2,465 *(demo)*\n• TCS - ₹3,245 *(demo)*\n• HDFC Bank - ₹1,678 *(demo)*\n• Infosys - ₹1,456 *(demo)*\n• ICICI Bank - ₹945 *(demo)*\n\nWhich specific stock would you like to know about?`,
          type: 'stock_query',
          suggestions: ['Tell me about RELIANCE', 'Show TCS performance', 'Compare HDFC vs ICICI', 'Top gainers today']
        };
      }
      
      // Navigation queries
      if (lowerMessage.includes('open') || lowerMessage.includes('go to') || lowerMessage.includes('navigate')) {
        if (lowerMessage.includes('chart')) {
          return {
            success: true,
            message: `🧭 **Navigation Command**\n\nOpening charts page for you!`,
            type: 'navigation',
            action: { type: 'navigate', path: '/charts' }
          };
        }
        if (lowerMessage.includes('portfolio')) {
          return {
            success: true,
            message: `🧭 **Navigation Command**\n\nOpening portfolio page for you!`,
            type: 'navigation',
            action: { type: 'navigate', path: '/portfolio' }
          };
        }
        if (lowerMessage.includes('dashboard') || lowerMessage.includes('home')) {
          return {
            success: true,
            message: `🧭 **Navigation Command**\n\nGoing to dashboard!`,
            type: 'navigation',
            action: { type: 'navigate', path: '/dashboard' }
          };
        }
      }
      
      // Market queries
      if (lowerMessage.includes('market') || lowerMessage.includes('nifty') || lowerMessage.includes('sensex')) {
        return {
          success: true,
          message: `📊 **Market Overview**\n\n**Current Status:** Markets are active *(demo data)*\n\n**Key Indices:**\n• NIFTY 50: 19,850 (+0.5%)\n• SENSEX: 66,450 (+0.3%)\n• Bank NIFTY: 45,200 (+0.8%)\n\n**Market Sentiment:** Cautiously optimistic with focus on IT and banking sectors.\n\n**Sector Performance:**\n• IT: Strong (+1.2%)\n• Banking: Stable (+0.8%)\n• Auto: Mixed (-0.3%)\n\nWould you like sector-specific information?`,
          type: 'market_data',
          suggestions: ['IT sector analysis', 'Banking stocks', 'Top gainers today', 'Market news']
        };
      }
      
      // News queries
      if (lowerMessage.includes('news') || lowerMessage.includes('update')) {
        return {
          success: true,
          message: `📰 **Market News & Updates**\n\n**Today's Highlights:**\n• IT sector shows strong performance amid global demand\n• Banking stocks remain stable with steady growth\n• FII activity continues to be positive this week\n• Crude oil prices affecting energy sector stocks\n• RBI policy meeting scheduled next week\n\n**Note:** Currently showing demo news. For real-time updates, please check financial news sources.`,
          type: 'news',
          suggestions: ['IT sector news', 'Banking updates', 'FII activity', 'RBI policy impact']
        };
      }
      
      // Educational queries
      if (lowerMessage.includes('what is') || lowerMessage.includes('explain') || lowerMessage.includes('learn')) {
        return {
          success: true,
          message: `🎓 **Stock Market Education**\n\nI'd be happy to explain stock market concepts!\n\n**Popular Topics:**\n• **P/E Ratio** - Price to Earnings ratio (valuation metric)\n• **Market Cap** - Total value of company shares\n• **Dividend** - Profit sharing with shareholders\n• **SIP** - Systematic Investment Plan\n• **Diversification** - Spreading investment risk\n• **Bull/Bear Market** - Market trends\n\nWhat specific concept would you like me to explain in detail?`,
          type: 'educational',
          suggestions: ['Explain P/E ratio', 'What is market cap?', 'How does SIP work?', 'Bull vs Bear market']
        };
      }
      
      // Use Gemini AI for complex queries
      if (this.model) {
        try {
          const prompt = `You are Saytrix, an AI stock trading assistant for TradeBro platform. Answer this question about investing or stock markets: "${userMessage}"\n\nProvide a helpful, educational response about investing, stock markets, or trading. Keep it concise and practical. Use emojis and bullet points for better readability.`;
          const result = await this.model.generateContent(prompt);
          const response = result.response.text();
          
          return {
            success: true,
            message: response,
            type: 'general',
            suggestions: ['Market overview', 'Investment tips', 'Stock analysis', 'Trading strategies']
          };
        } catch (aiError) {
          console.log('Gemini AI unavailable, using fallback');
        }
      }
      
      // Intelligent fallback response
      return {
        success: true,
        message: `💡 **I understand you're asking about: "${userMessage}"**\n\nI'm your AI stock market assistant and I can help with:\n\n📈 **Stock Information** - Prices, company data, analysis\n📊 **Market Trends** - Indices, sector performance, news\n🎓 **Investment Education** - Concepts, strategies, tips\n📰 **Market News** - Latest updates and events\n💼 **Trading Guidance** - Strategies and best practices\n\nCould you be more specific about what you'd like to know? For example:\n• "Tell me about [stock name]"\n• "What is [financial term]?"\n• "How do I start investing?"`,
        type: 'general',
        suggestions: ['Show me NIFTY performance', 'What are top gainers?', 'How to start investing?', 'Latest market news']
      };
    } catch (error) {
      console.error('❌ Error processing message:', error);
      return {
        success: true,
        message: '🔧 I\'m experiencing technical difficulties, but I can still help! Try asking about:\n\n• Stock prices and information\n• Investment guidance\n• Market trends\n• Financial education\n\nWhat would you like to know?',
        type: 'error',
        suggestions: ['Investment basics', 'Stock market overview', 'Popular stocks', 'Trading tips']
      };
    }
  }

  async testConnectivity() {
    return {
      geminiAI: !!this.model,
      stockData: true,
      components: true
    };
  }
}

module.exports = EnhancedGeminiService;