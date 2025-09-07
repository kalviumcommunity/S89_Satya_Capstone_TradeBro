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
  const emailPass = process.env.password_nodemailer || process.env.EMAIL_PASSWORD;

  console.log('🔍 Checking email credentials:', {
    email_nodemailer: process.env.email_nodemailer ? '✅ Found' : '❌ Missing',
    EMAIL_USER: process.env.EMAIL_USER ? '✅ Found' : '❌ Missing',
    password_nodemailer: process.env.password_nodemailer ? '✅ Found' : '❌ Missing',
    EMAIL_PASSWORD: process.env.EMAIL_PASSWORD ? '✅ Found' : '❌ Missing'
  });

  if (!emailUser || !emailPass) {
    console.warn('⚠️ Email credentials not configured. 2FA emails will not be sent.');
    console.warn('Expected: email_nodemailer and password_nodemailer in .env');
    return false;
  }

  console.log('✅ Email credentials found:', emailUser);
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
  const emailPass = process.env.password_nodemailer || process.env.EMAIL_PASSWORD;

  console.log('🔑 Using Gmail with app password');
  
  return nodemailer.createTransport({
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
    console.log(`🔐 Sending 2FA email to ${email} with code: ${code}`);
    
    if (!validateEmailCredentials()) {
      console.error('❌ Email credentials not configured');
      return { success: false, error: 'Email service not configured' };
    }

    const transporter = createEmailTransporter();
    
    // Test transporter connection
    await transporter.verify();
    console.log('✅ Email transporter verified');
    
    const mailOptions = {
      from: {
        name: 'TradeBro Security',
        address: process.env.email_nodemailer || process.env.EMAIL_USER
      },
      to: email,
      subject: 'TradeBro - Your 2FA Verification Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f8f9fa;">
          <div style="background: white; padding: 40px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #10b981; margin: 0; font-size: 2rem;">⚡ TradeBro</h1>
              <p style="color: #666; margin: 10px 0 0 0;">Secure Trading Platform</p>
            </div>
            
            <div style="text-align: center; margin-bottom: 30px;">
              <h2 style="color: #333; margin-bottom: 15px;">🔐 Two-Factor Authentication</h2>
              <p style="color: #666; margin-bottom: 25px;">Hi ${userName}, here's your verification code:</p>
              
              <div style="background: #f0f9ff; border: 2px solid #10b981; padding: 25px; border-radius: 8px; margin: 25px 0;">
                <h1 style="font-size: 3rem; letter-spacing: 0.5rem; color: #10b981; margin: 0; font-family: monospace;">${code}</h1>
              </div>
              
              <p style="color: #666; font-size: 14px; margin-bottom: 10px;">⏰ This code expires in 5 minutes</p>
              <p style="color: #999; font-size: 12px;">If you didn't request this code, please ignore this email.</p>
            </div>
            
            <div style="border-top: 1px solid #eee; padding-top: 20px; text-align: center;">
              <p style="color: #999; font-size: 12px; margin: 0;">© 2024 TradeBro - AI-Powered Trading Platform</p>
              <p style="color: #999; font-size: 11px; margin: 5px 0 0 0;">This is an automated message, please do not reply.</p>
            </div>
          </div>
        </div>
      `,
      text: `TradeBro - Two-Factor Authentication\n\nHi ${userName},\n\nYour verification code is: ${code}\n\nThis code expires in 5 minutes.\n\nIf you didn't request this code, please ignore this email.\n\n© 2024 TradeBro - AI-Powered Trading Platform`
    };

    console.log('📧 Sending email with options:', {
      from: mailOptions.from,
      to: mailOptions.to,
      subject: mailOptions.subject
    });

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ 2FA email sent successfully:', {
      messageId: info.messageId,
      to: email,
      code: code,
      timestamp: new Date().toISOString()
    });
    
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ 2FA email send failed:', {
      error: error.message,
      code: error.code,
      to: email,
      timestamp: new Date().toISOString()
    });
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
