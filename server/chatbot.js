const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const axios = require('axios');
const { GoogleGenerativeAI } = require('@google/generative-ai');

dotenv.config();  // Load environment variables from .env file

const router = express.Router();
const apiKey = process.env.STOCK_API_KEY;  // Retrieve the stock API key from environment
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

// Function to get stock data
const getStockData = async (symbol) => {
  try {
    const url = `https://financialmodelingprep.com/api/v3/quote/${symbol}?apikey=${apiKey}`;
    const response = await axios.get(url);

    if (response.data.length > 0) {
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

// Function to get top gainers
const getTopGainers = async () => {
  try {
    const url = `https://financialmodelingprep.com/api/v3/stock_market/gainers?apikey=${apiKey}`;
    const response = await axios.get(url);

    if (response.data.length > 0) {
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

// Endpoint to start a new chat session
router.post('/start', async (req, res) => {
  try {
    const sessionId = req.body.sessionId || Date.now().toString();

    // Initialize the generative model for Gemini AI
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    // Start a chat session with the system instruction
    const chat = model.startChat({
      history: [
        {
          role: 'user',
          parts: [{ text: systemInstruction[0].text }], // System message with initial instruction
        },
      ],
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
        const result = await chat.sendMessage(message);
        const response = result.response.text();

        return res.status(200).json({
          success: true,
          type: 'text',
          message: response
        });
      }

      // Process the full message to extract context
      // Look for phrases like "give me data about [COMPANY]" or "tell me about [COMPANY] stock"
      let stockSymbol = null;
      let companyName = null;

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
          companyName = company;
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
    const result = await chat.sendMessage(message);
    const response = result.response.text();

    res.status(200).json({
      success: true,
      type: 'text',
      message: response
    });
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

module.exports = router;
