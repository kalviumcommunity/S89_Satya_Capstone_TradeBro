/**
 * Mock Endpoints Utility
 *
 * This utility provides mock data for API endpoints when the server is unavailable.
 * It's used as a fallback mechanism to ensure the app can function without a backend.
 */

import axios from 'axios';
import { API_BASE_URL } from '../config/apiConfig';

// Original axios methods
let originalGet = null;
let originalPost = null;
let originalPut = null;
let originalDelete = null;

// Flag to track if mocks are active
let mocksActive = false;

/**
 * Set up a mock health endpoint for offline mode
 * This allows the app to check if the backend is available
 * without actually making network requests
 */
export const setupMockHealthEndpoint = () => {
  // Save original get method if not already saved
  if (!originalGet) {
    originalGet = axios.get;
  }

  // Override the get method to intercept health endpoint requests
  axios.get = function(url, config) {
    // Check if this is a health endpoint request
    if (url && url.includes('/api/health')) {
      console.log('Intercepted health endpoint request');
      // Return a rejected promise to simulate offline mode
      return Promise.reject({
        response: {
          status: 404,
          data: { message: 'Health endpoint not available (mock)' }
        }
      });
    }

    // Otherwise, use the original get method
    return originalGet.apply(this, arguments);
  };

  // Return a cleanup function
  return () => {
    // Restore the original get method
    if (originalGet) {
      axios.get = originalGet;
    }
  };
};

/**
 * Setup all mock endpoints for offline mode
 * @param {Object} userData - Optional user data to include in mock responses
 * @returns {Function} - Cleanup function to restore original methods
 */
export const setupAllMockEndpoints = (userData = null) => {
  // Save original methods if not already saved
  if (!originalGet) originalGet = axios.get;
  if (!originalPost) originalPost = axios.post;
  if (!originalPut) originalPut = axios.put;
  if (!originalDelete) originalDelete = axios.delete;

  // Override axios methods
  setupMockGetEndpoints(userData);
  setupMockPostEndpoints();
  setupMockPutEndpoints();
  setupMockDeleteEndpoints();

  mocksActive = true;

  // Only log in development environment
  if (process.env.NODE_ENV === 'development') {
    console.log('All mock endpoints setup');
  }

  // Return a cleanup function
  return () => {
    // Restore original methods
    if (originalGet) axios.get = originalGet;
    if (originalPost) axios.post = originalPost;
    if (originalPut) axios.put = originalPut;
    if (originalDelete) axios.delete = originalDelete;

    // Reset flags
    mocksActive = false;
    originalGet = null;
    originalPost = null;
    originalPut = null;
    originalDelete = null;

    if (process.env.NODE_ENV === 'development') {
      console.log('Mock endpoints cleaned up');
    }
  };
};

/**
 * Setup mock GET endpoints
 */
