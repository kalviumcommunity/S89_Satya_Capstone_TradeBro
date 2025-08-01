/**
 * AuthGuard Component
 * Global authentication protection for the entire application
 * Ensures users cannot access protected content without authentication
 */

import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const AuthGuard = ({ children }) => {
  const { isAuthenticated, loading, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Define public routes that don't require authentication
  const publicRoutes = [
    '/',
    '/login',
    '/signup',
    '/terms',
    '/privacy'
  ];

  // Check if current route is public
  const isPublicRoute = publicRoutes.includes(location.pathname);

  useEffect(() => {
    // Don't redirect while loading
    if (loading) return;

    // If user is not authenticated and trying to access protected route
    if (!isAuthenticated && !isPublicRoute) {
      console.log('🔒 AuthGuard: Redirecting unauthenticated user to login');
      
      // Store the intended destination
      localStorage.setItem('redirectAfterLogin', location.pathname);
      
      // Redirect to login
      navigate('/login', { 
        replace: true, 
        state: { from: location.pathname } 
      });
      return;
    }

    // If user is authenticated and trying to access auth pages, redirect to dashboard
    if (isAuthenticated && (location.pathname === '/login' || location.pathname === '/signup')) {
      console.log('🏠 AuthGuard: Redirecting authenticated user to dashboard');
      
      // Check for stored redirect URL
      const redirectUrl = localStorage.getItem('redirectAfterLogin');
      if (redirectUrl && redirectUrl !== '/login' && redirectUrl !== '/signup') {
        localStorage.removeItem('redirectAfterLogin');
        navigate(redirectUrl, { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
      return;
    }

  }, [isAuthenticated, loading, location.pathname, navigate, isPublicRoute]);

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="auth-guard-loading">
        <div className="loading-container">
          <div className="loading-spinner lg"></div>
          <p className="loading-text">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  // Render children if authentication check passes
  return children;
};

export default AuthGuard;
