/**
 * API Endpoint Test Script
 * 
 * This script tests all the API endpoints to ensure they are working properly.
 * Run this script after starting the server to check if all endpoints are accessible.
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000';
let token = null;

// Test endpoints
const endpoints = [
  { name: 'Health Check', url: `${API_BASE_URL}/api/health`, method: 'get' },
  { name: 'Test Endpoint', url: `${API_BASE_URL}/api/test`, method: 'get' },
  { name: 'Login', url: `${API_BASE_URL}/api/auth/login`, method: 'post', data: { email: 'test@example.com', password: 'password123' } },
  { name: 'Public Virtual Money', url: `${API_BASE_URL}/api/virtual-money/public`, method: 'get' },
  { name: 'Settings', url: `${API_BASE_URL}/api/settings`, method: 'get', auth: true },
  { name: 'Virtual Money Account', url: `${API_BASE_URL}/api/virtual-money/account`, method: 'get', auth: true },
  { name: 'Watchlist', url: `${API_BASE_URL}/api/watchlist/stocks`, method: 'get', auth: true },
  { name: 'Orders', url: `${API_BASE_URL}/api/orders/all`, method: 'get', auth: true },
  { name: 'Notifications', url: `${API_BASE_URL}/api/notifications`, method: 'get', auth: true },
];

// Test each endpoint
async function testEndpoints() {
  console.log('🧪 Testing API Endpoints...\n');
  
  // First, try to get a token
  try {
    const loginResponse = await axios.post(`${API_BASE_URL}/api/auth/login`, {
      email: 'test@example.com',
      password: 'password123'
    });
    
    if (loginResponse.data && loginResponse.data.token) {
      token = loginResponse.data.token;
      console.log('✅ Successfully obtained auth token\n');
    }
  } catch (error) {
    console.log('⚠️ Could not obtain auth token. Authenticated endpoints will likely fail.\n');
  }
  
  // Test each endpoint
  for (const endpoint of endpoints) {
    try {
      const config = {};
      
      // Add auth header if needed
      if (endpoint.auth && token) {
        config.headers = {
          Authorization: `Bearer ${token}`
        };
      }
      
      // Make the request
      const response = await axios({
        method: endpoint.method,
        url: endpoint.url,
        data: endpoint.data,
        ...config
      });
      
      console.log(`✅ ${endpoint.name}: ${response.status} ${response.statusText}`);
    } catch (error) {
      console.log(`❌ ${endpoint.name}: ${error.message}`);
      
      if (error.response) {
        console.log(`   Status: ${error.response.status} ${error.response.statusText}`);
        console.log(`   Data: ${JSON.stringify(error.response.data)}`);
      }
    }
  }
  
  console.log('\n🧪 API Endpoint Testing Complete');
}

// Run the tests
testEndpoints();
