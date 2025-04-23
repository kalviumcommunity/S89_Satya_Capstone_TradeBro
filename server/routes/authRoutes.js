const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const User = require("../models/User");
const router = express.Router();
const passport = require("passport");
require("dotenv").config();

const JWT_SECRET = process.env.JWT_SECRET;

// Signup Route
router.post("/signup", async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password)
    return res.status(400).json({ message: "All fields are required" });

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(409).json({ message: "Email already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
    });

    await newUser.save();

    const token = jwt.sign({ id: newUser._id }, JWT_SECRET, { expiresIn: "1d" });

    res.status(201).json({ message: "Signup successful", token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Signup failed" });
  }
});

// Login Route
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ message: "Email and password are required" });

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "1d" });

    res.status(200).json({ message: "Login successful", token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Login failed" });
  }
});

// Forgot Password Route
router.post("/forgotpassword", async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });

    const code = Math.floor(100000 + Math.random() * 900000); // Generate 6-digit code
    const hashedCode = await bcrypt.hash(code.toString(), 10);

    user.code = hashedCode;
    user.codeExpires = Date.now() + 10 * 60 * 1000; // Code valid for 10 minutes
    await user.save();

    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: process.env.EMAIL_NODEMAILER,
        pass: process.env.PASSWORD_NODEMAILER,
      },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_NODEMAILER,
      to: user.email,
      subject: "Password Reset Code",
      text: `Your password reset code is: ${code}`,
    });

    res.status(200).json({ message: "Verification code sent successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to send verification code" });
  }
});

// Reset Password Route
router.post("/resetpassword", async (req, res) => {
  const { email, code, newpassword } = req.body;

  if (!email || !code || !newpassword)
    return res.status(400).json({ message: "All fields are required" });

  try {
    const user = await User.findOne({ email });
    if (!user || !user.codeExpires || Date.now() > user.codeExpires)
      return res.status(400).json({ message: "Code expired or user not found" });

    const isCodeValid = await bcrypt.compare(code, user.code);
    if (!isCodeValid)
      return res.status(400).json({ message: "Invalid verification code" });

    const hashedPassword = await bcrypt.hash(newpassword, 10);
    user.password = hashedPassword;
    user.code = undefined; // Clear the code
    user.codeExpires = undefined; // Clear the expiration
    await user.save();

    res.status(200).json({ message: "Password reset successful" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to reset password" });
  }
});

router.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

// Google Callback Route
router.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/login" }),
  (req, res) => {
    // Successful authentication, redirect to the dashboard or home page
    res.redirect("/dashboard");
  }
);

module.exports = router;