const axios = require('axios');

/**
 * Enhanced Stock Data Provider with multiple API sources and fallback handling
 * Supports FMP API, Twelve Data API with intelligent routing for Indian stocks
 */
class StockDataProvider {
  constructor() {
    this.fmpApiKeys = [
      process.env.FMP_API_KEY,
      process.env.FMP_API_KEY_2,
      process.env.FMP_API_KEY_3,
      process.env.FMP_API_KEY_4
    ].filter(Boolean);
    this.twelveDataApiKey = process.env.TWELVE_DATA_API_KEY;
    this.requestTimeout = 10000; // 10 seconds
    this.retryAttempts = 2;
    this.currentFmpKeyIndex = 0;
    
    this.initializeApiEndpoints();
  }

  /**
   * Initialize API endpoints and configurations
   */
  initializeApiEndpoints() {
    this.apis = {
      fmp: {
        baseUrl: 'https://financialmodelingprep.com/api/v3',
        endpoints: {
          quote: '/quote',
          profile: '/profile',
          gainers: '/stock_market/gainers',
          losers: '/stock_market/losers',
          news: '/stock_news'
        },
        rateLimit: 250 // requests per minute
      },
      twelveData: {
        baseUrl: 'https://api.twelvedata.com',
        endpoints: {
          quote: '/quote',
          profile: '/profile',
          news: '/news'
        },
        rateLimit: 800 // requests per minute for free tier
      }
    };

    this.indianStockSymbols = new Set([
      'TCS', 'RELIANCE', 'INFY', 'HDFCBANK', 'ICICIBANK', 'SBIN', 'ITC',
      'LT', 'BHARTIARTL', 'ASIANPAINT', 'WIPRO', 'MARUTI', 'BAJFINANCE',
      'KOTAKBANK', 'HINDUNILVR', 'AXISBANK', 'ULTRACEMCO', 'NESTLEIND',
      'POWERGRID', 'NTPC', 'TECHM', 'SUNPHARMA', 'TITAN', 'DRREDDY',
      'ZOMATO', 'SWIGGY', 'PAYTM', 'NYKAA', 'COALINDIA', 'ONGC', 'IOC'
    ]);
  }

  /**
   * Get stock data with intelligent API selection and fallback
   */
  async getStockData(symbol) {
    try {
      console.log(`🔍 Fetching stock data for: ${symbol}`);
      
      const isIndianStock = this.isIndianStock(symbol);
      console.log(`🇮🇳 Indian stock detected: ${isIndianStock}`);

      // Try primary API based on stock type
      const primaryResult = await this.fetchFromPrimaryApi(symbol, isIndianStock);
      if (primaryResult) {
        console.log('✅ Data retrieved from primary API');
        return primaryResult;
      }

      // Try fallback APIs
      const fallbackResult = await this.fetchFromFallbackApis(symbol, isIndianStock);
      if (fallbackResult) {
        console.log('✅ Data retrieved from fallback API');
        return fallbackResult;
      }

      console.log('❌ No data found from any API');
      return null;
    } catch (error) {
      console.error('Error in getStockData:', error);
      return null;
    }
  }

  /**
   * Fetch from primary API based on stock type
   */
  async fetchFromPrimaryApi(symbol, isIndianStock) {
    if (isIndianStock && this.twelveDataApiKey) {
      return await this.fetchFromTwelveData(symbol);
    } else if (this.fmpApiKey) {
      return await this.fetchFromFMP(symbol);
    }
    return null;
  }

  /**
   * Fetch from fallback APIs
   */
  async fetchFromFallbackApis(symbol, isIndianStock) {
    const apis = isIndianStock 
      ? [() => this.fetchFromFMP(symbol), () => this.fetchFromTwelveData(symbol)]
      : [() => this.fetchFromTwelveData(symbol), () => this.fetchFromFMP(symbol)];

    for (const apiCall of apis) {
      try {
        const result = await apiCall();
        if (result) return result;
      } catch (error) {
        console.log('Fallback API failed, trying next...');
        continue;
      }
    }
    return null;
  }

