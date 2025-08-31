const express = require('express');
const router = express.Router();
const Pusher = require('pusher');
const { provideDefaultUser } = require('../middleware/defaultUser');
require('dotenv').config();

// Validate required environment variables
const requiredEnvVars = ['PUSHER_APP_ID', 'PUSHER_KEY', 'PUSHER_SECRET', 'PUSHER_CLUSTER'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingVars.length > 0) {
  throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
}

// Pusher configuration
const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: process.env.PUSHER_CLUSTER,
  useTLS: true,
});

/**
 * Pusher authentication endpoint for private channels
 * @param {string} req.body.socket_id - Client socket ID
 * @param {string} req.body.channel_name - Channel name to authorize
 * @param {object} req.user - Authenticated user object
 */
router.post('/auth', provideDefaultUser, (req, res) => {
  try {
    const { socket_id, channel_name } = req.body;
    
    // Validate required parameters
    if (!socket_id || !channel_name) {
      return res.status(400).json({ error: 'Missing socket_id or channel_name' });
    }

    // Validate user authentication
    if (!req.user?.id) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const userId = req.user.id;

    // Authorize user for their private channel only
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