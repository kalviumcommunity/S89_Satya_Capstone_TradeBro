/**
 * Enhanced Email Service
 * Supports both OAuth2 and App Password authentication for Gmail
 */

const nodemailer = require('nodemailer');
const { generateEmailHTML, generateEmailText } = require('../utils/emailUtils');

// Strict environment variable validation
function validateEmailCredentials() {
  // Use existing environment variables from .env
  const emailUser = process.env.email_nodemailer || process.env.EMAIL_USER;
  const emailPass = process.env.password_nodemailer || process.env.EMAIL_PASS;

  if (!emailUser || !emailPass) {
    console.warn('⚠️ Email credentials not configured. 2FA emails will not be sent.');
    return false;
  }

  console.log('✅ Email credentials found');
  return true;
}

/**
 * Create nodemailer transporter with OAuth2 or App Password
 * @returns {Object} Nodemailer transporter
 */
function createEmailTransporter() {
  if (!validateEmailCredentials()) {
    throw new Error('Email credentials not configured');
  }

  const emailUser = process.env.email_nodemailer || process.env.EMAIL_USER;
  const emailPass = process.env.password_nodemailer || process.env.EMAIL_PASS;

  console.log('🔑 Using Gmail with app password');
  
  return nodemailer.createTransporter({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: emailUser,
      pass: emailPass
    }
  });
}

/**
 * Send contact form email
 * @param {Object} emailData - Email data
 * @param {string} emailData.name - Sender name
 * @param {string} emailData.email - Sender email
 * @param {string} emailData.subject - Email subject
 * @param {string} emailData.message - Email message
 * @param {Object|null} emailData.userInfo - User information (if authenticated)
 * @param {boolean} emailData.isAuthenticated - Whether user is authenticated
 * @returns {Promise<Object>} Send result
 */
async function sendContactEmail(emailData) {
  const startTime = Date.now();
  
  try {
    const { name, email, subject, message, userInfo, isAuthenticated } = emailData;
    
    // Create transporter
    const transporter = createEmailTransporter();
    
    // Generate email content
    const htmlContent = generateEmailHTML({
      name,
      email,
      subject,
      message,
      userInfo,
      isAuthenticated
    });
    
    const textContent = generateEmailText({
      name,
      email,
      subject,
      message,
      userInfo,
      isAuthenticated
    });

    // Email options
    const mailOptions = {
      from: {
        name: `TradeBro Contact Form - ${name}`,
        address: process.env.EMAIL_USER // Use our email as sender
      },
      to: process.env.EMAIL_USER,
      replyTo: {
        name: name,
        address: email
      },
      subject: subject ? `TradeBro Contact: ${subject}` : `TradeBro Contact from ${name}`,
      text: textContent,
      html: htmlContent,
      headers: {
        'X-Priority': '3',
        'X-Mailer': 'TradeBro Contact System',
        'X-Contact-Type': isAuthenticated ? 'authenticated' : 'public'
      }
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);
    const duration = Date.now() - startTime;

    // Log success
    console.log('✅ Contact email sent successfully:', {
      messageId: info.messageId,
      from: email,
      name: name,
      subject: subject || 'No subject',
      isAuthenticated,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    });

    return {
      success: true,
      messageId: info.messageId,
      duration,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    const duration = Date.now() - startTime;
    
    // Log error with context
    console.error('❌ Contact email send failed:', {
      error: error.message,
      code: error.code,
      from: emailData.email,
      name: emailData.name,
      isAuthenticated: emailData.isAuthenticated,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    });

    // Categorize error types
    let errorType = 'unknown';
    let userMessage = 'Failed to send email. Please try again later.';

    if (error.code === 'EAUTH') {
      errorType = 'authentication';
      userMessage = 'Email service authentication failed. Please contact support.';
    } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      errorType = 'network';
      userMessage = 'Network error. Please check your connection and try again.';
    } else if (error.code === 'EMESSAGE') {
      errorType = 'message';
      userMessage = 'Invalid email content. Please check your message and try again.';
    }

    return {
      success: false,
      error: {
        type: errorType,
        message: userMessage,
        code: error.code,
        duration,
        timestamp: new Date().toISOString()
      }
    };
  }
}

/**
 * Send 2FA code email
 * @param {string} email - User email
 * @param {string} code - 2FA code
 * @param {string} userName - User name
 * @returns {Promise<Object>} Send result
 */
async function send2FAEmail(email, code, userName = 'User') {
  try {
    const transporter = createEmailTransporter();
    
    const mailOptions = {
      from: {
        name: 'TradeBro Security',
        address: process.env.email_nodemailer || process.env.EMAIL_USER
      },
      to: email,
      subject: 'TradeBro - Your 2FA Verification Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #10b981;">⚡ TradeBro</h1>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; text-align: center;">
            <h2 style="color: #333; margin-bottom: 20px;">🔐 Your Verification Code</h2>
            <p style="color: #666; margin-bottom: 30px;">Hi ${userName}, here's your 2FA code:</p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h1 style="font-size: 2.5rem; letter-spacing: 0.5rem; color: #10b981; margin: 0;">${code}</h1>
            </div>
            
            <p style="color: #666; font-size: 14px;">This code expires in 5 minutes.</p>
            <p style="color: #999; font-size: 12px; margin-top: 20px;">If you didn't request this, please ignore this email.</p>
          </div>
          
          <div style="text-align: center; margin-top: 30px; color: #999; font-size: 12px;">
            <p>© 2024 TradeBro - Secure Trading Platform</p>
          </div>
        </div>
      `,
      text: `TradeBro 2FA Code: ${code}\n\nThis code expires in 5 minutes.\nIf you didn't request this, please ignore this email.`
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ 2FA email sent:', info.messageId);
    
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ 2FA email failed:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Test email configuration
 * @returns {Promise<boolean>} Test result
 */
async function testEmailConfiguration() {
  try {
    console.log('🧪 Testing email configuration...');
    
    const transporter = createEmailTransporter();
    await transporter.verify();
    
    console.log('✅ Email configuration test passed');
    return true;
  } catch (error) {
    console.error('❌ Email configuration test failed:', error.message);
    return false;
  }
}

module.exports = {
  sendContactEmail,
  send2FAEmail,
  testEmailConfiguration,
  validateEmailCredentials
};
