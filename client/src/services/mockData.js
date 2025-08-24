/**
 * Mock Data Service for FMP API Fallback
 * Provides realistic stock data when FMP API is unavailable
 */
// Generate realistic stock price data
const generateStockData = (symbol, basePrice = 100, days = 30) => {
  const data = [];
  let currentPrice = basePrice;
  const now = new Date();
  
  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    // Generate realistic price movement
    const change = (Math.random() - 0.5) * 0.1; // ±5% max change
    currentPrice = Math.max(currentPrice * (1 + change), 1);
    
    const open = currentPrice;
    const high = open * (1 + Math.random() * 0.05);
    const low = open * (1 - Math.random() * 0.05);
    const close = low + Math.random() * (high - low);
    const volume = Math.floor(Math.random() * 1000000) + 100000;
    
    data.push({
      time: date.toISOString().split('T')[0],
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(close.toFixed(2)),
      volume
    });
    
    currentPrice = close;
  }
  
  return data;
};

// Mock Indian stock quotes for NSE and BSE
export const mockStockQuotes = {
  'RELIANCE.NS': {
    symbol: 'RELIANCE.NS',
    name: 'Reliance Industries Limited',
    price: 2847.50,
    change: 15.25,
    changesPercentage: 0.54,
    dayLow: 2835.40,
    dayHigh: 2865.80,
    yearHigh: 3024.90,
    yearLow: 2220.30,
    marketCap: 19250000000000,
    priceAvg50: 2798.45,
    priceAvg200: 2654.78,
    volume: 8765432,
    avgVolume: 12000000,
    exchange: 'NSE',
    open: 2840.20,
    previousClose: 2832.25,
    timestamp: Math.floor(Date.now() / 1000)
  },
  'TCS.NS': {
    symbol: 'TCS.NS',
    name: 'Tata Consultancy Services',
    price: 4125.80,
    change: -12.40,
    changesPercentage: -0.30,
    dayLow: 4118.25,
    dayHigh: 4145.60,
    yearHigh: 4592.25,
    yearLow: 3311.00,
    marketCap: 15100000000000,
    priceAvg50: 4089.75,
    priceAvg200: 3987.20,
    volume: 1234567,
    avgVolume: 2500000,
    exchange: 'NSE',
    open: 4138.20,
    previousClose: 4138.20,
    timestamp: Math.floor(Date.now() / 1000)
  },
  'HDFCBANK.NS': {
    symbol: 'HDFCBANK.NS',
    name: 'HDFC Bank Limited',
    price: 1687.90,
    change: 8.75,
    changesPercentage: 0.52,
    dayLow: 1678.30,
    dayHigh: 1695.40,
    yearHigh: 1794.50,
    yearLow: 1363.55,
    marketCap: 12850000000000,
    priceAvg50: 1654.45,
    priceAvg200: 1598.78,
    volume: 5678901,
    avgVolume: 8500000,
    exchange: 'NSE',
    open: 1682.15,
    previousClose: 1679.15,
    timestamp: Math.floor(Date.now() / 1000)
  },
  'INFY.NS': {
    symbol: 'INFY.NS',
    name: 'Infosys Limited',
    price: 1842.35,
    change: 22.15,
    changesPercentage: 1.22,
    dayLow: 1835.20,
    dayHigh: 1856.80,
    yearHigh: 1953.90,
    yearLow: 1351.65,
    marketCap: 7650000000000,
    priceAvg50: 1798.75,
    priceAvg200: 1687.20,
    volume: 3456789,
    avgVolume: 5200000,
    exchange: 'NSE',
    open: 1838.40,
    previousClose: 1820.20,
    timestamp: Math.floor(Date.now() / 1000)
  },
  'HINDUNILVR.NS': {
    symbol: 'HINDUNILVR.NS',
    name: 'Hindustan Unilever Limited',
    price: 2456.70,
    change: -5.30,
    changesPercentage: -0.22,
    dayLow: 2445.60,
    dayHigh: 2468.90,
    yearHigh: 2844.95,
    yearLow: 2172.00,
    marketCap: 5750000000000,
    priceAvg50: 2489.75,
    priceAvg200: 2398.20,
    volume: 987654,
    avgVolume: 1800000,
    exchange: 'NSE',
    open: 2462.00,
    previousClose: 2462.00,
    timestamp: Math.floor(Date.now() / 1000)
  },
  'ICICIBANK.NS': {
    symbol: 'ICICIBANK.NS',
    name: 'ICICI Bank Limited',
    price: 1287.45,
    change: 18.90,
    changesPercentage: 1.49,
    dayLow: 1278.30,
    dayHigh: 1295.80,
    yearHigh: 1257.65,
    yearLow: 912.35,
    marketCap: 9050000000000,
    priceAvg50: 1245.75,
    priceAvg200: 1156.20,
    volume: 7890123,
    avgVolume: 12500000,
    exchange: 'NSE',
    open: 1280.55,
    previousClose: 1268.55,
    timestamp: Math.floor(Date.now() / 1000)
  },
  'INFY': {
    symbol: 'INFY',
    name: 'Infosys Limited',
    price: 1456.30,
    change: 8.75,
    changesPercentage: 0.60,
    dayLow: 1445.20,
    dayHigh: 1468.90,
    yearHigh: 1953.90,
    yearLow: 1330.20,
    marketCap: 6100000000000,
    priceAvg50: 1423.45,
    priceAvg200: 1567.89,
    volume: 3456789,
    avgVolume: 4200000,
    exchange: 'NSE',
    open: 1447.55,
    previousClose: 1447.55,
    timestamp: Math.floor(Date.now() / 1000)
  },
  'HDFCBANK': {
    symbol: 'HDFCBANK',
    name: 'HDFC Bank Limited',
    price: 1567.45,
    change: 12.30,
    changesPercentage: 0.79,
    dayLow: 1555.20,
    dayHigh: 1578.90,
    yearHigh: 1725.00,
    yearLow: 1363.55,
    marketCap: 11900000000000,
    priceAvg50: 1534.67,
    priceAvg200: 1598.23,
    volume: 2345678,
    avgVolume: 2800000,
    exchange: 'NSE',
    open: 1555.15,
    previousClose: 1555.15,
    timestamp: Math.floor(Date.now() / 1000)
  },
  'ICICIBANK': {
    symbol: 'ICICIBANK',
    name: 'ICICI Bank Limited',
    price: 987.65,
    change: -5.45,
    changesPercentage: -0.55,
    dayLow: 982.30,
    dayHigh: 995.80,
    yearHigh: 1257.80,
    yearLow: 875.35,
    marketCap: 6900000000000,
    priceAvg50: 1012.34,
    priceAvg200: 1089.67,
    volume: 4567890,
    avgVolume: 5200000,
    exchange: 'NSE',
    open: 993.10,
    previousClose: 993.10,
    timestamp: Math.floor(Date.now() / 1000)
  }
};

