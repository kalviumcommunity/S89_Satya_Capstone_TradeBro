const axios = require('axios');

// Test the virtual money API
async function testVirtualMoneyAPI() {
  try {
    console.log('Testing virtual money API...');
    
    // Test the test endpoint
    const testResponse = await axios.get('http://localhost:5000/api/virtual-money/test');
    console.log('Test endpoint response:', testResponse.data);
    
    // Test the auth-test endpoint
    const authTestResponse = await axios.get('http://localhost:5000/api/virtual-money/auth-test');
    console.log('Auth test endpoint response:', authTestResponse.data);
    
    // Test the account endpoint
    const accountResponse = await axios.get('http://localhost:5000/api/virtual-money/account');
    console.log('Account endpoint response:', accountResponse.data);
    
    console.log('All tests completed successfully!');
  } catch (error) {
    console.error('Error testing API:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
  }
}

// Run the tests
testVirtualMoneyAPI();