  /**
   * Fetch stock data from FMP API with multiple keys
   */
  async fetchFromFMP(symbol) {
    if (this.fmpApiKeys.length === 0) return null;

    const symbolVariants = this.generateSymbolVariants(symbol);
    
    for (const apiKey of this.fmpApiKeys) {
      for (const variant of symbolVariants) {
        try {
          const [priceResponse, profileResponse] = await Promise.allSettled([
            this.makeRequest(`${this.apis.fmp.baseUrl}/quote/${variant}?apikey=${apiKey}`),
            this.makeRequest(`${this.apis.fmp.baseUrl}/profile/${variant}?apikey=${apiKey}`)
          ]);

          const priceData = priceResponse.status === 'fulfilled' ? priceResponse.value.data[0] : null;
          const profileData = profileResponse.status === 'fulfilled' ? profileResponse.value.data[0] : null;

          if (priceData && (profileData || priceData.name)) {
            return this.formatFMPResponse(priceData, profileData);
          }
        } catch (error) {
          continue; // Try next variant/key
        }
      }
    }
    return null;
  }

  /**
   * Fetch stock data from Twelve Data API
   */
  async fetchFromTwelveData(symbol) {
    if (!this.twelveDataApiKey) return null;

    try {
      const symbolVariants = this.generateTwelveDataVariants(symbol);
      
      for (const variant of symbolVariants) {
        try {
          const response = await this.makeRequest(
            `${this.apis.twelveData.baseUrl}/quote?symbol=${variant}&apikey=${this.twelveDataApiKey}`
          );

          const data = response.data;
          if (data && !data.code && data.symbol) {
            return this.formatTwelveDataResponse(data);
          }
        } catch (error) {
          continue; // Try next variant
        }
      }
      return null;
    } catch (error) {
      console.error('Twelve Data API error:', error.message);
      return null;
    }
  }

  /**
   * Get top movers (gainers/losers) with multiple API keys
   */
  async getTopMovers(type = 'gainers') {
    if (this.fmpApiKeys.length === 0) {
      return this.getMockTopMovers(type);
    }

    const endpoint = type === 'gainers' ? 'gainers' : 'losers';
    
    for (const apiKey of this.fmpApiKeys) {
      try {
        const response = await this.makeRequest(
          `${this.apis.fmp.baseUrl}/stock_market/${endpoint}?apikey=${apiKey}`
        );
        return response.data.slice(0, 10);
      } catch (error) {
        console.log(`FMP API key failed for ${type}: ${apiKey.substring(0, 8)}...`);
        continue;
      }
    }
    
    return this.getMockTopMovers(type);
  }

  /**
   * Get market news with multiple API keys
   */
  async getMarketNews(symbol = null, limit = 5) {
    if (this.fmpApiKeys.length === 0) {
      return this.getMockNews(symbol, limit);
    }

    for (const apiKey of this.fmpApiKeys) {
      try {
        const url = symbol 
          ? `${this.apis.fmp.baseUrl}/stock_news?tickers=${symbol}&limit=${limit}&apikey=${apiKey}`
          : `${this.apis.fmp.baseUrl}/stock_news?limit=${limit}&apikey=${apiKey}`;
        
        const response = await this.makeRequest(url);
        return response.data;
      } catch (error) {
        console.log(`FMP API key failed for news: ${apiKey.substring(0, 8)}...`);
        continue;
      }
    }
    
    return this.getMockNews(symbol, limit);
  }

  /**
   * Utility Methods
   */
  isIndianStock(symbol) {
    const cleanSymbol = symbol.replace(/\.(NS|BO|NSE)$/, '').toUpperCase();
    return this.indianStockSymbols.has(cleanSymbol);
  }

  generateSymbolVariants(symbol) {
    const baseSymbol = symbol.replace(/\.(NS|BO|NSE)$/, '');
    return [
      symbol,
      `${baseSymbol}.NS`,
      `${baseSymbol}.BO`,
      baseSymbol
    ];
  }

