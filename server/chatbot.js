const express = require('express');
const dotenv = require('dotenv');
const axios = require('axios');
const { GoogleGenerativeAI } = require('@google/generative-ai');

dotenv.config();  // Load environment variables from .env file

const router = express.Router();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);  // Load Gemini API key

// System Instruction for the chatbot
const systemInstruction = [
  {
    text: `*System Role:* You are TradeBro, a friendly and conversational stock market assistant. You're designed to be helpful, engaging, and personable while providing accurate information about stocks and trading.

*Prompt Details:*
1. Be conversational and friendly - use greetings like "Hi", "Hello", and casual language.
2. Respond to general questions in a conversational manner, as if chatting with a friend.
3. Only provide stock data when users specifically ask about a stock or company.
4. When greeting users or responding to general questions, don't mention stocks unless asked.
5. For casual greetings like "hi", "hello", "how are you", respond in a friendly, casual way without mentioning stocks.
6. When users ask about specific stocks, provide information in a structured format.
7. Use emojis occasionally to make conversations more engaging (but don't overuse them).
8. Maintain a confident, helpful tone throughout all interactions.
9. For Indian stocks, provide information relevant to the Indian market (NSE/BSE).
10. Keep disclaimers brief and only include them when providing actual stock data.
11. Personalize responses by occasionally using the user's questions in your answers.
12. For any stock query, provide the following data points: price, daily high, daily low, market cap, P/E ratio, and volume.
13. For stocks not in your database, provide reasonable simulated data.
14. NEVER ask the user for API details or similar technical information.
15. DO NOT mention or discuss virtual money, coins, or any virtual currency features.
16. Focus only on providing real stock market information and analysis.

*Sample Conversational Responses:*
- "Hi there! How can I help with your trading questions today?"
- "Hello! I'm TradeBro, your friendly trading assistant. What would you like to know?"
- "I'm doing great, thanks for asking! How can I assist with your trading journey today?"

*Sample Response Format for Stock Queries:*
"Here's the latest data for [STOCK_NAME]:

• Price: $XX.XX
• Daily High: $XX.XX
• Daily Low: $XX.XX
• Market Cap: $XX.XX billion
• P/E Ratio: XX.XX
• Volume: XX,XXX,XXX

Remember that market conditions change quickly, so always verify before making decisions! 📈"
`
  }
];

