const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const passport = require("passport");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const cookieParser = require("cookie-parser");
const axios = require("axios");

// Import middleware and routes
const responseMiddleware = require("./middleware/responseMiddleware");
const authRoutes = require("./routes/authRoutes");
const dataRoutes = require("./routes/apiRoutes");
const settingsRoutes = require("./routes/settings");
const saytrixRoutes = require("./routes/saytrix");
const searchRoutes = require("./routes/searchRoutes");
const saytrixRoutesAdvanced = require("./routes/saytrixRoutes");
const virtualMoneyRoutes = require("./routes/virtualMoneyRoutes");
const proxyRoutes = require("./routes/proxyRoutes");
const { router: notificationRoutes } = require("./routes/notificationRoutes");
const watchlistRoutes = require("./routes/watchlistRoutes");
const orderRoutes = require("./routes/orderRoutes");

const exampleRoutes = require("./routes/exampleRoutes");
const userDataRoutes = require("./routes/userDataRoutes");
const newsRoutes = require("./routes/newsRoutes");

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

// CORS configuration - Allow requests from frontend
const allowedOrigins = [
  process.env.CLIENT_URL || "https://tradebro.netlify.app",  // Production frontend
  "http://localhost:5173",         // Local development (Vite)
  "http://localhost:3000",         // Alternative local development port
  "https://s89-satya-capstone-tradebro.onrender.com"  // Backend self-reference
];

console.log('🔒 CORS allowed origins:', allowedOrigins);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn('❌ CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "Origin",
    "Access-Control-Request-Method",
    "Access-Control-Request-Headers"
  ],
  exposedHeaders: ["Set-Cookie"],
  optionsSuccessStatus: 200 // Some legacy browsers (IE11, various SmartTVs) choke on 204
}));

// Basic middleware
app.use(express.json({ limit: '10mb' })); // Increased limit for production
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Enable compression for production
if (process.env.NODE_ENV === 'production') {
  const compression = require('compression');
  app.use(compression({
    level: 6, // Compression level (1-9)
    threshold: 1024, // Only compress responses larger than 1KB
    filter: (req, res) => {
      // Don't compress responses with this request header
      if (req.headers['x-no-compression']) {
        return false;
      }
      // Fallback to standard filter function
      return compression.filter(req, res);
    }
  }));
  console.log('✅ Compression enabled for production');
}

app.use("/uploads", express.static("uploads"));

// Handle preflight requests manually for better compatibility
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin);
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin, Access-Control-Request-Method, Access-Control-Request-Headers');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.sendStatus(200);
});

// Ensure JSON responses and prevent HTML error pages
app.use((req, res, next) => {
  // Set default content type to JSON for API routes
  if (req.path.startsWith('/api/')) {
    res.setHeader('Content-Type', 'application/json');
  }
  next();
});

// Apply response middleware to standardize API responses
app.use(responseMiddleware);

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
  const healthData = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    routes: {
      auth: true,
      settings: true,
      watchlist: true,
      orders: true,
      virtualMoney: true,
      notifications: true,
      userdata: true,
      chatHistory: true
    }
  };
  return res.success('Server is running', healthData);
});





// Public reward status endpoint (no authentication required)
app.get('/api/virtual-money/public-reward-status', (_, res) => {
  const now = new Date();
  // Mock last reward time (12 hours ago)
  const lastReward = new Date(now.getTime() - (12 * 60 * 60 * 1000));
  const hoursSinceLastReward = 12;

  // Calculate time remaining
  const minutesRemaining = Math.ceil((24 - hoursSinceLastReward) * 60);
  const hoursRemaining = Math.floor(minutesRemaining / 60);
  const mins = minutesRemaining % 60;

  const rewardStatusData = {
    canClaim: false,
    timeRemaining: {
      hours: hoursRemaining,
      minutes: mins,
      totalMinutes: minutesRemaining
    },
    balance: 10000,
    balanceFormatted: '₹10,000'
  };

  return res.success(`You can claim your next reward in ${hoursRemaining}h ${mins}m`, rewardStatusData);
});

