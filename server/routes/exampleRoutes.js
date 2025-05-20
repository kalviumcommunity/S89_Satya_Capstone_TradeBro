/**
 * Example Routes
 * This file contains example API endpoints for demonstration purposes
 */

const express = require('express');
const router = express.Router();

/**
 * @route   GET /api/example
 * @desc    Get example data
 * @access  Public
 */
router.get('/', (req, res) => {
  return res.json({
    success: true,
    message: 'Example endpoint working',
    data: {
      example: 'This is example data',
      timestamp: new Date().toISOString()
    }
  });
});

/**
 * @route   GET /api/example/items
 * @desc    Get example items
 * @access  Public
 */
router.get('/items', (req, res) => {
  return res.json({
    success: true,
    message: 'Example items retrieved',
    data: [
      { id: 1, name: 'Example Item 1' },
      { id: 2, name: 'Example Item 2' },
      { id: 3, name: 'Example Item 3' }
    ]
  });
});

module.exports = router;
