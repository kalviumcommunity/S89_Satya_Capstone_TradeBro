/**
 * Mock Data Generator Utility
 * Provides realistic mock data for various stock market endpoints
 */

const { randomInRange, randomBoolean } = require('./randomizer');

/**
 * Predefined Indian stocks for realistic mock data
 */
const PREDEFINED_STOCKS = [
  { symbol: "RELIANCE.NS", name: "Reliance Industries" },
  { symbol: "TCS.NS", name: "Tata Consultancy Services" },
  { symbol: "HDFCBANK.NS", name: "HDFC Bank Ltd." },
  { symbol: "INFY.NS", name: "Infosys Ltd." },
  { symbol: "ICICIBANK.NS", name: "ICICI Bank Ltd." },
  { symbol: "TATAMOTORS.NS", name: "Tata Motors Ltd." },
  { symbol: "SUNPHARMA.NS", name: "Sun Pharmaceutical" },
  { symbol: "AXISBANK.NS", name: "Axis Bank Ltd." },
  { symbol: "WIPRO.NS", name: "Wipro Ltd." },
  { symbol: "BAJFINANCE.NS", name: "Bajaj Finance Ltd." },
  { symbol: "HINDUNILVR.NS", name: "Hindustan Unilever" },
  { symbol: "SBIN.NS", name: "State Bank of India" },
  { symbol: "BHARTIARTL.NS", name: "Bharti Airtel" },
  { symbol: "KOTAKBANK.NS", name: "Kotak Mahindra Bank" },
  { symbol: "ITC.NS", name: "ITC Limited" },
  { symbol: "MARUTI.NS", name: "Maruti Suzuki" },
  { symbol: "ASIANPAINT.NS", name: "Asian Paints" },
  { symbol: "HCLTECH.NS", name: "HCL Technologies" },
  { symbol: "ULTRACEMCO.NS", name: "UltraTech Cement" },
  { symbol: "TITAN.NS", name: "Titan Company" },
  { symbol: "ADANIENT.NS", name: "Adani Enterprises" },
  { symbol: "ADANIPORTS.NS", name: "Adani Ports" },
  { symbol: "BAJAJFINSV.NS", name: "Bajaj Finserv" },
  { symbol: "NTPC.NS", name: "NTPC Ltd." },
  { symbol: "POWERGRID.NS", name: "Power Grid Corporation" },
  { symbol: "ONGC.NS", name: "Oil & Natural Gas Corporation" },
  { symbol: "COALINDIA.NS", name: "Coal India" },
  { symbol: "GRASIM.NS", name: "Grasim Industries" },
  { symbol: "JSWSTEEL.NS", name: "JSW Steel" },
  { symbol: "TATASTEEL.NS", name: "Tata Steel" }
];

/**
 * Generate realistic mock stock data
 * @param {string} symbol - Stock symbol
 * @param {string} name - Stock name
 * @param {boolean} isGainer - Whether stock should be a gainer
 * @returns {object} Mock stock data
 */
const generateMockStockData = (symbol, name, isGainer = randomBoolean()) => {
  // Generate realistic base price based on symbol characteristics
  let basePrice;
  if (symbol.includes('BANK') || symbol.includes('HDFC') || symbol.includes('ICICI')) {
    basePrice = randomInRange(800, 2000); // Banking stocks
  } else if (symbol.includes('IT') || symbol.includes('TCS') || symbol.includes('INFY')) {
    basePrice = randomInRange(1200, 4000); // IT stocks
  } else if (symbol.includes('RELIANCE') || symbol.includes('ADANI')) {
    basePrice = randomInRange(2000, 3500); // Large cap stocks
  } else {
    basePrice = randomInRange(100, 5000); // General range
  }

  // Generate realistic percentage change
  const percentChange = isGainer
    ? randomInRange(0.1, 5.0) // Positive change
    : randomInRange(-5.0, -0.1); // Negative change

  // Calculate absolute change
  const change = (basePrice * percentChange / 100);

  // Generate other realistic values
  const open = randomInRange(basePrice * 0.98, basePrice * 1.02);
  const dayHigh = randomInRange(basePrice, basePrice * 1.05);
  const dayLow = randomInRange(basePrice * 0.95, basePrice);
  
  return {
    symbol,
    name: name || `${symbol} Ltd.`,
    price: parseFloat(basePrice.toFixed(2)),
    change: parseFloat(change.toFixed(2)),
    changesPercentage: parseFloat(percentChange.toFixed(2)),
    open: parseFloat(open.toFixed(2)),
    dayHigh: parseFloat(dayHigh.toFixed(2)),
    dayLow: parseFloat(dayLow.toFixed(2)),
    volume: Math.floor(randomInRange(100000, 10000000)),
    marketCap: Math.floor(randomInRange(1000000000, 10000000000000)),
    pe: parseFloat(randomInRange(10, 50).toFixed(2)),
    yearHigh: parseFloat((basePrice * randomInRange(1.2, 1.5)).toFixed(2)),
    yearLow: parseFloat((basePrice * randomInRange(0.6, 0.8)).toFixed(2)),
    eps: parseFloat(randomInRange(5, 200).toFixed(2)),
    beta: parseFloat(randomInRange(0.5, 2.0).toFixed(2))
  };
};

/**
 * Generate mock chart data for technical analysis
 * @param {string} symbol - Stock symbol
 * @param {number} dataPoints - Number of data points (default 100)
 * @param {string} interval - Time interval (5min, 1hour, 1day)
 * @returns {array} Array of OHLCV data
 */
