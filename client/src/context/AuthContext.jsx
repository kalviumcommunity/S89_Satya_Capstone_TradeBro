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
      try {
        console.log('Checking authentication status...');
        const token = localStorage.getItem('authToken');
        const tokenExpiry = localStorage.getItem('authTokenExpiry');
        const userEmail = localStorage.getItem('userEmail');
        const currentPath = window.location.pathname;

        if (!token) {
          console.log('No auth token found in localStorage');
          setIsAuthenticated(false);
          setUser(null);
          setLoading(false);

          // Check if we're on a page that requires authentication
          const authRequiredPaths = ['/portfolio', '/dashboard', '/settings', '/watchlist', '/orders'];
          if (authRequiredPaths.includes(currentPath)) {
            console.warn('Authentication required for this page. Redirecting to login...');
            window.location.href = '/login';
            return;
          }

          return;
        }

        console.log('Auth token found in localStorage');

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

          console.log('Token is still valid, expires:', expiryDate.toISOString());
        }

        // Token is valid, set authentication
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        console.log('Set Authorization header with token');

        // Also set token as a cookie for servers that might expect it there
        document.cookie = `authToken=${token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
        console.log('Set auth cookie');

        setIsAuthenticated(true);

        // Redirect to portfolio if last login was within 7 days
        const lastLogin = localStorage.getItem('lastLogin');
        if (lastLogin) {
          const lastLoginDate = new Date(lastLogin);
          const now = new Date();
          const daysSinceLastLogin = Math.floor((now - lastLoginDate) / (1000 * 60 * 60 * 24));

          // Update last login time
          localStorage.setItem('lastLogin', now.toISOString());
          console.log('Updated last login time');

          // If last login was within 7 days and we're on the login page, redirect to portfolio
          if (daysSinceLastLogin < 7 && currentPath === '/login') {
            console.log('Recent login detected, redirecting to portfolio');
            window.location.href = '/portfolio';
            return;
          }
        }

        // Use user data from localStorage instead of fetching from API
        const userName = localStorage.getItem('userName');
        const userFullName = localStorage.getItem('userFullName');

        if (userEmail) {
          // Create user object from localStorage data
          const userData = {
            email: userEmail,
            username: userName || userEmail.split('@')[0],
            fullName: userFullName || userName || userEmail.split('@')[0],
            profileImage: localStorage.getItem('userProfileImage'),
            phoneNumber: localStorage.getItem('userPhoneNumber'),
            language: localStorage.getItem('userLanguage'),
            notifications: localStorage.getItem('userNotifications')
              ? JSON.parse(localStorage.getItem('userNotifications'))
              : true
          };

          setUser(userData);
          console.log('Using user data from localStorage:', userData.email);
        } else {
          console.warn('No user email found in localStorage despite having a token');

          // Try to extract user info from token
          try {
            const tokenParts = token.split('.');
            if (tokenParts.length === 3) {
              const payload = JSON.parse(atob(tokenParts[1]));
              console.log('Extracted user data from token:', payload);

              if (payload.email) {
                localStorage.setItem('userEmail', payload.email);
                console.log('Email extracted from token and stored:', payload.email);

                // Create user object from token data
                const userData = {
                  email: payload.email,
                  id: payload.id,
                  username: payload.username || payload.email.split('@')[0],
                  fullName: payload.fullName || payload.username || payload.email.split('@')[0]
                };

                setUser(userData);
                console.log('Using user data extracted from token:', userData.email);

                // Store user data in localStorage for future use
                localStorage.setItem('userName', userData.username);
                localStorage.setItem('userFullName', userData.fullName);
                if (payload.id) {
                  localStorage.setItem('userId', payload.id);
                }
              } else {
                console.error('No email found in token payload');
              }
            }
          } catch (e) {
            console.error('Error extracting user data from token:', e);
          }
        }
      } catch (error) {
        console.error('Error checking auth status:', error);
        // On error, clear auth state to be safe
        setIsAuthenticated(false);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  // Login function with remember me for 7 days
  const login = (token, userData = null, rememberMe = true) => {
    if (!token) {
      console.error('Login failed: No token provided');
      return;
    }

    try {
      // Store token in localStorage
      localStorage.setItem('authToken', token);
      console.log('Auth token stored in localStorage');

      // If remember me is enabled, store expiration date (7 days from now)
      if (rememberMe) {
        const expirationDate = new Date();
        expirationDate.setDate(expirationDate.getDate() + 7); // 7 days
        localStorage.setItem('authTokenExpiry', expirationDate.toISOString());
        console.log('Token expiry set to:', expirationDate.toISOString());
      }

      // Set axios default header
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      // Also set token as a cookie for servers that might expect it there
      document.cookie = `authToken=${token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;

      // Store last login time
      localStorage.setItem('lastLogin', new Date().toISOString());
      console.log('Last login time updated');

      // Update state
      setIsAuthenticated(true);

      if (userData) {
        setUser(userData);

        // Store user data in localStorage for sidebar and other components
        localStorage.setItem('userEmail', userData.email || '');
        localStorage.setItem('userName', userData.username || '');
        localStorage.setItem('userFullName', userData.fullName || userData.username || '');

        // Also store user ID for reference
        if (userData.id || userData._id) {
          localStorage.setItem('userId', userData.id || userData._id);
          console.log('User ID stored in localStorage:', userData.id || userData._id);
        }

        // Store additional user data if available
        if (userData.profileImage) {
          localStorage.setItem('userProfileImage', userData.profileImage);
        }

        if (userData.phoneNumber) {
          localStorage.setItem('userPhoneNumber', userData.phoneNumber);
        }

        if (userData.language) {
          localStorage.setItem('userLanguage', userData.language);
        }

        // Store notifications settings as JSON string
        if (userData.notifications !== undefined) {
          localStorage.setItem('userNotifications', JSON.stringify(userData.notifications));
        }

        // Store the entire user data as JSON for easier access
        try {
          localStorage.setItem('userData', JSON.stringify(userData));
          console.log('Full user data stored in localStorage');
        } catch (e) {
          console.error('Error storing full user data:', e);
        }

        console.log('User data stored in localStorage:', {
          email: userData.email,
          username: userData.username,
          fullName: userData.fullName || userData.username,
          id: userData.id || userData._id
        });
      } else {
        console.warn('No user data provided during login');

        // Try to extract user info from token
        try {
          const tokenParts = token.split('.');
          if (tokenParts.length === 3) {
            const payload = JSON.parse(atob(tokenParts[1]));
            console.log('Extracted user data from token:', payload);

            if (payload.email) {
              localStorage.setItem('userEmail', payload.email);
              console.log('Email extracted from token and stored:', payload.email);
            }

            if (payload.id) {
              localStorage.setItem('userId', payload.id);
              console.log('User ID extracted from token and stored:', payload.id);
            }

            if (payload.username) {
              localStorage.setItem('userName', payload.username);
              console.log('Username extracted from token and stored:', payload.username);
            }

            if (payload.fullName || payload.username) {
              localStorage.setItem('userFullName', payload.fullName || payload.username);
              console.log('Full name extracted from token and stored:', payload.fullName || payload.username);
            }

            // Set user state from token data
            setUser({
              email: payload.email,
              id: payload.id,
              username: payload.username,
              fullName: payload.fullName || payload.username
            });
          }
        } catch (e) {
          console.error('Error extracting user data from token:', e);
        }
      }

      // Store last login timestamp
      localStorage.setItem('lastLogin', new Date().toISOString());

      console.log('User logged in successfully with data stored in localStorage');

      // Verify token was stored correctly
      const storedToken = localStorage.getItem('authToken');
      if (storedToken !== token) {
        console.error('Token verification failed: Stored token does not match provided token');
      } else {
        console.log('Token verification successful');
      }

      // Verify user email was stored
      const storedEmail = localStorage.getItem('userEmail');
      if (!storedEmail) {
        console.warn('User email was not stored in localStorage');
      } else {
        console.log('User email verification successful:', storedEmail);
      }
    } catch (error) {
      console.error('Error during login process:', error);
    }
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
    console.log('Registering new user with token and data:', { token: !!token, userData: userData ? 'provided' : 'not provided' });

    // If userData is provided but missing email, try to extract from token
    if (userData && !userData.email) {
      try {
        const tokenParts = token.split('.');
        if (tokenParts.length === 3) {
          const payload = JSON.parse(atob(tokenParts[1]));
          if (payload.email) {
            userData.email = payload.email;
            console.log('Added missing email to userData from token:', payload.email);
          }
        }
      } catch (e) {
        console.error('Error extracting email from token during registration:', e);
      }
    }

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
