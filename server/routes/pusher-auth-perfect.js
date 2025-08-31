const express = require('express');
const router = express.Router();
const Pusher = require('pusher');
const { provideDefaultUser } = require('../middleware/defaultUser');

// ------------------ Pusher Config (Secure) ------------------
if (!process.env.PUSHER_APP_ID || !process.env.PUSHER_KEY || !process.env.PUSHER_SECRET || !process.env.PUSHER_CLUSTER) {
    throw new Error('Pusher environment variables are not set. Please check your .env file.');
}

const pusherConfig = {
    appId: process.env.PUSHER_APP_ID,
    key: process.env.PUSHER_KEY,
    secret: process.env.PUSHER_SECRET,
    cluster: process.env.PUSHER_CLUSTER,
    useTLS: true
};

const pusher = new Pusher(pusherConfig);

// ------------------ Pusher Authentication Route ------------------
/**
 * POST /pusher/auth - Authenticates a user for a private Pusher channel.
 * Channel naming convention: `private-user-[userId]`
 */
router.post('/auth', provideDefaultUser, (req, res) => {
    console.log('Pusher auth request:', {
        user: req.user,
        channel: req.body.channel_name,
        headers: req.headers.authorization ? 'Token present' : 'No token'
    });
    
    if (!req.user || !req.user.id) {
        console.error('Pusher auth failed: No user found');
        return res.status(401).send('Not authorized');
    }

    const socketId = req.body.socket_id;
    const channelName = req.body.channel_name;
    
    // Validate that the user is trying to subscribe to their own private channel
    if (channelName !== `private-user-${req.user.id}`) {
        console.error('Pusher auth failed: Channel mismatch', {
            expected: `private-user-${req.user.id}`,
            received: channelName
        });
        return res.status(403).send('Forbidden: Not authorized to access this channel.');
    }

    try {
        const authResponse = pusher.authorizeChannel(socketId, channelName);
        console.log('Pusher auth successful for user:', req.user.id);
        res.send(authResponse);
    } catch (error) {
        console.error('Pusher authentication error:', error);
        res.status(500).send('Internal server error during Pusher authentication.');
    }
});

module.exports = router;