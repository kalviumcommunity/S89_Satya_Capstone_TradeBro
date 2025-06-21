// Fallback server functionality for when backend is not available
// This provides mock responses to keep the frontend functional

const GEMINI_API_KEY = 'AIzaSyD502Fqn3f0P1alBXYIDBfz7nIKflBdt80';

// Mock responses for when server is not available
const mockResponses = {
  greeting: "Hello! I'm Saytrix, your AI trading assistant. I'm currently running in offline mode, but I can still help you with basic information about trading and stocks.",
  
  stockInfo: "I'd be happy to help you with stock information! In normal mode, I can provide real-time stock prices, market analysis, and trading insights. Currently running in offline mode.",
  
  marketAnalysis: "Market analysis is one of my specialties! I can help you understand market trends, analyze stock performance, and provide trading recommendations when connected to live data.",
  
  tradingHelp: "I can assist you with trading strategies, portfolio management, risk assessment, and market insights. Let me know what specific trading topic you'd like to explore!",
  
  default: "I'm here to help with your trading and investment questions! While I'm currently in offline mode, I can still provide general guidance about stocks, trading strategies, and market concepts."
};

// Simple keyword matching for responses
const getResponseForQuery = (query) => {
  const lowerQuery = query.toLowerCase();
  
  if (lowerQuery.includes('hello') || lowerQuery.includes('hi') || lowerQuery.includes('hey')) {
    return mockResponses.greeting;
  }
  
  if (lowerQuery.includes('stock') || lowerQuery.includes('price') || lowerQuery.includes('share')) {
    return mockResponses.stockInfo;
  }
  
  if (lowerQuery.includes('market') || lowerQuery.includes('analysis') || lowerQuery.includes('trend')) {
    return mockResponses.marketAnalysis;
  }
  
  if (lowerQuery.includes('trade') || lowerQuery.includes('trading') || lowerQuery.includes('buy') || lowerQuery.includes('sell')) {
    return mockResponses.tradingHelp;
  }
  
  return mockResponses.default;
};

// Fallback API call using direct Gemini API
const callGeminiDirectly = async (message) => {
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `You are Saytrix, an AI trading assistant. Respond to this trading/finance related query in a helpful and professional manner: ${message}`
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        }
      })
    });

    if (response.ok) {
      const data = await response.json();
      if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        return data.candidates[0].content.parts[0].text;
      }
    }
    
    throw new Error('Invalid response from Gemini API');
  } catch (error) {
    console.error('Direct Gemini API call failed:', error);
    return getResponseForQuery(message);
  }
};

// Main fallback function
export const sendMessageFallback = async (message) => {
  try {
    console.log('🔄 Using fallback mode for Saytrix');
    
    // Try direct Gemini API first
    const response = await callGeminiDirectly(message);
    
    return {
      success: true,
      data: {
        response: response,
        timestamp: new Date().toISOString(),
        mode: 'fallback-gemini'
      }
    };
  } catch (error) {
    console.error('Fallback failed, using mock response:', error);
    
    // Use mock response as last resort
    return {
      success: true,
      data: {
        response: getResponseForQuery(message),
        timestamp: new Date().toISOString(),
        mode: 'fallback-mock'
      }
    };
  }
};

// Check if server is available
export const checkServerAvailability = async () => {
  try {
    const response = await fetch('http://localhost:5000/api/health', {
      method: 'GET',
      timeout: 3000
    });
    return response.ok;
  } catch (error) {
    console.log('Server not available, using fallback mode');
    return false;
  }
};

// Enhanced fetch with fallback
export const fetchWithFallback = async (url, options = {}) => {
  try {
    // Try the original request first
    const response = await fetch(url, {
      ...options,
      timeout: 5000 // 5 second timeout
    });
    
    if (response.ok) {
      return response;
    }
    
    throw new Error(`HTTP ${response.status}`);
  } catch (error) {
    console.warn('Primary request failed, checking for fallback options:', error.message);
    
    // If it's a Saytrix chat request, use fallback
    if (url.includes('/api/saytrix/chat') && options.method === 'POST') {
      const body = JSON.parse(options.body);
      const fallbackResponse = await sendMessageFallback(body.message);
      
      // Return a Response-like object
      return {
        ok: true,
        json: async () => fallbackResponse
      };
    }
    
    // For other requests, throw the original error
    throw error;
  }
};

export default {
  sendMessageFallback,
  checkServerAvailability,
  fetchWithFallback
};
