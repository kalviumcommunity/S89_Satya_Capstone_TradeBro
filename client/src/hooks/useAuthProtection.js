/**
 * Authentication Protection Hook
 * Provides comprehensive authentication protection including:
 * - Route protection
 * - Browser navigation blocking
 * - Direct URL access prevention
 * - Session validation
 */

import { useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { isProtectedRoute, setRedirectAfterLogin, clearRedirectAfterLogin } from '../utils/authEnforcement';

const useAuthProtection = (isAuthenticated, loading) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Block browser navigation to protected routes
  const blockProtectedNavigation = useCallback((event) => {
    if (!isAuthenticated && isProtectedRoute(window.location.pathname)) {
      console.log('🚫 Blocking browser navigation to protected route');
      
      // Prevent navigation
      event.preventDefault();
      event.returnValue = '';
      
      // Show warning
      toast.error('Authentication required to access this page', {
        position: "top-center",
        autoClose: 3000,
      });
      
      // Redirect to login
      setTimeout(() => {
        window.location.replace('/login');
      }, 100);
      
      return '';
    }
  }, [isAuthenticated]);

  // Monitor route changes and enforce authentication
  useEffect(() => {
    if (loading) return;

    const currentPath = location.pathname;
    
    // Check if current route requires authentication
    if (!isAuthenticated && isProtectedRoute(currentPath)) {
      console.log('🔒 Auth Protection: Blocking access to protected route:', currentPath);
      
      // Store intended destination
      setRedirectAfterLogin(currentPath);
      
      // Show authentication required message
      toast.warning('Please log in to access TradeBro', {
        position: "top-center",
        autoClose: 4000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      
      // Redirect to login
      navigate('/login', { 
        replace: true,
        state: { 
          from: currentPath,
          message: 'Authentication required'
        }
      });
      
      return;
    }

    // If authenticated and on auth pages, redirect appropriately
    if (isAuthenticated && (currentPath === '/login' || currentPath === '/signup')) {
      const redirectUrl = localStorage.getItem('redirectAfterLogin');
      
      if (redirectUrl && redirectUrl !== '/login' && redirectUrl !== '/signup') {
        clearRedirectAfterLogin();
        navigate(redirectUrl, { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    }

  }, [isAuthenticated, loading, location.pathname, navigate]);

  // Set up browser navigation blocking
  useEffect(() => {
    // Block browser back/forward navigation to protected routes
    window.addEventListener('beforeunload', blockProtectedNavigation);
    window.addEventListener('popstate', blockProtectedNavigation);
    
    return () => {
      window.removeEventListener('beforeunload', blockProtectedNavigation);
      window.removeEventListener('popstate', blockProtectedNavigation);
    };
  }, [blockProtectedNavigation]);

  // Validate session periodically
  useEffect(() => {
    if (!isAuthenticated) return;

    const validateSession = () => {
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('🔒 Session validation failed: No token found');
        toast.error('Session expired. Please log in again.');
        
        // Clear auth data and redirect
        localStorage.removeItem('user');
        window.location.replace('/login');
      }
    };

    // Validate session every 5 minutes
    const sessionInterval = setInterval(validateSession, 5 * 60 * 1000);
    
    return () => clearInterval(sessionInterval);
  }, [isAuthenticated]);

  // Return protection status
  return {
    isProtected: isProtectedRoute(location.pathname),
    canAccess: isAuthenticated || !isProtectedRoute(location.pathname)
  };
};

export default useAuthProtection;
