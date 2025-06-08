// Test script to verify OAuth configuration
require('dotenv').config();

console.log('🔍 Google OAuth Configuration Test');
console.log('=====================================');

// Check environment variables
const requiredEnvVars = [
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'JWT_SECRET',
  'MONGO_URI'
];

console.log('\n📋 Environment Variables Check:');
requiredEnvVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`✅ ${varName}: Set (${value.substring(0, 10)}...)`);
  } else {
    console.log(`❌ ${varName}: NOT SET`);
  }
});

// Check callback URLs
console.log('\n🔗 Callback URL Configuration:');
const nodeEnv = process.env.NODE_ENV || 'development';
console.log(`📍 Environment: ${nodeEnv}`);

const callbackURL = nodeEnv === 'production' 
  ? "https://s89-satya-capstone-tradebro.onrender.com/api/auth/google/callback"
  : "http://localhost:5000/api/auth/google/callback";

console.log(`🎯 Callback URL: ${callbackURL}`);

const clientUrl = nodeEnv === 'production' 
  ? 'https://tradebro.netlify.app'  // Update this with your actual Netlify URL
  : 'http://localhost:5173';

console.log(`🌐 Client URL: ${clientUrl}`);

// Test Google OAuth client creation
console.log('\n🧪 Testing Google OAuth Client:');
try {
  const { OAuth2Client } = require('google-auth-library');
  const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
  console.log('✅ Google OAuth client created successfully');
} catch (error) {
  console.log('❌ Error creating Google OAuth client:', error.message);
}

// Test JWT
console.log('\n🔐 Testing JWT:');
try {
  const jwt = require('jsonwebtoken');
  const testToken = jwt.sign({ test: 'data' }, process.env.JWT_SECRET, { expiresIn: '1h' });
  const decoded = jwt.verify(testToken, process.env.JWT_SECRET);
  console.log('✅ JWT creation and verification successful');
} catch (error) {
  console.log('❌ JWT error:', error.message);
}

// Test MongoDB connection
console.log('\n🗄️ Testing MongoDB Connection:');
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connection successful');
    mongoose.disconnect();
  })
  .catch((error) => {
    console.log('❌ MongoDB connection failed:', error.message);
  });

console.log('\n📝 Instructions:');
console.log('1. Ensure all environment variables are set');
console.log('2. Add this callback URL to Google Cloud Console:');
console.log(`   ${callbackURL}`);
console.log('3. Make sure your client URL is correct');
console.log('4. Test the OAuth flow in your browser');

console.log('\n🚀 To run this test: node test-oauth.js');
