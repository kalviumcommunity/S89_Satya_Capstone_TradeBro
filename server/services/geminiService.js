const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios');
require('dotenv').config();

class GeminiService {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
    console.log('🤖 Initializing Gemini Service...');
    console.log('🔑 API Key:', this.apiKey ? 'Configured ✅' : 'Not found ❌');

    this.genAI = new GoogleGenerativeAI(this.apiKey);
    this.model = this.genAI.getGenerativeModel({
      model: process.env.CHATBOT_MODEL || 'gemini-2.0-flash-exp'
    });

    console.log('🧠 Model:', process.env.CHATBOT_MODEL || 'gemini-2.0-flash-exp');

    this.fmpApiKey = process.env.FMP_API_KEY;
    this.twelveDataApiKey = process.env.TWELVE_DATA_API_KEY;

    // Initialize command processors
    this.initializeCommandProcessors();

    console.log('✅ Gemini Service initialized successfully');
    
    // System instruction for Saytrix
    this.systemInstruction = `You are Saytrix, an advanced AI stock market assistant for TradeBro, specialized in the Indian stock markets (NSE and BSE). You provide users with accurate, real-time, and comprehensive information about companies and their stocks.

Your capabilities include:
- Real-time stock price analysis and market data interpretation
- Technical analysis and fundamental analysis
- Market news analysis and impact assessment
- Portfolio management guidance and risk assessment
- Educational content about trading concepts and strategies
- Indian stock market expertise (NSE, BSE, NIFTY, SENSEX)
- Company analysis and financial metrics interpretation
- Voice command processing and natural language understanding

When users ask about stocks or market data, provide comprehensive responses including:
- Current stock price with change percentage and direction (📈/📉)
- Company name, sector, and industry information
- Key financial metrics (Market Cap, P/E Ratio, EPS, Day Range, 52W Range)
- Performance analysis and market context
- Recent news headlines when relevant
- Educational explanations for complex terms

Response formatting guidelines:
- Always use Indian Rupees (₹) for currency values
- Use engaging emojis (📈📉💰📊🏢📰) to enhance readability
- Structure responses with **bold headers** and bullet points (•)
- Provide data-driven insights based on provided information
- Be conversational yet professional
- Include actionable insights when appropriate
- For top gainers/losers, show percentage changes and current prices
- For news queries, include publication dates and brief summaries
- For educational queries, provide clear explanations with examples
- For comparisons, highlight key differences and similarities

Important guidelines:
- Never provide personal investment advice or buy/sell recommendations
- Always acknowledge limitations and suggest consulting financial advisors for major decisions
- If data is unavailable, clearly state this and offer alternatives
- For vague questions, ask clarifying questions
- Prioritize factual, data-based insights over speculation
- End responses with helpful follow-up suggestions when appropriate

Give responses in an understandable way instead of JSON format. When providing stock data, format it nicely with clear sections and bullet points.`;
  }

  initializeCommandProcessors() {
    // Define command patterns and their processors
    this.commandProcessors = [
      {
        patterns: [
          /what is (.+?) stock/i,
          /tell me about (.+?) stock/i,
          /(.+?) stock price/i,
          /(.+?) stock info/i,
          /data related to (.+)/i,
          /give me (.+?) data/i,
          /show me (.+?) stock/i,
          /(.+?) stock data/i
        ],
        processor: this.processStockQuery.bind(this),
        description: 'Stock information queries'
      },
      {
        patterns: [/top gainers?/i, /best performing stocks?/i, /gainers today/i],
        processor: this.processTopGainers.bind(this),
        description: 'Top gainers queries'
      },
      {
        patterns: [/top losers?/i, /worst performing stocks?/i, /losers today/i],
        processor: this.processTopLosers.bind(this),
        description: 'Top losers queries'
      },
      {
        patterns: [/market news/i, /latest news/i, /news about (.+)/i, /(.+?) news/i],
        processor: this.processNewsQuery.bind(this),
        description: 'Market news queries'
      },
      {
        patterns: [/compare (.+?) (?:and|vs|with) (.+)/i, /(.+?) vs (.+)/i],
        processor: this.processStockComparison.bind(this),
        description: 'Stock comparison queries'
      },
      {
        patterns: [/nifty 50/i, /nifty/i, /sensex/i, /market index/i],
        processor: this.processIndexQuery.bind(this),
        description: 'Market index queries'
      },
      {
        patterns: [/what is (.+)/i, /explain (.+)/i, /define (.+)/i],
        processor: this.processEducationalQuery.bind(this),
        description: 'Educational queries'
      },
      {
        patterns: [/portfolio/i, /my stocks/i, /holdings/i],
        processor: this.processPortfolioQuery.bind(this),
        description: 'Portfolio queries'
      }
    ];

    console.log('🔧 Command processors initialized:', this.commandProcessors.length);
  }

  // Get stock data with multiple API fallbacks
  async getStockData(symbol) {
    try {
      console.log(`🔍 Fetching stock data for symbol: ${symbol}`);

      // Check if this is likely an Indian stock
      const isLikelyIndianStock = this.isLikelyIndianStock(symbol);
      console.log(`🇮🇳 Is likely Indian stock: ${isLikelyIndianStock}`);

      if (isLikelyIndianStock) {
        // For Indian stocks, try Twelve Data first
        console.log('🔄 Trying Twelve Data API first for Indian stock...');
        const twelveData = await this.getStockDataFromTwelveData(symbol);
        if (twelveData) {
          console.log('✅ Found data from Twelve Data API');
          return twelveData;
        }
        console.log('❌ No data from Twelve Data API, trying FMP...');
      }

      // Try FMP API with different symbol formats
      console.log('🔄 Trying FMP API...');
      const fmpData = await this.getStockDataFromFMP(symbol);
      if (fmpData) {
        console.log('✅ Found data from FMP API');
        return fmpData;
      }
      console.log('❌ No data from FMP API');

      // If not tried yet, try Twelve Data API
      if (!isLikelyIndianStock) {
        console.log('🔄 Trying Twelve Data API as fallback...');
        const twelveData = await this.getStockDataFromTwelveData(symbol);
        if (twelveData) {
          console.log('✅ Found data from Twelve Data API');
          return twelveData;
        }
        console.log('❌ No data from Twelve Data API');
      }

      console.log('❌ No stock data found from any API');
      return null;
    } catch (error) {
      console.error('Error fetching stock data:', error);
      return null;
    }
  }

  // Check if a symbol is likely an Indian stock
  isLikelyIndianStock(symbol) {
    const indianStockSymbols = [
      'TCS', 'RELIANCE', 'INFY', 'HDFCBANK', 'ICICIBANK', 'SBIN', 'ITC',
      'LT', 'BHARTIARTL', 'ASIANPAINT', 'WIPRO', 'MARUTI', 'BAJFINANCE',
      'KOTAKBANK', 'HINDUNILVR', 'AXISBANK', 'ULTRACEMCO', 'NESTLEIND',
      'POWERGRID', 'NTPC', 'TECHM', 'SUNPHARMA', 'TITAN', 'DRREDDY'
    ];

    const cleanSymbol = symbol.replace('.NS', '').replace('.BO', '').replace('.NSE', '');
    return indianStockSymbols.includes(cleanSymbol.toUpperCase());
  }

  // Get stock data from FMP API with fallback for different symbol formats
  async getStockDataFromFMP(symbol) {
    try {
      // Try different symbol formats for Indian stocks
      const symbolVariants = [
        symbol,
        `${symbol}.NS`,  // NSE format
        `${symbol}.BO`,  // BSE format
        symbol.replace('.NS', '').replace('.BO', '') // Remove suffix if present
      ];

      for (const symbolVariant of symbolVariants) {
        try {
          const [priceResponse, profileResponse] = await Promise.all([
            axios.get(`https://financialmodelingprep.com/api/v3/quote/${symbolVariant}?apikey=${this.fmpApiKey}`),
            axios.get(`https://financialmodelingprep.com/api/v3/profile/${symbolVariant}?apikey=${this.fmpApiKey}`)
          ]);

          const priceData = priceResponse.data[0];
          const profileData = profileResponse.data[0];

          if (priceData && profileData) {
            return this.formatStockDataResponse(priceData, profileData);
          }
        } catch (error) {
          // Continue to next variant
          continue;
        }
      }

      return null;
    } catch (error) {
      console.error('Error fetching stock data from FMP:', error);
      return null;
    }
  }

  // Get stock data from Twelve Data API (better for Indian stocks)
  async getStockDataFromTwelveData(symbol) {
    try {
      // For Indian stocks, try with NSE suffix
      const symbolVariants = [
        `${symbol}.NSE`,  // Twelve Data NSE format
        symbol.replace('.NS', '').replace('.BO', '') + '.NSE',
        symbol
      ];

      for (const symbolVariant of symbolVariants) {
        try {
          const response = await axios.get(
            `https://api.twelvedata.com/quote?symbol=${symbolVariant}&apikey=${this.twelveDataApiKey}`
          );

          const data = response.data;

          if (data && !data.code && data.symbol) {
            // Format Twelve Data response to match our standard format
            return {
              symbol: data.symbol,
              name: data.name || symbolVariant,
              price: parseFloat(data.close) || 0,
              change: parseFloat(data.change) || 0,
              changesPercentage: parseFloat(data.percent_change) || 0,
              marketCap: null, // Not available in basic quote
              pe: null, // Not available in basic quote
              eps: null, // Not available in basic quote
              description: `Stock data for ${data.name || symbolVariant} from NSE`,
              sector: null, // Not available in basic quote
              industry: null, // Not available in basic quote
              website: null,
              dayLow: parseFloat(data.low) || 0,
              dayHigh: parseFloat(data.high) || 0,
              yearLow: parseFloat(data.fifty_two_week.low) || 0,
              yearHigh: parseFloat(data.fifty_two_week.high) || 0,
              volume: parseInt(data.volume) || 0,
              avgVolume: null
            };
          }
        } catch (error) {
          // Continue to next variant
          continue;
        }
      }

      return null;
    } catch (error) {
      console.error('Error fetching stock data from Twelve Data:', error);
      return null;
    }
  }

  // Helper method to format stock data response
  formatStockDataResponse(priceData, profileData) {
    return {
      symbol: priceData.symbol,
      name: profileData.companyName,
      price: priceData.price,
      change: priceData.change,
      changesPercentage: priceData.changesPercentage,
      marketCap: profileData.mktCap,
      pe: priceData.pe,
      eps: priceData.eps,
      description: profileData.description,
      sector: profileData.sector,
      industry: profileData.industry,
      website: profileData.website,
      dayLow: priceData.dayLow,
      dayHigh: priceData.dayHigh,
      yearLow: priceData.yearLow,
      yearHigh: priceData.yearHigh,
      volume: priceData.volume,
      avgVolume: priceData.avgVolume
    };
  }

  // Get top gainers/losers
  async getTopMovers(type = 'gainers') {
    try {
      const endpoint = type === 'gainers' ? 'gainers' : 'losers';
      const response = await axios.get(
        `https://financialmodelingprep.com/api/v3/stock_market/${endpoint}?apikey=${this.fmpApiKey}`
      );
      return response.data.slice(0, 10); // Return top 10
    } catch (error) {
      console.error(`Error fetching ${type}:`, error);
      return [];
    }
  }

  // Get market news
  async getMarketNews(symbol = null, limit = 5) {
    try {
      const url = symbol 
        ? `https://financialmodelingprep.com/api/v3/stock_news?tickers=${symbol}&limit=${limit}&apikey=${this.fmpApiKey}`
        : `https://financialmodelingprep.com/api/v3/stock_news?limit=${limit}&apikey=${this.fmpApiKey}`;
      
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching news:', error);
      return [];
    }
  }

  // Process user message and generate response
  async processMessage(userMessage, chatHistory = []) {
    console.log('🤖 Processing message:', userMessage);
    console.log('📚 Chat history length:', chatHistory.length);

    try {
      // First, try to match with command processors
      const commandResult = await this.processWithCommandProcessors(userMessage);

      if (commandResult.matched) {
        console.log('✅ Command matched:', commandResult.processor);

        // Generate AI response with the processed data
        const aiResponse = await this.generateEnhancedResponse(
          userMessage,
          commandResult.data,
          chatHistory
        );

        return {
          success: true,
          message: aiResponse,
          stockData: commandResult.stockData,
          additionalData: commandResult.additionalData,
          timestamp: new Date().toISOString()
        };
      }

      // Fallback to original processing for unmatched commands
      return await this.processGenericMessage(userMessage, chatHistory);

    } catch (error) {
      console.error('Error processing message:', error);
      return await this.generateFallbackResponse(userMessage, error);
    }
  }

  // Generate enhanced response with processed data
  async generateEnhancedResponse(userMessage, contextData, chatHistory = []) {
    try {
      const systemPrompt = this.getSystemPrompt();
      const conversationHistory = this.formatChatHistory(chatHistory);

      const prompt = `${systemPrompt}

${conversationHistory}

User Query: ${userMessage}

Relevant Data:
${contextData}

Please provide a comprehensive, helpful response based on the data above. Format your response clearly with proper sections and bullet points where appropriate. Use Indian Rupees (₹) for all currency values.`;

      const result = await this.model.generateContent(prompt);
      const response = result.response;
      const text = response.text();

      console.log('✅ Enhanced AI response generated successfully');

      return text;
    } catch (error) {
      console.error('❌ Error generating enhanced response:', error);
      return `Based on the data I found:\n\n${contextData}\n\nI hope this information helps! Let me know if you need more details about any specific aspect.`;
    }
  }

  // Process generic messages (fallback)
  async processGenericMessage(userMessage, chatHistory = []) {
    try {
      // Check if user is asking for specific stock data
      const stockSymbolMatch = userMessage.match(/\b([A-Z]{1,5})\b/g);
      let stockData = null;
      let additionalContext = '';

      // If a stock symbol is mentioned, fetch its data
      if (stockSymbolMatch) {
        for (const symbol of stockSymbolMatch) {
          const data = await this.getStockData(symbol);
          if (data) {
            stockData = data;
            additionalContext = this.formatStockData(data);
            break;
          }
        }
      }

      const systemPrompt = this.getSystemPrompt();
      const conversationHistory = this.formatChatHistory(chatHistory);

      const prompt = `${systemPrompt}

${conversationHistory}

${additionalContext ? `Current Stock Data:\n${additionalContext}\n\n` : ''}

User: ${userMessage}`;

      const result = await this.model.generateContent(prompt);
      const response = result.response;
      const text = response.text();

      console.log('✅ Generic AI response generated successfully');

      return {
        success: true,
        message: text,
        stockData: stockData,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Error in generic processing:', error);
      return await this.generateFallbackResponse(userMessage, error);
    }
  }

  // Generate fallback response for errors
  async generateFallbackResponse(userMessage, error) {
    console.log('🔄 Generating fallback response for:', userMessage);

    let fallbackResponse = "Hello! I'm Saytrix, your stock market assistant. ";

    if (userMessage.toLowerCase().includes('hello') || userMessage.toLowerCase().includes('hi')) {
      fallbackResponse += "How can I help you with stock market information today?";
    } else if (userMessage.toLowerCase().includes('stock') || userMessage.toLowerCase().includes('price')) {
      fallbackResponse += "I can help you with stock prices, market analysis, and company information. What specific stock would you like to know about?";
    } else if (userMessage.toLowerCase().includes('news')) {
      fallbackResponse += "I can provide you with the latest market news and updates. Would you like general market news or news about a specific stock?";
    } else if (userMessage.toLowerCase().includes('gainers') || userMessage.toLowerCase().includes('losers')) {
      fallbackResponse += "I can show you today's top gainers and losers in the market. Would you like to see the top performers?";
    } else {
      fallbackResponse += "I can help you with stock prices, market analysis, company information, and trading insights. What would you like to know about the stock market today?";
    }

    return {
      success: true,
      message: fallbackResponse,
      timestamp: new Date().toISOString()
    };
  }

  // Process message with command processors
  async processWithCommandProcessors(userMessage) {
    for (const processor of this.commandProcessors) {
      for (const pattern of processor.patterns) {
        const match = userMessage.match(pattern);
        if (match) {
          console.log(`🎯 Pattern matched: ${pattern} for processor: ${processor.description}`);

          try {
            const result = await processor.processor(userMessage, match);
            return {
              matched: true,
              processor: processor.description,
              data: result.data,
              stockData: result.stockData,
              additionalData: result.additionalData
            };
          } catch (error) {
            console.error(`❌ Error in processor ${processor.description}:`, error);
            continue; // Try next processor
          }
        }
      }
    }

    return { matched: false };
  }



  // Get quick suggestions based on user input
  getQuickSuggestions(input) {
    const suggestions = [
      'Tell me about RELIANCE stock',
      'What are today\'s top gainers?',
      'Show me TCS stock price',
      'Latest market news',
      'What is PE ratio?',
      'How is NIFTY performing?',
      'Top losers today',
      'Explain market cap'
    ];

    if (!input || input.length < 2) {
      return suggestions.slice(0, 4);
    }

    const filtered = suggestions.filter(suggestion => 
      suggestion.toLowerCase().includes(input.toLowerCase())
    );

    return filtered.length > 0 ? filtered : suggestions.slice(0, 4);
  }

  // Command Processor Methods
  async processStockQuery(userMessage, match) {
    const stockSymbol = this.extractStockSymbol(userMessage, match);
    console.log('📈 Processing stock query for:', stockSymbol);

    if (!stockSymbol) {
      return {
        data: "I couldn't identify a specific stock symbol. Please provide a valid stock symbol like RELIANCE, TCS, or INFY.",
        stockData: null,
        additionalData: null
      };
    }

    const stockData = await this.getStockData(stockSymbol);

    if (!stockData) {
      return {
        data: `I couldn't find data for ${stockSymbol}. Please check if the symbol is correct or try a different stock.`,
        stockData: null,
        additionalData: null
      };
    }

    const contextData = this.formatStockData(stockData);

    return {
      data: contextData,
      stockData: stockData,
      additionalData: {
        type: 'stock_info',
        symbol: stockSymbol,
        timestamp: new Date().toISOString()
      }
    };
  }

  async processTopGainers(userMessage, match) {
    console.log('📈 Processing top gainers query');

    const gainers = await this.getTopMovers('gainers');

    if (!gainers || gainers.length === 0) {
      return {
        data: "I'm unable to fetch the top gainers data right now. Please try again later.",
        stockData: null,
        additionalData: null
      };
    }

    const contextData = this.formatTopMovers(gainers, 'gainers');

    return {
      data: contextData,
      stockData: null,
      additionalData: {
        type: 'top_gainers',
        data: gainers.slice(0, 10),
        timestamp: new Date().toISOString()
      }
    };
  }

  async processTopLosers(userMessage, match) {
    console.log('📉 Processing top losers query');

    const losers = await this.getTopMovers('losers');

    if (!losers || losers.length === 0) {
      return {
        data: "I'm unable to fetch the top losers data right now. Please try again later.",
        stockData: null,
        additionalData: null
      };
    }

    const contextData = this.formatTopMovers(losers, 'losers');

    return {
      data: contextData,
      stockData: null,
      additionalData: {
        type: 'top_losers',
        data: losers.slice(0, 10),
        timestamp: new Date().toISOString()
      }
    };
  }

  async processNewsQuery(userMessage, match) {
    console.log('📰 Processing news query');

    // Check if specific stock is mentioned
    const stockSymbol = this.extractStockSymbol(userMessage, match);
    const news = await this.getMarketNews(stockSymbol, 5);

    if (!news || news.length === 0) {
      return {
        data: "I'm unable to fetch the latest news right now. Please try again later.",
        stockData: null,
        additionalData: null
      };
    }

    const contextData = this.formatNews(news, stockSymbol);

    return {
      data: contextData,
      stockData: null,
      additionalData: {
        type: 'market_news',
        symbol: stockSymbol,
        data: news,
        timestamp: new Date().toISOString()
      }
    };
  }

  async processStockComparison(userMessage, match) {
    console.log('🔍 Processing stock comparison');

    const stock1 = match[1]?.trim().toUpperCase();
    const stock2 = match[2]?.trim().toUpperCase();

    if (!stock1 || !stock2) {
      return {
        data: "Please provide two valid stock symbols for comparison, like 'Compare TCS and INFY'.",
        stockData: null,
        additionalData: null
      };
    }

    const [data1, data2] = await Promise.all([
      this.getStockData(stock1),
      this.getStockData(stock2)
    ]);

    if (!data1 || !data2) {
      return {
        data: `I couldn't find data for ${!data1 ? stock1 : stock2}. Please check the stock symbols.`,
        stockData: null,
        additionalData: null
      };
    }

    const contextData = this.formatStockComparison(data1, data2);

    return {
      data: contextData,
      stockData: null,
      additionalData: {
        type: 'stock_comparison',
        stocks: [data1, data2],
        timestamp: new Date().toISOString()
      }
    };
  }

  async processIndexQuery(userMessage, match) {
    console.log('📊 Processing index query');

    // For now, provide general index information
    // In the future, you can integrate with index APIs
    const contextData = `
Market Index Information:

**NIFTY 50**: The National Stock Exchange's benchmark index comprising 50 large-cap stocks.
**SENSEX**: BSE's benchmark index with 30 well-established companies.

These indices represent the overall market performance and are key indicators of market sentiment.

For real-time index data, please check the market dashboard or specify which index you'd like to know about.`;

    return {
      data: contextData,
      stockData: null,
      additionalData: {
        type: 'market_index',
        timestamp: new Date().toISOString()
      }
    };
  }

  async processEducationalQuery(userMessage, match) {
    console.log('🎓 Processing educational query');

    const topic = match[1]?.toLowerCase();
    const educationalData = this.getEducationalContent(topic);

    return {
      data: educationalData,
      stockData: null,
      additionalData: {
        type: 'educational',
        topic: topic,
        timestamp: new Date().toISOString()
      }
    };
  }

  async processPortfolioQuery(userMessage, match) {
    console.log('💼 Processing portfolio query');

    // This would integrate with user's portfolio data
    const contextData = `
To view your portfolio, please visit the Portfolio section in the app.

I can help you with:
- Analyzing individual stocks in your portfolio
- Comparing your holdings
- Getting news about your stocks
- Understanding market trends affecting your investments

What specific aspect of your portfolio would you like to discuss?`;

    return {
      data: contextData,
      stockData: null,
      additionalData: {
        type: 'portfolio',
        timestamp: new Date().toISOString()
      }
    };
  }

  // Helper Methods
  getSystemPrompt() {
    return this.systemInstruction;
  }

  formatChatHistory(chatHistory) {
    if (!chatHistory || chatHistory.length === 0) {
      return '';
    }

    return chatHistory.map(msg => {
      const role = msg.role === 'user' ? 'User' : 'Assistant';
      return `${role}: ${msg.content}`;
    }).join('\n');
  }

  extractStockSymbol(userMessage, match) {
    // Try to extract from regex match first
    if (match && match[1]) {
      let symbol = match[1].trim().toUpperCase();
      // Remove common words that might be captured
      symbol = symbol.replace(/\b(STOCK|SHARE|COMPANY|DATA|PRICE|INFO|ABOUT)\b/g, '').trim();
      if (symbol && symbol.length >= 2 && symbol.length <= 15) {
        return symbol;
      }
    }

    // Try to find stock symbols in the message (more flexible)
    const symbolMatch = userMessage.match(/\b([A-Z]{2,15})\b/g);
    if (symbolMatch) {
      for (const symbol of symbolMatch) {
        // Skip common words that are not stock symbols
        const skipWords = ['STOCK', 'SHARE', 'COMPANY', 'DATA', 'PRICE', 'INFO', 'ABOUT', 'TELL', 'SHOW', 'GIVE', 'WHAT', 'THE', 'IS', 'ARE', 'AND', 'OR', 'BUT', 'FOR', 'WITH', 'TO', 'FROM', 'BY', 'AT', 'IN', 'ON', 'OF'];
        if (!skipWords.includes(symbol) && symbol.length >= 2 && symbol.length <= 15) {
          return symbol;
        }
      }
    }

    // Try to match company names to symbols
    // For Indian stocks, we'll try both NSE (.NS) and BSE (.BO) suffixes
    const companyMap = {
      'reliance': 'RELIANCE',
      'tcs': 'TCS',
      'tata consultancy': 'TCS',
      'tata consultancy services': 'TCS',
      'infosys': 'INFY',
      'hdfc bank': 'HDFCBANK',
      'icici bank': 'ICICIBANK',
      'state bank': 'SBIN',
      'itc': 'ITC',
      'larsen': 'LT',
      'bharti airtel': 'BHARTIARTL',
      'asian paints': 'ASIANPAINT',
      'zomato': 'ZOMATO',
      'swiggy': 'SWIGGY',
      'paytm': 'PAYTM',
      'ola': 'OLA',
      'flipkart': 'FLIPKART',
      'nykaa': 'NYKAA',
      'policybazaar': 'PB',
      'freshworks': 'FRSH',
      'wipro': 'WIPRO',
      'hcl': 'HCLTECH',
      'tech mahindra': 'TECHM',
      'maruti': 'MARUTI',
      'tata motors': 'TATAMOTORS',
      'mahindra': 'M&M',
      'bajaj': 'BAJFINANCE',
      'kotak': 'KOTAKBANK',
      'axis bank': 'AXISBANK',
      'yes bank': 'YESBANK',
      'indusind': 'INDUSINDBK',
      'adani': 'ADANIPORTS',
      'ambani': 'RELIANCE',
      'tata': 'TCS',
      'birla': 'ULTRACEMCO',
      'godrej': 'GODREJCP',
      'mahindra tech': 'TECHM',
      'sun pharma': 'SUNPHARMA',
      'dr reddy': 'DRREDDY',
      'cipla': 'CIPLA',
      'lupin': 'LUPIN',
      'biocon': 'BIOCON',
      'titan': 'TITAN',
      'tanishq': 'TITAN',
      'nestle': 'NESTLEIND',
      'hindustan unilever': 'HINDUNILVR',
      'unilever': 'HINDUNILVR',
      'britannia': 'BRITANNIA',
      'dabur': 'DABUR',
      'marico': 'MARICO',
      'colgate': 'COLPAL',
      'pidilite': 'PIDILITIND',
      'berger': 'BERGEPAINT',
      'asian paint': 'ASIANPAINT',
      'ultratech': 'ULTRACEMCO',
      'acc cement': 'ACC',
      'ambuja': 'AMBUJACEM',
      'grasim': 'GRASIM',
      'jsw': 'JSWSTEEL',
      'tata steel': 'TATASTEEL',
      'sail': 'SAIL',
      'hindalco': 'HINDALCO',
      'vedanta': 'VEDL',
      'coal india': 'COALINDIA',
      'ongc': 'ONGC',
      'ioc': 'IOC',
      'bpcl': 'BPCL',
      'hpcl': 'HPCL',
      'gail': 'GAIL',
      'ntpc': 'NTPC',
      'power grid': 'POWERGRID',
      'bhel': 'BHEL',
      'lic': 'LICI',
      'sbi life': 'SBILIFE',
      'hdfc life': 'HDFCLIFE',
      'icici prudential': 'ICICIPRULI',
      'bajaj allianz': 'BAJAJHLDNG',
      'hero motocorp': 'HEROMOTOCO',
      'bajaj auto': 'BAJAJ-AUTO',
      'tvs motor': 'TVSMOTOR',
      'eicher': 'EICHERMOT',
      'ashok leyland': 'ASHOKLEY',
      'tata consumer': 'TATACONSUM',
      'godrej consumer': 'GODREJCP',
      'marico': 'MARICO',
      'emami': 'EMAMILTD',
      'jubilant': 'JUBLFOOD',
      'dominos': 'JUBLFOOD',
      'mcdonald': 'WESTLIFE',
      'kfc': 'DEVYANI',
      'pizza hut': 'DEVYANI',
      'cafe coffee day': 'COFFEEDAY',
      'barista': 'BARISTA',
      'haldiram': 'HALDIRAM',
      'patanjali': 'PATANJALI',
      'baba ramdev': 'PATANJALI',
      'jumeta': 'ZOMATO'  // Handle the specific case mentioned by user
    };

    const lowerMessage = userMessage.toLowerCase();
    for (const [company, symbol] of Object.entries(companyMap)) {
      if (lowerMessage.includes(company)) {
        return symbol;
      }
    }

    return null;
  }

  formatStockData(stockData) {
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

🏢 **Sector**: ${stockData.sector || 'N/A'}
🔧 **Industry**: ${stockData.industry || 'N/A'}`;
  }

  formatTopMovers(movers, type) {
    const emoji = type === 'gainers' ? '📈' : '📉';
    const title = type === 'gainers' ? 'Top Gainers' : 'Top Losers';

    let formatted = `${emoji} **${title} Today**\n\n`;

    movers.slice(0, 10).forEach((stock, index) => {
      const changeSymbol = stock.changesPercentage >= 0 ? '📈' : '📉';
      formatted += `${index + 1}. **${stock.symbol}** - ${stock.name}\n`;
      formatted += `   💰 ₹${stock.price?.toFixed(2) || 'N/A'} ${changeSymbol} ${stock.changesPercentage?.toFixed(2) || 'N/A'}%\n\n`;
    });

    return formatted;
  }

  formatNews(news, symbol = null) {
    const title = symbol ? `📰 Latest News for ${symbol}` : '📰 Latest Market News';

    let formatted = `${title}\n\n`;

    news.slice(0, 5).forEach((article, index) => {
      formatted += `${index + 1}. **${article.title}**\n`;
      formatted += `   📅 ${new Date(article.publishedDate).toLocaleDateString()}\n`;
      if (article.text && article.text.length > 0) {
        formatted += `   📝 ${article.text.substring(0, 150)}...\n`;
      }
      formatted += '\n';
    });

    return formatted;
  }

  formatStockComparison(stock1, stock2) {
    const change1Symbol = stock1.change >= 0 ? '📈' : '📉';
    const change2Symbol = stock2.change >= 0 ? '📈' : '📉';

    return `
🔍 **Stock Comparison: ${stock1.symbol} vs ${stock2.symbol}**

**${stock1.name} (${stock1.symbol})**
💰 Price: ₹${stock1.price?.toFixed(2) || 'N/A'} ${change1Symbol} ${stock1.changesPercentage?.toFixed(2) || 'N/A'}%
📊 Market Cap: ${stock1.marketCap ? '₹' + (stock1.marketCap / 10000000).toFixed(0) + ' Cr' : 'N/A'}
📈 P/E Ratio: ${stock1.pe?.toFixed(2) || 'N/A'}

**${stock2.name} (${stock2.symbol})**
💰 Price: ₹${stock2.price?.toFixed(2) || 'N/A'} ${change2Symbol} ${stock2.changesPercentage?.toFixed(2) || 'N/A'}%
📊 Market Cap: ${stock2.marketCap ? '₹' + (stock2.marketCap / 10000000).toFixed(0) + ' Cr' : 'N/A'}
📈 P/E Ratio: ${stock2.pe?.toFixed(2) || 'N/A'}

**Quick Analysis**:
• Better Performer Today: ${Math.abs(stock1.changesPercentage || 0) > Math.abs(stock2.changesPercentage || 0) ? stock1.symbol : stock2.symbol}
• Larger Market Cap: ${(stock1.marketCap || 0) > (stock2.marketCap || 0) ? stock1.symbol : stock2.symbol}
• Lower P/E Ratio: ${(stock1.pe || Infinity) < (stock2.pe || Infinity) ? stock1.symbol : stock2.symbol}`;
  }

  getEducationalContent(topic) {
    const educationalMap = {
      'pe ratio': `
📊 **P/E Ratio (Price-to-Earnings Ratio)**

The P/E ratio compares a company's stock price to its earnings per share (EPS).

**Formula**: P/E = Stock Price ÷ Earnings Per Share

**What it means**:
• **High P/E**: Stock may be overvalued or investors expect high growth
• **Low P/E**: Stock may be undervalued or company has slow growth
• **Industry Average**: Compare with sector peers for context

**Example**: If a stock trades at ₹100 and EPS is ₹10, P/E = 10
This means investors pay ₹10 for every ₹1 of earnings.`,

      'market cap': `
💰 **Market Capitalization**

Market cap is the total value of a company's shares in the stock market.

**Formula**: Market Cap = Share Price × Total Outstanding Shares

**Categories**:
• **Large Cap**: > ₹20,000 Cr (Stable, established companies)
• **Mid Cap**: ₹5,000 - ₹20,000 Cr (Growing companies)
• **Small Cap**: < ₹5,000 Cr (High growth potential, higher risk)

**Why it matters**: Indicates company size and investment risk level.`,

      'stock market': `
📈 **Stock Market Basics**

The stock market is where shares of publicly traded companies are bought and sold.

**Key Concepts**:
• **Shares**: Ownership units in a company
• **NSE/BSE**: Major Indian stock exchanges
• **NIFTY/SENSEX**: Market indices tracking top companies
• **Bull Market**: Rising prices, optimistic sentiment
• **Bear Market**: Falling prices, pessimistic sentiment

**How to invest**: Open demat account → Research companies → Buy shares → Monitor performance`,

      'eps': `
💵 **Earnings Per Share (EPS)**

EPS shows how much profit a company makes for each share.

**Formula**: EPS = Net Income ÷ Outstanding Shares

**Types**:
• **Basic EPS**: Simple calculation
• **Diluted EPS**: Includes potential shares from options/bonds

**Higher EPS = Better profitability per share**
Used to calculate P/E ratio and compare companies.`
    };

    return educationalMap[topic] || `
🎓 **Learning About: ${topic}**

I'd be happy to explain financial concepts! Here are some topics I can help with:

• **P/E Ratio** - Valuation metric
• **Market Cap** - Company size indicator
• **EPS** - Earnings per share
• **Stock Market** - Basic concepts
• **Dividend Yield** - Income from stocks
• **Beta** - Stock volatility measure

Ask me about any of these topics for detailed explanations!`;
  }
}

module.exports = new GeminiService();
