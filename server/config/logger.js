/**
 * Winston Logger Configuration
 * Centralized logging for the TradeBro application
 */

const winston = require('winston');
const path = require('path');

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white'
};

// Tell winston that you want to link the colors
winston.addColors(colors);

// Define which logs to print based on environment
const level = () => {
  const env = process.env.NODE_ENV || 'development';
  const isDevelopment = env === 'development';
  return isDevelopment ? 'debug' : 'warn';
};

// Define different log formats
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`
  )
);

// Define file format (without colors for file logs)
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Define transports
const transports = [
  // Console transport
  new winston.transports.Console({
    level: level(),
    format: logFormat
  }),
  
  // Error log file
  new winston.transports.File({
    filename: path.join(__dirname, '../logs/error.log'),
    level: 'error',
    format: fileFormat,
    maxsize: 5242880, // 5MB
    maxFiles: 5
  }),
  
  // Combined log file
  new winston.transports.File({
    filename: path.join(__dirname, '../logs/combined.log'),
    format: fileFormat,
    maxsize: 5242880, // 5MB
    maxFiles: 5
  })
];

// Create the logger
const logger = winston.createLogger({
  level: level(),
  levels,
  format: fileFormat,
  transports,
  exitOnError: false
});

// Create logs directory if it doesn't exist
const fs = require('fs');
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Add request logging method
logger.logRequest = (req, res, duration, cacheHit = false) => {
  const logData = {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    duration: `${duration}ms`,
    cacheHit,
    timestamp: new Date().toISOString()
  };

  logger.info(`${req.method} ${req.originalUrl} - ${duration}ms ${cacheHit ? '[CACHE HIT]' : ''}`, logData);
};

// Add API response logging method
logger.logAPIResponse = (endpoint, success, duration, source = 'api', error = null) => {
  const logData = {
    endpoint,
    success,
    duration: `${duration}ms`,
    source,
    timestamp: new Date().toISOString()
  };

  if (error) {
    logData.error = {
      message: error.message,
      code: error.code,
      status: error.status
    };
  }

  if (success) {
    logger.info(`API Success: ${endpoint} - ${duration}ms [${source.toUpperCase()}]`, logData);
  } else {
    logger.error(`API Failed: ${endpoint} - ${duration}ms [${source.toUpperCase()}]`, logData);
  }
};

// Add cache logging method
logger.logCache = (operation, key, hit = null, ttl = null) => {
  const logData = {
    operation,
    key,
    timestamp: new Date().toISOString()
  };

  if (hit !== null) logData.hit = hit;
  if (ttl !== null) logData.ttl = `${ttl}s`;

  const message = hit === true 
    ? `Cache HIT: ${key}` 
    : hit === false 
    ? `Cache MISS: ${key}` 
    : `Cache ${operation.toUpperCase()}: ${key}`;

  logger.debug(message, logData);
};

// Add news-specific logging method
logger.logNews = (type, query, category, results, source, cacheHit, duration) => {
  const logData = {
    type,
    query,
    category,
    resultsCount: results,
    source,
    cacheHit,
    duration: `${duration}ms`,
    timestamp: new Date().toISOString()
  };

  const message = `News ${type}: ${results} results from ${source} - ${duration}ms ${cacheHit ? '[CACHED]' : ''}`;
  logger.info(message, logData);
};

module.exports = logger;
