import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Loading from './common/Loading';

/**
 * ProtectedRoute component that checks if the user is authenticated
 * If not authenticated, redirects to login page
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to render if authenticated
 * @returns {React.ReactNode} - Protected route component
 */
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Check if authentication state is loaded
    if (!loading) {
      // Check if there's a token in localStorage
      const token = localStorage.getItem('authToken');

      if (token && !isAuthenticated) {
        // If token exists but not authenticated yet, give more time and try to force authentication
        console.log('Token found but not authenticated yet, waiting for auth state to update...');

        // Check URL parameters for Google login
        const urlParams = new URLSearchParams(window.location.search);
        const googleToken = urlParams.get('token');
        const success = urlParams.get('success');
        const google = urlParams.get('google');

        if (googleToken && success === 'true' && google === 'true') {
          console.log('Google login parameters detected in URL');
          // URL will be cleaned up by the Dashboard component
        }

        const timer = setTimeout(() => {
          console.log('Auth check completed after token found, isAuthenticated:', isAuthenticated);
          setIsChecking(false);
        }, 3000);
        return () => clearTimeout(timer);
      } else if (isAuthenticated) {
        // If already authenticated, no delay needed
        setIsChecking(false);
      } else {
        // No token, shorter delay
        const timer = setTimeout(() => {
          console.log('Auth check completed, no token found, isAuthenticated:', isAuthenticated);
          setIsChecking(false);
        }, 1000);
        return () => clearTimeout(timer);
      }
    }
  }, [loading, isAuthenticated]);

  // Show loading spinner while checking authentication
  if (loading || isChecking) {
    return (
      <div className="loading-container" style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        flexDirection: 'column',
        background: 'var(--background-gradient, linear-gradient(135deg, #e0f7fa, #fdfbfb))'
      }}>
        <Loading size="large" />
        <p style={{ marginTop: '1rem' }}>Verifying authentication...</p>
      </div>
    );
  }

  // If not authenticated, redirect to login page
  if (!isAuthenticated) {
    console.log('User not authenticated, redirecting to login page from:', location.pathname);
    console.log('Auth state:', { isAuthenticated, loading, isChecking });
    console.log('Auth token in localStorage:', localStorage.getItem('authToken'));

    // Add a small delay before redirecting
    setTimeout(() => {
      console.log('Redirecting to login page after delay');
    }, 500);

    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // If authenticated, render children
  return children;
};

export default ProtectedRoute;
