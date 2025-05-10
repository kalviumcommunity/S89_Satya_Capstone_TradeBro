// Helper functions for the chatbot implementation
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize the Google Generative AI with API key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "YOUR_API_KEY");

// Function to handle chatbot interactions
async function generateResponse(userInput) {
  try {
    // Get the model (Gemini 2.0 Flash)
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // Configure the generation
    const generationConfig = {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 1024,
    };

    // Create a chat session
    const chat = model.startChat({
      generationConfig,
      history: [
        {
          role: "user",
          parts: [{ text: "You are a trading assistant for TradeBro, a stock trading platform. Your job is to help users understand stock trading concepts, analyze market trends, and provide educational information about investing. You should be knowledgeable, professional, and helpful. You should NOT provide specific investment advice or recommendations for individual stocks. Always remind users that investing involves risk and they should do their own research. Focus on education rather than specific predictions." }],
        },
        {
          role: "model",
          parts: [{ text: "I understand my role as a trading assistant for TradeBro. I'll focus on providing educational information about stock trading concepts, market analysis techniques, and general investing principles. I'll be knowledgeable, professional, and helpful while avoiding specific investment recommendations or stock picks.\n\nI'll make sure to remind users that investing involves risk and that they should conduct their own research before making investment decisions. My primary goal is to help users learn about trading and investing, not to provide specific financial advice.\n\nHow can I help you understand the world of trading and investing today?" }],
        },
      ],
    });

    // Send the user's message and get a response
    const result = await chat.sendMessage(userInput);
    const response = result.response;
    
    return response.text();
  } catch (error) {
    console.error("Error generating response:", error);
    return "I'm sorry, I encountered an error processing your request. Please try again later.";
  }
}

// Function to clean up response text
function cleanupResponse(text) {
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
}

module.exports = {
  generateResponse,
  cleanupResponse
};
