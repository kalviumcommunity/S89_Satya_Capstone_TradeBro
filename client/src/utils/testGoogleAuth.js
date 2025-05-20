/**
 * Test utility for Google Authentication
 * 
 * This file provides a simple way to test the Google authentication flow.
 * It logs the current environment variables and provides a function to test the Google auth URL.
 */

// Log the current environment variables
console.log('VITE_API_BASE_URL:', import.meta.env.VITE_API_BASE_URL);
console.log('VITE_GOOGLE_CLIENT_ID:', import.meta.env.VITE_GOOGLE_CLIENT_ID);

/**
 * Test the Google authentication URL
 * @returns {string} The Google authentication URL
 */
export const getGoogleAuthUrl = () => {
  const url = `${import.meta.env.VITE_API_BASE_URL}/api/auth/google`;
  console.log('Google Auth URL:', url);
  return url;
};

/**
 * Open the Google authentication URL in a new window
 */
export const openGoogleAuthWindow = () => {
  const url = getGoogleAuthUrl();
  window.open(url, '_blank', 'width=600,height=700');
};

/**
 * Test the Google authentication flow by redirecting to the Google auth URL
 */
export const testGoogleAuth = () => {
  const url = getGoogleAuthUrl();
  window.location.href = url;
};

export default {
  getGoogleAuthUrl,
  openGoogleAuthWindow,
  testGoogleAuth
};