const setupMockGetEndpoints = (userData = null) => {
  axios.get = function(url, config) {
    // Chatbot start endpoint
    if (url && url.includes('/api/chatbot/start')) {
      console.log('Using mock chatbot start endpoint');
      // Generate a random session ID
      const sessionId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

      // Store the session ID in localStorage for other endpoints to use
      localStorage.setItem('chatbotSessionId', sessionId);

      return Promise.resolve({
        data: {
          success: true,
          sessionId: sessionId,
          message: "Chat session started successfully"
        }
      });
    }

    // Settings endpoint
    if (url && url.includes('/api/settings')) {
      console.log('Using mock settings data');
      return Promise.resolve({
        data: {
          success: true,
          userSettings: {
            fullName: userData?.fullName || 'Demo User',
            email: userData?.email || localStorage.getItem('userEmail') || 'user@example.com',
            phoneNumber: userData?.phoneNumber || '',
            language: userData?.language || 'English',
            profileImage: userData?.profileImage || null,
            notifications: userData?.notifications !== undefined ? userData.notifications : true
          }
        }
      });
    }

    // Watchlist endpoint
    if (url && url.includes('/api/watchlist/stocks')) {
      console.log('Using mock watchlist data');

      // Get stored watchlist from localStorage or return empty array
      let watchlist = [];
      try {
        const storedWatchlist = localStorage.getItem('watchlist');
        if (storedWatchlist) {
          watchlist = JSON.parse(storedWatchlist);
        }
      } catch (e) {
        console.error('Error parsing stored watchlist:', e);
      }

      return Promise.resolve({
        data: {
          success: true,
          data: watchlist
        }
      });
    }

    // Virtual money endpoint
    if (url && url.includes('/api/virtual-money/account')) {
      console.log('Using mock virtual money data');

      // Get stored virtual money data or use default
      let virtualMoneyData = {
        balance: 10000,
        balanceFormatted: '₹10,000',
        lastLoginReward: null,
        portfolio: [],
        currency: 'INR'
      };

      try {
        const storedData = localStorage.getItem('virtualMoney');
        if (storedData) {
          const parsedData = JSON.parse(storedData);
          if (parsedData && typeof parsedData.balance === 'number') {
            virtualMoneyData = {
              ...virtualMoneyData,
              ...parsedData
            };
          }
        }
      } catch (e) {
        console.error('Error parsing stored virtual money:', e);
      }

      // Add user information
      const userEmail = userData?.email || localStorage.getItem('userEmail') || 'user@example.com';
      const userName = userData?.username || localStorage.getItem('userName') || 'User';
      const userFullName = userData?.fullName || localStorage.getItem('userFullName') || userName;

      // Calculate day streak if applicable
      let dayStreak = 1;
      if (virtualMoneyData.lastLoginReward) {
        // For mock purposes, just use a random streak between 1-7
        dayStreak = Math.floor(Math.random() * 7) + 1;
      }

      return Promise.resolve({
        data: {
          success: true,
          data: {
            ...virtualMoneyData,
            balanceFormatted: `₹${virtualMoneyData.balance.toLocaleString('en-IN')}`,
            userEmail: userEmail,
            userName: userName,
            userFullName: userFullName,
            dayStreak: dayStreak
          }
        }
      });
    }

    // Virtual money reward status endpoint
    if (url && url.includes('/api/virtual-money/reward-status')) {
      console.log('Using mock reward status endpoint');

      try {
        // Get user info
        const userEmail = userData?.email || localStorage.getItem('userEmail') || 'user@example.com';
        const userName = userData?.username || localStorage.getItem('userName') || 'User';
        const userFullName = userData?.fullName || localStorage.getItem('userFullName') || userName;

        // Check if user has already claimed reward today
        const lastReward = localStorage.getItem('lastRewardClaim');
        const today = new Date().setHours(0, 0, 0, 0);

        if (lastReward && new Date(parseInt(lastReward)).setHours(0, 0, 0, 0) === today) {
          // Already claimed today
          console.log('Reward already claimed today (mock)');

          // Calculate time remaining until next reward
          const now = new Date();
          const tomorrow = new Date(now);
          tomorrow.setDate(tomorrow.getDate() + 1);
          tomorrow.setHours(0, 0, 0, 0);

          const minutesRemaining = Math.ceil((tomorrow - now) / (1000 * 60));
          const hoursRemaining = Math.floor(minutesRemaining / 60);
          const mins = minutesRemaining % 60;

          return Promise.resolve({
            data: {
              success: true,
              canClaim: false,
              message: `Hi ${userFullName}, you've already claimed your daily reward.`,
              timeRemaining: {
                hours: hoursRemaining,
                minutes: mins,
                totalMinutes: minutesRemaining
              },
              nextRewardTime: tomorrow.toISOString()
            }
          });
        } else {
          // Can claim reward
          return Promise.resolve({
            data: {
              success: true,
              canClaim: true,
              message: `Hi ${userFullName}, you can claim your daily reward!`,
              timeRemaining: {
                hours: 0,
                minutes: 0,
                totalMinutes: 0
              }
            }
          });
        }
      } catch (error) {
        console.error('Error in mock reward status endpoint:', error);

        // Return a generic response
        return Promise.resolve({
          data: {
            success: true,
            canClaim: true,
            message: 'You can claim your daily reward!'
          }
        });
      }
    }

    // Orders endpoint
    if (url && url.includes('/api/orders/all')) {
      console.log('Using mock orders data');
      return Promise.resolve({
        data: {
          success: true,
          data: []
        }
      });
    }

    // Notifications endpoint
    if (url && url.includes('/api/notifications')) {
      console.log('Using mock notifications data');
      return Promise.resolve({
        data: {
          success: true,
          data: [
            {
              id: '1',
              title: 'Welcome to TradeBro',
              message: 'Thank you for joining TradeBro. Start exploring the platform!',
              type: 'info',
              read: false,
              timestamp: new Date(Date.now() - 3600000).toISOString()
            },
            {
              id: '2',
              title: 'Market Update',
              message: 'The market has opened. Check the latest trends!',
              type: 'success',
              read: true,
              timestamp: new Date(Date.now() - 86400000).toISOString()
            },
            {
              id: '3',
              title: 'New Feature',
              message: 'We\'ve added a new portfolio tracking feature. Try it out!',
              type: 'info',
              read: false,
              timestamp: new Date(Date.now() - 172800000).toISOString()
            }
          ]
        }
      });
    }

    // Stock search endpoint
    if (url && url.includes('/api/stocks/search')) {
      console.log('Using mock stock search endpoint');

      // Extract the query parameter
      const queryParam = url.split('?')[1];
      const params = new URLSearchParams(queryParam);
      const query = params.get('query');

      if (!query) {
        return Promise.resolve({
          data: {
            success: false,
            message: 'Search query is required'
          }
        });
      }

      // Mock stock data
      const mockStocks = [
        { symbol: "AAPL", name: "Apple Inc.", exchange: "NASDAQ", exchangeShortName: "NASDAQ", type: "stock" },
        { symbol: "MSFT", name: "Microsoft Corporation", exchange: "NASDAQ", exchangeShortName: "NASDAQ", type: "stock" },
        { symbol: "GOOGL", name: "Alphabet Inc.", exchange: "NASDAQ", exchangeShortName: "NASDAQ", type: "stock" },
        { symbol: "AMZN", name: "Amazon.com Inc.", exchange: "NASDAQ", exchangeShortName: "NASDAQ", type: "stock" },
        { symbol: "META", name: "Meta Platforms Inc.", exchange: "NASDAQ", exchangeShortName: "NASDAQ", type: "stock" },
        { symbol: "TSLA", name: "Tesla, Inc.", exchange: "NASDAQ", exchangeShortName: "NASDAQ", type: "stock" },
        { symbol: "NFLX", name: "Netflix, Inc.", exchange: "NASDAQ", exchangeShortName: "NASDAQ", type: "stock" },
        { symbol: "NVDA", name: "NVIDIA Corporation", exchange: "NASDAQ", exchangeShortName: "NASDAQ", type: "stock" },
        { symbol: "RELIANCE.BSE", name: "Reliance Industries", exchange: "BSE", exchangeShortName: "BSE", type: "stock" },
        { symbol: "TCS.BSE", name: "Tata Consultancy Services", exchange: "BSE", exchangeShortName: "BSE", type: "stock" },
        { symbol: "INFY.BSE", name: "Infosys Ltd", exchange: "BSE", exchangeShortName: "BSE", type: "stock" },
        { symbol: "HDFCBANK.BSE", name: "HDFC Bank Ltd", exchange: "BSE", exchangeShortName: "BSE", type: "stock" }
      ];

      // Filter stocks based on query
      const filteredStocks = mockStocks.filter(stock =>
        stock.symbol.toLowerCase().includes(query.toLowerCase()) ||
        stock.name.toLowerCase().includes(query.toLowerCase())
      );

      return Promise.resolve({
        data: {
          success: true,
          data: filteredStocks,
          query,
          note: 'Using mock data in offline mode'
        }
      });
    }

    // Otherwise, use the original get method
    return originalGet.apply(this, arguments);
  };
};

