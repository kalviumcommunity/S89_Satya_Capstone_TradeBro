const express = require("express");
const multer = require("multer");
const path = require("path");
const router = express.Router();

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Ensure this folder exists
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

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
    const { fullName, email, phoneNumber, language } = req.body;
    const profileImage = req.file ? req.file.filename : userSettings.profileImage;

    // Update the mock database
    userSettings = { fullName, email, phoneNumber, language, profileImage };

    console.log("Updated Settings:", userSettings);

    res.status(200).json({ message: "Settings updated successfully!", userSettings });
  } catch (error) {
    console.error("Error updating settings:", error);
    res.status(500).json({ message: "Failed to update settings." });
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
    console.error("Error deleting settings:", error);
    res.status(500).json({ message: "Failed to delete settings." });
  }
});

module.exports = router;