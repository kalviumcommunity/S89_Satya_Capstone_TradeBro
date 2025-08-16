/**
 * Simple test script to verify Saytrix functionality
 * Run with: node test-saytrix.js
 */

const axios = require('axios');

const API_BASE = 'http://localhost:5001/api';

async function testSaytrixEndpoints() {
  console.log('🧪 Testing Saytrix Chatbot Endpoints...\n');

  const tests = [
    {
      name: 'Health Check',
      endpoint: '/saytrix/health',
      method: 'GET'
    },
    {
      name: 'Chat Message',
      endpoint: '/saytrix/chat',
      method: 'POST',
      data: {
        message: 'Tell me about Reliance stock',
        sessionId: 'test-session-123'
      }
    },
    {
      name: 'Suggestions',
      endpoint: '/saytrix/suggestions',
      method: 'GET'
    },
    {
      name: 'Voice Command',
      endpoint: '/saytrix/voice',
      method: 'POST',
      data: {
        message: 'Show me top gainers',
        isVoiceCommand: true
      }
    }
  ];

  for (const test of tests) {
    try {
      console.log(`Testing: ${test.name}...`);
      
      const config = {
        method: test.method,
        url: `${API_BASE}${test.endpoint}`,
        timeout: 10000
      };

      if (test.data) {
        config.data = test.data;
      }

      const response = await axios(config);
      
      if (response.data.success) {
        console.log(`✅ ${test.name}: PASSED`);
        if (test.name === 'Chat Message' && response.data.data) {
          console.log(`   Response: ${response.data.data.response.substring(0, 100)}...`);
        }
      } else {
        console.log(`❌ ${test.name}: FAILED - ${response.data.error || 'Unknown error'}`);
      }
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        console.log(`⚠️  ${test.name}: Server not running (${API_BASE})`);
      } else {
        console.log(`❌ ${test.name}: ERROR - ${error.message}`);
      }
    }
    console.log('');
  }

  console.log('🏁 Test completed!\n');
  console.log('📋 Next Steps:');
  console.log('1. Start the servers: start-tradebro.bat');
  console.log('2. Open browser: http://localhost:5173');
  console.log('3. Navigate to Saytrix page');
  console.log('4. Test voice and text chat features');
}

// Run tests
testSaytrixEndpoints().catch(console.error);