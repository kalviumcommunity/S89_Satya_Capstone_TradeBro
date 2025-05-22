import axios from 'axios';
import { setupMockHealthEndpoint } from './mockEndpoints';
import { API_BASE_URL } from '../config/apiConfig';
import { ensureHttpForLocalhost } from './urlUtils';

// Configure axios defaults
axios.defaults.timeout = 10000; // 10 seconds timeout by default

// Set the base URL for all requests, ensuring HTTP for localhost
axios.defaults.baseURL = API_BASE_URL;

// Set up global error handling for network errors
const originalFetch = window.fetch;
window.fetch = function(...args) {
  return originalFetch(...args).catch(error => {
    console.log('Fetch error:', error);
    if (error.message && error.message.includes('Failed to fetch')) {
      console.log('Network error detected in fetch call');
    }
    throw error;
  });
};

// Add a request interceptor
axios.interceptors.request.use(
  (config) => {
    // Get the token from localStorage
    const token = localStorage.getItem('authToken');

    // If token exists, add it to the headers
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;

      // We're removing the insecure cookie storage of the token
      // and only using Authorization header for authentication

      // Only log in development environment
      if (process.env.NODE_ENV === 'development') {
        console.log(`Request to ${config.url} with auth token`);
      }
    } else {
      // Only log in development environment
      if (process.env.NODE_ENV === 'development') {
        // Check if we're on a page that should have auth but doesn't
        const currentPath = window.location.pathname;
        const authRequiredPaths = ['/portfolio', '/dashboard', '/settings', '/watchlist', '/orders'];

        if (authRequiredPaths.includes(currentPath)) {
          console.warn(`WARNING: No auth token found for request to ${config.url} while on ${currentPath}`);
        }
      }
    }

    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Add a response interceptor
axios.interceptors.response.use(
  (response) => {
    // Log successful responses in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`Response from ${response.config.url} successful`);
    }
    return response;
  },
  (error) => {
    // Log errors in development environment with more details
    if (process.env.NODE_ENV === 'development') {
      console.error('API Error:', error.config?.url, error.message, error.response?.status);
    } else {
      // In production, log minimal error information
      console.error('API Error:', error.response?.status || 'Network Error');
    }

    // Check if this is an offline error
    if (error.isOfflineError) {
      if (process.env.NODE_ENV === 'development') {
        console.log('Request blocked due to offline mode:', error.message);
      }
      return Promise.reject(error);
    }

    // Handle network errors (like ECONNREFUSED, timeout, etc.)
    if (error.code === 'ECONNABORTED' || !error.response) {
      if (process.env.NODE_ENV === 'development') {
        console.log('Network error detected:', error.message);
      }
      // Dispatch an event to notify the app is offline
      const offlineEvent = new CustomEvent('app:offline', { detail: { error } });
      window.dispatchEvent(offlineEvent);

      // For certain endpoints, return mock data
      if (error.config && error.config.url) {
        // If it's a settings endpoint
        if (error.config.url.includes('/api/settings')) {
          console.log('Returning mock settings data');
          return Promise.resolve({
            data: {
              success: true,
              userSettings: {
                fullName: 'Demo User',
                email: localStorage.getItem('userEmail') || 'user@example.com',
                phoneNumber: '',
                language: 'English',
                profileImage: null,
                notifications: true
              }
            }
          });
        }

        // If it's a watchlist endpoint
        if (error.config.url.includes('/api/watchlist')) {
          console.log('Handling watchlist endpoint for network error');

          // Handle GET request for watchlist stocks
          if (error.config.url.includes('/api/watchlist/stocks')) {
            console.log('Returning mock watchlist data');
            return Promise.resolve({
              data: {
                success: true,
                data: []
              }
            });
          }

          // Handle POST request to add stock to watchlist
          if (error.config.url.includes('/api/watchlist/add') && error.config.method === 'post') {
            console.log('Handling add to watchlist request');
            try {
              // Get the stock data from the request
              const stockData = JSON.parse(error.config.data);
              const { symbol, name } = stockData;

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

              // Check if stock is already in watchlist
              const stockExists = watchlist.some(item => item.symbol === symbol);

              if (stockExists) {
                return Promise.resolve({
                  data: {
                    success: false,
                    message: `${symbol} is already in your watchlist`
                  }
                });
              }

              // Add stock to watchlist
              watchlist.push({ symbol, name, addedAt: new Date().toISOString() });

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

          // Handle other watchlist endpoints
          return Promise.resolve({
            data: {
              success: true,
              message: 'Watchlist operation completed successfully (mock)'
            }
          });
        }

        // If it's a virtual money endpoint
        if (error.config.url.includes('/api/virtual-money')) {
          console.log('Returning mock virtual money data');

          // Handle specific virtual money endpoints
          if (error.config.url.includes('/api/virtual-money/claim-reward')) {
            // For claim-reward endpoint
            if (error.config.method === 'post') {
              console.log('Using mock data for claim-reward endpoint');

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

                // Get user info for personalized message
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
                      nextRewardTime: new Date(tomorrow).toISOString()
                    }
                  }
                });
              }

              // Set last reward claim time
              localStorage.setItem('lastRewardClaim', Date.now().toString());

              // Get current balance from localStorage or default to 10000
              let currentBalance = 10000;
              try {
                const storedVirtualMoney = localStorage.getItem('virtualMoney');
                if (storedVirtualMoney) {
                  const parsedData = JSON.parse(storedVirtualMoney);
                  if (parsedData && typeof parsedData.balance === 'number') {
                    currentBalance = parsedData.balance;
                  }
                }
              } catch (e) {
                console.error('Error parsing stored virtual money:', e);
              }

              // Add reward
              const newBalance = currentBalance + 1;

              // Update localStorage
              const virtualMoneyData = {
                balance: newBalance,
                lastLoginReward: new Date(),
                portfolio: [],
                currency: 'INR'
              };
              localStorage.setItem('virtualMoney', JSON.stringify(virtualMoneyData));

              // Get user info for personalized message
              const userEmail = localStorage.getItem('userEmail') || 'user@example.com';
              const userName = localStorage.getItem('userName') || 'User';
              const userFullName = localStorage.getItem('userFullName') || userName;

              // Calculate day streak (mock value between 1-7)
              const dayStreak = Math.floor(Math.random() * 7) + 1;

              return Promise.resolve({
                data: {
                  success: true,
                  message: `Congratulations ${userFullName}! You've claimed your daily reward.`,
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
            }
          } else if (error.config.url.includes('/api/virtual-money/reward-status')) {
            // For reward-status endpoint
            console.log('Handling reward-status endpoint for network error');

            try {
              // Get user info
              const userEmail = localStorage.getItem('userEmail') || 'user@example.com';
              const userName = localStorage.getItem('userName') || 'User';
              const userFullName = localStorage.getItem('userFullName') || userName;

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
          } else {
            // Default virtual money response
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
            const userEmail = localStorage.getItem('userEmail') || 'user@example.com';
            const userName = localStorage.getItem('userName') || 'User';
            const userFullName = localStorage.getItem('userFullName') || userName;

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
        }

        // If it's an orders endpoint
        if (error.config.url.includes('/api/orders')) {
          console.log('Returning mock orders data');
          return Promise.resolve({
            data: {
              success: true,
              data: []
            }
          });
        }

        // If it's a virtual money reward status endpoint
        if (error.config.url.includes('/api/virtual-money/reward-status')) {
          console.log('Redirecting to virtual money handler for reward-status endpoint');
          // This endpoint is already handled in the virtual money section above
          return error.config.url.includes('/api/virtual-money') ?
            Promise.resolve() : Promise.reject(error);
        }

        // If it's a stock search endpoint
        if (error.config.url.includes('/api/stock-search') || error.config.url.includes('/api/stocks/search')) {
          console.log('Returning mock stock search data for network error');

          // Extract the query parameter
          const queryParam = error.config.url.split('?')[1];
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

          // Enhanced mock stock data with more fields
          const mockStocks = [
            { symbol: "AAPL", name: "Apple Inc.", exchange: "NASDAQ", exchangeShortName: "NASDAQ", type: "stock", country: "United States", currency: "USD" },
            { symbol: "MSFT", name: "Microsoft Corporation", exchange: "NASDAQ", exchangeShortName: "NASDAQ", type: "stock", country: "United States", currency: "USD" },
            { symbol: "GOOGL", name: "Alphabet Inc.", exchange: "NASDAQ", exchangeShortName: "NASDAQ", type: "stock", country: "United States", currency: "USD" },
            { symbol: "AMZN", name: "Amazon.com Inc.", exchange: "NASDAQ", exchangeShortName: "NASDAQ", type: "stock", country: "United States", currency: "USD" },
            { symbol: "META", name: "Meta Platforms Inc.", exchange: "NASDAQ", exchangeShortName: "NASDAQ", type: "stock", country: "United States", currency: "USD" },
            { symbol: "TSLA", name: "Tesla, Inc.", exchange: "NASDAQ", exchangeShortName: "NASDAQ", type: "stock", country: "United States", currency: "USD" },
            { symbol: "NFLX", name: "Netflix, Inc.", exchange: "NASDAQ", exchangeShortName: "NASDAQ", type: "stock", country: "United States", currency: "USD" },
            { symbol: "NVDA", name: "NVIDIA Corporation", exchange: "NASDAQ", exchangeShortName: "NASDAQ", type: "stock", country: "United States", currency: "USD" },
            { symbol: "RELIANCE.BSE", name: "Reliance Industries", exchange: "BSE", exchangeShortName: "BSE", type: "stock", country: "India", currency: "INR" },
            { symbol: "TCS.BSE", name: "Tata Consultancy Services", exchange: "BSE", exchangeShortName: "BSE", type: "stock", country: "India", currency: "INR" },
            { symbol: "INFY.BSE", name: "Infosys Ltd", exchange: "BSE", exchangeShortName: "BSE", type: "stock", country: "India", currency: "INR" },
            { symbol: "HDFCBANK.BSE", name: "HDFC Bank Ltd", exchange: "BSE", exchangeShortName: "BSE", type: "stock", country: "India", currency: "INR" }
          ];

          // Filter stocks based on query
          const filteredStocks = mockStocks.filter(stock =>
            stock.symbol.toLowerCase().includes(query.toLowerCase()) ||
            stock.name.toLowerCase().includes(query.toLowerCase())
          );

          console.log(`Found ${filteredStocks.length} mock stocks matching "${query}"`);

          // Check which endpoint format to use
          if (error.config.url.includes('/api/stocks/search')) {
            // Direct endpoint format
            return Promise.resolve({
              data: {
                success: true,
                results: filteredStocks,
                query,
                source: 'mock',
                note: 'Using mock data due to network error'
              }
            });
          } else if (error.config.url.includes('/api/stock-search')) {
            // stock-search endpoint format
            return Promise.resolve({
              data: {
                success: true,
                data: filteredStocks,
                query,
                source: 'mock',
                note: 'Using mock data due to network error'
              }
            });
          }
        }
      }
    }

    // Handle 401 Unauthorized errors
    if (error.response && error.response.status === 401) {
      console.log('Authentication error (401):', error.config.url);

      // Show a toast notification for authentication errors
      try {
        // Check if we can access the toast function
        if (window.showToast) {
          window.showToast('Authentication required. Please log in.', 'error');
        }
      } catch (toastError) {
        console.error('Failed to show toast notification:', toastError);
      }

      // Get the current token
      const token = localStorage.getItem('authToken');

      // Check if we're on a page that requires authentication
      const currentPath = window.location.pathname;
      const authRequiredPaths = ['/portfolio', '/dashboard', '/settings', '/watchlist', '/orders'];
      const isAuthRequiredPage = authRequiredPaths.includes(currentPath);

      // Check if this is a login/signup request
      const isAuthRequest = error.config.url.includes('/api/auth/login') ||
                           error.config.url.includes('/api/auth/signup');

      // If this is not an auth request and we're on an auth-required page
      if (!isAuthRequest && isAuthRequiredPage) {
        console.warn('Authentication required for this page. Redirecting to login...');

        // Clear token
        localStorage.removeItem('authToken');

        // Only redirect if not already on login or signup page
        if (currentPath !== '/login' && currentPath !== '/signup' && currentPath !== '/') {
          // Add a small delay to allow console messages to be seen
          setTimeout(() => {
            window.location.href = '/login';
          }, 500);
        }
      } else if (isAuthRequest) {
        // This is a failed login/signup attempt, don't redirect
        console.log('Login/signup attempt failed with 401. Not redirecting.');
      } else {
        // This is a 401 on a non-auth-required page, just log it
        console.log('Received 401 for API request, but not redirecting.');
      }
    }

    // Handle 403 Forbidden errors
    if (error.response && error.response.status === 403) {
      console.log('Authorization error (403):', error.config.url);

      // Try to refresh the token or re-authenticate silently
      const token = localStorage.getItem('authToken');
      if (token) {
        // For now, just log the issue - in a real app, you might try to refresh the token
        console.log('Token exists but request was forbidden. Token might be invalid.');
      }
    }

    // Handle 404 errors
    if (error.response && error.response.status === 404) {
      console.log('Resource not found (404):', error.config.url);

      // Handle 404 errors for health endpoint
      if (error.config && error.config.url && error.config.url.includes('/api/health')) {
        console.log('Health endpoint not available, app is in offline mode');
        const offlineEvent = new CustomEvent('app:offline', { detail: { error } });
        window.dispatchEvent(offlineEvent);
      }

      // For certain endpoints, return mock data
      if (error.config && error.config.url) {
        // If it's a settings endpoint
        if (error.config.url.includes('/api/settings')) {
          console.log('Returning mock settings data for 404');
          return Promise.resolve({
            data: {
              success: true,
              userSettings: {
                fullName: 'Demo User',
                email: localStorage.getItem('userEmail') || 'user@example.com',
                phoneNumber: '',
                language: 'English',
                profileImage: null,
                notifications: true
              }
            }
          });
        }

        // If it's a watchlist endpoint
        if (error.config.url.includes('/api/watchlist')) {
          console.log('Handling watchlist endpoint for 404');

          // Handle GET request for watchlist stocks
          if (error.config.url.includes('/api/watchlist/stocks')) {
            console.log('Returning mock watchlist data for 404');

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

          // Handle POST request to add stock to watchlist
          if (error.config.url.includes('/api/watchlist/add') && error.config.method === 'post') {
            console.log('Handling add to watchlist request');
            try {
              // Get the stock data from the request
              const stockData = JSON.parse(error.config.data);
              const { symbol, name } = stockData;

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

              // Check if stock is already in watchlist
              const stockExists = watchlist.some(item => item.symbol === symbol);

              if (stockExists) {
                return Promise.resolve({
                  data: {
                    success: false,
                    message: `${symbol} is already in your watchlist`
                  }
                });
              }

              // Add stock to watchlist with an ID
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

          // Handle DELETE request to remove stock from watchlist
          if (error.config.url.includes('/api/watchlist/remove/') && error.config.method === 'delete') {
            console.log('Handling remove from watchlist request');
            try {
              // Extract the symbol from the URL
              const symbol = error.config.url.split('/').pop();

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

          // Handle other watchlist endpoints
          return Promise.resolve({
            data: {
              success: true,
              message: 'Watchlist operation completed successfully (mock)'
            }
          });
        }

        // If it's a virtual money endpoint
        if (error.config.url.includes('/api/virtual-money')) {
          console.log('Returning mock virtual money data for 404');

          // Handle portfolio reset endpoint
          if (error.config.url.includes('/api/virtual-money/portfolio') && error.config.method === 'delete') {
            console.log('Handling portfolio reset endpoint for 404');

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

          // Handle specific virtual money endpoints
          if (error.config.url.includes('/api/virtual-money/reward-status')) {
            // For reward-status endpoint
            // Get user info for personalized message
            const userEmail = localStorage.getItem('userEmail') || 'user@example.com';
            const userName = localStorage.getItem('userName') || 'User';
            const userFullName = localStorage.getItem('userFullName') || userName;

            // Check if user has already claimed reward today
            const lastReward = localStorage.getItem('lastRewardClaim');
            const today = new Date().setHours(0, 0, 0, 0);

            if (lastReward && new Date(parseInt(lastReward)).setHours(0, 0, 0, 0) === today) {
              // Already claimed today
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
                  message: `You can claim your next reward in ${hoursRemaining}h ${mins}m`,
                  timeRemaining: {
                    hours: hoursRemaining,
                    minutes: mins,
                    totalMinutes: minutesRemaining
                  },
                  balance: 10000,
                  balanceFormatted: '₹10,000'
                }
              });
            } else {
              return Promise.resolve({
                data: {
                  success: true,
                  canClaim: true,
                  message: `Hi ${userFullName}, you can claim your daily reward!`,
                  balance: 10000,
                  balanceFormatted: '₹10,000'
                }
              });
            }
          }

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
          const userEmail = localStorage.getItem('userEmail') || 'user@example.com';
          const userName = localStorage.getItem('userName') || 'User';
          const userFullName = localStorage.getItem('userFullName') || userName;

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

        // If it's an orders endpoint
        if (error.config.url.includes('/api/orders')) {
          console.log('Returning mock orders data for 404');
          return Promise.resolve({
            data: {
              success: true,
              data: []
            }
          });
        }

        // If it's a virtual money endpoint
        if (error.config.url.includes('/api/virtual-money')) {
          console.log('Handling virtual money endpoint for 404 error:', error.config.url);

          // For reward-status endpoint
          if (error.config.url.includes('/api/virtual-money/reward-status')) {
            console.log('Returning mock reward status data for 404');

            try {
              // Get user info
              const userEmail = localStorage.getItem('userEmail') || 'user@example.com';
              const userName = localStorage.getItem('userName') || 'User';
              const userFullName = localStorage.getItem('userFullName') || userName;

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

          // For other virtual money endpoints, return a default response
          return Promise.resolve({
            data: {
              success: true,
              message: 'Virtual money operation completed successfully (mock)'
            }
          });
        }

        // If it's a stock search endpoint
        if (error.config.url.includes('/api/stock-search') || error.config.url.includes('/api/stocks/search')) {
          console.log('Returning mock stock search data for 404');

          // Extract the query parameter
          const queryParam = error.config.url.split('?')[1];
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

          // Enhanced mock stock data with more fields
          const mockStocks = [
            { symbol: "AAPL", name: "Apple Inc.", exchange: "NASDAQ", exchangeShortName: "NASDAQ", type: "stock", country: "United States", currency: "USD" },
            { symbol: "MSFT", name: "Microsoft Corporation", exchange: "NASDAQ", exchangeShortName: "NASDAQ", type: "stock", country: "United States", currency: "USD" },
            { symbol: "GOOGL", name: "Alphabet Inc.", exchange: "NASDAQ", exchangeShortName: "NASDAQ", type: "stock", country: "United States", currency: "USD" },
            { symbol: "AMZN", name: "Amazon.com Inc.", exchange: "NASDAQ", exchangeShortName: "NASDAQ", type: "stock", country: "United States", currency: "USD" },
            { symbol: "META", name: "Meta Platforms Inc.", exchange: "NASDAQ", exchangeShortName: "NASDAQ", type: "stock", country: "United States", currency: "USD" },
            { symbol: "TSLA", name: "Tesla, Inc.", exchange: "NASDAQ", exchangeShortName: "NASDAQ", type: "stock", country: "United States", currency: "USD" },
            { symbol: "NFLX", name: "Netflix, Inc.", exchange: "NASDAQ", exchangeShortName: "NASDAQ", type: "stock", country: "United States", currency: "USD" },
            { symbol: "NVDA", name: "NVIDIA Corporation", exchange: "NASDAQ", exchangeShortName: "NASDAQ", type: "stock", country: "United States", currency: "USD" },
            { symbol: "RELIANCE.BSE", name: "Reliance Industries", exchange: "BSE", exchangeShortName: "BSE", type: "stock", country: "India", currency: "INR" },
            { symbol: "TCS.BSE", name: "Tata Consultancy Services", exchange: "BSE", exchangeShortName: "BSE", type: "stock", country: "India", currency: "INR" },
            { symbol: "INFY.BSE", name: "Infosys Ltd", exchange: "BSE", exchangeShortName: "BSE", type: "stock", country: "India", currency: "INR" },
            { symbol: "HDFCBANK.BSE", name: "HDFC Bank Ltd", exchange: "BSE", exchangeShortName: "BSE", type: "stock", country: "India", currency: "INR" }
          ];

          // Filter stocks based on query
          const filteredStocks = mockStocks.filter(stock =>
            stock.symbol.toLowerCase().includes(query.toLowerCase()) ||
            stock.name.toLowerCase().includes(query.toLowerCase())
          );

          console.log(`Found ${filteredStocks.length} mock stocks matching "${query}" for 404 response`);

          // Check which endpoint format to use
          if (error.config.url.includes('/api/stocks/search')) {
            // Direct endpoint format
            return Promise.resolve({
              data: {
                success: true,
                results: filteredStocks,
                query,
                source: 'mock',
                note: 'Using mock data in offline mode'
              }
            });
          } else if (error.config.url.includes('/api/stock-search')) {
            // stock-search endpoint format
            return Promise.resolve({
              data: {
                success: true,
                data: filteredStocks,
                query,
                source: 'mock',
                note: 'Using mock data in offline mode'
              }
            });
          }
        }

        // If it's a chatbot endpoint
        if (error.config.url.includes('/api/chatbot')) {
          console.log('Returning mock chatbot data for 404');

          // Handle chatbot start endpoint
          if (error.config.url.includes('/api/chatbot/start')) {
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

          // Handle chatbot message endpoint
          if (error.config.url.includes('/api/chatbot/message')) {
            // Get the message from the request data
            const message = error.config.data ? JSON.parse(error.config.data).message : '';

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

          // Handle chatbot end endpoint
          if (error.config.url.includes('/api/chatbot/end')) {
            // Clear the session ID from localStorage
            localStorage.removeItem('chatbotSessionId');

            return Promise.resolve({
              data: {
                success: true,
                message: "Chat session ended successfully"
              }
            });
          }
        }
      }
    }

    return Promise.reject(error);
  }
);

export default axios;
