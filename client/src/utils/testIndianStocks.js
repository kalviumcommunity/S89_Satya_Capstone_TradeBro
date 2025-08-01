/**
 * Test utility for Indian stocks API integration
 * This file helps test if Indian stocks work with FMP API
 */

import fmpAPI from '../services/fmpAPI';

// Test Indian stocks
const testStocks = [
  'RELIANCE.NS',
  'TCS.NS', 
  'HDFCBANK.NS',
  'INFY.NS',
  'HINDUNILVR.NS'
];

export const testIndianStockAPI = async () => {
  console.log('🇮🇳 Testing Indian Stock API Integration...');
  
  for (const symbol of testStocks) {
    try {
      console.log(`\n📊 Testing ${symbol}:`);
      
      // Test stock quote
      const quoteResult = await fmpAPI.stock.getStockQuote(symbol);
      console.log(`✅ Quote: ${quoteResult.success ? 'SUCCESS' : 'FALLBACK'}`);
      if (quoteResult.success && quoteResult.data) {
        console.log(`   Price: ₹${quoteResult.data.price}`);
        console.log(`   Change: ${quoteResult.data.change} (${quoteResult.data.changePercent}%)`);
      }
      
      // Test historical data
      const histResult = await fmpAPI.chart.getHistoricalData(symbol, '1M');
      console.log(`✅ Historical: ${histResult.success ? 'SUCCESS' : 'FALLBACK'}`);
      if (histResult.success && histResult.data) {
        console.log(`   Data points: ${histResult.data.length}`);
      }
      
    } catch (error) {
      console.error(`❌ Error testing ${symbol}:`, error.message);
    }
  }
  
  console.log('\n🎯 Indian Stock API Test Complete!');
};

// Auto-run test in development
if (import.meta.env.DEV) {
  // Uncomment to run test automatically
  // setTimeout(testIndianStockAPI, 2000);
}

export default testIndianStockAPI;
