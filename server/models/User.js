const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

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
    },
    googleId: {
        type: String,
        unique: true,
        sparse: true // Allows null values for non-Google users
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
    code: {
        type: String
    },
    codeExpires: {
        type: Date
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const User = mongoose.model('User', userSchema);

module.exports = User;