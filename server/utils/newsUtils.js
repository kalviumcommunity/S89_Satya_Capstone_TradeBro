/**
 * News Utility Functions
 * Reusable functions for news processing, mock data generation, and sentiment analysis
 */

/**
 * Generate mock news data with dynamic content
 * @param {string} category - News category
 * @param {string|null} query - Search query
 * @returns {Array} Array of mock news items
 */
function generateMockNews(category = 'general', query = null) {
  const baseNews = [
    {
      id: 1,
      title: "Stock Market Reaches All-Time High Amid Tech Rally",
      description: "Major indices hit record levels as technology stocks surge on positive earnings reports and strong investor confidence. The rally continues to drive market optimism.",
      source: "Financial Times",
      url: "https://example.com/news/1",
      publishedAt: new Date(Date.now() - 3600000).toISOString(),
      category: "markets",
      symbol: "SPY"
    },
    {
      id: 2,
      title: "Federal Reserve Maintains Interest Rates, Signals Cautious Approach",
      description: "The central bank has decided to maintain current interest rates, citing stable inflation and employment figures. Officials remain cautious about future monetary policy.",
      source: "Bloomberg",
      url: "https://example.com/news/2",
      publishedAt: new Date(Date.now() - 7200000).toISOString(),
      category: "economy",
      symbol: "DJI"
    },
    {
      id: 3,
      title: "AI Revolution Drives Tech Giant's Record Quarterly Earnings",
      description: "Leading technology company unveils innovative AI products expected to disrupt multiple industries. Quarterly earnings exceed analyst expectations significantly.",
      source: "TechCrunch",
      url: "https://example.com/news/3",
      publishedAt: new Date(Date.now() - 10800000).toISOString(),
      category: "technology",
      symbol: "AAPL"
    },
    {
      id: 4,
      title: "Bitcoin Surges Past $50K as Institutional Adoption Grows",
      description: "Cryptocurrency markets rally as major institutions announce Bitcoin adoption strategies. The digital asset shows strong momentum amid regulatory clarity.",
      source: "CoinDesk",
      url: "https://example.com/news/4",
      publishedAt: new Date(Date.now() - 14400000).toISOString(),
      category: "crypto",
      symbol: "BTC"
    },
    {
      id: 5,
      title: "Energy Sector Rebounds on Strong Demand and Supply Constraints",
      description: "Oil and gas companies report strong quarterly results as energy demand recovers and supply constraints support higher prices globally.",
      source: "Reuters",
      url: "https://example.com/news/5",
      publishedAt: new Date(Date.now() - 18000000).toISOString(),
      category: "energy",
      symbol: "XLE"
    },
    {
      id: 6,
      title: "Healthcare Innovation Drives Biotech Stock Rally",
      description: "Breakthrough medical treatments and FDA approvals fuel investor optimism in biotechnology sector. Several companies announce promising clinical trial results.",
      source: "BioPharma Dive",
      url: "https://example.com/news/6",
      publishedAt: new Date(Date.now() - 21600000).toISOString(),
      category: "healthcare",
      symbol: "XBI"
    }
  ];

  // Filter by category if provided and not 'general'
  let filteredNews = baseNews;
  if (category && category !== 'general') {
    filteredNews = baseNews.filter(item => item.category === category);
  }

  // Filter by query if provided
  if (query) {
    const lowerQuery = query.toLowerCase();
    filteredNews = filteredNews.filter(item =>
      item.title.toLowerCase().includes(lowerQuery) ||
      item.description.toLowerCase().includes(lowerQuery) ||
      (item.symbol && item.symbol.toLowerCase().includes(lowerQuery))
    );
  }

  // If no results found, return all news or create query-specific news
  if (filteredNews.length === 0) {
    if (query) {
      // Create a query-specific mock news item
      filteredNews = [{
        id: Date.now(),
        title: `Breaking: ${query.toUpperCase()} Shows Strong Market Performance`,
        description: `Latest developments regarding ${query} indicate positive market sentiment and strong investor interest. Analysts remain optimistic about future prospects.`,
        source: "TradeBro News",
        url: "https://example.com/news/query",
        publishedAt: new Date().toISOString(),
        category: category || 'general',
        symbol: query.toUpperCase().substring(0, 4)
      }];
    } else {
      filteredNews = baseNews;
    }
  }

  // Add dynamic images, sentiment, and trending flags
  return filteredNews.map(item => ({
    ...item,
    image: generateDynamicImage(item.category, query, item.id),
    sentiment: analyzeSentiment(item.description),
    trending: isTrending(item.title, item.description, query)
  }));
}

/**
 * Generate dynamic Unsplash image URL based on category and query
 * @param {string} category - News category
 * @param {string|null} query - Search query
 * @param {number} id - News item ID for uniqueness
 * @returns {string} Unsplash image URL
 */
