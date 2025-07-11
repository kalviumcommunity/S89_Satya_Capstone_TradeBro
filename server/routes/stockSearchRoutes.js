/**
 * Stock Search Routes
 * Clean, modular routes for stock search functionality
 */

const express = require('express');
const router = express.Router();
const stockSearchController = require('../controllers/stockSearchController');

// Apply middleware to all routes
router.use(stockSearchController.validateSearchParams);
router.use(stockSearchController.rateLimitMiddleware);

/**
 * GET /api/stocks?q=query&limit=10
 * Multi-source stock search with FMP, Twelve Data, and local fallback
 * 
 * Query Parameters:
 * - q (required): Search query string
 * - limit (optional): Maximum results to return (1-50, default: 10)
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "query": "reliance",
 *     "results": [...],
 *     "count": 5,
 *     "sources": { "FMP": 2, "TwelveData": 1, "Local": 2 },
 *     "responseTime": "150ms"
 *   },
 *   "timestamp": "2024-01-01T00:00:00.000Z"
 * }
 */
router.get('/', stockSearchController.searchStocks.bind(stockSearchController));

/**
 * GET /api/stocks/suggestions?q=query&limit=5
 * Instant search suggestions for autocomplete
 * 
 * Query Parameters:
 * - q (required): Search query string
 * - limit (optional): Maximum suggestions (1-20, default: 5)
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "query": "rel",
 *     "suggestions": [...],
 *     "count": 3,
 *     "responseTime": "50ms"
 *   },
 *   "timestamp": "2024-01-01T00:00:00.000Z"
 * }
 */
router.get('/suggestions', stockSearchController.getSuggestions.bind(stockSearchController));

/**
 * GET /api/stocks/trending?limit=10
 * Get trending NSE stocks
 * 
 * Query Parameters:
 * - limit (optional): Maximum trending stocks (1-50, default: 10)
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "trending": [...],
 *     "count": 10,
 *     "description": "Top trending NSE stocks",
 *     "responseTime": "25ms"
 *   },
 *   "timestamp": "2024-01-01T00:00:00.000Z"
 * }
 */
router.get('/trending', stockSearchController.getTrendingStocks.bind(stockSearchController));

/**
 * GET /api/stocks/health
 * Health check for stock search service
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "status": "healthy",
 *     "service": "stock-search",
 *     "version": "1.0.0",
 *     "checks": {
 *       "localSearch": true,
 *       "fmpApi": true,
 *       "twelveDataApi": false
 *     },
 *     "responseTime": "10ms",
 *     "timestamp": "2024-01-01T00:00:00.000Z"
 *   }
 * }
 */
router.get('/health', stockSearchController.healthCheck.bind(stockSearchController));

/**
 * Error handling middleware for stock search routes
 */
router.use((error, req, res, next) => {
  console.error(`❌ Stock search route error [${req.searchId || 'unknown'}]:`, {
    error: error.message,
    path: req.path,
    method: req.method,
    query: req.query,
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
  });

  res.status(500).json({
    success: false,
    error: 'Stock search service error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Service temporarily unavailable',
    code: 'ROUTE_ERROR',
    requestId: req.searchId,
    timestamp: new Date().toISOString()
  });
});

/**
 * 404 handler for unknown stock search endpoints
 */
router.use('*', (req, res) => {
  console.warn(`⚠️ Unknown stock search endpoint: ${req.method} ${req.originalUrl}`);
  
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    message: `The endpoint ${req.method} ${req.path} does not exist`,
    code: 'ENDPOINT_NOT_FOUND',
    availableEndpoints: [
      'GET /api/stocks?q=query',
      'GET /api/stocks/suggestions?q=query',
      'GET /api/stocks/trending',
      'GET /api/stocks/health'
    ],
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
