/**
 * Authentication Enforcement Utilities
 * Provides comprehensive authentication protection across the application
 */

// Protected routes that require authentication
export const PROTECTED_ROUTES = [
  '/dashboard',
  '/portfolio',
  '/trading',
  '/charts',
  '/watchlist',
  '/orders',
  '/news',
  '/saytrix',
  '/settings',
  '/profile',
  '/terms',
  '/privacy',
  '/trade',
  '/stocks',
  '/chat',
  '/ai',
  '/app',
  '/home'
];

// Public routes accessible without authentication
export const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/signup'
];

/**
 * Check if a route requires authentication
 * @param {string} pathname - The route pathname to check
 * @returns {boolean} - True if route requires authentication
 */
export const isProtectedRoute = (pathname) => {
  return PROTECTED_ROUTES.some(route => pathname.startsWith(route));
};

/**
 * Check if a route is public (no authentication required)
 * @param {string} pathname - The route pathname to check
 * @returns {boolean} - True if route is public
 */
export const isPublicRoute = (pathname) => {
  return PUBLIC_ROUTES.includes(pathname);
};

/**
 * Get redirect URL after successful authentication
 * @returns {string|null} - Stored redirect URL or null
 */
export const getRedirectAfterLogin = () => {
  return localStorage.getItem('redirectAfterLogin');
};

/**
 * Store redirect URL for after authentication
 * @param {string} pathname - The pathname to redirect to after login
 */
export const setRedirectAfterLogin = (pathname) => {
  if (pathname && pathname !== '/login' && pathname !== '/signup') {
    localStorage.setItem('redirectAfterLogin', pathname);
  }
};

/**
 * Clear stored redirect URL
 */
export const clearRedirectAfterLogin = () => {
  localStorage.removeItem('redirectAfterLogin');
};

/**
 * Validate authentication token
 * @returns {boolean} - True if token exists and is valid format
 */
export const validateAuthToken = () => {
  const token = localStorage.getItem('token');
  if (!token) return false;
  
  try {
    // Basic token format validation
    const parts = token.split('.');
    return parts.length === 3; // JWT format check
  } catch (error) {
    console.error('Token validation error:', error);
    return false;
  }
};

/**
 * Clear all authentication data
 */
export const clearAuthData = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('redirectAfterLogin');
};

/**
 * Check if user should be redirected based on authentication status
 * @param {boolean} isAuthenticated - Current authentication status
 * @param {string} currentPath - Current route pathname
 * @returns {object} - Redirect information { shouldRedirect, redirectTo, reason }
 */
export const getRedirectInfo = (isAuthenticated, currentPath) => {
  // If not authenticated and trying to access protected route
  if (!isAuthenticated && isProtectedRoute(currentPath)) {
    return {
      shouldRedirect: true,
      redirectTo: '/login',
      reason: 'authentication_required'
    };
  }

  // If authenticated and on auth pages, redirect to dashboard or stored URL
  if (isAuthenticated && (currentPath === '/login' || currentPath === '/signup')) {
    const redirectUrl = getRedirectAfterLogin();
    return {
      shouldRedirect: true,
      redirectTo: redirectUrl || '/dashboard',
      reason: 'already_authenticated'
    };
  }

  return {
    shouldRedirect: false,
    redirectTo: null,
    reason: null
  };
};

/**
 * Authentication enforcement middleware
 * Call this function on route changes to enforce authentication
 */
export const enforceAuthentication = (isAuthenticated, currentPath, navigate, showToast = null) => {
  const redirectInfo = getRedirectInfo(isAuthenticated, currentPath);
  
  if (redirectInfo.shouldRedirect) {
    console.log(`🔒 Auth Enforcement: Redirecting from ${currentPath} to ${redirectInfo.redirectTo} (${redirectInfo.reason})`);
    
    // Store redirect URL if needed
    if (redirectInfo.reason === 'authentication_required') {
      setRedirectAfterLogin(currentPath);
      
      // Show toast notification if function provided
      if (showToast) {
        showToast.warning('Please log in to access TradeBro features', {
          position: "top-center",
          autoClose: 4000,
        });
      }
    }
    
    // Clear redirect URL if already authenticated
    if (redirectInfo.reason === 'already_authenticated') {
      clearRedirectAfterLogin();
    }
    
    // Perform redirect
    navigate(redirectInfo.redirectTo, { replace: true });
    return true; // Redirect performed
  }
  
  return false; // No redirect needed
};

export default {
  PROTECTED_ROUTES,
  PUBLIC_ROUTES,
  isProtectedRoute,
  isPublicRoute,
  getRedirectAfterLogin,
  setRedirectAfterLogin,
  clearRedirectAfterLogin,
  validateAuthToken,
  clearAuthData,
  getRedirectInfo,
  enforceAuthentication
};
