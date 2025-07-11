/**
 * Stock Search Controller
 * Handles HTTP requests for stock search functionality
 */

const stockSearchService = require('../services/stockSearchService');

class StockSearchController {
  /**
   * Multi-source stock search
   * GET /api/stocks?q=query&limit=10
   */
  async searchStocks(req, res) {
    const startTime = Date.now();
    
    try {
      const { q: query, limit = 10 } = req.query;

      // Validate query parameter
      if (!query || typeof query !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'Query parameter "q" is required and must be a string',
          code: 'INVALID_QUERY'
        });
      }

      if (query.trim().length < 1) {
        return res.status(400).json({
          success: false,
          error: 'Query must be at least 1 character long',
          code: 'QUERY_TOO_SHORT'
        });
      }

      // Validate limit parameter
      const limitNum = parseInt(limit);
      if (isNaN(limitNum) || limitNum < 1 || limitNum > 50) {
        return res.status(400).json({
          success: false,
          error: 'Limit must be between 1 and 50',
          code: 'INVALID_LIMIT'
        });
      }

      console.log(`🔍 Stock search request: "${query}" (limit: ${limitNum})`);

      // Perform multi-source search
      const results = await stockSearchService.searchStocks(query.trim(), limitNum);

      const responseTime = Date.now() - startTime;
      
      // Log search performance
      console.log(`✅ Stock search completed in ${responseTime}ms - ${results.length} results`);

      // Return successful response
      res.json({
        success: true,
        data: {
          query: query.trim(),
          results,
          count: results.length,
          sources: this.getSourceBreakdown(results),
          responseTime: `${responseTime}ms`
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      console.error('❌ Stock search error:', {
        error: error.message,
        query: req.query.q,
        responseTime: `${responseTime}ms`,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });

      res.status(500).json({
        success: false,
        error: 'Internal server error during stock search',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Search temporarily unavailable',
        code: 'SEARCH_ERROR',
        responseTime: `${responseTime}ms`,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Get instant search suggestions
   * GET /api/stocks/suggestions?q=query&limit=5
   */
  async getSuggestions(req, res) {
    const startTime = Date.now();
    
    try {
      const { q: query, limit = 5 } = req.query;

      // Validate query parameter
      if (!query || typeof query !== 'string') {
        return res.json({
          success: true,
          data: {
            query: '',
            suggestions: [],
            count: 0
          },
          timestamp: new Date().toISOString()
        });
      }

      if (query.trim().length < 1) {
        return res.json({
          success: true,
          data: {
            query: query.trim(),
            suggestions: [],
            count: 0
          },
          timestamp: new Date().toISOString()
        });
      }

      // Validate limit parameter
      const limitNum = parseInt(limit);
      const validLimit = isNaN(limitNum) || limitNum < 1 || limitNum > 20 ? 5 : limitNum;

      console.log(`💡 Suggestions request: "${query}" (limit: ${validLimit})`);

      // Get suggestions from service
      const suggestions = stockSearchService.getSuggestions(query.trim(), validLimit);

      const responseTime = Date.now() - startTime;
      
      console.log(`✅ Suggestions completed in ${responseTime}ms - ${suggestions.length} results`);

      // Return suggestions
      res.json({
        success: true,
        data: {
          query: query.trim(),
          suggestions,
          count: suggestions.length,
          responseTime: `${responseTime}ms`
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      console.error('❌ Suggestions error:', {
        error: error.message,
        query: req.query.q,
        responseTime: `${responseTime}ms`
      });

      // Return empty suggestions on error
      res.json({
        success: true,
        data: {
          query: req.query.q || '',
          suggestions: [],
          count: 0,
          error: 'Failed to load suggestions'
        },
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Get trending stocks
   * GET /api/stocks/trending?limit=10
   */
  async getTrendingStocks(req, res) {
    const startTime = Date.now();
    
    try {
      const { limit = 10 } = req.query;

      // Validate limit parameter
      const limitNum = parseInt(limit);
      const validLimit = isNaN(limitNum) || limitNum < 1 || limitNum > 50 ? 10 : limitNum;

      console.log(`📈 Trending stocks request (limit: ${validLimit})`);

      // Get trending stocks from service
      const trendingStocks = stockSearchService.getTrendingStocks(validLimit);

      const responseTime = Date.now() - startTime;
      
      console.log(`✅ Trending stocks completed in ${responseTime}ms - ${trendingStocks.length} results`);

      // Return trending stocks
      res.json({
        success: true,
        data: {
          trending: trendingStocks,
          count: trendingStocks.length,
          description: 'Top trending NSE stocks',
          responseTime: `${responseTime}ms`
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      console.error('❌ Trending stocks error:', {
        error: error.message,
        responseTime: `${responseTime}ms`,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });

      res.status(500).json({
        success: false,
        error: 'Internal server error while fetching trending stocks',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Trending data temporarily unavailable',
        code: 'TRENDING_ERROR',
        responseTime: `${responseTime}ms`,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Health check for stock search service
   * GET /api/stocks/health
   */
  async healthCheck(req, res) {
    const startTime = Date.now();
    
    try {
      console.log('🏥 Stock search health check');

      // Test basic functionality
      const testResults = await stockSearchService.getSuggestions('REL', 1);
      const isHealthy = Array.isArray(testResults);

      const responseTime = Date.now() - startTime;

      const healthStatus = {
        status: isHealthy ? 'healthy' : 'unhealthy',
        service: 'stock-search',
        version: '1.0.0',
        checks: {
          localSearch: isHealthy,
          fmpApi: !!process.env.FMP_API_KEY,
          twelveDataApi: !!process.env.TWELVE_DATA_API_KEY
        },
        responseTime: `${responseTime}ms`,
        timestamp: new Date().toISOString()
      };

      const statusCode = isHealthy ? 200 : 503;
      
      res.status(statusCode).json({
        success: isHealthy,
        data: healthStatus
      });

    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      console.error('❌ Health check error:', error.message);

      res.status(503).json({
        success: false,
        data: {
          status: 'unhealthy',
          service: 'stock-search',
          error: error.message,
          responseTime: `${responseTime}ms`,
          timestamp: new Date().toISOString()
        }
      });
    }
  }

  /**
   * Get source breakdown for analytics
   * @private
   */
  getSourceBreakdown(results) {
    const breakdown = {
      FMP: 0,
      TwelveData: 0,
      Local: 0
    };

    results.forEach(result => {
      if (breakdown.hasOwnProperty(result.source)) {
        breakdown[result.source]++;
      }
    });

    return breakdown;
  }

  /**
   * Validate search parameters middleware
   */
  validateSearchParams(req, res, next) {
    const { q: query } = req.query;

    // Add request ID for tracking
    req.searchId = `search_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Log incoming request
    console.log(`📥 Search request [${req.searchId}]:`, {
      query,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString()
    });

    next();
  }

  /**
   * Rate limiting middleware (placeholder for future implementation)
   */
  rateLimitMiddleware(req, res, next) {
    // Future: Implement rate limiting with Redis
    // For now, just pass through
    next();
  }
}

module.exports = new StockSearchController();
