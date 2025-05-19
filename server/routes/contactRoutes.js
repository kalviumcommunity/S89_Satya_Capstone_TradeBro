const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { verifyToken } = require('../middleware/auth');

dotenv.config();

// Create a transporter object using SMTP transport
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS // This should be set in your .env file
  }
});

// Send contact form email
router.post('/send', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    // Validate input
    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and message are required'
      });
    }

    // Email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    // Get user information if authenticated
    let userInfo = '';
    if (req.headers.authorization) {
      try {
        const token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);
        if (user) {
          userInfo = `\n\nUser Account Information:\nUsername: ${user.username}\nUser ID: ${user._id}`;
        }
      } catch (error) {
        console.log('Non-critical error getting user info:', error.message);
      }
    }

    // Set up email options
    const mailOptions = {
      from: `"${name}" <${email}>`,
      to: 'tradebro2025@gmail.com',
      subject: subject || `Contact Form: Message from ${name}`,
      text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}${userInfo}`,
      html: `
        <h3>New Contact Form Submission</h3>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Subject:</strong> ${subject || 'N/A'}</p>
        <p><strong>Message:</strong></p>
        <p>${message.replace(/\n/g, '<br>')}</p>
        ${userInfo ? `
        <h4>User Account Information:</h4>
        <p><strong>Username:</strong> ${userInfo.split('\n')[2].split(':')[1].trim()}</p>
        <p><strong>User ID:</strong> ${userInfo.split('\n')[3].split(':')[1].trim()}</p>
        ` : ''}
        <hr>
        <p><em>This email was sent from the TradeBro contact form.</em></p>
      `
    };

    // Send email
    await transporter.sendMail(mailOptions);

    res.status(200).json({
      success: true,
      message: 'Email sent successfully'
    });
  } catch (error) {
    console.error('Error sending email:', error);

    // Check if it's an authentication error
    if (error.code === 'EAUTH') {
      return res.status(500).json({
        success: false,
        message: 'Email authentication failed. Please check your email credentials.',
        error: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to send email',
      error: error.message
    });
  }
});

// Send authenticated contact form email (with user details)
router.post('/send-auth', verifyToken, async (req, res) => {
  try {
    const { subject, message } = req.body;

    // Validate input
    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Message is required'
      });
    }

    // Get user details
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Set up email options
    const mailOptions = {
      from: `"${user.username}" <${user.email}>`,
      to: 'tradebro2025@gmail.com',
      subject: subject ? `Contact Form: ${subject}` : `Contact Form from ${user.username}`,
      text: `Name: ${user.username}\nEmail: ${user.email}\nUser ID: ${user._id}\n\nMessage:\n${message}`,
      html: `
        <h3>New Contact Form Submission (Authenticated User)</h3>
        <p><strong>Name:</strong> ${user.username}</p>
        <p><strong>Email:</strong> ${user.email}</p>
        <p><strong>Subject:</strong> ${subject || 'N/A'}</p>
        <p><strong>Message:</strong></p>
        <p>${message.replace(/\n/g, '<br>')}</p>
        <h4>User Account Information:</h4>
        <p><strong>Username:</strong> ${user.username}</p>
        <p><strong>User ID:</strong> ${user._id}</p>
        <hr>
        <p><em>This email was sent from the TradeBro contact form by an authenticated user.</em></p>
      `
    };

    // Send email
    await transporter.sendMail(mailOptions);

    res.status(200).json({
      success: true,
      message: 'Email sent successfully'
    });
  } catch (error) {
    console.error('Error sending email:', error);

    // Check if it's an authentication error
    if (error.code === 'EAUTH') {
      return res.status(500).json({
        success: false,
        message: 'Email authentication failed. Please check your email credentials.',
        error: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to send email',
      error: error.message
    });
  }
});

module.exports = router;
