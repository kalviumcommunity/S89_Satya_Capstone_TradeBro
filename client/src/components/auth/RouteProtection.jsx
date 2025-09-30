/**
 * Route Protection Component
 * Provides comprehensive route-level authentication protection
 * Prevents unauthorized access to protected routes via direct URL navigation
 */

import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';

const RouteProtection = ({ isAuthenticated, loading, children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Define routes that require authentication
  const protectedRoutes = [
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

  // Check if current route requires authentication
  const isProtectedRoute = protectedRoutes.some(route => 
    location.pathname.startsWith(route)
  );

  useEffect(() => {
    // Skip protection check while loading
    if (loading) return;

    // If user is not authenticated and trying to access protected route
    if (!isAuthenticated && isProtectedRoute) {
      console.log('🚫 RouteProtection: Blocking access to protected route:', location.pathname);
      
      // Show warning message
      toast.warning('Please log in to access TradeBro features', {
        position: "top-center",
        autoClose: 4000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });

      // Store intended destination for redirect after login
      localStorage.setItem('redirectAfterLogin', location.pathname);
      
      // Redirect to login page
      navigate('/login', { 
        replace: true,
        state: { 
          from: location.pathname,
          message: 'Authentication required to access this page'
        }
      });
      
      return;
    }

    // If user is authenticated and on login/signup page, redirect to dashboard
    if (isAuthenticated && (location.pathname === '/login' || location.pathname === '/signup')) {
      const redirectUrl = localStorage.getItem('redirectAfterLogin');
      
      if (redirectUrl && redirectUrl !== '/login' && redirectUrl !== '/signup') {
        localStorage.removeItem('redirectAfterLogin');
        navigate(redirectUrl, { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
      
      return;
    }

  }, [isAuthenticated, loading, location.pathname, navigate, isProtectedRoute]);

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="route-protection-loading">
        <div className="loading-container">
          <div className="loading-spinner lg"></div>
          <p className="loading-text">Securing your session...</p>
        </div>
      </div>
    );
  }

  // Render children if route protection passes
  return children;
};

export default RouteProtection;
