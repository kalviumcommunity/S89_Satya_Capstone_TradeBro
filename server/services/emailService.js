/**
 * Enhanced Email Service
 * Supports both OAuth2 and App Password authentication for Gmail
 */

const nodemailer = require('nodemailer');
const { generateEmailHTML, generateEmailText } = require('../utils/emailUtils');

// Strict environment variable validation
function validateEmailCredentials() {
  const requiredVars = ['EMAIL_USER'];
  const missingVars = [];

  requiredVars.forEach(varName => {
    if (!process.env[varName]) {
      missingVars.push(varName);
    }
  });

  // Check for authentication method
  const hasAppPassword = !!process.env.EMAIL_PASS;
  const hasOAuth2 = !!(
    process.env.GMAIL_CLIENT_ID && 
    process.env.GMAIL_CLIENT_SECRET && 
    process.env.GMAIL_REFRESH_TOKEN
  );

  if (!hasAppPassword && !hasOAuth2) {
    missingVars.push('EMAIL_PASS or OAuth2 credentials (GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN)');
  }

  if (missingVars.length > 0) {
    throw new Error(`Missing required email environment variables: ${missingVars.join(', ')}`);
  }

  console.log('✅ Email credentials validated successfully');
  console.log(`📧 Email service configured with ${hasOAuth2 ? 'OAuth2' : 'App Password'} authentication`);
}

/**
 * Create nodemailer transporter with OAuth2 or App Password
 * @returns {Object} Nodemailer transporter
 */
function createEmailTransporter() {
  validateEmailCredentials();

  const baseConfig = {
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // Use TLS
  };

  // Try OAuth2 first (more secure)
  if (process.env.GMAIL_CLIENT_ID && process.env.GMAIL_CLIENT_SECRET && process.env.GMAIL_REFRESH_TOKEN) {
    console.log('🔐 Using OAuth2 authentication for Gmail');
    
    return nodemailer.createTransporter({
      ...baseConfig,
      auth: {
        type: 'OAuth2',
        user: process.env.EMAIL_USER,
        clientId: process.env.GMAIL_CLIENT_ID,
        clientSecret: process.env.GMAIL_CLIENT_SECRET,
        refreshToken: process.env.GMAIL_REFRESH_TOKEN,
        accessToken: process.env.GMAIL_ACCESS_TOKEN, // Optional, will be generated if not provided
      }
    });
  }

  // Fallback to App Password
  if (process.env.EMAIL_PASS) {
    console.log('🔑 Using App Password authentication for Gmail');
    
    return nodemailer.createTransporter({
      ...baseConfig,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  }

  throw new Error('No valid email authentication method configured');
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
  testEmailConfiguration,
  validateEmailCredentials
};
