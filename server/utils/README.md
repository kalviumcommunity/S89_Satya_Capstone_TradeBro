# Response Utilities

This module provides standardized API response utilities for the TradeBro application.

## Overview

The response utilities provide a consistent way to format API responses across the application. This ensures that all API endpoints return responses in the same format, making it easier for the frontend to handle responses.

## Response Format

All API responses follow this standard format:

### Success Response

```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... },
  "statusCode": 200
}
```

### Error Response

```json
{
  "success": false,
  "message": "An error occurred",
  "error": { ... },
  "statusCode": 500
}
```

## Available Methods

The response middleware adds the following methods to the Express response object:

### `res.success(message, data, statusCode)`

Sends a success response.

- `message`: Success message (string)
- `data`: Response data (any)
- `statusCode`: HTTP status code (number, default: 200)

Example:
```javascript
return res.success('User created successfully', { id: 123, name: 'John Doe' }, 201);
```

### `res.error(message, error, statusCode)`

Sends an error response.

- `message`: Error message (string)
- `error`: Error details (any)
- `statusCode`: HTTP status code (number, default: 500)

Example:
```javascript
return res.error('Failed to create user', { code: 'USER_EXISTS' }, 400);
```

### `res.validationError(message, errors)`

Sends a validation error response (HTTP 400).

- `message`: Validation error message (string)
- `errors`: Validation errors object (object)

Example:
```javascript
return res.validationError('Validation failed', { 
  email: 'Email is required',
  password: 'Password must be at least 8 characters'
});
```

### `res.notFound(message)`

Sends a not found response (HTTP 404).

- `message`: Not found message (string)

Example:
```javascript
return res.notFound('User not found');
```

### `res.unauthorized(message)`

Sends an unauthorized response (HTTP 401).

- `message`: Unauthorized message (string)

Example:
```javascript
return res.unauthorized('Invalid credentials');
```

### `res.forbidden(message)`

Sends a forbidden response (HTTP 403).

- `message`: Forbidden message (string)

Example:
```javascript
return res.forbidden('You do not have permission to access this resource');
```

## Usage in Routes

```javascript
const express = require('express');
const router = express.Router();

router.get('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.notFound('User not found');
    }
    
    return res.success('User retrieved successfully', user);
  } catch (error) {
    return res.error('Failed to retrieve user', error);
  }
});

module.exports = router;
```

## Benefits

- Consistent response format across all API endpoints
- Simplified error handling
- Improved developer experience
- Better client-side error handling
