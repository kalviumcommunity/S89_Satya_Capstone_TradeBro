const express = require('express');
const app = express();
const cors = require('cors');
const PORT = 5000;

// Basic middleware
app.use(express.json());

// CORS middleware
app.use(cors({
  origin: ["http://localhost:5173"],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"]
}));

// Add CORS headers to all responses
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:5173');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.header('Access-Control-Allow-Credentials', 'true');
  next();
});

// Simple token verification middleware for testing
const verifyTestToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.split(' ')[1]
    : null;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Access Denied. No token provided"
    });
  }

  // For testing, we'll accept any token
  req.user = { id: '123456789', email: 'test@example.com' };
  next();
};

// Test route
app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'Test server is running',
    timestamp: new Date().toISOString()
  });
});

// Auth test endpoint
app.post('/api/auth/login', (req, res) => {
  // Return a test token
  res.json({
    success: true,
    token: 'test-token-123456789',
    user: {
      id: '123456789',
      email: 'test@example.com',
      name: 'Test User'
    }
  });
});

// Virtual money test routes
app.get('/api/virtual-money/account', verifyTestToken, (req, res) => {
  res.json({
    success: true,
    data: {
      balance: 10000,
      balanceFormatted: '₹10,000',
      lastLoginReward: null,
      portfolio: [],
      currency: 'INR'
    }
  });
});

// Non-authenticated version for testing
app.get('/api/virtual-money/account-public', (req, res) => {
  res.json({
    success: true,
    data: {
      balance: 10000,
      balanceFormatted: '₹10,000',
      lastLoginReward: null,
      portfolio: [],
      currency: 'INR'
    }
  });
});

app.get('/api/settings', (req, res) => {
  res.json({
    success: true,
    userSettings: {
      fullName: "Test User",
      email: "test@example.com",
      phoneNumber: "",
      language: "English",
      profileImage: null,
      notifications: true
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Test server running at http://localhost:${PORT}`);
  console.log('Try these endpoints:');
  console.log('- http://localhost:5000/api/test');
  console.log('- http://localhost:5000/api/auth/login (POST)');
  console.log('- http://localhost:5000/api/virtual-money/account (requires auth token)');
  console.log('- http://localhost:5000/api/virtual-money/account-public (no auth required)');
  console.log('- http://localhost:5000/api/settings');
});
