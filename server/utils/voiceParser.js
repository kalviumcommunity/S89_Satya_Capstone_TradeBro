/**
 * Voice Parser Utility
 * Handles voice intent parsing and command recognition for Saytrix
 */

/**
 * Intent types supported by the voice parser
 */
const INTENT_TYPES = {
  NAVIGATE: 'navigate',
  STOCK_DATA: 'stock_data',
  ACTION: 'action',
  ANSWER: 'answer',
  ERROR: 'error',
  SEARCH: 'search',
  COMPARE: 'compare',
  NEWS: 'news',
  HELP: 'help'
};

/**
 * Navigation patterns and their corresponding routes
 */
const NAVIGATION_PATTERNS = {
  dashboard: [
    'dashboard', 'home', 'main page', 'go home', 'take me home',
    'show dashboard', 'open dashboard', 'main screen'
  ],
  portfolio: [
    'portfolio', 'my portfolio', 'show portfolio', 'open portfolio',
    'my stocks', 'my investments', 'holdings'
  ],
  watchlist: [
    'watchlist', 'watch list', 'my watchlist', 'show watchlist',
    'open watchlist', 'favorites', 'saved stocks'
  ],
  market: [
    'market', 'stocks', 'stock market', 'market data', 'show market',
    'open market', 'trading', 'stock prices'
  ],
  news: [
    'news', 'market news', 'financial news', 'show news',
    'latest news', 'stock news', 'business news'
  ],
  orders: [
    'orders', 'my orders', 'order history', 'show orders',
    'trading history', 'transactions'
  ],
  settings: [
    'settings', 'preferences', 'configuration', 'options',
    'account settings', 'profile'
  ]
};

/**
 * Action patterns for trading operations
 */
const ACTION_PATTERNS = {
  buy: [
    'buy', 'purchase', 'invest in', 'get shares of', 'acquire',
    'place buy order', 'order to buy'
  ],
  sell: [
    'sell', 'dispose', 'liquidate', 'exit position', 'close position',
    'place sell order', 'order to sell'
  ],
  add_to_watchlist: [
    'add to watchlist', 'watch', 'track', 'follow', 'monitor',
    'add to favorites', 'save stock'
  ],
  remove_from_watchlist: [
    'remove from watchlist', 'unwatch', 'stop tracking',
    'remove from favorites', 'delete from watchlist'
  ],
  set_alert: [
    'set alert', 'create alert', 'notify me', 'alert when',
    'price alert', 'set notification'
  ]
};

/**
 * Stock-related keywords for data queries
 */
const STOCK_KEYWORDS = [
  'price', 'quote', 'stock', 'share', 'ticker', 'symbol',
  'market cap', 'pe ratio', 'earnings', 'dividend', 'volume',
  'high', 'low', 'open', 'close', 'change', 'percentage'
];

/**
 * Parse voice intent from message and AI response
 * @param {string} message - Original user message
 * @param {object} aiResponse - AI response object
 * @returns {object} Parsed intent with type and data
 */
const parseVoiceIntent = (message, aiResponse) => {
  try {
    const normalizedMessage = message.toLowerCase().trim();
    const normalizedAiResponse = aiResponse.message ? aiResponse.message.toLowerCase() : '';

    // Check for navigation intents
    const navigationIntent = parseNavigationIntent(normalizedMessage, normalizedAiResponse);
    if (navigationIntent) {
      return navigationIntent;
    }

    // Check for action intents
    const actionIntent = parseActionIntent(normalizedMessage, normalizedAiResponse);
    if (actionIntent) {
      return actionIntent;
    }

    // Check for stock data intents
    const stockIntent = parseStockIntent(normalizedMessage, aiResponse);
    if (stockIntent) {
      return stockIntent;
    }

    // Check for search intents
    const searchIntent = parseSearchIntent(normalizedMessage, normalizedAiResponse);
    if (searchIntent) {
      return searchIntent;
    }

    // Check for comparison intents
    const compareIntent = parseCompareIntent(normalizedMessage, normalizedAiResponse);
    if (compareIntent) {
      return compareIntent;
    }

    // Check for news intents
    const newsIntent = parseNewsIntent(normalizedMessage, normalizedAiResponse);
    if (newsIntent) {
      return newsIntent;
    }

    // Check for help intents
    const helpIntent = parseHelpIntent(normalizedMessage, normalizedAiResponse);
    if (helpIntent) {
      return helpIntent;
    }

    // Default to answer intent
    return {
      type: INTENT_TYPES.ANSWER,
      data: aiResponse.message || message,
      confidence: 0.5
    };

  } catch (error) {
    console.error('Error parsing voice intent:', error);
    return {
      type: INTENT_TYPES.ERROR,
      data: 'Failed to parse voice intent',
      error: error.message,
      confidence: 0
    };
  }
};

