const express = require('express');
const dotenv = require('dotenv');
const axios = require('axios');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const mime = require('mime');
const jwt = require('jsonwebtoken');

dotenv.config();  // Load environment variables from .env file

const router = express.Router();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);  // Load Gemini API key

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
    // Use our proxy server instead of direct API call
    const url = `${process.env.API_BASE_URL}/api/proxy/stock-batch?symbols=${symbol}`;
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
    const url = `${process.env.API_BASE_URL}/api/proxy/top-gainers`;
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

// Function to clean up response text
const cleanupResponse = (text) => {
  if (!text) return text;

  // Remove any unwanted characters or formatting issues
  let cleanedText = text;

  // Fix any markdown formatting issues
  // Replace triple backticks with double backticks to avoid code block issues
  cleanedText = cleanedText.replace(/```/g, '``');

  // Ensure proper spacing around bullet points
  cleanedText = cleanedText.replace(/•(?!\s)/g, '• ');

  // Fix table formatting if needed
  cleanedText = cleanedText.replace(/\|\s*\n/g, '|\n');

  // Fix hash formatting for headers
  cleanedText = cleanedText.replace(/^#(?!\s)/gm, '# ');
  cleanedText = cleanedText.replace(/^##(?!\s)/gm, '## ');
  cleanedText = cleanedText.replace(/^###(?!\s)/gm, '### ');

  // Fix quote formatting
  cleanedText = cleanedText.replace(/^>(?!\s)/gm, '> ');

  // Remove any extra whitespace at the beginning or end
  cleanedText = cleanedText.trim();

  return cleanedText;
};

// Initialize chat sessions cache
const chatSessions = new Map();

// Import models
const User = require('./models/User');
const VirtualMoney = require('./models/VirtualMoney');
const ChatHistory = require('./models/ChatHistory');
const UserData = require('./models/UserData');
const UserDataManager = require('./utils/userDataManager');
const { verifyToken } = require('./middleware/auth');

// Endpoint to start a new chat session
router.post('/start', async (req, res) => {
  try {
    const sessionId = req.body.sessionId || Date.now().toString();
    const userEmail = req.body.user; // Get user email from request if available

    // Check if we have user information for personalization
    if (userEmail) {
      try {
        // Try to find the user by email for personalization
        const user = await User.findOne({ email: userEmail });

        if (user) {
          // Get user's virtual money data
          let virtualMoney = await VirtualMoney.findOne({ userId: user._id });
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
          const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

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
              thinkingConfig: {
                thinkingBudget: 0,
              },
              responseMimeType: 'text/plain',
              temperature: 0.7,
              maxOutputTokens: 2048,
            },
          });

          // Store the chat session
          chatSessions.set(sessionId, chat);

          console.log(`Started personalized chat session for user: ${user.username}`);

          // Store initial bot message in chat history
          try {
            await UserDataManager.addChatMessage(
              user._id,
              user.email,
              sessionId,
              `I understand my role as TradeBro, a friendly and conversational stock market assistant for ${user.username}. I'll be helpful, engaging, and personable while providing accurate information about stocks and trading. I'll follow all the guidelines you've provided and personalize my responses based on your portfolio and preferences.`,
              'bot'
            );

            console.log(`Created chat history for user: ${user.email}`);
          } catch (historyError) {
            console.error('Error creating chat history:', historyError);
            // Continue without storing history
          }

          return res.status(200).json({
            success: true,
            sessionId,
            message: "Personalized chat session started successfully"
          });
        }
      } catch (userError) {
        console.error('Error finding user for personalization:', userError);
        // Continue with non-personalized chat if user lookup fails
      }
    }

    // If we get here, either no user was provided or user lookup failed
    // Initialize the generative model for Gemini AI with basic instruction
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

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
        thinkingConfig: {
          thinkingBudget: 0,
        },
        responseMimeType: 'text/plain',
        temperature: 0.7,
        maxOutputTokens: 2048,
      },
    });

    // Store the chat session
    chatSessions.set(sessionId, chat);

    console.log(`Started standard chat session with ID: ${sessionId}`);

    return res.status(200).json({
      success: true,
      sessionId,
      message: "Chat session started successfully"
    });
  } catch (error) {
    console.error('Error starting chat session:', error);
    return res.status(500).json({
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

    // Log the incoming message for debugging
    console.log(`Received message: "${message}" for session ${sessionId}`);

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
          // Add a timestamp to the greeting to ensure unique responses
          const uniqueGreeting = `${message} [Greeting ID: ${Date.now()}]`;
          console.log(`Processing greeting: "${message}" with session ${sessionId}`);

          const result = await chat.sendMessage(uniqueGreeting);
          let response = result.response.text();

          // Log the raw response for debugging
          console.log('Raw response from Gemini (greeting):', response);

          // Clean up the response if needed
          response = cleanupResponse(response);

          // Remove any greeting ID that might have been echoed back
          response = response.replace(/\[Greeting ID: \d+\]/g, '').trim();

          // Ensure we have a varied response by adding a random element
          const greetingVariations = [
            "How can I help with your trading questions today?",
            "What would you like to know about the stock market?",
            "I'm here to assist with your investment queries!",
            "What trading information are you looking for?",
            "How can I assist with your financial decisions today?"
          ];

          // Only append a variation if the response is very short (likely just a greeting)
          if (response.length < 30) {
            const randomVariation = greetingVariations[Math.floor(Math.random() * greetingVariations.length)];
            response = `${response} ${randomVariation}`;
          }

          return res.status(200).json({
            success: true,
            type: 'text',
            message: response
          });
        } catch (greetingError) {
          console.error('Error handling greeting:', greetingError);

          // Fallback responses for common greetings with variations
          const greetingResponses = {
            'hi': [
              "Hi there! How can I help with your trading questions today?",
              "Hi! What would you like to know about stocks or trading?",
              "Hi! I'm your TradeBro assistant. What financial information are you looking for?"
            ],
            'hello': [
              "Hello! I'm TradeBro, your friendly trading assistant. What would you like to know?",
              "Hello there! Ready to explore the world of stocks and trading?",
              "Hello! How can I assist with your investment journey today?"
            ],
            'hey': [
              "Hey! Ready to talk stocks and trading strategies? What's on your mind?",
              "Hey there! What market information are you interested in today?",
              "Hey! I'm here to help with all your trading questions. What would you like to know?"
            ],
            'how are you': [
              "I'm doing great, thanks for asking! How can I assist with your trading journey today?",
              "I'm excellent! Ready to help you navigate the financial markets. What can I do for you?",
              "I'm wonderful! What trading or investment topics would you like to explore today?"
            ]
          };

          // Find a matching greeting and select a random variation
          let responseText = "Hello! I'm your TradeBro assistant. How can I help you with stocks or trading today?";
          for (const [greeting, responses] of Object.entries(greetingResponses)) {
            if (message.toLowerCase().includes(greeting)) {
              // Select a random response from the array
              responseText = responses[Math.floor(Math.random() * responses.length)];
              break;
            }
          }

          // Try to recreate the chat session if it failed
          try {
            console.log("Recreating chat session after greeting error");
            // Initialize the generative model for Gemini AI with a more reliable model
            const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

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
                thinkingConfig: {
                  thinkingBudget: 0,
                },
                responseMimeType: 'text/plain',
                temperature: 0.8, // Slightly higher temperature for more variation
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
        let response = result.response.text();

        // Log the raw response for debugging
        console.log('Raw response from Gemini (stock query):', response);

        // Clean up the response if needed
        response = cleanupResponse(response);

        return res.status(200).json({
          success: true,
          type: 'text',
          message: response
        });
      }
    }

    // Send the message to the Gemini API
    try {
      // Add a unique identifier to each message to prevent caching/repetition
      const uniqueMessage = `${message} [Query ID: ${Date.now()}]`;

      // Log the message being sent
      console.log(`Sending message to Gemini: "${message}" with session ${sessionId}`);

      // Try to get user information from the request
      let userId = null;
      let userEmail = null;

      // Check if we have a token in the request
      const token = req.headers.authorization?.split(' ')[1];
      if (token) {
        try {
          // Verify the token to get user ID
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          userId = decoded.id;

          // Get user email
          const user = await User.findById(userId);
          if (user) {
            userEmail = user.email;
          }
        } catch (tokenError) {
          console.error('Error verifying token:', tokenError);
          // Continue without user info
        }
      }

      const result = await chat.sendMessage(uniqueMessage);
      let response = result.response.text();

      // Log the raw response for debugging
      console.log('Raw response from Gemini (general query):', response);

      // Clean up the response if needed
      response = cleanupResponse(response);

      // Remove any query ID that might have been echoed back
      response = response.replace(/\[Query ID: \d+\]/g, '').trim();

      // Store the chat history if we have user information
      if (userId && userEmail) {
        try {
          // Store user message
          await UserDataManager.addChatMessage(
            userId,
            userEmail,
            sessionId,
            message,
            'user'
          );

          // Store bot response
          await UserDataManager.addChatMessage(
            userId,
            userEmail,
            sessionId,
            response,
            'bot'
          );

          console.log(`Stored chat history for user: ${userEmail}`);
        } catch (historyError) {
          console.error('Error storing chat history:', historyError);
          // Continue without storing history
        }
      }

      res.status(200).json({
        success: true,
        type: 'text',
        message: response
      });
    } catch (generalError) {
      console.error('Error generating response:', generalError);

      // Try to recreate the chat session if it failed
      try {
        console.log("Attempting to recreate chat session due to error");

        // Initialize the generative model for Gemini AI with a more reliable model
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

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
            thinkingConfig: {
              thinkingBudget: 0,
            },
            responseMimeType: 'text/plain',
            temperature: 0.7,
            maxOutputTokens: 1024,
          },
        });

        // Replace the existing chat session
        chatSessions.set(sessionId, newChat);
        console.log("Recreated chat session with more reliable model");

        // Try to send the message again with the new session
        const retryResult = await newChat.sendMessage(message);
        let retryResponse = retryResult.response.text();

        // Clean up the response if needed
        retryResponse = cleanupResponse(retryResponse);

        return res.status(200).json({
          success: true,
          type: 'text',
          message: retryResponse
        });
      } catch (retryError) {
        console.error("Failed to recreate chat session:", retryError);

        // Provide a fallback response
        return res.status(200).json({
          success: true,
          type: 'text',
          message: "I'm here to help with your trading and stock market questions. Could you please provide more details about what you'd like to know?"
        });
      }
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
router.post('/end', async (req, res) => {
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

    // Try to get user information from the request
    let userId = null;

    // Check if we have a token in the request
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
      try {
        // Verify the token to get user ID
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        userId = decoded.id;

        // Mark chat session as ended in the database
        if (userId) {
          await UserDataManager.endChatSession(userId, sessionId);
          console.log(`Marked chat session ${sessionId} as ended for user ${userId}`);
        }
      } catch (tokenError) {
        console.error('Error verifying token:', tokenError);
        // Continue without user info
      }
    }

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
