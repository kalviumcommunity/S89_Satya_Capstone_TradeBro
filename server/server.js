const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const passport = require("passport");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const cookieParser = require("cookie-parser");
const axios = require("axios");

// Load environment variables
dotenv.config();
require("./passport.config");

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;
// Use environment variables for database connection and API keys
const MONGO_URI = process.env.MONGO_URI;
// FMP API key for stock data
const FMP_API = process.env.FMP_API_KEY;

// CORS configuration
app.use(cors({
  origin: ["http://localhost:5173"],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"]
}));

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use("/uploads", express.static("uploads"));

// Session configuration
const sessionOptions = {
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 7 * 24 * 60 * 60 * 1000 } // 7 days
};

// Configure MongoDB session store
if (MONGO_URI) {
  sessionOptions.store = MongoStore.create({
    mongoUrl: MONGO_URI,
    ttl: 7 * 24 * 60 * 60, // 7 days
    autoRemove: 'native',
    touchAfter: 24 * 3600, // 24 hours
    collectionName: 'sessions'
  });
  console.log("Using MongoDB session store");
} else {
  console.warn("Using memory session store (not recommended for production)");
}

app.use(session(sessionOptions));

// Initialize passport
app.use(passport.initialize());
app.use(passport.session());

// Health check endpoint
app.get('/api/health', (_, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    routes: {
      auth: true,
      settings: true,
      watchlist: true,
      orders: true,
      virtualMoney: true,
      notifications: true
    }
  });
});

// Simple test endpoint
app.get('/api/test', (_, res) => {
  res.json({
    message: 'API is working correctly',
    time: new Date().toISOString()
  });
});

// Public virtual money endpoint for testing
app.get('/api/virtual-money/public', (_, res) => {
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

// Stock search endpoint (public)
app.get('/api/stocks/search', async (req, res) => {
  try {
    const { query } = req.query;

    if (!query || query.length < 1) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    try {
      // Search for stocks using FMP API
      const response = await axios.get(
        `https://financialmodelingprep.com/api/v3/search?query=${query}&limit=10&apikey=${FMP_API}`
      );

      // Filter out non-stock results and prioritize exact matches
      let searchResults = response.data
        .filter(item => item.type === 'stock' || item.type === 'etf')
        .map(stock => ({
          symbol: stock.symbol,
          name: stock.name || stock.symbol,
          exchange: stock.exchangeShortName || 'Unknown',
          type: stock.type || 'stock'
        }));

      // Sort results: exact symbol matches first, then by symbol length (shorter first)
      searchResults.sort((a, b) => {
        // Exact symbol match gets highest priority
        if (a.symbol.toLowerCase() === query.toLowerCase()) return -1;
        if (b.symbol.toLowerCase() === query.toLowerCase()) return 1;

        // Starts with the query gets second priority
        const aStartsWith = a.symbol.toLowerCase().startsWith(query.toLowerCase());
        const bStartsWith = b.symbol.toLowerCase().startsWith(query.toLowerCase());
        if (aStartsWith && !bStartsWith) return -1;
        if (!aStartsWith && bStartsWith) return 1;

        // Shorter symbols get third priority
        return a.symbol.length - b.symbol.length;
      });

      res.status(200).json({
        success: true,
        data: searchResults,
        query
      });
    } catch (apiError) {
      console.error('Error searching for stocks:', apiError);

      // Fallback to a basic search if API fails
      // Create mock results based on the query
      const mockResults = [
        {
          symbol: query.toUpperCase(),
          name: `${query.toUpperCase()} Corporation`,
          exchange: 'NASDAQ',
          type: 'stock'
        },
        {
          symbol: `${query.toUpperCase()}.X`,
          name: `${query.toUpperCase()} Index`,
          exchange: 'NYSE',
          type: 'etf'
        }
      ];

      res.status(200).json({
        success: true,
        data: mockResults,
        query,
        note: 'Using fallback data due to API limitations'
      });
    }
  } catch (error) {
    console.error('Error in stock search:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Import and use routes
const authRoutes = require("./routes/authRoutes");
const dataRoutes = require("./routes/apiRoutes");
const settingsRoutes = require("./routes/settings");
const chatbotRoutes = require("./chatbot");
const virtualMoneyRoutes = require("./routes/virtualMoneyRoutes");
const proxyRoutes = require("./routes/proxyRoutes");
const { router: notificationRoutes } = require("./routes/notificationRoutes");
const watchlistRoutes = require("./routes/watchlistRoutes");
const orderRoutes = require("./routes/orderRoutes");
const stockSearchRoutes = require("./routes/stockSearchRoutes");

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/data", dataRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/chatbot", chatbotRoutes);
app.use("/api/virtual-money", virtualMoneyRoutes);
app.use("/api/proxy", proxyRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/watchlist", watchlistRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/stock-search", stockSearchRoutes);

// Error handling middleware
app.use((err, _, res, __) => {
  console.error("Server error:", err);
  res.status(500).json({
    success: false,
    message: "Internal Server Error"
  });
});

// Connect to MongoDB with improved options
mongoose.connect(MONGO_URI, {
  // MongoDB connection options
  serverSelectionTimeoutMS: 10000, // Increased timeout to 10 seconds
  socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
  family: 4, // Use IPv4, skip trying IPv6
  retryWrites: true,
  w: 'majority',
  ssl: true,
  authSource: 'admin',
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('✅ Connected to MongoDB');

  // Start server after successful MongoDB connection
  app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
    console.log(`Health check endpoint: http://localhost:${PORT}/api/health`);
  });
})
.catch(err => {
  console.error('❌ MongoDB connection error:', err);
  console.error('Error details:', err.message);

  if (err.name === 'MongoServerSelectionError') {
    console.error('This may be due to IP whitelisting issues. Make sure your IP is whitelisted in MongoDB Atlas.');
  }

  if (err.message && err.message.includes('authentication failed')) {
    console.error('Authentication failed. Check your username and password in the connection string.');
  }

  if (err.message && err.message.includes('SSL')) {
    console.error('SSL/TLS error. This may be due to network restrictions or firewall settings.');
  }

  console.log('⚠️ Starting server without MongoDB connection. Some features will not work.');

  // Start server anyway to allow non-database features to work
  app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT} (without MongoDB)`);
    console.log(`Health check endpoint: http://localhost:${PORT}/api/health`);
  });
});