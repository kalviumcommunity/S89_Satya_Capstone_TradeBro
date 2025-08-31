const express = require('express');
const dotenv = require('dotenv');
const axios = require('axios');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const mime = require('mime');
const jwt = require('jsonwebtoken');

// Import enhanced services
const AdvancedPromptingService = require('../services/enhanced/AdvancedPromptingService');
const StructuredOutputService = require('../services/enhanced/StructuredOutputService');
const FunctionCallingService = require('../services/enhanced/FunctionCallingService');
const EvaluationFramework = require('../evaluation/EvaluationFramework');

dotenv.config();

const router = express.Router();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Initialize enhanced services
const promptingService = new AdvancedPromptingService();
const structuredService = new StructuredOutputService();
const functionService = new FunctionCallingService();
const evaluationFramework = new EvaluationFramework();

// Token tracking
let totalTokensUsed = 0;

// System Instruction for the chatbot
const systemInstruction = [
  {
    text: `*System Role:* You are an advanced stock market assistant trained to provide precise and up-to-date data about stock performance, financial metrics, and market trends. Your goal is to deliver factually correct answers to user queries with clarity and brevity.

*Prompt Details:*
1. Gather accurate and real-time data from trusted financial APIs or databases.
2. Always prioritize user-specific queries (e.g., stock price, market cap, PE ratio, dividend yield, etc.).
3. Structure responses in a clear and concise format, using tables or bullet points for better readability.
4. Include relevant disclaimers about market volatility and the importance of research before investing.
5. Keep responses neutral and data-driven; avoid speculation or subjective opinions.
6. Provide definitions or context for financial terms when necessary to ensure user understanding.
7. For technical analysis, include visual aids (charts or graphs) if supported by your platform.
8. For Indian stocks, provide information relevant to the Indian market (NSE/BSE).
9. Keep disclaimers brief and only include them when providing actual stock data.

*Example Response Guidelines:*
- For a query like, "What's the current price of XYZ stock?":
   - Answer with: "The current price of XYZ stock is ₹123.45 (as of [timestamp]). Its daily high was ₹125.00 and daily low was ₹120.00."
- For general market trends: Include sector performance or index movements for better insights. Make the result user-friendly. Only give the data related to the NSE and BSE.`
  }
];

// Function to get stock data using our proxy server
const getStockData = async (symbol) => {
  try {
    // Use our API URL from environment variable or fallback to the deployed URL
    const baseUrl = process.env.API_BASE_URL || 'https://s89-satya-capstone-tradebro.onrender.com';
    const url = `${baseUrl}/api/proxy/stock-batch?symbols=${symbol}`;
    const response = await axios.get(url);

    if (response.data && response.data.length > 0) {
      const stockData = response.data[0];
      return {
        price: stockData.price,
        dayHigh: stockData.dayHigh,
        dayLow: stockData.dayLow,
        marketCap: stockData.marketCap,
        pe: stockData.pe,
        eps: stockData.eps,
        volume: stockData.volume,
        avgVolume: stockData.avgVolume,
        yearHigh: stockData.yearHigh,
        yearLow: stockData.yearLow,
        change: stockData.change,
        changesPercentage: stockData.changesPercentage,
        symbol: stockData.symbol,
        name: stockData.name
      };
    }
    return null;
  } catch (error) {
    console.error('Error fetching stock data:', error);
    return null;
  }
};

// Function to get top gainers/losers
const getTopMovers = async (type = 'gainers') => {
  try {
    const baseUrl = process.env.API_BASE_URL || 'https://s89-satya-capstone-tradebro.onrender.com';
    const url = `${baseUrl}/api/proxy/top-${type}`;
    const response = await axios.get(url);
    return response.data || [];
  } catch (error) {
    console.error(`Error fetching top ${type}:`, error);
    return [];
  }
};

// Function to get market news
const getMarketNews = async (symbol = null) => {
  try {
    const baseUrl = process.env.API_BASE_URL || 'https://s89-satya-capstone-tradebro.onrender.com';
    let url = `${baseUrl}/api/proxy/market-news`;
    if (symbol) {
      url += `?symbol=${symbol}`;
    }
    const response = await axios.get(url);
    return response.data || [];
  } catch (error) {
    console.error('Error fetching market news:', error);
    return [];
  }
};

