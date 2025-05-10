/**
 * Example Routes
 * This file demonstrates how to use the standardized response utilities
 */

const express = require('express');
const router = express.Router();
const { verifyToken, optionalAuth } = require('../middleware/auth');

/**
 * @route   GET /api/example
 * @desc    Example endpoint that demonstrates success response
 * @access  Public
 */
router.get('/', (req, res) => {
  const exampleData = {
    id: 1,
    name: 'Example Data',
    timestamp: new Date().toISOString()
  };
  
  return res.success('Example data retrieved successfully', exampleData);
});

/**
 * @route   GET /api/example/error
 * @desc    Example endpoint that demonstrates error response
 * @access  Public
 */
router.get('/error', (req, res) => {
  return res.error('This is an example error', { code: 'EXAMPLE_ERROR' });
});

/**
 * @route   GET /api/example/not-found
 * @desc    Example endpoint that demonstrates not found response
 * @access  Public
 */
router.get('/not-found', (req, res) => {
  return res.notFound('The requested resource was not found');
});

/**
 * @route   GET /api/example/validation-error
 * @desc    Example endpoint that demonstrates validation error response
 * @access  Public
 */
router.get('/validation-error', (req, res) => {
  const validationErrors = {
    name: 'Name is required',
    email: 'Email must be valid'
  };
  
  return res.validationError('Validation failed', validationErrors);
});

/**
 * @route   GET /api/example/auth
 * @desc    Example endpoint that demonstrates authentication
 * @access  Private
 */
router.get('/auth', verifyToken, (req, res) => {
  return res.success('Authentication successful', {
    user: req.user,
    authenticated: true
  });
});

/**
 * @route   GET /api/example/optional-auth
 * @desc    Example endpoint that demonstrates optional authentication
 * @access  Public/Private
 */
router.get('/optional-auth', optionalAuth, (req, res) => {
  if (req.user) {
    return res.success('User is authenticated', {
      user: req.user,
      authenticated: true
    });
  } else {
    return res.success('User is not authenticated', {
      authenticated: false
    });
  }
});

/**
 * @route   POST /api/example
 * @desc    Example endpoint that demonstrates handling POST data
 * @access  Public
 */
router.post('/', (req, res) => {
  const { name, email } = req.body;
  
  // Validate input
  if (!name || !email) {
    return res.validationError('Name and email are required');
  }
  
  // Process data (in a real app, this might save to a database)
  const newData = {
    id: Math.floor(Math.random() * 1000),
    name,
    email,
    createdAt: new Date().toISOString()
  };
  
  return res.success('Data created successfully', newData, 201);
});

/**
 * @route   PUT /api/example/:id
 * @desc    Example endpoint that demonstrates handling PUT data
 * @access  Public
 */
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { name, email } = req.body;
  
  // Validate input
  if (!name && !email) {
    return res.validationError('At least one field (name or email) is required for update');
  }
  
  // In a real app, you would check if the resource exists
  // For this example, we'll just pretend it does
  
  // Process update (in a real app, this might update a database)
  const updatedData = {
    id: parseInt(id),
    name: name || 'Original Name',
    email: email || 'original@example.com',
    updatedAt: new Date().toISOString()
  };
  
  return res.success('Data updated successfully', updatedData);
});

/**
 * @route   DELETE /api/example/:id
 * @desc    Example endpoint that demonstrates handling DELETE
 * @access  Public
 */
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  
  // In a real app, you would check if the resource exists
  // For this example, we'll just pretend it does
  
  // Process deletion (in a real app, this might delete from a database)
  
  return res.success('Data deleted successfully', { id: parseInt(id) });
});

module.exports = router;