/**
 * Setup mock POST endpoints
 */
const setupMockPostEndpoints = () => {
  axios.post = function(url, data, config) {
    // Handle specific POST endpoints here

    // Watchlist add endpoint
    if (url && url.includes('/api/watchlist/add')) {
      console.log('Using mock watchlist add endpoint');

      try {
        // Get the stock data from the request
        const { symbol, name } = data;

        // Get existing watchlist from localStorage or create empty array
        let watchlist = [];
        try {
          const storedWatchlist = localStorage.getItem('watchlist');
          if (storedWatchlist) {
            watchlist = JSON.parse(storedWatchlist);
          }
        } catch (e) {
          console.error('Error parsing stored watchlist:', e);
        }

        // Check if stock already exists in watchlist
        const stockExists = watchlist.some(item => item.symbol === symbol);

        if (stockExists) {
          return Promise.resolve({
            data: {
              success: false,
              message: `${symbol} is already in your watchlist`
            }
          });
        }

        // Add stock to watchlist with an ID and mock data
        watchlist.push({
          symbol,
          name,
          addedAt: new Date().toISOString(),
          id: Date.now(),
          price: (Math.random() * 200 + 50).toFixed(2),
          change: (Math.random() * 10 - 5).toFixed(2),
          changePercent: (Math.random() * 5 - 2.5).toFixed(2),
          marketCap: `${(Math.random() * 500 + 10).toFixed(1)}B`,
          volume: `${(Math.random() * 50 + 5).toFixed(1)}M`
        });

        // Save updated watchlist to localStorage
        localStorage.setItem('watchlist', JSON.stringify(watchlist));

        return Promise.resolve({
          data: {
            success: true,
            message: `${symbol} added to watchlist`,
            data: watchlist
          }
        });
      } catch (e) {
        console.error('Error handling add to watchlist:', e);
        return Promise.resolve({
          data: {
            success: true,
            message: 'Stock added to watchlist (mock)'
          }
        });
      }
    }

    // Chatbot message endpoint
    if (url && url.includes('/api/chatbot/message')) {
      console.log('Using mock chatbot message endpoint');

      // Get the message from the request data
      const message = data.message;
      console.log('Received message:', message);

      // Generate a response based on the message
      let response;

      // Check for common stock-related queries
      if (message.toLowerCase().includes('stock') ||
          message.toLowerCase().includes('price') ||
          message.toLowerCase().includes('market')) {
        response = `I'd be happy to help you with information about stocks and the market.

The stock market has been quite volatile lately, with tech stocks showing strong performance. If you're interested in a specific stock, you can ask me about it, and I'll provide you with the latest information.

Some popular stocks to consider:
• Apple (AAPL)
• Microsoft (MSFT)
• Amazon (AMZN)
• Tesla (TSLA)
• Google (GOOGL)

What specific information would you like to know?`;
      }
      // Check for greetings
      else if (message.toLowerCase().includes('hi') ||
               message.toLowerCase().includes('hello') ||
               message.toLowerCase().includes('hey')) {
        response = `Hello there! I'm your TradeBro assistant. How can I help you with your trading questions today?

I can provide information on:
• Stock prices and trends
• Market analysis
• Trading strategies
• Investment advice
• Financial concepts

What would you like to know about?`;
      }
      // Check for help requests
      else if (message.toLowerCase().includes('help') ||
               message.toLowerCase().includes('what can you do')) {
        response = `I'm your TradeBro assistant, and I'm here to help you with all things related to trading and investing. Here's what I can do:

1. Provide real-time stock information
2. Analyze market trends
3. Explain trading concepts
4. Offer investment strategies
5. Answer financial questions

Just ask me anything related to trading, and I'll do my best to assist you!`;
      }
      // Default response
      else {
        response = `Thanks for your question! As your TradeBro assistant, I'm here to help with all your trading needs.

Based on your question, I'd recommend exploring some of the key features of our platform:

• Real-time stock tracking
• Portfolio management
• Market analysis tools
• Trading strategies

Would you like me to explain any of these features in more detail?`;
      }

      return Promise.resolve({
        data: {
          success: true,
          type: 'text',
          message: response
        }
      });
    }

    // Chatbot end endpoint
    if (url && url.includes('/api/chatbot/end')) {
      console.log('Using mock chatbot end endpoint');

      // Clear the session ID from localStorage
      localStorage.removeItem('chatbotSessionId');

      return Promise.resolve({
        data: {
          success: true,
          message: "Chat session ended successfully"
        }
      });
    }

    // Virtual money claim reward endpoint
    if (url && url.includes('/api/virtual-money/claim-reward')) {
      console.log('Using mock claim reward endpoint');

      try {
        // Check if user has already claimed reward today
        const lastReward = localStorage.getItem('lastRewardClaim');
        const today = new Date().setHours(0, 0, 0, 0);

        if (lastReward && new Date(parseInt(lastReward)).setHours(0, 0, 0, 0) === today) {
          // Already claimed today
          console.log('Reward already claimed today (mock)');

          // Calculate time remaining until next reward
          const now = new Date();
          const tomorrow = new Date(now);
          tomorrow.setDate(tomorrow.getDate() + 1);
          tomorrow.setHours(0, 0, 0, 0);

          const minutesRemaining = Math.ceil((tomorrow - now) / (1000 * 60));
          const hoursRemaining = Math.floor(minutesRemaining / 60);
          const mins = minutesRemaining % 60;

          // Generate user info
          const userEmail = localStorage.getItem('userEmail') || 'user@example.com';
          const userName = localStorage.getItem('userName') || 'User';
          const userFullName = localStorage.getItem('userFullName') || userName;

          return Promise.reject({
            response: {
              status: 400,
              data: {
                success: false,
                message: `Hi ${userFullName}, you've already claimed your daily reward.`,
                timeRemaining: {
                  hours: hoursRemaining,
                  minutes: mins,
                  totalMinutes: minutesRemaining
                },
                nextRewardTime: tomorrow.toISOString()
              }
            }
          });
        }

        // Set last reward claim time
        localStorage.setItem('lastRewardClaim', Date.now().toString());

        // Get current balance from localStorage or default to 10000
        let currentBalance = 10000;
        let existingVirtualMoneyData = {
          portfolio: [],
          currency: 'INR'
        };

        try {
          const storedVirtualMoney = localStorage.getItem('virtualMoney');
          if (storedVirtualMoney) {
            const parsedData = JSON.parse(storedVirtualMoney);
            if (parsedData) {
              if (typeof parsedData.balance === 'number') {
                currentBalance = parsedData.balance;
              }
              if (Array.isArray(parsedData.portfolio)) {
                existingVirtualMoneyData.portfolio = parsedData.portfolio;
              }
            }
          }
        } catch (e) {
          console.error('Error parsing stored virtual money:', e);
        }

        // Add reward
        const newBalance = currentBalance + 1;

        // Generate user info
        const userEmail = localStorage.getItem('userEmail') || 'user@example.com';
        const userName = localStorage.getItem('userName') || 'User';
        const userFullName = localStorage.getItem('userFullName') || userName;

        // Calculate day streak (mock value between 1-7)
        const dayStreak = Math.floor(Math.random() * 7) + 1;

        // Update localStorage
        const virtualMoneyData = {
          ...existingVirtualMoneyData,
          balance: newBalance,
          lastLoginReward: new Date(),
          userEmail: userEmail,
          userName: userName,
          userFullName: userFullName,
          dayStreak: dayStreak
        };

        localStorage.setItem('virtualMoney', JSON.stringify(virtualMoneyData));

        // Generate a personalized reward message
        const rewardMessages = [
          `Congratulations ${userFullName}! You've claimed your daily reward.`,
          `Well done ${userName}! Here's your daily reward.`,
          `Thanks for logging in today ${userName}! Enjoy your reward.`,
          `Your daily reward has been added to your account, ${userFullName}!`,
          `Consistency pays off! Here's your daily reward, ${userName}.`
        ];

        // Select a random message
        const randomMessage = rewardMessages[Math.floor(Math.random() * rewardMessages.length)];

        return Promise.resolve({
          data: {
            success: true,
            message: randomMessage,
            data: {
              balance: newBalance,
              balanceFormatted: `₹${newBalance.toLocaleString('en-IN')}`,
              rewardAmount: 1,
              rewardAmountFormatted: '₹1',
              currency: 'INR',
              dayStreak: dayStreak,
              userName: userName,
              userFullName: userFullName
            }
          }
        });
      } catch (error) {
        console.error('Error in mock claim reward endpoint:', error);

        // Return a generic error response
        return Promise.reject({
          response: {
            status: 500,
            data: {
              success: false,
              message: 'An error occurred while processing your reward claim',
              error: error.message
            }
          }
        });
      }
    }

    // Otherwise, use the original post method
    return originalPost.apply(this, arguments);
  };
};