  generateTwelveDataVariants(symbol) {
    const baseSymbol = symbol.replace(/\.(NS|BO|NSE)$/, '');
    return [
      `${baseSymbol}.NSE`,
      `${baseSymbol}.BSE`,
      symbol,
      baseSymbol
    ];
  }

  async makeRequest(url) {
    const config = {
      timeout: this.requestTimeout,
      headers: {
        'User-Agent': 'TradeBro-StockAssistant/1.0'
      }
    };

    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        return await axios.get(url, config);
      } catch (error) {
        if (attempt === this.retryAttempts) throw error;
        await this.delay(1000 * attempt); // Exponential backoff
      }
    }
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  formatFMPResponse(priceData, profileData) {
    return {
      symbol: priceData.symbol,
      name: profileData?.companyName || priceData.name || priceData.symbol,
      price: priceData.price || 0,
      change: priceData.change || 0,
      changesPercentage: priceData.changesPercentage || 0,
      marketCap: profileData?.mktCap || null,
      pe: priceData.pe || null,
      eps: priceData.eps || null,
      description: profileData?.description || '',
      sector: profileData?.sector || null,
      industry: profileData?.industry || null,
      website: profileData?.website || null,
      dayLow: priceData.dayLow || 0,
      dayHigh: priceData.dayHigh || 0,
      yearLow: priceData.yearLow || 0,
      yearHigh: priceData.yearHigh || 0,
      volume: priceData.volume || 0,
      avgVolume: priceData.avgVolume || null,
      source: 'FMP'
    };
  }

  formatTwelveDataResponse(data) {
    return {
      symbol: data.symbol,
      name: data.name || data.symbol,
      price: parseFloat(data.close) || 0,
      change: parseFloat(data.change) || 0,
      changesPercentage: parseFloat(data.percent_change) || 0,
      marketCap: null,
      pe: null,
      eps: null,
      description: `Stock data for ${data.name || data.symbol}`,
      sector: null,
      industry: null,
      website: null,
      dayLow: parseFloat(data.low) || 0,
      dayHigh: parseFloat(data.high) || 0,
      yearLow: parseFloat(data.fifty_two_week?.low) || 0,
      yearHigh: parseFloat(data.fifty_two_week?.high) || 0,
      volume: parseInt(data.volume) || 0,
      avgVolume: null,
      source: 'TwelveData'
    };
  }

  /**
   * Fallback mock data methods
   */
  getMockTopMovers(type) {
    const mockData = type === 'gainers' ? [
      { symbol: 'RELIANCE', name: 'Reliance Industries', price: 2450.50, changesPercentage: 3.25 },
      { symbol: 'TCS', name: 'Tata Consultancy Services', price: 3890.75, changesPercentage: 2.80 },
      { symbol: 'INFY', name: 'Infosys Limited', price: 1650.30, changesPercentage: 2.45 }
    ] : [
      { symbol: 'ZOMATO', name: 'Zomato Limited', price: 85.20, changesPercentage: -4.15 },
      { symbol: 'PAYTM', name: 'One 97 Communications', price: 425.60, changesPercentage: -3.80 },
      { symbol: 'NYKAA', name: 'FSN E-Commerce Ventures', price: 145.90, changesPercentage: -3.25 }
    ];

    return mockData;
  }

  getMockNews(symbol, limit) {
    const mockNews = [
      {
        title: `${symbol || 'Market'} shows strong performance amid positive sentiment`,
        publishedDate: new Date().toISOString(),
        text: 'Market analysts are optimistic about the current trends and future prospects.'
      },
      {
        title: 'Indian markets continue to attract foreign investment',
        publishedDate: new Date(Date.now() - 86400000).toISOString(),
        text: 'Foreign institutional investors have shown increased interest in Indian equities.'
      }
    ];

    return mockNews.slice(0, limit);
  }
}

module.exports = StockDataProvider;