function generateDynamicImage(category, query, id) {
  const baseUrl = 'https://images.unsplash.com/';
  const imageParams = 'auto=format&fit=crop&w=800&q=80';
  
  // Category-specific image mappings
  const categoryImages = {
    markets: 'photo-1611974789855-9c2a0a7236a3', // Stock market charts
    economy: 'photo-1526304640581-d334cdbbf45e', // Economic indicators
    technology: 'photo-1519389950473-47ba0277781c', // Technology/AI
    crypto: 'photo-1639762681485-074b7f938ba0', // Cryptocurrency
    energy: 'photo-1497435334941-8c899ee9e8e9', // Energy/oil
    healthcare: 'photo-1559757148-5c350d0d3c56', // Healthcare/medical
    general: 'photo-1590283603385-17ffb3a7f29f' // General finance
  };

  // Use query-specific image if available, otherwise use category default
  if (query) {
    const queryLower = query.toLowerCase();
    if (queryLower.includes('bitcoin') || queryLower.includes('crypto')) {
      return `${baseUrl}photo-1639762681485-074b7f938ba0?${imageParams}`;
    }
    if (queryLower.includes('ai') || queryLower.includes('tech')) {
      return `${baseUrl}photo-1519389950473-47ba0277781c?${imageParams}`;
    }
    if (queryLower.includes('energy') || queryLower.includes('oil')) {
      return `${baseUrl}photo-1497435334941-8c899ee9e8e9?${imageParams}`;
    }
  }

  const imageId = categoryImages[category] || categoryImages.general;
  return `${baseUrl}${imageId}?${imageParams}&sig=${id}`;
}

/**
 * Analyze sentiment based on keywords in the description
 * @param {string} description - News description
 * @returns {string} Sentiment: 'positive', 'negative', or 'neutral'
 */
function analyzeSentiment(description) {
  const text = description.toLowerCase();
  
  const positiveKeywords = [
    'surge', 'rally', 'gains', 'growth', 'positive', 'strong', 'record', 'high',
    'breakthrough', 'success', 'optimistic', 'bullish', 'rise', 'increase',
    'exceed', 'outperform', 'boost', 'momentum', 'confidence', 'recovery'
  ];
  
  const negativeKeywords = [
    'fall', 'drop', 'decline', 'crash', 'loss', 'negative', 'weak', 'low',
    'concern', 'worry', 'bearish', 'decrease', 'plunge', 'tumble', 'crisis',
    'risk', 'uncertainty', 'volatility', 'pressure', 'struggle'
  ];

  let positiveScore = 0;
  let negativeScore = 0;

  positiveKeywords.forEach(keyword => {
    if (text.includes(keyword)) positiveScore++;
  });

  negativeKeywords.forEach(keyword => {
    if (text.includes(keyword)) negativeScore++;
  });

  if (positiveScore > negativeScore) return 'positive';
  if (negativeScore > positiveScore) return 'negative';
  return 'neutral';
}

/**
 * Determine if news is trending based on keywords
 * @param {string} title - News title
 * @param {string} description - News description
 * @param {string|null} query - Search query
 * @returns {boolean} Whether the news is trending
 */
function isTrending(title, description, query) {
  const text = `${title} ${description}`.toLowerCase();
  const queryText = query ? query.toLowerCase() : '';
  
  const trendingKeywords = [
    'bitcoin', 'ai', 'artificial intelligence', 'earnings', 'ipo', 'merger',
    'acquisition', 'breakthrough', 'record', 'all-time high', 'federal reserve',
    'interest rate', 'inflation', 'recession', 'bull market', 'bear market',
    'cryptocurrency', 'blockchain', 'tesla', 'apple', 'microsoft', 'google',
    'amazon', 'meta', 'nvidia'
  ];

  // Check if any trending keywords are present
  const hasTrendingKeyword = trendingKeywords.some(keyword => 
    text.includes(keyword) || queryText.includes(keyword)
  );

  // Additional trending indicators
  const hasUrgentWords = ['breaking', 'urgent', 'alert', 'just in'].some(word => 
    text.includes(word)
  );

  return hasTrendingKeyword || hasUrgentWords;
}

/**
 * Format news data from API response
 * @param {Array} apiData - Raw API response data
 * @param {string} category - News category
 * @returns {Array} Formatted news data
 */
function formatNewsData(apiData, category = 'general') {
  if (!Array.isArray(apiData)) return [];

  return apiData.map((item, index) => ({
    id: item.id || `api_${Date.now()}_${index}`,
    title: item.title || 'No title available',
    description: item.text || item.description || 'No description available',
    source: item.site || item.source || 'Unknown Source',
    url: item.url || '#',
    image: item.image || generateDynamicImage(category, null, index),
    publishedAt: item.publishedDate || item.publishedAt || new Date().toISOString(),
    category: item.category || category,
    symbol: item.symbol || null,
    sentiment: analyzeSentiment(item.text || item.description || ''),
    trending: isTrending(
      item.title || '', 
      item.text || item.description || '', 
      null
    )
  }));
}

/**
 * Create cache key for news requests
 * @param {string} type - Request type ('general', 'category', 'search')
 * @param {string|null} category - Category name
 * @param {string|null} query - Search query
 * @returns {string} Cache key
 */
function createCacheKey(type, category = null, query = null) {
  let key = `news_${type}`;
  if (category) key += `_cat_${category}`;
  if (query) key += `_q_${query}`;
  return key.toLowerCase().replace(/[^a-z0-9_]/g, '_');
}

module.exports = {
  generateMockNews,
  generateDynamicImage,
  analyzeSentiment,
  isTrending,
  formatNewsData,
  createCacheKey
};