// Function to get stock data using our proxy server
const getStockData = async (symbol) => {
  try {
    // Use our proxy server instead of direct API call
    const url = `http://localhost:${process.env.PORT || 5000}/api/proxy/stock-batch?symbols=${symbol}`;
    const response = await axios.get(url);

    if (response.data && response.data.length > 0) {
      const stockData = response.data[0];
      return {
        price: stockData.price,
        dayHigh: stockData.dayHigh,
        dayLow: stockData.dayLow,
        marketCap: stockData.marketCap,
        peRatio: stockData.pe,
        volume: stockData.volume
      };
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error fetching stock data:', error.message);
    return null;
  }
};

// Function to get top gainers using our proxy server
const getTopGainers = async () => {
  try {
    // Use our proxy server instead of direct API call
    const url = `http://localhost:${process.env.PORT || 5000}/api/proxy/top-gainers`;
    const response = await axios.get(url);

    if (response.data && response.data.length > 0) {
      return response.data.slice(0, 5).map(stock => ({
        symbol: stock.symbol,
        companyName: stock.name,
        price: stock.price,
        changePercent: stock.changesPercentage
      }));
    }
    return [];
  } catch (error) {
    console.error('Error fetching top gainers data:', error.message);
    return [];
  }
};

// Initialize chat sessions cache
const chatSessions = new Map();

// Import models
const User = require('./models/User');
const VirtualMoney = require('./models/VirtualMoney');
const { verifyToken } = require('./middleware/auth');

// Endpoint to start a new chat session
router.post('/start', async (req, res) => {
  try {
    const sessionId = req.body.sessionId || Date.now().toString();

    // Initialize the generative model for Gemini AI
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

    // Start a chat session with a basic system instruction
    const chat = model.startChat({
      history: [
        {
          role: 'user',
          parts: [{ text: systemInstruction[0].text }],
        },
        {
          role: 'model',
          parts: [{ text: `I understand my role as TradeBro, a friendly and conversational stock market assistant. I'll be helpful, engaging, and personable while providing accurate information about stocks and trading.` }],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        topP: 0.95,
        topK: 64,
        maxOutputTokens: 2048,
      },
    });

    // Store the chat session
    chatSessions.set(sessionId, chat);

    res.status(200).json({
      success: true,
      sessionId,
      message: "Chat session started successfully"
    });
    return;
  } catch (error) {
    console.error('Error starting chat session:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
    return;
  }

  // If we get here, try the authenticated version
  if (req.user) {
    try {
      const sessionId = req.body.sessionId || Date.now().toString();

      // Get user details for personalization
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Get user's virtual money data
      let virtualMoney = await VirtualMoney.findOne({ userId: req.user.id });
      if (!virtualMoney && user.email) {
        virtualMoney = await VirtualMoney.findOne({ userEmail: user.email });
      }

      // Create personalized system instruction
      const personalizedInstruction = systemInstruction[0].text + `\n\n*User Information:*\nUsername: ${user.username}\nEmail: ${user.email}\n`;

      // Add portfolio information if available
      let portfolioInfo = "";
      if (virtualMoney && virtualMoney.portfolio && virtualMoney.portfolio.length > 0) {
        portfolioInfo = "\n*User Portfolio:*\n";
        virtualMoney.portfolio.forEach(stock => {
          portfolioInfo += `- ${stock.stockSymbol}: ${stock.quantity} shares at avg. price $${stock.averageBuyPrice.toFixed(2)}\n`;
        });
      }

      // Initialize the generative model for Gemini AI
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

      // Combine personalized instruction with portfolio info
      const fullInstruction = personalizedInstruction + portfolioInfo;

      // Start a chat session with the personalized system instruction
      const chat = model.startChat({
        history: [
          {
            role: 'user',
            parts: [{ text: fullInstruction }], // System message with personalized instruction
          },
          {
            role: 'model',
            parts: [{ text: `I understand my role as TradeBro, a friendly and conversational stock market assistant for ${user.username}. I'll be helpful, engaging, and personable while providing accurate information about stocks and trading. I'll follow all the guidelines you've provided and personalize my responses based on your portfolio and preferences.` }],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          topP: 0.95,
          topK: 64,
          maxOutputTokens: 2048,
        },
      });

      // Store the chat session
      chatSessions.set(sessionId, chat);

      res.status(200).json({
        success: true,
        sessionId,
        message: "Chat session started successfully"
      });
    } catch (error) {
      console.error('Error starting chat session:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
});

// Endpoint to send a message to the chatbot
router.post('/message', async (req, res) => {
  try {
    const { sessionId, message } = req.body;

    if (!sessionId || !message) {
      return res.status(400).json({
        success: false,
        error: "Session ID and message are required"
      });
    }

    // Get the chat session
    const chat = chatSessions.get(sessionId);

    if (!chat) {
      return res.status(404).json({
        success: false,
        error: "Chat session not found"
      });
    }

    // Check for special commands
    if (message.toLowerCase().includes('top gainers')) {
      const topGainers = await getTopGainers();

      if (topGainers.length > 0) {
        return res.status(200).json({
          success: true,
          type: 'topGainers',
          data: topGainers
        });
      } else {
        return res.status(200).json({
          success: true,
          type: 'text',
          message: "Sorry, I couldn't retrieve the top gainers data right now."
        });
      }
    } else if (message.toLowerCase().includes('stock') ||
               message.toLowerCase().includes('share') ||
               message.toLowerCase().includes('zomato') ||
               /\b[A-Z]{2,5}\b/.test(message.toUpperCase())) {

      // Define common greetings and conversational words to exclude from stock symbol detection
      const commonGreetings = [
        'hi', 'hello', 'hey', 'greetings', 'howdy', 'hola', 'morning', 'afternoon',
        'evening', 'good', 'nice', 'welcome', 'thanks', 'thank', 'please', 'help',
        'how', 'what', 'when', 'where', 'why', 'who', 'which', 'yes', 'no', 'ok', 'okay',
        'give', 'tell', 'show', 'find', 'search', 'look', 'get', 'fetch', 'display'
      ];

      // Common words that should be ignored when extracting stock symbols
      const commonWords = [
        'stock', 'share', 'price', 'about', 'tell', 'show', 'what', 'how', 'the', 'for', 'and', 'get',
        'me', 'us', 'you', 'i', 'we', 'they', 'them', 'it', 'that', 'this', 'these', 'those',
        'a', 'an', 'of', 'in', 'on', 'at', 'by', 'to', 'for', 'with', 'from', 'related', 'data'
      ];

      // Check if the message is just a simple greeting
      const messageWords = message.toLowerCase().split(/\s+/);
      const isSimpleGreeting = messageWords.length <= 3 &&
                              messageWords.some(word => commonGreetings.includes(word)) &&
                              !message.toLowerCase().includes('stock') &&
                              !message.toLowerCase().includes('share') &&
                              !message.toLowerCase().includes('price') &&
                              !message.toLowerCase().includes('market');

      // If it's a simple greeting, handle it conversationally
      if (isSimpleGreeting) {
        try {
          const result = await chat.sendMessage(message);
          const response = result.response.text();

          return res.status(200).json({
            success: true,
            type: 'text',
            message: response
          });
        } catch (greetingError) {
          console.error('Error handling greeting:', greetingError);

          // Fallback responses for common greetings
          const greetingResponses = {
            'hi': "Hi there! How can I help with your trading questions today?",
            'hello': "Hello! I'm TradeBro, your friendly trading assistant. What would you like to know?",
            'hey': "Hey! Ready to talk stocks and trading strategies? What's on your mind?",
            'how are you': "I'm doing great, thanks for asking! How can I assist with your trading journey today?"
          };

          // Find a matching greeting or use default
          let responseText = "Hello! I'm your TradeBro assistant. How can I help you with stocks or trading today?";
          for (const [greeting, response] of Object.entries(greetingResponses)) {
            if (message.toLowerCase().includes(greeting)) {
              responseText = response;
              break;
            }
          }

          // Try to recreate the chat session if it failed
          try {
            // Initialize the generative model for Gemini AI with a more reliable model
            const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

            // Start a new chat session with a basic system instruction
            const newChat = model.startChat({
              history: [
                {
                  role: 'user',
                  parts: [{ text: systemInstruction[0].text }],
                },
                {
                  role: 'model',
                  parts: [{ text: `I understand my role as TradeBro, a friendly and conversational stock market assistant.` }],
                },
              ],
              generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 1024,
              },
            });

            // Replace the existing chat session
            chatSessions.set(sessionId, newChat);
            console.log("Recreated chat session with more reliable model");
          } catch (recreateError) {
            console.error("Failed to recreate chat session:", recreateError);
          }

          return res.status(200).json({
            success: true,
            type: 'text',
            message: responseText
          });
        }
      }

      // Process the full message to extract context
      // Look for phrases like "give me data about [COMPANY]" or "tell me about [COMPANY] stock"
      let stockSymbol = null;

      // Check for company names in known formats
      const knownCompanies = {
        'google': 'GOOGL',
        'alphabet': 'GOOGL',
        'microsoft': 'MSFT',
        'apple': 'AAPL',
        'amazon': 'AMZN',
        'tesla': 'TSLA',
        'facebook': 'META',
        'meta': 'META',
        'netflix': 'NFLX',
        'zomato': 'ZOMATO',
        'nvidia': 'NVDA',
        'amd': 'AMD',
        'intel': 'INTC',
        'ibm': 'IBM',
        'oracle': 'ORCL',
        'salesforce': 'CRM',
        'twitter': 'TWTR',
        'uber': 'UBER',
        'lyft': 'LYFT',
        'airbnb': 'ABNB',
        'walmart': 'WMT',
        'target': 'TGT',
        'costco': 'COST',
        'nike': 'NKE',
        'coca-cola': 'KO',
        'coke': 'KO',
        'pepsi': 'PEP',
        'pepsico': 'PEP',
        'starbucks': 'SBUX',
        'mcdonald\'s': 'MCD',
        'mcdonalds': 'MCD',
        'disney': 'DIS',
        'boeing': 'BA',
        'ford': 'F',
        'gm': 'GM',
        'general motors': 'GM',
        'ge': 'GE',
        'general electric': 'GE',
        'att': 'T',
        'at&t': 'T',
        'verizon': 'VZ',
        'tmobile': 'TMUS',
        't-mobile': 'TMUS',
        'jp morgan': 'JPM',
        'jpmorgan': 'JPM',
        'bank of america': 'BAC',
        'wells fargo': 'WFC',
        'goldman sachs': 'GS',
        'morgan stanley': 'MS',
        'visa': 'V',
        'mastercard': 'MA',
        'paypal': 'PYPL',
        'square': 'SQ',
        'block': 'SQ',
        'robinhood': 'HOOD',
        'coinbase': 'COIN',
        'pfizer': 'PFE',
        'moderna': 'MRNA',
        'johnson & johnson': 'JNJ',
        'johnson and johnson': 'JNJ',
        'merck': 'MRK',
        'exxon': 'XOM',
        'exxonmobil': 'XOM',
        'chevron': 'CVX',
        'shell': 'SHEL',
        'bp': 'BP',
        'adani': 'ADANIENT.NS',
        'reliance': 'RELIANCE.NS',
        'tata': 'TATAMOTORS.NS',
        'infosys': 'INFY',
        'wipro': 'WIT',
        'tcs': 'TCS.NS'
      };

      // Check if any known company names are in the message
      const lowerMessage = message.toLowerCase();
      for (const [company, symbol] of Object.entries(knownCompanies)) {
        if (lowerMessage.includes(company)) {
          stockSymbol = symbol;
          break;
        }
      }

      // If no known company was found, try to extract a stock symbol
      if (!stockSymbol) {
        // Check for common stock symbols (2-5 uppercase letters)
        const symbolMatch = message.toUpperCase().match(/\b[A-Z]{2,5}\b/);
        if (symbolMatch) {
          // Make sure the matched symbol is not in our common words list
          if (!commonGreetings.includes(symbolMatch[0].toLowerCase()) &&
              !commonWords.includes(symbolMatch[0].toLowerCase())) {
            stockSymbol = symbolMatch[0];
          }
        }
        // If still no symbol, try to extract a potential company name
        else {
          const words = message.split(/\s+/);
          for (const word of words) {
            if (word.length >= 3 &&
                /^[A-Za-z]+$/.test(word) &&
                !commonWords.includes(word.toLowerCase()) &&
                !commonGreetings.includes(word.toLowerCase())) {
              stockSymbol = word.toUpperCase();
              break;
            }
          }
        }
      }

      if (stockSymbol) {
        // Try to get real data first
        let stockData = await getStockData(stockSymbol);

        // If no real data, generate simulated data
        if (!stockData) {
          // Generate simulated data for the stock
          const basePrice = Math.random() * 500 + 50; // Random price between 50 and 550
          stockData = {
            price: parseFloat(basePrice.toFixed(2)),
            dayHigh: parseFloat((basePrice * (1 + Math.random() * 0.05)).toFixed(2)),
            dayLow: parseFloat((basePrice * (1 - Math.random() * 0.05)).toFixed(2)),
            marketCap: parseFloat((basePrice * (Math.random() * 100 + 10) * 1000000).toFixed(2)),
            peRatio: parseFloat((Math.random() * 50 + 10).toFixed(2)),
            volume: Math.floor(Math.random() * 10000000) + 500000
          };
        }

        return res.status(200).json({
          success: true,
          type: 'stockData',
          symbol: stockSymbol,
          data: stockData
        });
      } else {
        // If we couldn't identify a specific stock, ask the model to handle it
        const result = await chat.sendMessage(message);
        const response = result.response.text();

        return res.status(200).json({
          success: true,
          type: 'text',
          message: response
        });
      }
    }

    // Send the message to the Gemini API
    try {
      const result = await chat.sendMessage(message);
      const response = result.response.text();

      res.status(200).json({
        success: true,
        type: 'text',
        message: response
      });
    } catch (generalError) {
      console.error('Error generating response:', generalError);

      // Provide a fallback response
      res.status(200).json({
        success: true,
        type: 'text',
        message: "I'm here to help with your trading and stock market questions. Could you please provide more details about what you'd like to know?"
      });
    }
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Endpoint to end a chat session
router.post('/end', (req, res) => {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: "Session ID is required"
      });
    }

    // Remove the chat session
    chatSessions.delete(sessionId);

    res.status(200).json({
      success: true,
      message: "Chat session ended successfully"
    });
  } catch (error) {
    console.error('Error ending chat session:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Endpoint to get user portfolio for chatbot
router.get('/user-portfolio', verifyToken, async (req, res) => {
  try {
    // Get user details
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get user's virtual money data
    let virtualMoney = await VirtualMoney.findOne({ userId: req.user.id });
    if (!virtualMoney && user.email) {
      virtualMoney = await VirtualMoney.findOne({ userEmail: user.email });
    }

    if (!virtualMoney) {
      return res.status(200).json({
        success: true,
        data: {
          username: user.username,
          email: user.email,
          balance: 0,
          portfolio: []
        }
      });
    }

    // Format portfolio data
    const portfolioData = virtualMoney.portfolio.map(stock => ({
      symbol: stock.stockSymbol,
      quantity: stock.quantity,
      averagePrice: stock.averageBuyPrice,
      lastUpdated: stock.lastUpdated
    }));

    res.status(200).json({
      success: true,
      data: {
        username: user.username,
        email: user.email,
        balance: virtualMoney.balance,
        portfolio: portfolioData
      }
    });
  } catch (error) {
    console.error('Error getting user portfolio:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