// Function to extract stock symbol from user message
const extractStockSymbol = (message) => {
  // Common patterns for stock queries
  const patterns = [
    /(?:price|quote|value|cost|worth)\s+(?:of\s+)?([A-Z]{2,10})/i,
    /([A-Z]{2,10})\s+(?:stock|share|price|quote)/i,
    /(?:tell|show|give)\s+(?:me\s+)?(?:the\s+)?(?:price|quote|value|cost|worth)\s+(?:of\s+)?([A-Z]{2,10})/i,
    /(?:what|how)\s+(?:is|about)\s+([A-Z]{2,10})/i,
    /\b([A-Z]{2,10})\b/g
  ];

  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match && match[1]) {
      const symbol = match[1].toUpperCase();
      // Filter out common words that might be captured
      const excludeWords = ['THE', 'AND', 'OR', 'BUT', 'FOR', 'WITH', 'TO', 'FROM', 'BY', 'AT', 'IN', 'ON', 'OF', 'IS', 'ARE', 'WAS', 'WERE', 'BEEN', 'HAVE', 'HAS', 'HAD', 'DO', 'DOES', 'DID', 'WILL', 'WOULD', 'COULD', 'SHOULD', 'CAN', 'MAY', 'MIGHT', 'MUST', 'SHALL', 'WHAT', 'WHEN', 'WHERE', 'WHO', 'WHY', 'HOW', 'WHICH', 'THIS', 'THAT', 'THESE', 'THOSE'];
      if (!excludeWords.includes(symbol) && symbol.length >= 2 && symbol.length <= 10) {
        return symbol;
      }
    }
  }
  return null;
};

// Function to detect query intent
const detectIntent = (message) => {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('gainer') || lowerMessage.includes('top performing') || lowerMessage.includes('best stock')) {
    return 'top_gainers';
  }
  
  if (lowerMessage.includes('loser') || lowerMessage.includes('worst performing') || lowerMessage.includes('declining')) {
    return 'top_losers';
  }
  
  if (lowerMessage.includes('news') || lowerMessage.includes('headlines') || lowerMessage.includes('updates')) {
    return 'news';
  }
  
  if (lowerMessage.includes('compare') || lowerMessage.includes('vs') || lowerMessage.includes('versus')) {
    return 'comparison';
  }
  
  if (extractStockSymbol(message)) {
    return 'stock_query';
  }
  
  return 'general';
};

// Function to format stock data response
const formatStockResponse = (stockData) => {
  if (!stockData) return "I couldn't find data for that stock symbol.";
  
  const changeSymbol = stockData.change >= 0 ? '📈' : '📉';
  const changeColor = stockData.change >= 0 ? 'positive' : 'negative';
  
  return `
**${stockData.name} (${stockData.symbol})**

💰 **Current Price**: ₹${stockData.price?.toFixed(2) || 'N/A'}
${changeSymbol} **Change**: ${stockData.change?.toFixed(2) || 'N/A'} (${stockData.changesPercentage?.toFixed(2) || 'N/A'}%)

📊 **Key Metrics**:
• Market Cap: ${stockData.marketCap ? '₹' + (stockData.marketCap / 10000000).toFixed(0) + ' Cr' : 'N/A'}
• P/E Ratio: ${stockData.pe?.toFixed(2) || 'N/A'}
• EPS: ₹${stockData.eps?.toFixed(2) || 'N/A'}

📈 **Day Range**: ₹${stockData.dayLow?.toFixed(2) || 'N/A'} - ₹${stockData.dayHigh?.toFixed(2) || 'N/A'}
📊 **52W Range**: ₹${stockData.yearLow?.toFixed(2) || 'N/A'} - ₹${stockData.yearHigh?.toFixed(2) || 'N/A'}

📊 **Volume**: ${stockData.volume ? stockData.volume.toLocaleString() : 'N/A'}

*Disclaimer: This data is for informational purposes only. Please conduct your own research before making investment decisions.*
`;
};

// Function to format top movers response
const formatTopMoversResponse = (movers, type) => {
  if (!movers || movers.length === 0) {
    return `I couldn't fetch the top ${type} data at the moment. Please try again later.`;
  }
  
  const emoji = type === 'gainers' ? '📈' : '📉';
  const title = type === 'gainers' ? 'Top Gainers' : 'Top Losers';
  
  let response = `${emoji} **${title} Today**\n\n`;
  
  movers.slice(0, 10).forEach((stock, index) => {
    const changeSymbol = stock.changesPercentage >= 0 ? '📈' : '📉';
    response += `${index + 1}. **${stock.symbol}** - ${stock.name}\n`;
    response += `   💰 ₹${stock.price?.toFixed(2) || 'N/A'} ${changeSymbol} ${stock.changesPercentage?.toFixed(2) || 'N/A'}%\n\n`;
  });
  
  return response;
};

// Function to format news response
const formatNewsResponse = (news, symbol = null) => {
  if (!news || news.length === 0) {
    return "I couldn't fetch the latest news at the moment. Please try again later.";
  }
  
  const title = symbol ? `📰 Latest News for ${symbol}` : '📰 Latest Market News';
  let response = `${title}\n\n`;
  
  news.slice(0, 5).forEach((article, index) => {
    response += `${index + 1}. **${article.title}**\n`;
    response += `   📅 ${new Date(article.publishedDate).toLocaleDateString()}\n`;
    if (article.text && article.text.length > 0) {
      response += `   📝 ${article.text.substring(0, 150)}...\n`;
    }
    response += '\n';
  });
  
  return response;
};

