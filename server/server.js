const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const passport = require("passport");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const cookieParser = require("cookie-parser");


// Import middleware and routes
const responseMiddleware = require("./middleware/responseMiddleware");
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

const userDataRoutes = require("./routes/userDataRoutes");
const newsRoutes = require("./routes/newsRoutes");

// Import real-time data service
const realTimeDataService = require("./services/realTimeDataService");

// Load environment variables
dotenv.config();
require("./passport.config");

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;
// Use environment variables for database connection and API keys
const MONGO_URI = process.env.MONGO_URI;


// Trust proxy - important for detecting HTTPS when behind a proxy like Cloudflare or Render
app.set('trust proxy', true);

// CORS configuration
app.use(cors({
  origin: [
    // Development URLs
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:9090",
    "http://localhost:9091",
    "http://localhost:7000",
    // Production URLs
    "https://tradebro.netlify.app",
    "https://tradebro-client.vercel.app",
    "https://tradebro.vercel.app",
    "https://s89-satya-capstone-tradebro-client.vercel.app",
    "https://s89-satya-capstone-tradebro.vercel.app"
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"]
}));

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use("/uploads", express.static("uploads"));

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

app.use("/api/userdata", userDataRoutes);
app.use("/api/news", newsRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Server error:", err);
  return res.status(500).json({
    success: false,
    message: "Internal Server Error",
    error: err.message
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
  authSource: 'admin'
})
.then(() => {
  console.log('✅ Connected to MongoDB');

  // Start server after successful MongoDB connection
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`Health check endpoint: https://s89-satya-capstone-tradebro.onrender.com/api/health`);

    // Start real-time data service
    console.log('🔄 Starting real-time data service...');
    realTimeDataService.start();
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
    console.log(`Health check endpoint: https://s89-satya-capstone-tradebro.onrender.com/api/health`);

    // Start real-time data service even without MongoDB
    console.log('🔄 Starting real-time data service...');
    realTimeDataService.start();
  });
});