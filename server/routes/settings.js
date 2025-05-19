const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const validator = require("validator");
const router = express.Router();
const User = require("../models/User");
const { verifyToken } = require("../middleware/auth");

// Ensure the uploads directory exists
if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Ensure this folder exists
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/gif"];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error("Only JPEG, PNG, and GIF files are allowed."));
    }
    cb(null, true);
  },
  limits: { fileSize: 2 * 1024 * 1024 }, // Limit file size to 2MB
});

// Get user settings
router.get("/", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const userSettings = {
      fullName: user.fullName || "",
      email: user.email,
      phoneNumber: user.phoneNumber || "",
      language: user.language || "English",
      profileImage: user.profileImage,
      notifications: user.notifications !== undefined ? user.notifications : true,
      tradingExperience: user.tradingExperience || "Beginner",
      bio: user.bio || "No bio provided yet.",
      preferredMarkets: user.preferredMarkets || ["Stocks"],
      createdAt: user.createdAt
    };

    res.status(200).json({ success: true, userSettings });
  } catch (error) {
    console.error("Error fetching settings:", error.message);
    res.status(500).json({ success: false, message: `Failed to fetch settings: ${error.message}` });
  }
});

// Update user settings
router.put("/", verifyToken, upload.single("profileImage"), async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const fullName = validator.escape(req.body.fullName || "");
    const phoneNumber = validator.escape(req.body.phoneNumber || "");
    const language = validator.escape(req.body.language || "English");
    const profileImage = req.file ? req.file.filename : user.profileImage;
    const notifications = req.body.notifications !== undefined ? req.body.notifications : user.notifications;
    const tradingExperience = validator.escape(req.body.tradingExperience || user.tradingExperience || "Beginner");
    const bio = validator.escape(req.body.bio || user.bio || "");

    // Parse preferredMarkets if it exists
    let preferredMarkets = user.preferredMarkets || ["Stocks"];
    if (req.body.preferredMarkets) {
      try {
        const parsedMarkets = JSON.parse(req.body.preferredMarkets);
        if (Array.isArray(parsedMarkets)) {
          preferredMarkets = parsedMarkets.map(market => validator.escape(market));
        }
      } catch (err) {
        console.error("Error parsing preferredMarkets:", err);
      }
    }

    // Update user in database
    user.fullName = fullName;
    user.phoneNumber = phoneNumber;
    user.language = language;
    user.profileImage = profileImage;
    user.notifications = notifications;
    user.tradingExperience = tradingExperience;
    user.bio = bio;
    user.preferredMarkets = preferredMarkets;

    await user.save();

    const userSettings = {
      fullName: user.fullName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      language: user.language,
      profileImage: user.profileImage,
      notifications: user.notifications,
      tradingExperience: user.tradingExperience,
      bio: user.bio,
      preferredMarkets: user.preferredMarkets,
      createdAt: user.createdAt
    };

    console.log("Updated Settings:", userSettings);

    res.status(200).json({ success: true, message: "Settings updated successfully!", userSettings });
  } catch (error) {
    console.error("Error updating settings:", error.message);
    res.status(500).json({ success: false, message: `Failed to update settings: ${error.message}` });
  }
});

// Delete user settings
router.delete("/", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Reset user settings
    user.fullName = "";
    user.phoneNumber = "";
    user.language = "English";
    user.profileImage = null;

    await user.save();

    console.log("User settings deleted.");

    res.status(200).json({ success: true, message: "User settings deleted successfully!" });
  } catch (error) {
    console.error("Error deleting settings:", error.message);
    res.status(500).json({ success: false, message: `Failed to delete settings: ${error.message}` });
  }
});

// Update notification settings
router.put("/notifications", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Update notifications setting
    user.notifications = req.body.notifications;

    await user.save();

    console.log("Notification settings updated:", user.notifications);

    res.status(200).json({
      success: true,
      message: "Notification settings updated successfully!",
      notifications: user.notifications
    });
  } catch (error) {
    console.error("Error updating notification settings:", error.message);
    res.status(500).json({ success: false, message: `Failed to update notification settings: ${error.message}` });
  }
});

module.exports = router;