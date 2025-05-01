const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const validator = require("validator");
const router = express.Router();

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

// Mock database (replace with actual database logic)
let userSettings = {
  fullName: "John Doe",
  email: "johndoe@example.com",
  phoneNumber: "1234567890",
  language: "English",
  profileImage: null,
};

// Update user settings
router.put("/", upload.single("profileImage"), async (req, res) => {
  try {
    const fullName = validator.escape(req.body.fullName || "");
    const email = validator.isEmail(req.body.email) ? req.body.email : "";
    const phoneNumber = validator.escape(req.body.phoneNumber || "");
    const language = validator.escape(req.body.language || "English");
    const profileImage = req.file ? req.file.filename : userSettings.profileImage;

    // Update the mock database
    userSettings = { fullName, email, phoneNumber, language, profileImage };

    console.log("Updated Settings:", userSettings);

    res.status(200).json({ message: "Settings updated successfully!", userSettings });
  } catch (error) {
    console.error("Error updating settings:", error.message);
    res.status(500).json({ message: `Failed to update settings: ${error.message}` });
  }
});

// Delete user settings
router.delete("/", async (req, res) => {
  try {
    // Reset the mock database
    userSettings = {
      fullName: "",
      email: "",
      phoneNumber: "",
      language: "English",
      profileImage: null,
    };

    console.log("User settings deleted.");

    res.status(200).json({ message: "User settings deleted successfully!" });
  } catch (error) {
    console.error("Error deleting settings:", error.message);
    res.status(500).json({ message: `Failed to delete settings: ${error.message}` });
  }
});

module.exports = router;