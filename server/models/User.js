const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: false // Not required for Google OAuth users
    },
    fullName: {
        type: String,
        default: ''
    },
    phoneNumber: {
        type: String,
        default: ''
    },
    language: {
        type: String,
        default: 'English'
    },
    profileImage: {
        type: String,
        default: null
    },
    notifications: {
        type: Boolean,
        default: true
    },
    tradingExperience: {
        type: String,
        enum: ['Beginner', 'Intermediate', 'Advanced', 'Professional'],
        default: 'Beginner'
    },
    preferredMarkets: {
        type: [String],
        default: ['Stocks']
    },
    bio: {
        type: String,
        default: 'No bio provided yet.'
    },
    authProvider: {
        type: String,
        enum: ['local', 'google'],
        default: 'local'
    },
    googleId: {
        type: String,
        unique: true,
        sparse: true // Allows multiple null values
    },
    emailVerified: {
        type: Boolean,
        default: false
    },
    isEmailVerified: {
        type: Boolean,
        default: false
    },
    profilePicture: {
        type: String,
        default: null
    },
    lastLogin: {
        type: Date,
        default: Date.now
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    referralCode: {
        type: String,
        unique: true,
        sparse: true // Allows multiple null values
    },
    referredBy: {
        type: String,
        default: null
    },
    
    // Two-Factor Authentication
    twoFactorEnabled: {
        type: Boolean,
        default: false
    },
    twoFactorSecret: {
        type: String,
        default: null
    },
    twoFactorTempSecret: {
        type: String,
        default: null
    },
    loginAlerts: {
        type: Boolean,
        default: true
    },
    
    // Password Reset
    resetPasswordToken: {
        type: String,
        default: null
    },
    resetPasswordExpires: {
        type: Date,
        default: null
    },
    
    // Two-Factor Authentication Code
    twoFactorCode: {
        type: String,
        default: null
    },
    twoFactorExpires: {
        type: Date,
        default: null
    }
});

const User = mongoose.model('User', userSchema);

module.exports = User;