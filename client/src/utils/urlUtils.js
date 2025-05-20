/**
 * URL Utilities
 *
 * This file contains utility functions for handling URLs in the application.
 */

/**
 * Ensures that localhost URLs use HTTP instead of HTTPS to avoid SSL issues
 * @param {string} url - The URL to process
 * @returns {string} - The processed URL with HTTP for localhost
 */
export const ensureHttpForLocalhost = (url) => {
  if (!url) return url;

  // If the URL includes localhost and starts with https://, replace it with http://
  if (url.includes('localhost') && url.startsWith('https://')) {
    return url.replace('https://', 'http://');
  }

  return url;
};

/**
 * Builds a full URL from a base URL and path, ensuring HTTP for localhost
 * @param {string} baseUrl - The base URL
 * @param {string} path - The path to append
 * @returns {string} - The full URL with HTTP for localhost
 */
export const buildUrl = (baseUrl, path) => {
  // Ensure the base URL doesn't end with a slash and the path doesn't start with a slash
  const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;

  // Build the full URL
  const fullUrl = `${cleanBaseUrl}${cleanPath}`;

  // Ensure HTTP for localhost
  return ensureHttpForLocalhost(fullUrl);
};

/**
 * Gets the API base URL from environment variables or fallback
 * @returns {string} - The API base URL with HTTP for localhost
 */
export const getApiBaseUrl = () => {
  // Use the deployed backend URL as default if environment variable is not set
  const apiUrl = import.meta.env.VITE_API_BASE_URL || 'https://s89-satya-capstone-tradebro.onrender.com';
  return ensureHttpForLocalhost(apiUrl);
};

export default {
  ensureHttpForLocalhost,
  buildUrl,
  getApiBaseUrl
};
