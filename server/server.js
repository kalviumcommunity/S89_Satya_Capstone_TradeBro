const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const authRoutes = require("./routes/authRoutes");
const dataRoutes = require("./routes/apiRoutes");
const passport = require("passport");
const session = require("express-session");
const MongoStore = require("connect-mongo"); 
require("./passport.config");

dotenv.config();

const app = express();

app.use(
  session({
    secret: process.env.SESSION_SECRET || "keyboard cat", // Use a secure secret
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI, // Store sessions in MongoDB
      collectionName: "sessions",
    }),
    cookie: {
      maxAge: 1000 * 60 * 60 * 24, // 1 day
      secure: process.env.NODE_ENV === "production", // Use secure cookies in production
      httpOnly: true,
    },
  })
);

// Initialize Passport middleware
app.use(passport.initialize());
app.use(passport.session());

const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({ credentials: true, origin: "http://localhost:5173" })); // Allow credentials for frontend
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/data", dataRoutes);

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB connected");
    app.listen(PORT, () => {
      console.log(`🚀 Server running at http://localhost:${PORT}`);
    });
  })
  .catch((err) => console.error("❌ MongoDB connection failed:", err));