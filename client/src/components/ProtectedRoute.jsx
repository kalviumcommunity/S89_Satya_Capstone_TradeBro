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
      // Add a longer delay to ensure auth state is properly set
      const timer = setTimeout(() => {
        console.log('Auth check completed, isAuthenticated:', isAuthenticated);
        setIsChecking(false);
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [loading]);

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
