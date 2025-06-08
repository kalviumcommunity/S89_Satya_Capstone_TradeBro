const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { getStockData, getTopGainers, cleanupResponse } = require('./chatbotHelper');
const User = require('./models/User');
const VirtualMoney = require('./models/VirtualMoney');
const UserDataManager = require('./utils/userDataManager');

const router = express.Router();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

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

// Chat sessions cache
const chatSessions = new Map();

router.post('/start', async (req, res) => {
  try {
    const sessionId = req.body.sessionId || Date.now().toString();
    const userEmail = req.body.user;

    if (userEmail) {
      try {
        const user = await User.findOne({ email: userEmail });

        if (user) {
          let virtualMoney = await VirtualMoney.findOne({ userId: user._id });
          if (!virtualMoney && user.email) {
            virtualMoney = await VirtualMoney.findOne({ userEmail: user.email });
          }

          const personalizedInstruction = systemInstruction[0].text + `\n\n*User Information:*\nUsername: ${user.username}\nEmail: ${user.email}\n`;

          let portfolioInfo = "";
          if (virtualMoney && virtualMoney.portfolio && virtualMoney.portfolio.length > 0) {
            portfolioInfo = "\n*User Portfolio:*\n";
            virtualMoney.portfolio.forEach(stock => {
              portfolioInfo += `- ${stock.stockSymbol}: ${stock.quantity} shares at avg. price $${stock.averageBuyPrice.toFixed(2)}\n`;
            });
          }

          const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
          const fullInstruction = personalizedInstruction + portfolioInfo;

          const chat = model.startChat({
            history: [
              { role: 'user', parts: [{ text: fullInstruction }] },
              {
                role: 'model',
                parts: [{
                  text: `I understand my role as TradeBro, a friendly and conversational stock market assistant for ${user.username}. I'll be helpful, engaging, and personable while providing accurate information about stocks and trading. I'll follow all the guidelines you've provided and personalize my responses based on your portfolio and preferences.`
                }],
              },
            ],
            generationConfig: {
              thinkingConfig: { thinkingBudget: 0 },
              responseMimeType: 'text/plain',
              temperature: 0.7,
              maxOutputTokens: 2048,
            },
          });

          chatSessions.set(sessionId, chat);

          await UserDataManager.addChatMessage(
            user._id,
            user.email,
            sessionId,
            `I understand my role as TradeBro, a friendly and conversational stock market assistant for ${user.username}. I'll be helpful, engaging, and personable while providing accurate information about stocks and trading. I'll follow all the guidelines you've provided and personalize my responses based on your portfolio and preferences.`,
            'bot'
          );

          return res.status(200).json({
            success: true,
            sessionId,
            message: "Personalized chat session started successfully"
          });
        }
      } catch (userError) {
        console.error('Error finding user for personalization:', userError);
      }
    }

    // Fallback to standard chat if no user or lookup failed
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const chat = model.startChat({
      history: [
        { role: 'user', parts: [{ text: systemInstruction[0].text }] },
        {
          role: 'model',
          parts: [{ text: `I understand my role as TradeBro, a friendly and conversational stock market assistant.` }],
        },
      ],
      generationConfig: {
        thinkingConfig: { thinkingBudget: 0 },
        responseMimeType: 'text/plain',
        temperature: 0.7,
        maxOutputTokens: 2048,
      },
    });

    chatSessions.set(sessionId, chat);

    return res.status(200).json({
      success: true,
      sessionId,
      message: "Chat session started successfully"
    });
  } catch (error) {
    console.error('Error starting chat session:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/message', async (req, res) => {
  try {
    const { sessionId, message } = req.body;

    if (!sessionId || !message) {
      return res.status(400).json({ success: false, error: "Session ID and message are required" });
    }

    const chat = chatSessions.get(sessionId);
    if (!chat) {
      return res.status(404).json({ success: false, error: "Chat session not found" });
    }

    // Example: Handle 'top gainers' special command
    if (message.toLowerCase().includes('top gainers')) {
      const topGainers = await getTopGainers();
      if (topGainers.length > 0) {
        return res.status(200).json({ success: true, type: 'topGainers', data: topGainers });
      }
      return res.status(200).json({ success: true, type: 'text', message: "Sorry, I couldn't retrieve the top gainers data right now." });
    }

    // Handle greetings, stock symbol checks, and chatbot interaction here...
    // (You can add your full message handling logic here similarly as in your original code)

    // Example: just send the message to Gemini chat and return response (simplified)
    const result = await chat.sendMessage(message);
    let response = result.response.text();
    response = cleanupResponse(response);

    return res.status(200).json({ success: true, type: 'text', message: response });

  } catch (error) {
    console.error('Error processing message:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
