const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  // Reference to the User who owns this notification
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // User's email, for easy reference
  userEmail: {
    type: String,
    required: true
  },
  // Type of the notification (e.g., success, info, alert)
  type: {
    type: String,
    enum: ['alert', 'info', 'success', 'error', 'warning'], // Added 'warning' for consistency
    default: 'info'
  },
  // Main title of the notification
  title: {
    type: String,
    required: true
  },
  // The full message content
  message: {
    type: String,
    required: true
  },
  // Flag to indicate if the notification has been read
  read: {
    type: Boolean,
    default: false
  },
  // Timestamp when the notification was read
  readAt: {
    type: Date,
    default: null
  },
  // An optional link for an action
  link: {
    type: String,
    default: null
  },
  // Flexible data field for storing metadata (e.g., stock data, order details)
  data: {
    type: Object, // Using Object allows for flexible data payloads
    default: {}
  }
}, { 
  // Mongoose handles createdAt and updatedAt automatically
  timestamps: true 
});

// Add indexes for better query performance
// Index for sorting all notifications by creation date in descending order
notificationSchema.index({ createdAt: -1 });

// Compound index for the most common query: fetching a user's notifications sorted by date
notificationSchema.index({ userId: 1, createdAt: -1 });

// Compound index for efficiently finding unread notifications for a user
notificationSchema.index({ userId: 1, read: 1 });

// Compound index for preventing duplicate notifications for a user
notificationSchema.index({ userId: 1, type: 1, title: 1 });

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;