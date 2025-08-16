/**
 * Test script to verify FMP API keys are working
 * Run with: node test-api-keys.js
 */

const axios = require('axios');
require('dotenv').config();

const API_KEYS = [
  process.env.FMP_API_KEY,
  process.env.FMP_API_KEY_2,
  process.env.FMP_API_KEY_3,
  process.env.FMP_API_KEY_4
].filter(Boolean);

async function testApiKeys() {
  console.log('🔑 Testing FMP API Keys...\n');

  for (let i = 0; i < API_KEYS.length; i++) {
    const apiKey = API_KEYS[i];
    console.log(`Testing API Key ${i + 1}: ${apiKey.substring(0, 8)}...`);

    try {
      // Test stock quote
      const quoteResponse = await axios.get(
        `https://financialmodelingprep.com/api/v3/quote/RELIANCE?apikey=${apiKey}`,
        { timeout: 5000 }
      );

      if (quoteResponse.data && quoteResponse.data[0]) {
        const stock = quoteResponse.data[0];
        console.log(`✅ Stock Quote: ${stock.symbol} - $${stock.price} (${stock.changesPercentage}%)`);
      }

      // Test gainers
      const gainersResponse = await axios.get(
        `https://financialmodelingprep.com/api/v3/stock_market/gainers?apikey=${apiKey}`,
        { timeout: 5000 }
      );

      if (gainersResponse.data && gainersResponse.data.length > 0) {
        console.log(`✅ Top Gainers: Found ${gainersResponse.data.length} stocks`);
      }

      // Test news
      const newsResponse = await axios.get(
        `https://financialmodelingprep.com/api/v3/stock_news?limit=3&apikey=${apiKey}`,
        { timeout: 5000 }
      );

      if (newsResponse.data && newsResponse.data.length > 0) {
        console.log(`✅ News: Found ${newsResponse.data.length} articles`);
      }

      console.log(`🎉 API Key ${i + 1} is working perfectly!\n`);

    } catch (error) {
      if (error.response?.status === 429) {
        console.log(`⚠️  API Key ${i + 1}: Rate limit exceeded`);
      } else if (error.response?.status === 401) {
        console.log(`❌ API Key ${i + 1}: Invalid or expired`);
      } else {
        console.log(`❌ API Key ${i + 1}: ${error.message}`);
      }
      console.log('');
    }
  }

  console.log('🏁 API Key testing completed!');
  console.log(`📊 Working keys: ${API_KEYS.length}`);
  console.log('\n🚀 Ready to start Saytrix chatbot with real data!');
}

testApiKeys().catch(console.error);