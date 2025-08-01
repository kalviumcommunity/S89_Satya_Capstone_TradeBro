/**
 * Utility functions for formatting numbers, currency, and other data
 */

/**
 * Format currency in Indian Rupees
 * @param {number} amount - Amount to format
 * @param {boolean} compact - Whether to use compact notation (K, L, Cr)
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount, compact = false) => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '₹0.00';
  }

  const numAmount = Number(amount);

  if (compact) {
    if (numAmount >= 10000000) { // 1 Crore
      return `₹${(numAmount / 10000000).toFixed(2)}Cr`;
    } else if (numAmount >= 100000) { // 1 Lakh
      return `₹${(numAmount / 100000).toFixed(2)}L`;
    } else if (numAmount >= 1000) { // 1 Thousand
      return `₹${(numAmount / 1000).toFixed(2)}K`;
    }
  }

  // Standard Indian number formatting
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(numAmount);
};

/**
 * Format numbers with Indian numbering system
 * @param {number} num - Number to format
 * @param {boolean} compact - Whether to use compact notation
 * @returns {string} Formatted number string
 */
export const formatNumber = (num, compact = false) => {
  if (num === null || num === undefined || isNaN(num)) {
    return '0';
  }

  const numValue = Number(num);

  if (compact) {
    if (numValue >= 10000000) { // 1 Crore
      return `${(numValue / 10000000).toFixed(2)}Cr`;
    } else if (numValue >= 100000) { // 1 Lakh
      return `${(numValue / 100000).toFixed(2)}L`;
    } else if (numValue >= 1000) { // 1 Thousand
      return `${(numValue / 1000).toFixed(2)}K`;
    }
  }

  // Standard Indian number formatting
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(numValue);
};

/**
 * Format percentage values
 * @param {number} percentage - Percentage to format
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted percentage string
 */
export const formatPercentage = (percentage, decimals = 2) => {
  if (percentage === null || percentage === undefined || isNaN(percentage)) {
    return '0.00%';
  }

  const numPercentage = Number(percentage);
  return `${numPercentage.toFixed(decimals)}%`;
};

/**
 * Format date and time
 * @param {Date|string} date - Date to format
 * @param {string} format - Format type ('short', 'long', 'time', 'datetime')
 * @returns {string} Formatted date string
 */
export const formatDate = (date, format = 'short') => {
  if (!date) return '';

  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) return '';

  const options = {
    short: { day: '2-digit', month: '2-digit', year: 'numeric' },
    long: { day: 'numeric', month: 'long', year: 'numeric' },
    time: { hour: '2-digit', minute: '2-digit', hour12: true },
    datetime: { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    }
  };

  return new Intl.DateTimeFormat('en-IN', options[format]).format(dateObj);
};

/**
 * Format time duration in human readable format
 * @param {number} seconds - Duration in seconds
 * @returns {string} Formatted duration string
 */
export const formatDuration = (seconds) => {
  if (!seconds || seconds < 0) return '0s';

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
};

/**
 * Format stock price change with color indication
 * @param {number} change - Price change amount
 * @param {number} changePercent - Price change percentage
 * @returns {object} Object with formatted values and color class
 */
export const formatPriceChange = (change, changePercent) => {
  const isPositive = change >= 0;
  const formattedChange = formatCurrency(Math.abs(change));
  const formattedPercent = formatPercentage(Math.abs(changePercent));
  
  return {
    change: `${isPositive ? '+' : '-'}${formattedChange}`,
    percent: `${isPositive ? '+' : '-'}${formattedPercent}`,
    colorClass: isPositive ? 'positive' : 'negative',
    isPositive
  };
};

/**
 * Format market cap with appropriate suffix
 * @param {number} marketCap - Market capitalization
 * @returns {string} Formatted market cap string
 */
export const formatMarketCap = (marketCap) => {
  if (!marketCap || marketCap === 0) return 'N/A';

  if (marketCap >= 1000000000000) { // 1 Trillion
    return `₹${(marketCap / 1000000000000).toFixed(2)}T`;
  } else if (marketCap >= 10000000000) { // 1000 Crores
    return `₹${(marketCap / 10000000).toFixed(2)}Cr`;
  } else if (marketCap >= 100000000) { // 10 Crores
    return `₹${(marketCap / 10000000).toFixed(1)}Cr`;
  } else if (marketCap >= 10000000) { // 1 Crore
    return `₹${(marketCap / 10000000).toFixed(2)}Cr`;
  } else {
    return formatCurrency(marketCap, true);
  }
};

/**
 * Format volume with appropriate suffix
 * @param {number} volume - Trading volume
 * @returns {string} Formatted volume string
 */
export const formatVolume = (volume) => {
  if (!volume || volume === 0) return '0';

  if (volume >= 10000000) { // 1 Crore
    return `${(volume / 10000000).toFixed(2)}Cr`;
  } else if (volume >= 100000) { // 1 Lakh
    return `${(volume / 100000).toFixed(2)}L`;
  } else if (volume >= 1000) { // 1 Thousand
    return `${(volume / 1000).toFixed(2)}K`;
  } else {
    return volume.toString();
  }
};

/**
 * Truncate text with ellipsis
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text
 */
export const truncateText = (text, maxLength = 50) => {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

/**
 * Format file size in human readable format
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted file size
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Format phone number in Indian format
 * @param {string} phoneNumber - Phone number to format
 * @returns {string} Formatted phone number
 */
export const formatPhoneNumber = (phoneNumber) => {
  if (!phoneNumber) return '';

  // Remove all non-digits
  const cleaned = phoneNumber.replace(/\D/g, '');

  // Indian mobile number format: +91 XXXXX XXXXX
  if (cleaned.length === 10) {
    return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
  } else if (cleaned.length === 12 && cleaned.startsWith('91')) {
    return `+91 ${cleaned.slice(2, 7)} ${cleaned.slice(7)}`;
  }

  return phoneNumber; // Return original if format doesn't match
};

/**
 * Capitalize first letter of each word
 * @param {string} text - Text to capitalize
 * @returns {string} Capitalized text
 */
export const capitalizeWords = (text) => {
  if (!text) return '';
  return text.replace(/\w\S*/g, (txt) => 
    txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  );
};

/**
 * Format relative time (e.g., "2 hours ago")
 * @param {Date|string} date - Date to format
 * @returns {string} Relative time string
 */
export const formatRelativeTime = (date) => {
  if (!date) return '';

  const now = new Date();
  const dateObj = new Date(date);
  const diffInSeconds = Math.floor((now - dateObj) / 1000);

  if (diffInSeconds < 60) {
    return 'Just now';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 2592000) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  } else {
    return formatDate(date, 'short');
  }
};
