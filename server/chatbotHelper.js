const axios = require('axios');

// Function to get stock data using our proxy server
const getStockData = async (symbol) => {
  try {
    const baseUrl = process.env.API_BASE_URL || 'https://s89-satya-capstone-tradebro.onrender.com';
    const url = `${baseUrl}/api/proxy/stock-batch?symbols=${symbol}`;
    const response = await axios.get(url);

    if (response.data && response.data.length > 0) {
      const stockData = response.data[0];
      return {
        price: stockData.price,
        dayHigh: stockData.dayHigh,
        dayLow: stockData.dayLow,
        marketCap: stockData.marketCap,
        peRatio: stockData.pe,
        volume: stockData.volume
      };
    } 
    return null;
  } catch (error) {
    console.error('Error fetching stock data:', error.message);
    return null;
  }
};

// Function to get top gainers using our proxy server
const getTopGainers = async () => {
  try {
    const baseUrl = process.env.API_BASE_URL || 'https://s89-satya-capstone-tradebro.onrender.com';
    const url = `${baseUrl}/api/proxy/top-gainers`;
    const response = await axios.get(url);

    if (response.data && response.data.length > 0) {
      return response.data.slice(0, 5).map(stock => ({
        symbol: stock.symbol,
        companyName: stock.name,
        price: stock.price,
        changePercent: stock.changesPercentage
      }));
    }
    return [];
  } catch (error) {
    console.error('Error fetching top gainers data:', error.message);
    return [];
  }
};

// Function to clean up response text
const cleanupResponse = (text) => {
  if (!text) return text;

  let cleanedText = text;

  cleanedText = cleanedText.replace(/```/g, '``');
  cleanedText = cleanedText.replace(/•(?!\s)/g, '• ');
  cleanedText = cleanedText.replace(/\|\s*\n/g, '|\n');
  cleanedText = cleanedText.replace(/^#(?!\s)/gm, '# ');
  cleanedText = cleanedText.replace(/^##(?!\s)/gm, '## ');
  cleanedText = cleanedText.replace(/^###(?!\s)/gm, '### ');
  cleanedText = cleanedText.replace(/^>(?!\s)/gm, '> ');
  cleanedText = cleanedText.trim();

  return cleanedText;
};

module.exports = {
  getStockData,
  getTopGainers,
  cleanupResponse,
};