// Mock search results for Indian stocks (NSE and BSE)
export const mockSearchResults = [
  { symbol: 'RELIANCE.NS', name: 'Reliance Industries Limited', exchange: 'NSE', currency: 'INR', type: 'stock' },
  { symbol: 'TCS.NS', name: 'Tata Consultancy Services', exchange: 'NSE', currency: 'INR', type: 'stock' },
  { symbol: 'HDFCBANK.NS', name: 'HDFC Bank Limited', exchange: 'NSE', currency: 'INR', type: 'stock' },
  { symbol: 'INFY.NS', name: 'Infosys Limited', exchange: 'NSE', currency: 'INR', type: 'stock' },
  { symbol: 'HINDUNILVR.NS', name: 'Hindustan Unilever Limited', exchange: 'NSE', currency: 'INR', type: 'stock' },
  { symbol: 'ICICIBANK.NS', name: 'ICICI Bank Limited', exchange: 'NSE', currency: 'INR', type: 'stock' },
  { symbol: 'KOTAKBANK.NS', name: 'Kotak Mahindra Bank Limited', exchange: 'NSE', currency: 'INR', type: 'stock' },
  { symbol: 'BHARTIARTL.NS', name: 'Bharti Airtel Limited', exchange: 'NSE', currency: 'INR', type: 'stock' },
  { symbol: 'ITC.NS', name: 'ITC Limited', exchange: 'NSE', currency: 'INR', type: 'stock' },
  { symbol: 'SBIN.NS', name: 'State Bank of India', exchange: 'NSE', currency: 'INR', type: 'stock' },
  { symbol: 'LT.NS', name: 'Larsen & Toubro Limited', exchange: 'NSE', currency: 'INR', type: 'stock' },
  { symbol: 'ASIANPAINT.NS', name: 'Asian Paints Limited', exchange: 'NSE', currency: 'INR', type: 'stock' },
  { symbol: 'MARUTI.NS', name: 'Maruti Suzuki India Limited', exchange: 'NSE', currency: 'INR', type: 'stock' },
  { symbol: 'BAJFINANCE.NS', name: 'Bajaj Finance Limited', exchange: 'NSE', currency: 'INR', type: 'stock' },
  { symbol: 'WIPRO.NS', name: 'Wipro Limited', exchange: 'NSE', currency: 'INR', type: 'stock' },
  { symbol: 'HCLTECH.NS', name: 'HCL Technologies Limited', exchange: 'NSE', currency: 'INR', type: 'stock' },
  { symbol: 'TECHM.NS', name: 'Tech Mahindra Limited', exchange: 'NSE', currency: 'INR', type: 'stock' },
  { symbol: 'SUNPHARMA.NS', name: 'Sun Pharmaceutical Industries Limited', exchange: 'NSE', currency: 'INR', type: 'stock' },
  { symbol: 'TITAN.NS', name: 'Titan Company Limited', exchange: 'NSE', currency: 'INR', type: 'stock' },
  { symbol: 'NESTLEIND.NS', name: 'Nestle India Limited', exchange: 'NSE', currency: 'INR', type: 'stock' },
  { symbol: 'ULTRACEMCO.NS', name: 'UltraTech Cement Limited', exchange: 'NSE', currency: 'INR', type: 'stock' },
  { symbol: 'POWERGRID.NS', name: 'Power Grid Corporation of India Limited', exchange: 'NSE', currency: 'INR', type: 'stock' },
  { symbol: 'NTPC.NS', name: 'NTPC Limited', exchange: 'NSE', currency: 'INR', type: 'stock' },
  { symbol: 'ONGC.NS', name: 'Oil and Natural Gas Corporation Limited', exchange: 'NSE', currency: 'INR', type: 'stock' },
  { symbol: 'COALINDIA.NS', name: 'Coal India Limited', exchange: 'NSE', currency: 'INR', type: 'stock' },
  { symbol: 'ZOMATO.NS', name: 'Zomato Limited', exchange: 'NSE', currency: 'INR', type: 'stock' },
  { symbol: 'PAYTM.NS', name: 'One 97 Communications Limited', exchange: 'NSE', currency: 'INR', type: 'stock' },
  { symbol: 'NYKAA.NS', name: 'FSN E-Commerce Ventures Limited', exchange: 'NSE', currency: 'INR', type: 'stock' },
  { symbol: 'POLICYBZR.NS', name: 'PB Fintech Limited', exchange: 'NSE', currency: 'INR', type: 'stock' },

  // Indian tech and startup stocks
  { symbol: 'ZOMATO.NS', name: 'Zomato Limited', exchange: 'NSE', currency: 'INR', type: 'stock' },
  { symbol: 'SWIGGY.NS', name: 'Bundl Technologies Private Limited', exchange: 'NSE', currency: 'INR', type: 'stock' },
  { symbol: 'INFY.NS', name: 'Infosys Limited', exchange: 'NSE', currency: 'INR', type: 'stock' },

  // Popular US stocks for testing
  { symbol: 'AAPL', name: 'Apple Inc.', exchange: 'NASDAQ', currency: 'USD', type: 'stock' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', exchange: 'NASDAQ', currency: 'USD', type: 'stock' },
  { symbol: 'MSFT', name: 'Microsoft Corporation', exchange: 'NASDAQ', currency: 'USD', type: 'stock' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', exchange: 'NASDAQ', currency: 'USD', type: 'stock' },
  { symbol: 'TSLA', name: 'Tesla Inc.', exchange: 'NASDAQ', currency: 'USD', type: 'stock' },
  { symbol: 'META', name: 'Meta Platforms Inc.', exchange: 'NASDAQ', currency: 'USD', type: 'stock' },
  { symbol: 'NVDA', name: 'NVIDIA Corporation', exchange: 'NASDAQ', currency: 'USD', type: 'stock' },

  // Additional Indian stocks
  { symbol: 'ADANIPORTS.NS', name: 'Adani Ports and Special Economic Zone Limited', exchange: 'NSE', currency: 'INR', type: 'stock' },
  { symbol: 'AXISBANK.NS', name: 'Axis Bank Limited', exchange: 'NSE', currency: 'INR', type: 'stock' },
  { symbol: 'BAJAJ-AUTO.NS', name: 'Bajaj Auto Limited', exchange: 'NSE', currency: 'INR', type: 'stock' },
  { symbol: 'BRITANNIA.NS', name: 'Britannia Industries Limited', exchange: 'NSE', currency: 'INR', type: 'stock' },
  { symbol: 'CIPLA.NS', name: 'Cipla Limited', exchange: 'NSE', currency: 'INR', type: 'stock' },
  { symbol: 'DRREDDY.NS', name: 'Dr. Reddys Laboratories Limited', exchange: 'NSE', currency: 'INR', type: 'stock' },
  { symbol: 'EICHERMOT.NS', name: 'Eicher Motors Limited', exchange: 'NSE', currency: 'INR', type: 'stock' },
  { symbol: 'GRASIM.NS', name: 'Grasim Industries Limited', exchange: 'NSE', currency: 'INR', type: 'stock' },
  { symbol: 'HEROMOTOCO.NS', name: 'Hero MotoCorp Limited', exchange: 'NSE', currency: 'INR', type: 'stock' },
  { symbol: 'JSWSTEEL.NS', name: 'JSW Steel Limited', exchange: 'NSE', currency: 'INR', type: 'stock' },
  { symbol: 'TSLA', name: 'Tesla Inc.', exchange: 'NASDAQ', currency: 'USD', type: 'stock' },
  { symbol: 'META', name: 'Meta Platforms Inc.', exchange: 'NASDAQ', currency: 'USD', type: 'stock' },
  { symbol: 'NVDA', name: 'NVIDIA Corporation', exchange: 'NASDAQ', currency: 'USD', type: 'stock' },
  { symbol: 'NFLX', name: 'Netflix Inc.', exchange: 'NASDAQ', currency: 'USD', type: 'stock' },
  { symbol: 'CRM', name: 'Salesforce Inc.', exchange: 'NYSE', currency: 'USD', type: 'stock' },
  { symbol: 'ADBE', name: 'Adobe Inc.', exchange: 'NASDAQ', currency: 'USD', type: 'stock' }
];

// Mock market gainers
export const mockGainers = [
  { symbol: 'AAPL', name: 'Apple Inc.', change: 2.15, changesPercentage: 1.24, price: 175.43 },
  { symbol: 'NVDA', name: 'NVIDIA Corporation', change: 15.42, changesPercentage: 1.79, price: 875.28 },
  { symbol: 'META', name: 'Meta Platforms Inc.', change: 8.75, changesPercentage: 1.84, price: 484.20 },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', change: 3.42, changesPercentage: 2.46, price: 142.56 },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', change: 1.87, changesPercentage: 1.25, price: 151.94 }
];

// Mock news data
export const mockNews = [
  {
    title: 'Reliance Industries Reports Strong Q3 Results',
    text: 'Reliance Industries Limited reported strong quarterly results with increased revenue from petrochemicals and retail segments.',
    url: '#',
    image: 'https://via.placeholder.com/300x200',
    site: 'Economic Times',
    publishedDate: new Date().toISOString(),
    symbol: 'RELIANCE'
  },
  {
    title: 'TCS Announces New Digital Transformation Services',
    text: 'Tata Consultancy Services launches new suite of digital transformation services for enterprise clients.',
    url: '#',
    image: 'https://via.placeholder.com/300x200',
    site: 'Business Standard',
    publishedDate: new Date(Date.now() - 3600000).toISOString(),
    symbol: 'TCS'
  },
  {
    title: 'Indian IT Sector Shows Resilience Amid Global Challenges',
    text: 'The Indian IT sector continues to show strong performance despite global economic uncertainties.',
    url: '#',
    image: 'https://via.placeholder.com/300x200',
    site: 'Financial Express',
    publishedDate: new Date(Date.now() - 7200000).toISOString(),
    symbol: 'INFY'
  }
];

/**
 * Mock FMP API Service
 */
export const mockFMPAPI = {
  // Mock stock search with improved matching
  searchStocks: async (query, limit = 10) => {
    await new Promise(resolve => setTimeout(resolve, 300)); // Simulate API delay

    console.log(`🔍 Mock API searching for: "${query}"`);

    // Handle empty query
    if (!query || query.trim() === '') {
      console.log('⚠️ Empty search query, returning popular stocks');
      const popularStocks = mockSearchResults.slice(0, limit);
      return {
        success: true,
        results: popularStocks,
        total: popularStocks.length
      };
    }

    // Normalize query
    const normalizedQuery = query.toLowerCase().trim();

    // Score-based matching for better results
    const scoredResults = mockSearchResults.map(stock => {
      let score = 0;
      const symbol = stock.symbol.toLowerCase();
      const name = stock.name.toLowerCase();

      // Exact symbol match (highest priority)
      if (symbol === normalizedQuery) {
        score += 100;
      }
      // Symbol starts with query
      else if (symbol.startsWith(normalizedQuery)) {
        score += 50;
      }
      // Symbol contains query
      else if (symbol.includes(normalizedQuery)) {
        score += 25;
      }

      // Name exact match
      if (name === normalizedQuery) {
        score += 75;
      }
      // Name starts with query
      else if (name.startsWith(normalizedQuery)) {
        score += 40;
      }
      // Words in name start with query
      else if (name.split(' ').some(word => word.startsWith(normalizedQuery))) {
        score += 30;
      }
      // Name contains query
      else if (name.includes(normalizedQuery)) {
        score += 20;
      }

      // Prioritize Indian stocks
      if (stock.exchange === 'NSE' || stock.exchange === 'BSE' ||
          stock.symbol.endsWith('.NS') || stock.symbol.endsWith('.BO')) {
        score += 10;
      }

      return { stock, score };
    })
    .filter(item => item.score > 0)  // Only include matches
    .sort((a, b) => b.score - a.score)  // Sort by score descending
    .map(item => item.stock)
    .slice(0, limit);

    console.log(`📊 Mock search found ${scoredResults.length} results for "${query}"`);
    if (scoredResults.length > 0) {
      console.log('📋 Sample results:', scoredResults.slice(0, 3));
    }

    return {
      success: true,
      results: scoredResults,
      total: scoredResults.length
    };
  },

  // Mock stock quote
  getStockQuote: async (symbol) => {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const quote = mockStockQuotes[symbol.toUpperCase()];
    if (quote) {
      return {
        success: true,
        data: quote
      };
    }
    
    return {
      success: false,
      error: 'Stock not found'
    };
  },

  // Mock historical data
  getHistoricalData: async (symbol, period = '1D') => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const basePrice = mockStockQuotes[symbol.toUpperCase()]?.price || 100;
    const days = period === '1D' ? 1 : period === '1M' ? 30 : 90;
    
    return {
      success: true,
      data: generateStockData(symbol, basePrice, days),
      symbol,
      period
    };
  },

  // Mock market gainers
  getGainers: async (limit = 10) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return {
      success: true,
      data: mockGainers.slice(0, limit)
    };
  },

  // Mock market news
  getMarketNews: async (limit = 20) => {
    await new Promise(resolve => setTimeout(resolve, 400));
    
    return {
      success: true,
      data: mockNews.slice(0, limit)
    };
  }
};

export default mockFMPAPI;
