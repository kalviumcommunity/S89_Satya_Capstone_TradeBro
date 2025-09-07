const express = require('express');
const router = express.Router();
const Pusher = require('pusher');
const { provideDefaultUser } = require('../middleware/defaultUser');

const pusher = new Pusher({
    appId: process.env.PUSHER_APP_ID || 'dummy',
    key: process.env.PUSHER_KEY || 'dummy',
    secret: process.env.PUSHER_SECRET || 'dummy',
    cluster: process.env.PUSHER_CLUSTER || 'us2',
    useTLS: true
});

// ------------------ Pusher Authentication Route ------------------
/**
 * POST /pusher/auth - Authenticates a user for a private Pusher channel.
 * Channel naming convention: `private-user-[userId]`
 */
router.post('/auth', provideDefaultUser, (req, res) => {
    try {
        const { socket_id, channel_name } = req.body;
        
        if (!socket_id || !channel_name) {
            return res.status(400).json({ error: 'Missing socket_id or channel_name' });
        }

        if (!req.user?.id) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

        const userId = req.user.id;
        
        // Allow access to user's private channel
        if (!channel_name.startsWith(`private-user-${userId}`)) {
            return res.status(403).json({ error: 'Not authorized for this channel' });
        }

        const auth = pusher.authorizeChannel(socket_id, channel_name);
        res.json(auth);
        
    } catch (error) {
        console.error('Pusher auth error:', error);
        res.status(500).json({ error: 'Authentication failed' });
    }
});

module.exports = router;