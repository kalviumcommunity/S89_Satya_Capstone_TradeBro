/**
 * Input Validation Utility
 * Provides validation functions for stock API endpoints
 */

/**
 * Validate stock symbol format
 * @param {string} symbol - Stock symbol to validate
 * @returns {object} Validation result
 */
const validateStockSymbol = (symbol) => {
  if (!symbol) {
    return {
      isValid: false,
      error: 'Symbol is required',
      code: 'SYMBOL_REQUIRED'
    };
  }

  if (typeof symbol !== 'string') {
    return {
      isValid: false,
      error: 'Symbol must be a string',
      code: 'SYMBOL_INVALID_TYPE'
    };
  }

  // Remove whitespace and convert to uppercase
  const cleanSymbol = symbol.trim().toUpperCase();

  if (cleanSymbol.length === 0) {
    return {
      isValid: false,
      error: 'Symbol cannot be empty',
      code: 'SYMBOL_EMPTY'
    };
  }

  if (cleanSymbol.length > 20) {
    return {
      isValid: false,
      error: 'Symbol too long (max 20 characters)',
      code: 'SYMBOL_TOO_LONG'
    };
  }

  // Check for valid characters (alphanumeric, dots, hyphens)
  const validSymbolRegex = /^[A-Z0-9.\-]+$/;
  if (!validSymbolRegex.test(cleanSymbol)) {
    return {
      isValid: false,
      error: 'Symbol contains invalid characters (only letters, numbers, dots, and hyphens allowed)',
      code: 'SYMBOL_INVALID_CHARACTERS'
    };
  }

  return {
    isValid: true,
    cleanSymbol
  };
};

/**
 * Validate multiple symbols (comma-separated)
 * @param {string} symbols - Comma-separated symbols
 * @param {number} maxSymbols - Maximum number of symbols allowed
 * @returns {object} Validation result
 */
const validateMultipleSymbols = (symbols, maxSymbols = 50) => {
  if (!symbols) {
    return {
      isValid: false,
      error: 'Symbols parameter is required',
      code: 'SYMBOLS_REQUIRED'
    };
  }

  const symbolArray = symbols.split(',').map(s => s.trim()).filter(s => s.length > 0);

  if (symbolArray.length === 0) {
    return {
      isValid: false,
      error: 'At least one symbol is required',
      code: 'NO_VALID_SYMBOLS'
    };
  }

  if (symbolArray.length > maxSymbols) {
    return {
      isValid: false,
      error: `Too many symbols (max ${maxSymbols} allowed)`,
      code: 'TOO_MANY_SYMBOLS'
    };
  }

  const validatedSymbols = [];
  const errors = [];

  for (const symbol of symbolArray) {
    const validation = validateStockSymbol(symbol);
    if (validation.isValid) {
      validatedSymbols.push(validation.cleanSymbol);
    } else {
      errors.push({
        symbol,
        error: validation.error,
        code: validation.code
      });
    }
  }

  if (validatedSymbols.length === 0) {
    return {
      isValid: false,
      error: 'No valid symbols found',
      code: 'NO_VALID_SYMBOLS',
      symbolErrors: errors
    };
  }

  return {
    isValid: true,
    validSymbols: validatedSymbols,
    symbolErrors: errors.length > 0 ? errors : null
  };
};

/**
 * Validate pagination parameters
 * @param {object} query - Query parameters
 * @returns {object} Validation result
 */
const validatePagination = (query) => {
  const { page = 1, limit = 20 } = query;
  
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);

  if (isNaN(pageNum) || pageNum < 1) {
    return {
      isValid: false,
      error: 'Page must be a positive integer',
      code: 'INVALID_PAGE'
    };
  }

  if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
    return {
      isValid: false,
      error: 'Limit must be between 1 and 100',
      code: 'INVALID_LIMIT'
    };
  }

  return {
    isValid: true,
    page: pageNum,
    limit: limitNum
  };
};

/**
 * Validate date range parameters
 * @param {object} query - Query parameters
 * @returns {object} Validation result
 */
const validateDateRange = (query) => {
  const { from, to } = query;
  
  if (!from && !to) {
    return { isValid: true }; // No date range specified
  }

  const fromDate = from ? new Date(from) : null;
  const toDate = to ? new Date(to) : null;

  if (from && isNaN(fromDate.getTime())) {
    return {
      isValid: false,
      error: 'Invalid from date format',
      code: 'INVALID_FROM_DATE'
    };
  }

  if (to && isNaN(toDate.getTime())) {
    return {
      isValid: false,
      error: 'Invalid to date format',
      code: 'INVALID_TO_DATE'
    };
  }

  if (fromDate && toDate && fromDate > toDate) {
    return {
      isValid: false,
      error: 'From date cannot be after to date',
      code: 'INVALID_DATE_RANGE'
    };
  }

  // Check if date range is not too far in the future
  const now = new Date();
  const maxFutureDate = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000); // 1 year

  if (fromDate && fromDate > maxFutureDate) {
    return {
      isValid: false,
      error: 'From date cannot be more than 1 year in the future',
      code: 'FROM_DATE_TOO_FAR'
    };
  }

  if (toDate && toDate > maxFutureDate) {
    return {
      isValid: false,
      error: 'To date cannot be more than 1 year in the future',
      code: 'TO_DATE_TOO_FAR'
    };
  }

  return {
    isValid: true,
    fromDate,
    toDate
  };
};

/**
 * Validate chart interval parameter
 * @param {string} interval - Chart interval
 * @returns {object} Validation result
 */
const validateChartInterval = (interval) => {
  const validIntervals = ['1min', '5min', '15min', '30min', '1hour', '4hour', '1day', '1week', '1month'];
  
  if (!interval) {
    return {
      isValid: true,
      interval: '5min' // Default interval
    };
  }

  if (!validIntervals.includes(interval)) {
    return {
      isValid: false,
      error: `Invalid interval. Valid options: ${validIntervals.join(', ')}`,
      code: 'INVALID_INTERVAL'
    };
  }

  return {
    isValid: true,
    interval
  };
};

/**
 * Create validation middleware
 * @param {function} validationFn - Validation function
 * @returns {function} Express middleware
 */
const createValidationMiddleware = (validationFn) => {
  return (req, res, next) => {
    const result = validationFn(req);
    
    if (!result.isValid) {
      return res.status(400).json({
        success: false,
        error: result.error,
        code: result.code,
        details: result.symbolErrors || result.details
      });
    }

    // Add validated data to request object
    req.validated = result;
    next();
  };
};

/**
 * Symbol validation middleware
 */
const validateSymbolMiddleware = createValidationMiddleware((req) => {
  return validateStockSymbol(req.params.symbol);
});

/**
 * Multiple symbols validation middleware
 */
const validateMultipleSymbolsMiddleware = createValidationMiddleware((req) => {
  return validateMultipleSymbols(req.query.symbols);
});

/**
 * Pagination validation middleware
 */
const validatePaginationMiddleware = createValidationMiddleware((req) => {
  return validatePagination(req.query);
});

module.exports = {
  validateStockSymbol,
  validateMultipleSymbols,
  validatePagination,
  validateDateRange,
  validateChartInterval,
  createValidationMiddleware,
  validateSymbolMiddleware,
  validateMultipleSymbolsMiddleware,
  validatePaginationMiddleware
};
