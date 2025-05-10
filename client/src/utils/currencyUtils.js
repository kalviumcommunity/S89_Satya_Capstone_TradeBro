/**
 * Utility functions for currency formatting
 */

/**
 * Format a number as Indian Rupees
 * @param {number} amount - The amount to format
 * @param {boolean} showSymbol - Whether to show the ₹ symbol (default: true)
 * @returns {string} Formatted amount in Indian Rupees
 */
export const formatIndianRupees = (amount, showSymbol = true) => {
  if (amount === undefined || amount === null) return showSymbol ? '₹0' : '0';
  
  // Format with Indian locale and currency
  const formatter = new Intl.NumberFormat('en-IN', {
    style: showSymbol ? 'currency' : 'decimal',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  
  return formatter.format(amount);
};

/**
 * Format large numbers in Indian Rupees with abbreviations (Lakh, Crore)
 * @param {number} amount - The amount to format
 * @returns {string} Formatted amount with appropriate abbreviation
 */
export const formatLargeIndianRupees = (amount) => {
  if (amount === undefined || amount === null) return '₹0';
  
  if (amount >= 10000000000) { // 1000 Crore
    return `₹${(amount / 10000000000).toFixed(2)} Arab`;
  } else if (amount >= 1000000000) { // 100 Crore
    return `₹${(amount / 1000000000).toFixed(2)} Arab`;
  } else if (amount >= 10000000) { // 1 Crore
    return `₹${(amount / 10000000).toFixed(2)} Cr`;
  } else if (amount >= 100000) { // 1 Lakh
    return `₹${(amount / 100000).toFixed(2)} L`;
  } else if (amount >= 1000) {
    return `₹${(amount / 1000).toFixed(2)}K`;
  } else {
    return `₹${amount.toLocaleString('en-IN')}`;
  }
};

/**
 * Convert a dollar amount to Indian Rupees (approximate conversion)
 * @param {number} dollarAmount - The amount in USD
 * @returns {number} Approximate amount in INR
 */
export const convertUSDtoINR = (dollarAmount) => {
  // Using a fixed conversion rate for simplicity
  // In a real app, you would use an API to get the current exchange rate
  const conversionRate = 83.5; // 1 USD = 83.5 INR (approximate)
  return dollarAmount * conversionRate;
};

/**
 * Format a number as a percentage
 * @param {number} value - The value to format as percentage
 * @param {number} decimals - Number of decimal places (default: 2)
 * @returns {string} Formatted percentage
 */
export const formatPercentage = (value, decimals = 2) => {
  if (value === undefined || value === null) return '0%';
  return `${value.toFixed(decimals)}%`;
};
