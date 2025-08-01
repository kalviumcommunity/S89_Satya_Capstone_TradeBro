/**
 * Stock Search Service
 * Handles multi-source stock search with FMP API, Twelve Data API, and local fallback
 */

const axios = require('axios');

class StockSearchService {
  constructor() {
    this.fmpApiKey = process.env.FMP_API_KEY;
    this.twelveDataApiKey = process.env.TWELVE_DATA_API_KEY;
    this.requestTimeout = 5000; // 5 seconds
    
    // Future: This will be replaced with MongoDB/Redis cache
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Perform multi-source stock search with fallbacks
   * @param {string} query - Search query
   * @param {number} limit - Maximum results to return
   * @returns {Promise<Array>} Normalized search results
   */
  async searchStocks(query, limit = 10) {
    const results = [];
    const seenSymbols = new Set();
    const cacheKey = `search:${query.toLowerCase()}:${limit}`;

    try {
      // Check cache first (future: MongoDB/Redis)
      const cachedResults = this.getCachedResults(cacheKey);
      if (cachedResults) {
        console.log(`💾 Cache hit for search: "${query}"`);
        return cachedResults;
      }

      console.log(`🔍 Multi-source search for: "${query}"`);

      // 1. Try FMP API first
      const fmpResults = await this.searchWithFMP(query, limit);
      this.addUniqueResults(results, fmpResults, seenSymbols, limit);

      // 2. Try Twelve Data API if we need more results
      if (results.length < limit && this.twelveDataApiKey) {
        const twelveDataResults = await this.searchWithTwelveData(query, limit - results.length);
        this.addUniqueResults(results, twelveDataResults, seenSymbols, limit);
      }

      // 3. Add local suggestions if still need more results
      if (results.length < limit) {
        const localResults = this.searchLocalStocks(query, limit - results.length);
        this.addUniqueResults(results, localResults, seenSymbols, limit);
      }

      // Cache results (future: MongoDB/Redis)
      this.setCachedResults(cacheKey, results);

      console.log(`✅ Found ${results.length} total search results`);
      return results;

    } catch (error) {
      console.error('❌ Multi-source search error:', error.message);
      
      // Return local fallback on complete failure
      const fallbackResults = this.searchLocalStocks(query, limit);
      console.log(`🟣 Local fallback returned ${fallbackResults.length} results`);
      return fallbackResults;
    }
  }

  /**
   * Search using Financial Modeling Prep API
   * @param {string} query - Search query
   * @param {number} limit - Maximum results
   * @returns {Promise<Array>} Normalized FMP results
   */
  async searchWithFMP(query, limit = 10) {
    try {
      if (!this.fmpApiKey) {
        console.warn('🟢 FMP API: API key not configured');
        return [];
      }

      console.log('🟢 FMP API: Searching...');
      
      const searchUrl = `https://financialmodelingprep.com/api/v3/search`;
      const response = await axios.get(searchUrl, {
        params: {
          query: query,
          limit: limit,
          apikey: this.fmpApiKey
        },
        timeout: this.requestTimeout
      });

      if (!response.data || !Array.isArray(response.data)) {
        throw new Error('Invalid response format');
      }

      const normalizedResults = response.data.map(stock => this.normalizeFMPResult(stock));
      console.log(`🟢 FMP API: Found ${normalizedResults.length} results`);
      
      return normalizedResults;

    } catch (error) {
      console.warn(`🟢 FMP API: Search failed - ${error.message}`);
      return [];
    }
  }

  /**
   * Search using Twelve Data API
   * @param {string} query - Search query
   * @param {number} limit - Maximum results
   * @returns {Promise<Array>} Normalized Twelve Data results
   */
  async searchWithTwelveData(query, limit = 10) {
    try {
      if (!this.twelveDataApiKey) {
        console.warn('🟡 Twelve Data API: API key not configured');
        return [];
      }

      console.log('🟡 Twelve Data API: Searching...');
      
      const searchUrl = `https://api.twelvedata.com/symbol_search`;
      const response = await axios.get(searchUrl, {
        params: {
          symbol: query,
          apikey: this.twelveDataApiKey
        },
        timeout: this.requestTimeout
      });

      if (!response.data || !response.data.data || !Array.isArray(response.data.data)) {
        throw new Error('Invalid response format');
      }

      const normalizedResults = response.data.data
        .slice(0, limit)
        .map(stock => this.normalizeTwelveDataResult(stock));
      
      console.log(`🟡 Twelve Data API: Found ${normalizedResults.length} results`);
      
      return normalizedResults;

    } catch (error) {
      console.warn(`🟡 Twelve Data API: Search failed - ${error.message}`);
      return [];
    }
  }

  /**
   * Search local Indian NSE stocks
   * @param {string} query - Search query
   * @param {number} limit - Maximum results
   * @returns {Array} Normalized local results
   */
  searchLocalStocks(query, limit = 10) {
    try {
      console.log('🟣 Local fallback: Searching...');
      
      const lowerQuery = query.toLowerCase();
      const matchedStocks = this.getIndianStocks().filter(stock => 
        stock.symbol.toLowerCase().includes(lowerQuery) ||
        stock.name.toLowerCase().includes(lowerQuery) ||
        stock.sector.toLowerCase().includes(lowerQuery)
      );

      const results = matchedStocks.slice(0, limit);
      console.log(`🟣 Local fallback: Found ${results.length} results`);
      
      return results;

    } catch (error) {
      console.error(`🟣 Local fallback: Search failed - ${error.message}`);
      return [];
    }
  }

  /**
   * Get trending Indian NSE stocks
   * @param {number} limit - Maximum results
   * @returns {Array} Top trending stocks
   */
  getTrendingStocks(limit = 10) {
    const trendingSymbols = [
      'RELIANCE.NS', 'TCS.NS', 'HDFCBANK.NS', 'INFY.NS', 'ICICIBANK.NS',
      'SBIN.NS', 'ITC.NS', 'LT.NS', 'BHARTIARTL.NS', 'ASIANPAINT.NS'
    ];

    const allStocks = this.getIndianStocks();
    const trendingStocks = trendingSymbols
      .map(symbol => allStocks.find(stock => stock.symbol === symbol))
      .filter(Boolean)
      .slice(0, limit);

    console.log(`📈 Trending stocks: Returned ${trendingStocks.length} stocks`);
    return trendingStocks;
  }

  /**
   * Get instant search suggestions
   * @param {string} query - Search query
   * @param {number} limit - Maximum suggestions
   * @returns {Array} Quick suggestions
   */
  getSuggestions(query, limit = 5) {
    if (!query || query.trim().length < 1) {
      return [];
    }

    const suggestions = this.searchLocalStocks(query, limit);
    console.log(`💡 Suggestions: Found ${suggestions.length} for "${query}"`);
    
    return suggestions;
  }

  /**
   * Add unique results to the main results array
   * @private
   */
  addUniqueResults(results, newResults, seenSymbols, limit) {
    for (const stock of newResults) {
      if (!seenSymbols.has(stock.symbol) && results.length < limit) {
        results.push(stock);
        seenSymbols.add(stock.symbol);
      }
    }
  }

  /**
   * Normalize FMP API result
   * @private
   */
  normalizeFMPResult(stock) {
    return {
      symbol: stock.symbol,
      name: stock.name,
      exchange: stock.exchangeShortName || 'Unknown',
      currency: stock.currency || this.getCurrencyByExchange(stock.exchangeShortName),
      sector: stock.sector || 'Unknown',
      country: this.getCountryByExchange(stock.exchangeShortName),
      source: 'FMP'
    };
  }

  /**
   * Normalize Twelve Data API result
   * @private
   */
  normalizeTwelveDataResult(stock) {
    return {
      symbol: stock.symbol,
      name: stock.instrument_name,
      exchange: stock.exchange,
      currency: stock.currency || this.getCurrencyByExchange(stock.exchange),
      sector: stock.instrument_type || 'Unknown',
      country: stock.country || this.getCountryByExchange(stock.exchange),
      source: 'TwelveData'
    };
  }

  /**
   * Get currency by exchange
   * @private
   */
  getCurrencyByExchange(exchange) {
    const exchangeCurrencyMap = {
      'NSE': 'INR',
      'BSE': 'INR',
      'NASDAQ': 'USD',
      'NYSE': 'USD',
      'LSE': 'GBP'
    };
    return exchangeCurrencyMap[exchange] || 'USD';
  }

  /**
   * Get country by exchange
   * @private
   */
  getCountryByExchange(exchange) {
    const exchangeCountryMap = {
      'NSE': 'India',
      'BSE': 'India',
      'NASDAQ': 'United States',
      'NYSE': 'United States',
      'LSE': 'United Kingdom'
    };
    return exchangeCountryMap[exchange] || 'Unknown';
  }

  /**
   * Get cached results (future: MongoDB/Redis)
   * @private
   */
  getCachedResults(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    return null;
  }

  /**
   * Set cached results (future: MongoDB/Redis)
   * @private
   */
  setCachedResults(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Get Indian stocks data
   * @private
   */
  getIndianStocks() {
    return [
      { symbol: 'RELIANCE.NS', name: 'Reliance Industries Ltd', sector: 'Energy', exchange: 'NSE', currency: 'INR', country: 'India', source: 'Local' },
      { symbol: 'TCS.NS', name: 'Tata Consultancy Services', sector: 'IT', exchange: 'NSE', currency: 'INR', country: 'India', source: 'Local' },
      { symbol: 'HDFCBANK.NS', name: 'HDFC Bank Ltd', sector: 'Banking', exchange: 'NSE', currency: 'INR', country: 'India', source: 'Local' },
      { symbol: 'INFY.NS', name: 'Infosys Ltd', sector: 'IT', exchange: 'NSE', currency: 'INR', country: 'India', source: 'Local' },
      { symbol: 'ICICIBANK.NS', name: 'ICICI Bank Ltd', sector: 'Banking', exchange: 'NSE', currency: 'INR', country: 'India', source: 'Local' },
      { symbol: 'SBIN.NS', name: 'State Bank of India', sector: 'Banking', exchange: 'NSE', currency: 'INR', country: 'India', source: 'Local' },
      { symbol: 'ITC.NS', name: 'ITC Ltd', sector: 'FMCG', exchange: 'NSE', currency: 'INR', country: 'India', source: 'Local' },
      { symbol: 'LT.NS', name: 'Larsen & Toubro Ltd', sector: 'Infrastructure', exchange: 'NSE', currency: 'INR', country: 'India', source: 'Local' },
      { symbol: 'BHARTIARTL.NS', name: 'Bharti Airtel Ltd', sector: 'Telecom', exchange: 'NSE', currency: 'INR', country: 'India', source: 'Local' },
      { symbol: 'ASIANPAINT.NS', name: 'Asian Paints Ltd', sector: 'Paints', exchange: 'NSE', currency: 'INR', country: 'India', source: 'Local' },
      { symbol: 'WIPRO.NS', name: 'Wipro Ltd', sector: 'IT', exchange: 'NSE', currency: 'INR', country: 'India', source: 'Local' },
      { symbol: 'MARUTI.NS', name: 'Maruti Suzuki India Ltd', sector: 'Auto', exchange: 'NSE', currency: 'INR', country: 'India', source: 'Local' },
      { symbol: 'BAJFINANCE.NS', name: 'Bajaj Finance Ltd', sector: 'NBFC', exchange: 'NSE', currency: 'INR', country: 'India', source: 'Local' },
      { symbol: 'KOTAKBANK.NS', name: 'Kotak Mahindra Bank Ltd', sector: 'Banking', exchange: 'NSE', currency: 'INR', country: 'India', source: 'Local' },
      { symbol: 'HINDUNILVR.NS', name: 'Hindustan Unilever Ltd', sector: 'FMCG', exchange: 'NSE', currency: 'INR', country: 'India', source: 'Local' },
      { symbol: 'AXISBANK.NS', name: 'Axis Bank Ltd', sector: 'Banking', exchange: 'NSE', currency: 'INR', country: 'India', source: 'Local' },
      { symbol: 'ULTRACEMCO.NS', name: 'UltraTech Cement Ltd', sector: 'Cement', exchange: 'NSE', currency: 'INR', country: 'India', source: 'Local' },
      { symbol: 'NESTLEIND.NS', name: 'Nestle India Ltd', sector: 'FMCG', exchange: 'NSE', currency: 'INR', country: 'India', source: 'Local' },
      { symbol: 'POWERGRID.NS', name: 'Power Grid Corporation', sector: 'Power', exchange: 'NSE', currency: 'INR', country: 'India', source: 'Local' },
      { symbol: 'NTPC.NS', name: 'NTPC Ltd', sector: 'Power', exchange: 'NSE', currency: 'INR', country: 'India', source: 'Local' },
      { symbol: 'TECHM.NS', name: 'Tech Mahindra Ltd', sector: 'IT', exchange: 'NSE', currency: 'INR', country: 'India', source: 'Local' },
      { symbol: 'SUNPHARMA.NS', name: 'Sun Pharmaceutical Industries', sector: 'Pharma', exchange: 'NSE', currency: 'INR', country: 'India', source: 'Local' },
      { symbol: 'TITAN.NS', name: 'Titan Company Ltd', sector: 'Jewellery', exchange: 'NSE', currency: 'INR', country: 'India', source: 'Local' },
      { symbol: 'DRREDDY.NS', name: 'Dr. Reddys Laboratories', sector: 'Pharma', exchange: 'NSE', currency: 'INR', country: 'India', source: 'Local' }
    ];
  }
}

module.exports = new StockSearchService();