/**
 * Setup mock PUT endpoints
 */
const setupMockPutEndpoints = () => {
  axios.put = function(url, data, config) {
    // Handle specific PUT endpoints here

    // Otherwise, use the original put method
    return originalPut.apply(this, arguments);
  };
};

/**
 * Setup mock DELETE endpoints
 */
const setupMockDeleteEndpoints = () => {
  axios.delete = function(url, config) {
    // Handle specific DELETE endpoints here

    // Handle portfolio reset endpoint
    if (url && url.includes('/api/virtual-money/portfolio')) {
      console.log('Using mock portfolio reset endpoint');

      try {
        // Get current virtual money data
        let virtualMoneyData = {
          balance: 10000,
          balanceFormatted: '₹10,000',
          lastLoginReward: null,
          portfolio: [],
          currency: 'INR'
        };

        // Try to get existing data from localStorage
        const storedData = localStorage.getItem('virtualMoney');
        if (storedData) {
          const parsedData = JSON.parse(storedData);
          if (parsedData && typeof parsedData.balance === 'number') {
            // Keep the balance but reset the portfolio
            virtualMoneyData = {
              ...parsedData,
              portfolio: []
            };
          }
        }

        // Save updated data back to localStorage
        localStorage.setItem('virtualMoney', JSON.stringify(virtualMoneyData));

        return Promise.resolve({
          data: {
            success: true,
            message: 'Portfolio has been reset successfully',
            data: virtualMoneyData
          }
        });
      } catch (error) {
        console.error('Error in mock portfolio reset:', error);
        return Promise.reject({
          response: {
            status: 500,
            data: {
              success: false,
              message: 'Failed to reset portfolio'
            }
          }
        });
      }
    }

    // Handle watchlist remove endpoint
    if (url && url.includes('/api/watchlist/remove/')) {
      console.log('Using mock watchlist remove endpoint');

      try {
        // Extract the symbol from the URL
        const symbol = url.split('/').pop();

        // Get existing watchlist from localStorage
        let watchlist = [];
        try {
          const storedWatchlist = localStorage.getItem('watchlist');
          if (storedWatchlist) {
            watchlist = JSON.parse(storedWatchlist);
          }
        } catch (e) {
          console.error('Error parsing stored watchlist:', e);
        }

        // Check if stock exists in watchlist
        const stockExists = watchlist.some(item => item.symbol === symbol);

        if (!stockExists) {
          return Promise.resolve({
            data: {
              success: false,
              message: `${symbol} is not in your watchlist`
            }
          });
        }

        // Remove stock from watchlist
        const updatedWatchlist = watchlist.filter(item => item.symbol !== symbol);

        // Save updated watchlist to localStorage
        localStorage.setItem('watchlist', JSON.stringify(updatedWatchlist));

        return Promise.resolve({
          data: {
            success: true,
            message: `${symbol} removed from watchlist`,
            data: updatedWatchlist
          }
        });
      } catch (e) {
        console.error('Error handling remove from watchlist:', e);
        return Promise.resolve({
          data: {
            success: true,
            message: 'Stock removed from watchlist (mock)'
          }
        });
      }
    }

    // Otherwise, use the original delete method
    return originalDelete.apply(this, arguments);
  };
};

/**
 * Reset all mocks and restore original axios methods
 */
export const resetMocks = () => {
  if (originalGet) axios.get = originalGet;
  if (originalPost) axios.post = originalPost;
  if (originalPut) axios.put = originalPut;
  if (originalDelete) axios.delete = originalDelete;

  mocksActive = false;
  console.log('All mocks reset');
};

/**
 * Check if mocks are active
 */
export const areMocksActive = () => {
  return mocksActive;
};

/**
 * Create a mock response for a specific endpoint
 * @param {string} endpoint - The endpoint to mock
 * @param {Object} mockData - The mock data to return
 * @returns {Function} - A function that returns the mock data
 */
export const createMockEndpoint = (endpoint, mockData) => {
  return () => {
    console.log(`Using mock data for ${endpoint}`);
    return mockData;
  };
};
