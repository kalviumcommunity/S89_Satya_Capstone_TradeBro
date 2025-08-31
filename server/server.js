// server.js
const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const passport = require("passport");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const axios = require("axios");

// Load environment variables
dotenv.config();

// -------------------- ENVIRONMENT VARIABLE VALIDATION --------------------
const requiredEnvVars = ["MONGO_URI", "JWT_SECRET", "FMP_API_KEY", "GEMINI_API_KEY"];
const missingRequired = requiredEnvVars.filter(v => !process.env[v]);
if (missingRequired.length > 0) {
  console.error("❌ Missing required environment variables:", missingRequired);
  process.exit(1);
}

// Optional variables warning
const optionalEnvVars = ["TWELVE_DATA_API_KEY", "SESSION_SECRET", "CLIENT_URL", "API_BASE_URL"];
optionalEnvVars.forEach(v => {
  if (!process.env[v]) console.warn(`⚠️ Optional env var not set: ${v}`);
});

// -------------------- ROUTES --------------------
const responseMiddleware = require("./middleware/responseMiddleware");
const authRoutes = require("./routes/authRoutes");

const portfolioRoutes = require("./routes/portfolioRoutes");
const dataRoutes = require("./routes/apiRoutes");


const saytrixRoutes = require("./routes/saytrix");
const saytrixRoutesAdvanced = require("./routes/saytrixRoutes");
const chatbotRoutes = require("./routes/chatbotRoutes");
const chatRoutes = require("./routes/chatRoutes");
const searchRoutes = require("./routes/searchRoutes");
const virtualMoneyRoutes = require("./routes/virtualMoneyRoutes");
const proxyRoutes = require("./routes/proxyRoutes");
const stocksRoutes = require("./routes/stocks");
const stockRoutes = require("./routes/stockRoutes");
const stockSearchRoutes = require("./routes/stockSearchRoutes");

const watchlistRoutes = require("./routes/watchlistRoutes");
const enhancedWatchlistRoutes = require("./routes/enhancedWatchlistRoutes");
const orderRoutes = require("./routes/orderRoutes");
const userDataRoutes = require("./routes/userDataRoutes");
const userActivityRoutes = require("./routes/userActivityRoutes");
const userPreferencesRoutes = require("./routes/userPreferencesRoutes");
const newsRoutes = require("./routes/newsRoutes");
const liveChartRoutes = require("./routes/liveChartRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const contactRoutes = require("./routes/contactRoutes");
const leaderboardRoutes = require("./routes/leaderboardRoutes");
const referralRoutes = require("./routes/referralRoutes");
const pusherRoutes = require("./routes/pusherRoutes");


// Passport configuration
require('./passport.config');

// -------------------- EXPRESS APP --------------------
const app = express();
const PORT = process.env.PORT || 5000;

// -------------------- CORS --------------------
const allowedOrigins = [
  "https://tradebro.netlify.app",
  "https://s89-satya-capstone-tradebro.onrender.com",
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:3000",
  "http://localhost:5001",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174"
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept", "Origin"],
  exposedHeaders: ["Set-Cookie"],
  optionsSuccessStatus: 200
}));



// -------------------- MIDDLEWARE --------------------
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());
app.use("/uploads", express.static("uploads"));
app.use(responseMiddleware);

// Compression for production
if (process.env.NODE_ENV === "production") {
  const compression = require("compression");
  app.use(compression({ level: 6, threshold: 1024 }));
}

// Session middleware for OAuth
app.use(session({
  secret: process.env.SESSION_SECRET || "tradebro-session-secret-2025",
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === "production", 
    httpOnly: true, 
    maxAge: 24 * 60 * 60 * 1000 
  }
}));

app.use(passport.initialize());
app.use(passport.session());

// -------------------- HEALTH CHECK --------------------
app.get("/api/health", (_, res) => {
  return res.success("Server is running", { status: "ok", timestamp: new Date().toISOString() });
});

