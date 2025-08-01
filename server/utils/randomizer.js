/**
 * Randomizer Utility
 * Provides consistent randomization logic for stock price fluctuations
 */

/**
 * Check if market is currently open
 * @returns {boolean} True if market is open
 */
const isMarketOpen = () => {
  const now = new Date();
  const day = now.getDay();
  const hours = now.getHours();
  const minutes = now.getMinutes();

  // Weekend check (0 = Sunday, 6 = Saturday)
  if (day === 0 || day === 6) {
    return false;
  }

  // Market hours check (9:30 AM to 4:00 PM IST for NSE/BSE)
  const isBeforeOpen = hours < 9 || (hours === 9 && minutes < 30);
  const isAfterClose = hours > 16 || (hours === 16 && minutes >= 0);

  return !(isBeforeOpen || isAfterClose);
};

/**
 * Generate deterministic but seemingly random changes based on userId and symbol
 * @param {string} userId - User ID for personalization
 * @param {string} symbol - Stock symbol
 * @returns {number} Personalized factor between -0.1 and 0.1
 */
const generatePersonalizedFactor = (userId, symbol) => {
  if (!userId || !symbol) return 0;
  
  // Create deterministic hash
  const hash = (userId + symbol).split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);

  // Use the hash to create personalized price fluctuations
  const personalFactor = (hash % 20) / 100; // -0.1 to 0.1
  const isPositive = hash % 2 === 0;
  
  return isPositive ? personalFactor : -personalFactor;
};

/**
 * Apply live fluctuation to stock data
 * @param {object|array} data - Stock data (single object or array)
 * @param {string} type - Fluctuation type: 'gain', 'loss', 'neutral', 'random'
 * @param {object} options - Additional options
 * @param {string} options.userId - User ID for personalization
 * @param {boolean} options.respectMarketHours - Only apply changes during market hours
 * @param {number} options.intensity - Fluctuation intensity (0-1, default 0.4)
 * @returns {object|array} Modified data with fluctuations applied
 */
const applyLiveFluctuation = (data, type = 'random', options = {}) => {
  const {
    userId = null,
    respectMarketHours = true,
    intensity = 0.4
  } = options;

  // Don't apply changes if market is closed and respectMarketHours is true
  if (respectMarketHours && !isMarketOpen()) {
    return data;
  }

  /**
   * Apply fluctuation to a single stock item
   * @param {object} item - Stock data item
   * @returns {object} Modified stock data
   */
  const applyFluctuationToItem = (item) => {
    // Skip if item doesn't have required price fields
    if (!item.price || item.changesPercentage === undefined) {
      return item;
    }

    let changeAmount = 0;
    
    // Generate change based on type
    switch (type) {
      case 'gain':
        changeAmount = Math.random() * intensity; // Positive change
        break;
      case 'loss':
        changeAmount = -Math.random() * intensity; // Negative change
        break;
      case 'neutral':
        changeAmount = (Math.random() * 0.1) - 0.05; // Very small change
        break;
      case 'random':
      default:
        changeAmount = (Math.random() * intensity) - (intensity / 2); // Random change
        break;
    }

    // Apply personalization if userId is provided
    if (userId && item.symbol) {
      const personalFactor = generatePersonalizedFactor(userId, item.symbol);
      changeAmount += personalFactor;
    }

    // Calculate new values
    const originalPrice = parseFloat(item.price);
    const newPrice = Math.max(0.01, originalPrice + changeAmount); // Ensure price doesn't go negative
    const priceChange = newPrice - originalPrice;
    const percentChange = (priceChange / originalPrice) * 100;

    // Create modified item
    const modifiedItem = {
      ...item,
      price: parseFloat(newPrice.toFixed(2)),
      change: parseFloat(((item.change || 0) + priceChange).toFixed(2)),
      changesPercentage: parseFloat(((item.changesPercentage || 0) + percentChange).toFixed(2))
    };

    // Update related fields if they exist
    if (item.dayHigh !== undefined) {
      modifiedItem.dayHigh = Math.max(modifiedItem.dayHigh, modifiedItem.price);
    }
    if (item.dayLow !== undefined) {
      modifiedItem.dayLow = Math.min(modifiedItem.dayLow, modifiedItem.price);
    }

    return modifiedItem;
  };

  // Handle array of items
  if (Array.isArray(data)) {
    return data.map(applyFluctuationToItem);
  }

  // Handle single item
  return applyFluctuationToItem(data);
};

/**
 * Generate random fluctuation for specific market scenarios
 * @param {string} scenario - Market scenario: 'bull', 'bear', 'volatile', 'stable'
 * @param {number} baseIntensity - Base intensity (default 0.4)
 * @returns {object} Fluctuation parameters
 */
const getFluctuationForScenario = (scenario, baseIntensity = 0.4) => {
  const scenarios = {
    bull: {
      type: 'gain',
      intensity: baseIntensity * 1.2,
      bias: 0.7 // 70% chance of positive movement
    },
    bear: {
      type: 'loss',
      intensity: baseIntensity * 1.2,
      bias: 0.3 // 30% chance of positive movement
    },
    volatile: {
      type: 'random',
      intensity: baseIntensity * 2,
      bias: 0.5 // 50% chance of positive movement
    },
    stable: {
      type: 'neutral',
      intensity: baseIntensity * 0.3,
      bias: 0.5 // 50% chance of positive movement
    }
  };

  return scenarios[scenario] || scenarios.stable;
};

/**
 * Apply market scenario-based fluctuation
 * @param {object|array} data - Stock data
 * @param {string} scenario - Market scenario
 * @param {object} options - Additional options
 * @returns {object|array} Modified data
 */
const applyScenarioFluctuation = (data, scenario, options = {}) => {
  const fluctuationParams = getFluctuationForScenario(scenario, options.baseIntensity);
  
  return applyLiveFluctuation(data, fluctuationParams.type, {
    ...options,
    intensity: fluctuationParams.intensity
  });
};

/**
 * Generate random boolean based on probability
 * @param {number} probability - Probability (0-1)
 * @returns {boolean} Random boolean
 */
const randomBoolean = (probability = 0.5) => {
  return Math.random() < probability;
};

/**
 * Generate random number within range
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @param {number} decimals - Number of decimal places
 * @returns {number} Random number
 */
const randomInRange = (min, max, decimals = 2) => {
  const value = Math.random() * (max - min) + min;
  return parseFloat(value.toFixed(decimals));
};

module.exports = {
  applyLiveFluctuation,
  applyScenarioFluctuation,
  getFluctuationForScenario,
  generatePersonalizedFactor,
  isMarketOpen,
  randomBoolean,
  randomInRange
};