// Enhanced chatbot endpoint with multiple prompting techniques
router.post('/chat', async (req, res) => {
  try {
    const { message, sessionId, technique = 'dynamic', context = {} } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }
    
    console.log(`🤖 Processing: "${message}" using ${technique} technique`);
    
    let response;
    let tokens = 0;
    
    // Route to appropriate prompting technique
    switch (technique) {
      case 'zero-shot':
        response = await promptingService.zeroShotPrompt(message, context);
        break;
      case 'one-shot':
        response = await promptingService.oneShotPrompt(message, context);
        break;
      case 'multi-shot':
        response = await promptingService.multiShotPrompt(message, context);
        break;
      case 'dynamic':
        response = await promptingService.dynamicPrompt(message, context);
        break;
      case 'chain-of-thought':
        response = await promptingService.chainOfThoughtPrompt(message, context);
        break;
      case 'function-calling':
        response = await functionService.processWithFunctionCalling(message, context);
        break;
      default:
        response = await promptingService.dynamicPrompt(message, context);
    }
    
    // Track tokens
    tokens = response.tokens || 0;
    totalTokensUsed += tokens;
    console.log(`🔢 Tokens used: ${tokens} | Session total: ${totalTokensUsed}`);
    
    res.json({
      success: response.success,
      message: response.response || response.text,
      technique: response.technique || technique,
      tokens: tokens,
      totalTokens: totalTokensUsed,
      functionCalls: response.functionCalls,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Enhanced chatbot error:', error);
    res.status(500).json({
      success: false,
      error: 'An error occurred while processing your request.',
      timestamp: new Date().toISOString()
    });
  }
});

// Structured output endpoint
router.post('/structured', async (req, res) => {
  try {
    const { type, data = {} } = req.body;
    
    let response;
    
    switch (type) {
      case 'stock-analysis':
        response = await structuredService.generateStockAnalysis(data.symbol, data.marketData);
        break;
      case 'market-overview':
        response = await structuredService.generateMarketOverview(data.marketData);
        break;
      case 'educational':
        response = await structuredService.generateEducationalContent(data.topic, data.difficulty);
        break;
      case 'trading-signal':
        response = await structuredService.generateTradingSignal(data.symbol, data.analysisData);
        break;
      default:
        return res.status(400).json({ error: 'Invalid structured output type' });
    }
    
    totalTokensUsed += response.tokens || 0;
    console.log(`🔢 Structured output tokens: ${response.tokens}`);
    
    res.json({
      ...response,
      totalTokens: totalTokensUsed,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Structured output error:', error);
    res.status(500).json({
      success: false,
      error: 'Error generating structured output',
      timestamp: new Date().toISOString()
    });
  }
});

// Function calling endpoint
router.post('/functions', async (req, res) => {
  try {
    const { query, context = {} } = req.body;
    
    const response = await functionService.processWithFunctionCalling(query, context);
    
    totalTokensUsed += response.tokens || 0;
    console.log(`🔢 Function calling tokens: ${response.tokens}`);
    
    res.json({
      ...response,
      totalTokens: totalTokensUsed,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Function calling error:', error);
    res.status(500).json({
      success: false,
      error: 'Error in function calling',
      timestamp: new Date().toISOString()
    });
  }
});

// Evaluation endpoint
router.post('/evaluate', async (req, res) => {
  try {
    console.log('🧪 Starting evaluation pipeline...');
    
    const results = await evaluationFramework.runEvaluationPipeline();
    
    res.json({
      success: true,
      results: results,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Evaluation error:', error);
    res.status(500).json({
      success: false,
      error: 'Error running evaluation',
      timestamp: new Date().toISOString()
    });
  }
});

// Token usage endpoint
router.get('/tokens', (req, res) => {
  res.json({
    totalTokensUsed: totalTokensUsed,
    promptingServiceTokens: promptingService.getTotalTokens(),
    timestamp: new Date().toISOString()
  });
});

// Reset token counter
router.post('/tokens/reset', (req, res) => {
  totalTokensUsed = 0;
  promptingService.resetTokenCount();
  
  res.json({
    success: true,
    message: 'Token counters reset',
    timestamp: new Date().toISOString()
  });
});

// Enhanced health check endpoint
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'enhanced-chatbot',
    features: {
      promptingTechniques: ['zero-shot', 'one-shot', 'multi-shot', 'dynamic', 'chain-of-thought'],
      structuredOutput: true,
      functionCalling: true,
      evaluation: true,
      tokenTracking: true
    },
    totalTokensUsed: totalTokensUsed,
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