// Stock search endpoint (public)
app.get('/api/stocks/search', async (req, res) => {
  try {
    const { query } = req.query;

    if (!query || query.length < 1) {
      return res.validationError('Search query is required');
    }

    console.log(`Direct stock search request received for query: "${query}"`);

    // Define a common format for search results
    let searchResults = [];
    let apiSource = 'none';

    try {
      // Search for stocks using FMP API with timeout
      console.log('Attempting to search with FMP API');
      const response = await axios.get(
        `https://financialmodelingprep.com/api/v3/search?query=${query}&limit=15&apikey=${FMP_API}`,
        { timeout: 5000 } // 5 second timeout
      );

      if (response.data && Array.isArray(response.data)) {
        // Filter out non-stock results and prioritize exact matches
        searchResults = response.data
          .filter(item => item.type === 'stock' || item.type === 'etf')
          .map(stock => ({
            symbol: stock.symbol,
            name: stock.name || stock.symbol,
            exchange: stock.exchangeShortName || 'Unknown',
            exchangeShortName: stock.exchangeShortName || 'Unknown',
            type: stock.type || 'stock',
            country: stock.country || 'Unknown',
            currency: 'USD' // FMP doesn't provide currency, assume USD
          }));

        apiSource = 'fmp';
        console.log(`FMP API returned ${searchResults.length} results`);
      } else {
        throw new Error('Invalid response format from FMP API');
      }
    } catch (apiError) {
      console.error('Error searching for stocks with FMP API:', apiError.message);

      // Try Twelve Data API as fallback
      try {
        console.log('Attempting to search with Twelve Data API');
        const twelveDataResponse = await axios.get(
          `https://api.twelvedata.com/symbol_search?symbol=${query}&outputsize=20&apikey=${TWELVE_DATA_API_KEY}`,
          { timeout: 5000 } // 5 second timeout
        );

        if (twelveDataResponse.data && twelveDataResponse.data.data && Array.isArray(twelveDataResponse.data.data)) {
          // Map the response to a consistent format
          searchResults = twelveDataResponse.data.data
            .filter(item => item.instrument_type === 'Common Stock' ||
                            item.instrument_type === 'ETF' ||
                            item.instrument_type === 'Index')
            .map(stock => ({
              symbol: stock.symbol,
              name: stock.instrument_name || stock.symbol,
              exchange: stock.exchange || 'Unknown',
              exchangeShortName: stock.exchange || 'Unknown',
              type: stock.instrument_type === 'Common Stock' ? 'stock' :
                    stock.instrument_type === 'ETF' ? 'etf' : 'index',
              country: stock.country || 'Unknown',
              currency: stock.currency || 'Unknown'
            }));

          apiSource = 'twelvedata';
          console.log(`Twelve Data API returned ${searchResults.length} results`);
        } else {
          throw new Error('Invalid response format from Twelve Data API');
        }
      } catch (twelveDataError) {
        console.error('Error with Twelve Data API:', twelveDataError.message);

        // Both APIs failed, use mock data
        console.log('Both APIs failed, using mock data');

        // Create mock results based on the query
        searchResults = [
          {
            symbol: query.toUpperCase(),
            name: `${query.toUpperCase()} Corporation`,
            exchange: 'NASDAQ',
            exchangeShortName: 'NASDAQ',
            type: 'stock',
            country: 'United States',
            currency: 'USD'
          },
          {
            symbol: `${query.toUpperCase()}.BSE`,
            name: `${query.toUpperCase()} BSE`,
            exchange: 'BSE',
            exchangeShortName: 'BSE',
            type: 'stock',
            country: 'India',
            currency: 'INR'
          },
          {
            symbol: `${query.toUpperCase()}.NSE`,
            name: `${query.toUpperCase()} NSE`,
            exchange: 'NSE',
            exchangeShortName: 'NSE',
            type: 'stock',
            country: 'India',
            currency: 'INR'
          }
        ];

        apiSource = 'mock';
        console.log('Using mock data with 3 results');
      }
    }

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

      // Prioritize Indian stocks (BSE/NSE) if available
      const aIsIndian = a.exchange.includes('BSE') || a.exchange.includes('NSE');
      const bIsIndian = b.exchange.includes('BSE') || b.exchange.includes('NSE');
      if (aIsIndian && !bIsIndian) return -1;
      if (!aIsIndian && bIsIndian) return 1;

      // Shorter symbols get fourth priority
      return a.symbol.length - b.symbol.length;
    });

    return res.success('Stocks retrieved successfully', {
      results: searchResults,
      query,
      source: apiSource,
      isFallback: apiSource === 'mock'
    });
  } catch (error) {
    console.error('Error in direct stock search:', error);
    return res.error('Server error', error);
  }
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/data", dataRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/saytrix", saytrixRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/saytrix", saytrixRoutesAdvanced);
// Legacy chatbot endpoint redirects to Saytrix
app.use("/api/chatbot", saytrixRoutes);
app.use("/api/virtual-money", virtualMoneyRoutes);
app.use("/api/proxy", proxyRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/watchlist", watchlistRoutes);
app.use("/api/orders", orderRoutes);

app.use("/api/example", exampleRoutes);
app.use("/api/userdata", userDataRoutes);
app.use("/api/news", newsRoutes);

// 404 handler for API routes
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    res.status(404).json({
      success: false,
      message: 'API endpoint not found',
      path: req.path,
      method: req.method
    });
  } else {
    next();
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Server error:", err);

  // Ensure JSON response for API routes
  if (req.path.startsWith('/api/')) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    });
  }

  return res.error("Internal Server Error", err);
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
  authSource: 'admin'
  // Removed deprecated options: useNewUrlParser and useUnifiedTopology
})
.then(() => {
  console.log('✅ Connected to MongoDB');

  // Start server after successful MongoDB connection
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
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
    console.log(`🚀 Server running on port ${PORT} (without MongoDB)`);
    console.log(`Health check endpoint: http://localhost:${PORT}/api/health`);
  });
});