const generateMockChartData = (symbol, dataPoints = 100, interval = '5min') => {
  const data = [];
  const now = new Date();
  const basePrice = randomInRange(100, 1000);
  const volatility = randomInRange(0.5, 2.5);

  // Calculate time interval in milliseconds
  const intervalMs = {
    '1min': 60 * 1000,
    '5min': 5 * 60 * 1000,
    '15min': 15 * 60 * 1000,
    '1hour': 60 * 60 * 1000,
    '1day': 24 * 60 * 60 * 1000
  }[interval] || 5 * 60 * 1000;

  let currentPrice = basePrice;

  for (let i = dataPoints - 1; i >= 0; i--) {
    const time = new Date(now.getTime() - (i * intervalMs));
    
    // Generate price movement
    const randomChange = (Math.random() - 0.5) * volatility;
    currentPrice = Math.max(1, currentPrice + randomChange);

    const open = currentPrice + randomInRange(-2, 2);
    const close = currentPrice + randomInRange(-2, 2);
    const high = Math.max(open, close) + randomInRange(0, 3);
    const low = Math.min(open, close) - randomInRange(0, 3);
    const volume = Math.floor(randomInRange(10000, 1000000));

    data.push({
      time: time.getTime(),
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(Math.max(0.01, low).toFixed(2)),
      close: parseFloat(close.toFixed(2)),
      volume
    });
  }

  return data.sort((a, b) => a.time - b.time);
};

/**
 * Generate mock historical price data
 * @param {string} symbol - Stock symbol
 * @param {number} days - Number of days (default 30)
 * @returns {object} Historical data object
 */
const generateMockHistoricalData = (symbol, days = 30) => {
  const historical = [];
  const today = new Date();
  let basePrice = randomInRange(100, 1000);

  for (let i = days; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);

    // Add some trend and randomness
    const changePercent = randomInRange(-3, 3);
    basePrice = Math.max(1, basePrice * (1 + (changePercent / 100)));

    const open = basePrice + randomInRange(-5, 5);
    const close = basePrice + randomInRange(-5, 5);
    const high = Math.max(open, close) + randomInRange(0, 10);
    const low = Math.min(open, close) - randomInRange(0, 10);

    historical.push({
      date: date.toISOString().split('T')[0],
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(Math.max(0.01, low).toFixed(2)),
      close: parseFloat(close.toFixed(2)),
      volume: Math.floor(randomInRange(500000, 10000000)),
      changePercent: parseFloat(changePercent.toFixed(2))
    });
  }

  return {
    symbol,
    historical: historical.sort((a, b) => new Date(b.date) - new Date(a.date))
  };
};

/**
 * Generate mock market indices data
 * @returns {array} Array of market indices
 */
const generateMockIndices = () => {
  return [
    {
      symbol: "^NSEI",
      name: "NIFTY 50",
      price: randomInRange(22000, 23000),
      changesPercentage: randomInRange(-1, 2)
    },
    {
      symbol: "^BSESN",
      name: "BSE SENSEX",
      price: randomInRange(73000, 75000),
      changesPercentage: randomInRange(-1, 2)
    },
    {
      symbol: "^NSEBANK",
      name: "NIFTY BANK",
      price: randomInRange(47000, 49000),
      changesPercentage: randomInRange(-1.5, 1.5)
    },
    {
      symbol: "^CNXIT",
      name: "NIFTY IT",
      price: randomInRange(31000, 33000),
      changesPercentage: randomInRange(-1, 1)
    },
    {
      symbol: "^NSMIDCP",
      name: "NIFTY MIDCAP",
      price: randomInRange(44000, 46000),
      changesPercentage: randomInRange(-0.8, 1.2)
    }
  ];
};

/**
 * Generate mock top gainers
 * @param {number} count - Number of gainers (default 10)
 * @returns {array} Array of top gainers
 */
const generateMockTopGainers = (count = 10) => {
  return PREDEFINED_STOCKS.slice(0, count).map(stock => 
    generateMockStockData(stock.symbol, stock.name, true)
  );
};

/**
 * Generate mock top losers
 * @param {number} count - Number of losers (default 10)
 * @returns {array} Array of top losers
 */
const generateMockTopLosers = (count = 10) => {
  return PREDEFINED_STOCKS.slice(count, count * 2).map(stock => 
    generateMockStockData(stock.symbol, stock.name, false)
  );
};

/**
 * Generate mock stock list
 * @returns {array} Array of stock list items
 */
const generateMockStockList = () => {
  return PREDEFINED_STOCKS.map(stock => ({
    symbol: stock.symbol,
    name: stock.name,
    exchange: stock.symbol.endsWith('.NS') ? 'NSE' : 'BSE',
    exchangeShortName: stock.symbol.endsWith('.NS') ? 'NSE' : 'BSE',
    type: 'stock'
  }));
};

/**
 * Format stock name from symbol
 * @param {string} symbol - Stock symbol
 * @returns {string} Formatted stock name
 */
const formatStockName = (symbol) => {
  if (symbol.endsWith('.NS')) {
    return symbol.replace('.NS', '').replace(/([A-Z])/g, ' $1').trim() + ' (NSE)';
  } else if (symbol.endsWith('.BO')) {
    return symbol.replace('.BO', '').replace(/([A-Z])/g, ' $1').trim() + ' (BSE)';
  }
  return symbol.replace(/([A-Z])/g, ' $1').trim();
};

/**
 * Check if symbol is Indian stock
 * @param {string} symbol - Stock symbol
 * @returns {boolean} True if Indian stock
 */
const isIndianStock = (symbol) => {
  return symbol.endsWith('.NS') || symbol.endsWith('.BO');
};

module.exports = {
  PREDEFINED_STOCKS,
  generateMockStockData,
  generateMockChartData,
  generateMockHistoricalData,
  generateMockIndices,
  generateMockTopGainers,
  generateMockTopLosers,
  generateMockStockList,
  formatStockName,
  isIndianStock
};
