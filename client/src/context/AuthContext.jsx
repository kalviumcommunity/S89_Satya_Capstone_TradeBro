import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

// Create the context
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if user is authenticated on initial load
  useEffect(() => {
    const checkAuthStatus = async () => {
      const token = localStorage.getItem('authToken');
      const tokenExpiry = localStorage.getItem('authTokenExpiry');
      const userEmail = localStorage.getItem('userEmail');

      if (token) {
        // Check if token has expired (if expiry date is set)
        if (tokenExpiry) {
          const expiryDate = new Date(tokenExpiry);
          const now = new Date();

          if (now > expiryDate) {
            // Token has expired, log out
            console.log('Auth token expired, logging out');
            logout();
            setLoading(false);
            return;
          }
        }

        // Token is valid, set authentication
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

        // Also set token as a cookie for servers that might expect it there
        document.cookie = `authToken=${token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;

        setIsAuthenticated(true);

        // Redirect to portfolio if last login was within 7 days
        const lastLogin = localStorage.getItem('lastLogin');
        if (lastLogin) {
          const lastLoginDate = new Date(lastLogin);
          const now = new Date();
          const daysSinceLastLogin = Math.floor((now - lastLoginDate) / (1000 * 60 * 60 * 24));

          // Update last login time
          localStorage.setItem('lastLogin', now.toISOString());

          // If last login was within 7 days and we're on the login page, redirect to portfolio
          if (daysSinceLastLogin < 7 && window.location.pathname === '/login') {
            window.location.href = '/portfolio';
          }
        }

        // Try to get user data if needed
        try {
          const response = await axios.get('http://localhost:5000/api/auth/user');
          setUser(response.data);

          // Store email for fallback
          if (response.data && response.data.email) {
            localStorage.setItem('userEmail', response.data.email);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);

          // If token is invalid, clear it
          if (error.response && (error.response.status === 401 || error.response.status === 403)) {
            logout();
          } else if (!error.response || error.response.status === 404) {
            // If server is down or endpoint not found, use fallback user data
            console.log('Using fallback user data');
            if (userEmail) {
              setUser({
                email: userEmail,
                _id: 'local-user-id',
                username: userEmail.split('@')[0]
              });
            }
          }
        }
      }
      setLoading(false);
    };

    checkAuthStatus();
  }, []);

  // Login function with remember me for 7 days
  const login = (token, userData = null, rememberMe = true) => {
    // Store token in localStorage
    localStorage.setItem('authToken', token);

    // If remember me is enabled, store expiration date (7 days from now)
    if (rememberMe) {
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + 7); // 7 days
      localStorage.setItem('authTokenExpiry', expirationDate.toISOString());
    }

    // Set axios default header
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

    // Also set token as a cookie for servers that might expect it there
    document.cookie = `authToken=${token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;

    // Update state
    setIsAuthenticated(true);
    if (userData) {
      setUser(userData);

      // Store email for fallback
      if (userData.email) {
        localStorage.setItem('userEmail', userData.email);
      }
    }

    // Store last login timestamp
    localStorage.setItem('lastLogin', new Date().toISOString());

    console.log('User logged in successfully');
  };

  // Logout function
  const logout = async () => {
    try {
      // Call the logout endpoint if needed
      await axios.get('http://localhost:5000/api/auth/logout');
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      // Clear local storage and state
      localStorage.removeItem('authToken');
      localStorage.removeItem('authTokenExpiry');
      localStorage.removeItem('lastLogin');

      // Clear the auth cookie
      document.cookie = 'authToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';

      // Clear axios headers
      delete axios.defaults.headers.common['Authorization'];

      // Update state
      setIsAuthenticated(false);
      setUser(null);

      console.log('User logged out successfully');
    }
  };

  // Register function with auto-login
  const register = (token, userData = null) => {
    // Use the login function with remember me enabled
    login(token, userData, true);
  };

  // Context value
  const value = {
    isAuthenticated,
    user,
    loading,
    login,
    logout,
    register
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
