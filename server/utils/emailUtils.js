/**
 * Email Utility Functions
 * Reusable functions for email generation and user token handling
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Extract user information from JWT token
 * @param {string} authHeader - Authorization header value
 * @returns {Promise<Object|null>} User information or null
 */
async function getUserInfoFromToken(authHeader) {
  try {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return null;
    }

    // Validate JWT_SECRET exists
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET not found in environment variables');
      return null;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      console.warn(`User not found for token ID: ${decoded.id}`);
      return null;
    }

    return {
      id: user._id,
      username: user.username,
      email: user.email,
      fullName: user.fullName || user.username
    };
  } catch (error) {
    console.warn('Non-critical error extracting user info from token:', {
      message: error.message,
      name: error.name
    });
    return null;
  }
}

/**
 * Generate HTML email content
 * @param {Object} data - Email data
 * @param {string} data.name - Sender name
 * @param {string} data.email - Sender email
 * @param {string} data.subject - Email subject
 * @param {string} data.message - Email message
 * @param {Object|null} data.userInfo - User information (if authenticated)
 * @param {boolean} data.isAuthenticated - Whether user is authenticated
 * @returns {string} HTML email content
 */
function generateEmailHTML(data) {
  const { name, email, subject, message, userInfo, isAuthenticated } = data;
  
  // Escape HTML to prevent XSS
  const escapeHtml = (text) => {
    if (!text) return '';
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  };

  // Convert newlines to <br> tags
  const formatMessage = (text) => {
    return escapeHtml(text).replace(/\n/g, '<br>');
  };

  const authBadge = isAuthenticated 
    ? '<span style="background-color: #10B981; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold;">AUTHENTICATED USER</span>'
    : '<span style="background-color: #6B7280; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold;">PUBLIC FORM</span>';

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>TradeBro Contact Form</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
        .field { margin-bottom: 15px; }
        .label { font-weight: bold; color: #495057; margin-bottom: 5px; display: block; }
        .value { background: white; padding: 10px; border-radius: 4px; border-left: 4px solid #667eea; }
        .message-box { background: white; padding: 15px; border-radius: 4px; border-left: 4px solid #28a745; margin: 15px 0; }
        .user-info { background: #e3f2fd; padding: 15px; border-radius: 4px; margin: 15px 0; }
        .footer { text-align: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid #dee2e6; color: #6c757d; font-size: 14px; }
        .timestamp { color: #6c757d; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h2>📧 New Contact Form Submission</h2>
        <p>${authBadge}</p>
        <p class="timestamp">Received: ${new Date().toLocaleString()}</p>
      </div>
      
      <div class="content">
        <div class="field">
          <span class="label">👤 Name:</span>
          <div class="value">${escapeHtml(name)}</div>
        </div>
        
        <div class="field">
          <span class="label">📧 Email:</span>
          <div class="value">${escapeHtml(email)}</div>
        </div>
        
        <div class="field">
          <span class="label">📋 Subject:</span>
          <div class="value">${escapeHtml(subject) || 'No subject provided'}</div>
        </div>
        
        <div class="field">
          <span class="label">💬 Message:</span>
          <div class="message-box">${formatMessage(message)}</div>
        </div>
        
        ${userInfo ? `
        <div class="user-info">
          <h4>🔐 User Account Information</h4>
          <p><strong>Username:</strong> ${escapeHtml(userInfo.username)}</p>
          <p><strong>Full Name:</strong> ${escapeHtml(userInfo.fullName)}</p>
          <p><strong>User ID:</strong> ${escapeHtml(userInfo.id.toString())}</p>
          <p><strong>Account Email:</strong> ${escapeHtml(userInfo.email)}</p>
        </div>
        ` : ''}
      </div>
      
      <div class="footer">
        <p>🚀 <strong>TradeBro</strong> - Stock Trading Platform</p>
        <p>This email was automatically generated from the contact form.</p>
      </div>
    </body>
    </html>
  `;
}

/**
 * Generate plain text email content
 * @param {Object} data - Email data (same as generateEmailHTML)
 * @returns {string} Plain text email content
 */
function generateEmailText(data) {
  const { name, email, subject, message, userInfo, isAuthenticated } = data;
  
  let text = `
TradeBro Contact Form Submission
${isAuthenticated ? '[AUTHENTICATED USER]' : '[PUBLIC FORM]'}
Received: ${new Date().toLocaleString()}

Name: ${name}
Email: ${email}
Subject: ${subject || 'No subject provided'}

Message:
${message}
`;

  if (userInfo) {
    text += `

User Account Information:
Username: ${userInfo.username}
Full Name: ${userInfo.fullName}
User ID: ${userInfo.id}
Account Email: ${userInfo.email}
`;
  }

  text += `

---
This email was automatically generated from the TradeBro contact form.
`;

  return text.trim();
}

module.exports = {
  getUserInfoFromToken,
  generateEmailHTML,
  generateEmailText
};