// Keep server alive by pinging itself every 14 minutes
if (process.env.NODE_ENV === "production") {
  setInterval(async () => {
    try {
      await axios.get(`${process.env.API_BASE_URL}/api/health`);
      console.log("✅ Health check ping successful");
    } catch (error) {
      console.log("❌ Health check ping failed:", error.message);
    }
  }, 14 * 60 * 1000); // 14 minutes
}

// -------------------- PUBLIC ROUTES --------------------
app.get("/api/virtual-money/public-reward-status", (_, res) => {
  return res.success("Next reward in 12h", { canClaim: false, balance: 10000 });
});

app.get("/api/stocks/search", async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) return res.validationError("Query is required");

    let searchResults = [];
    let apiSource = "none";

    try {
      const response = await axios.get(`https://financialmodelingprep.com/api/v3/search?query=${query}&limit=15&apikey=${process.env.FMP_API_KEY}`, { timeout: 5000 });
      if (Array.isArray(response.data)) {
        searchResults = response.data.map(stock => ({
          symbol: stock.symbol,
          name: stock.name || stock.symbol,
          exchange: stock.exchangeShortName || "Unknown",
          type: stock.type || "stock",
          country: stock.country || "Unknown",
          currency: "USD"
        }));
        apiSource = "fmp";
      }
    } catch {
      searchResults = [{
        symbol: query.toUpperCase(),
        name: `${query.toUpperCase()} Corp`,
        exchange: "NASDAQ",
        type: "stock",
        country: "USA",
        currency: "USD",
        isMock: true
      }];
      apiSource = "mock";
    }

    return res.success("Stocks retrieved successfully", { results: searchResults, query, source: apiSource });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Failed to search stocks", error: err.message });
  }
});

// -------------------- API ROUTES --------------------
app.use("/api/auth", authRoutes);

app.use("/api/portfolio", portfolioRoutes);
app.use("/api/data", dataRoutes);


app.use("/api/saytrix", saytrixRoutes);
app.use("/api/saytrix/advanced", saytrixRoutesAdvanced);
app.use("/api/chatbot", chatbotRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/virtual-money", virtualMoneyRoutes);
app.use("/api/proxy", proxyRoutes);
app.use("/api/stocks", stocksRoutes);
app.use("/api/stock", stockRoutes);
app.use("/api/stock-search", stockSearchRoutes);

app.use("/api/watchlist", watchlistRoutes);
app.use("/api/watchlist/enhanced", enhancedWatchlistRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/userdata", userDataRoutes);
app.use("/api/user-activity", userActivityRoutes);
app.use("/api/user-preferences", userPreferencesRoutes);
app.use("/api/news", newsRoutes);
app.use("/api/live-charts", liveChartRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/leaderboard", leaderboardRoutes);
app.use("/api/trades", require("./routes/tradesRoutes"));
app.use("/api/referral", referralRoutes);
app.use("/pusher", pusherRoutes);
app.use("/pusher", require("./routes/pusher-auth-perfect"));



// 404 handler
app.use((req, res) => {
  console.log('404 - Route not found:', req.method, req.path);
  res.status(404).json({ success: false, message: "API endpoint not found", path: req.path, method: req.method });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('🚨 Global Error:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  });
  
  const statusCode = err.statusCode || err.status || 500;
  const message = process.env.NODE_ENV === 'production' 
    ? 'Internal Server Error' 
    : err.message;
  
  res.status(statusCode).json({ 
    success: false, 
    message,
    code: err.code || 'INTERNAL_ERROR',
    ...(process.env.NODE_ENV === 'development' && { error: err.message })
  });
});

// -------------------- MONGODB CONNECTION --------------------
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log("✅ Connected to MongoDB");
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch(err => {
    console.error("❌ MongoDB connection error:", err.message);
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT} (MongoDB not connected)`));
  });
