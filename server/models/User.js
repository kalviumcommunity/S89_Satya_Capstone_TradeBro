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
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const User = mongoose.model('User', userSchema);

module.exports = User;