/**
 * Security Layer Component
 * Provides additional security measures for the application
 * - Prevents unauthorized access through developer tools
 * - Monitors for suspicious activity
 * - Enforces authentication at the component level
 */

import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { isProtectedRoute } from '../../utils/authEnforcement';

const SecurityLayer = ({ isAuthenticated, children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Security check: Prevent access to protected routes without authentication
    if (!isAuthenticated && isProtectedRoute(location.pathname)) {
      console.log('🔒 Security Layer: Unauthorized access attempt blocked');
      
      // Clear any potentially cached data
      sessionStorage.clear();
      
      // Show security warning
      toast.error('Unauthorized access detected. Please log in.', {
        position: "top-center",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      
      // Force redirect to login
      setTimeout(() => {
        window.location.href = '/login';
      }, 1000);
      
      return;
    }

    // Monitor for developer tools usage (basic detection)
    const detectDevTools = () => {
      const threshold = 160;
      if (window.outerHeight - window.innerHeight > threshold || 
          window.outerWidth - window.innerWidth > threshold) {
        console.log('🔍 Developer tools detected');
        
        // Only show warning for protected routes
        if (isProtectedRoute(location.pathname)) {
          toast.warning('Developer tools detected. Please use TradeBro responsibly.', {
            position: "top-right",
            autoClose: 3000,
          });
        }
      }
    };

    // Check for developer tools periodically
    const devToolsInterval = setInterval(detectDevTools, 5000);

    return () => {
      clearInterval(devToolsInterval);
    };
  }, [isAuthenticated, location.pathname, navigate]);

  // Additional security: Check for authentication token tampering
  useEffect(() => {
    if (isAuthenticated) {
      const token = localStorage.getItem('token');
      const user = localStorage.getItem('user');
      
      if (!token || !user) {
        console.log('🚨 Security Alert: Authentication data tampering detected');
        
        toast.error('Security violation detected. Please log in again.', {
          position: "top-center",
          autoClose: 5000,
        });
        
        // Clear all auth data and redirect
        localStorage.clear();
        sessionStorage.clear();
        window.location.href = '/login';
      }
    }
  }, [isAuthenticated, location.pathname]);

  // Render children if security checks pass
  return children;
};

export default SecurityLayer;