/**
 * Parse navigation intent
 * @param {string} message - Normalized message
 * @param {string} aiResponse - Normalized AI response
 * @returns {object|null} Navigation intent or null
 */
const parseNavigationIntent = (message, aiResponse) => {
  for (const [route, patterns] of Object.entries(NAVIGATION_PATTERNS)) {
    for (const pattern of patterns) {
      if (message.includes(pattern) || aiResponse.includes(pattern)) {
        return {
          type: INTENT_TYPES.NAVIGATE,
          data: `/${route}`,
          route,
          confidence: calculateConfidence(message, pattern)
        };
      }
    }
  }
  return null;
};

/**
 * Parse action intent
 * @param {string} message - Normalized message
 * @param {string} aiResponse - Normalized AI response
 * @returns {object|null} Action intent or null
 */
const parseActionIntent = (message, aiResponse) => {
  for (const [action, patterns] of Object.entries(ACTION_PATTERNS)) {
    for (const pattern of patterns) {
      if (message.includes(pattern) || aiResponse.includes(pattern)) {
        // Extract stock symbol if present
        const stockSymbol = extractStockSymbol(message);
        
        return {
          type: INTENT_TYPES.ACTION,
          data: action,
          action,
          stockSymbol,
          confidence: calculateConfidence(message, pattern)
        };
      }
    }
  }
  return null;
};

/**
 * Parse stock data intent
 * @param {string} message - Normalized message
 * @param {object} aiResponse - AI response object
 * @returns {object|null} Stock intent or null
 */
const parseStockIntent = (message, aiResponse) => {
  // Check if AI response contains stock data
  if (aiResponse.stockData) {
    return {
      type: INTENT_TYPES.STOCK_DATA,
      data: aiResponse.stockData,
      stockSymbol: aiResponse.stockData.symbol,
      confidence: 0.9
    };
  }

  // Check for stock-related keywords
  const hasStockKeywords = STOCK_KEYWORDS.some(keyword => message.includes(keyword));
  const stockSymbol = extractStockSymbol(message);

  if (hasStockKeywords || stockSymbol) {
    return {
      type: INTENT_TYPES.STOCK_DATA,
      data: stockSymbol || 'general_stock_query',
      stockSymbol,
      confidence: stockSymbol ? 0.8 : 0.6
    };
  }

  return null;
};

/**
 * Parse search intent
 * @param {string} message - Normalized message
 * @param {string} aiResponse - Normalized AI response
 * @returns {object|null} Search intent or null
 */
const parseSearchIntent = (message, aiResponse) => {
  const searchPatterns = ['search', 'find', 'look for', 'show me', 'get me'];
  
  for (const pattern of searchPatterns) {
    if (message.includes(pattern)) {
      const query = message.replace(pattern, '').trim();
      return {
        type: INTENT_TYPES.SEARCH,
        data: query,
        query,
        confidence: 0.7
      };
    }
  }
  return null;
};

/**
 * Parse comparison intent
 * @param {string} message - Normalized message
 * @param {string} aiResponse - Normalized AI response
 * @returns {object|null} Compare intent or null
 */
const parseCompareIntent = (message, aiResponse) => {
  const comparePatterns = ['compare', 'vs', 'versus', 'against', 'difference between'];
  
  for (const pattern of comparePatterns) {
    if (message.includes(pattern)) {
      const symbols = extractMultipleStockSymbols(message);
      return {
        type: INTENT_TYPES.COMPARE,
        data: symbols,
        symbols,
        confidence: symbols.length >= 2 ? 0.8 : 0.5
      };
    }
  }
  return null;
};

/**
 * Parse news intent
 * @param {string} message - Normalized message
 * @param {string} aiResponse - Normalized AI response
 * @returns {object|null} News intent or null
 */
const parseNewsIntent = (message, aiResponse) => {
  const newsPatterns = ['news', 'headlines', 'updates', 'latest', 'breaking'];
  
  for (const pattern of newsPatterns) {
    if (message.includes(pattern)) {
      const stockSymbol = extractStockSymbol(message);
      return {
        type: INTENT_TYPES.NEWS,
        data: stockSymbol || 'general_news',
        stockSymbol,
        confidence: 0.7
      };
    }
  }
  return null;
};

/**
 * Parse help intent
 * @param {string} message - Normalized message
 * @param {string} aiResponse - Normalized AI response
 * @returns {object|null} Help intent or null
 */
const parseHelpIntent = (message, aiResponse) => {
  const helpPatterns = ['help', 'how to', 'what is', 'explain', 'tutorial', 'guide'];
  
  for (const pattern of helpPatterns) {
    if (message.includes(pattern)) {
      return {
        type: INTENT_TYPES.HELP,
        data: message,
        topic: message.replace(pattern, '').trim(),
        confidence: 0.6
      };
    }
  }
  return null;
};

/**
 * Extract stock symbol from message
 * @param {string} message - Message to parse
 * @returns {string|null} Stock symbol or null
 */
const extractStockSymbol = (message) => {
  // Common Indian stock patterns
  const indianStockPattern = /\b([A-Z]{2,10})(\.NS|\.BO)?\b/g;
  const matches = message.toUpperCase().match(indianStockPattern);
  
  if (matches && matches.length > 0) {
    return matches[0];
  }

  // Common US stock patterns
  const usStockPattern = /\b[A-Z]{1,5}\b/g;
  const usMatches = message.toUpperCase().match(usStockPattern);
  
  if (usMatches && usMatches.length > 0) {
    // Filter out common words that might match the pattern
    const commonWords = ['THE', 'AND', 'OR', 'BUT', 'FOR', 'TO', 'OF', 'IN', 'ON', 'AT'];
    const filteredMatches = usMatches.filter(match => !commonWords.includes(match));
    
    if (filteredMatches.length > 0) {
      return filteredMatches[0];
    }
  }

  return null;
};

/**
 * Extract multiple stock symbols from message
 * @param {string} message - Message to parse
 * @returns {array} Array of stock symbols
 */
const extractMultipleStockSymbols = (message) => {
  const symbols = [];
  const stockPattern = /\b([A-Z]{2,10})(\.NS|\.BO)?\b/g;
  let match;
  
  while ((match = stockPattern.exec(message.toUpperCase())) !== null) {
    symbols.push(match[0]);
  }
  
  return symbols;
};

/**
 * Calculate confidence score for pattern matching
 * @param {string} message - Original message
 * @param {string} pattern - Matched pattern
 * @returns {number} Confidence score (0-1)
 */
const calculateConfidence = (message, pattern) => {
  const messageWords = message.split(' ').length;
  const patternWords = pattern.split(' ').length;
  
  // Higher confidence for exact matches and shorter patterns
  if (message.includes(pattern)) {
    return Math.min(0.9, 0.5 + (patternWords / messageWords));
  }
  
  return 0.3;
};

/**
 * Get intent suggestions based on message
 * @param {string} message - User message
 * @returns {array} Array of suggested intents
 */
const getIntentSuggestions = (message) => {
  const suggestions = [];
  const normalizedMessage = message.toLowerCase();

  // Add navigation suggestions
  if (normalizedMessage.includes('go') || normalizedMessage.includes('show')) {
    suggestions.push(
      { text: '📊 Go to Dashboard', intent: 'navigate', data: '/dashboard' },
      { text: '💼 View Portfolio', intent: 'navigate', data: '/portfolio' },
      { text: '📈 Check Market', intent: 'navigate', data: '/market' }
    );
  }

  // Add stock suggestions
  if (STOCK_KEYWORDS.some(keyword => normalizedMessage.includes(keyword))) {
    suggestions.push(
      { text: '💰 Get Stock Quote', intent: 'stock_data', data: 'quote' },
      { text: '📊 View Chart', intent: 'stock_data', data: 'chart' },
      { text: '📰 Stock News', intent: 'news', data: 'stock_news' }
    );
  }

  return suggestions;
};

module.exports = {
  parseVoiceIntent,
  extractStockSymbol,
  extractMultipleStockSymbols,
  getIntentSuggestions,
  INTENT_TYPES,
  NAVIGATION_PATTERNS,
  ACTION_PATTERNS
};
