import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { useToast } from './ToastContext';
import { getApiBaseUrl } from '../utils/urlUtils';

// Create the authentication context
const AuthContext = createContext();

// Custom hook to use the authentication context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Authentication provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('authToken'));
  
  const { success, error } = useToast();

  // API base URL
  const API_BASE_URL = getApiBaseUrl();

  // Check authentication status on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  // Check if user is authenticated
  const checkAuthStatus = async () => {
    const storedToken = localStorage.getItem('authToken');
    
    if (!storedToken) {
      setLoading(false);
      return;
    }

    try {
      const response = await axios.get(`${API_BASE_URL}/api/auth/verify`, {
        headers: {
          Authorization: `Bearer ${storedToken}`
        }
      });

      if (response.data.success) {
        setUser(response.data.user);
        setIsAuthenticated(true);
        setToken(storedToken);
        
        // Store user data in localStorage for quick access
        localStorage.setItem('userEmail', response.data.user.email);
        localStorage.setItem('userFullName', response.data.user.fullName);
        localStorage.setItem('userName', response.data.user.username);
        if (response.data.user.profileImage) {
          localStorage.setItem('userProfileImage', response.data.user.profileImage);
        }
      } else {
        // Token is invalid, clear it
        logout();
      }
    } catch (err) {
      console.error('Auth check failed:', err);
      // If token verification fails, clear it
      logout();
    } finally {
      setLoading(false);
    }
  };

  // Login function
  const login = async (email, password) => {
    try {
      setLoading(true);
      
      const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
        email,
        password
      });

      if (response.data.success) {
        const { token: authToken, user: userData } = response.data;
        
        // Store token and user data
        localStorage.setItem('authToken', authToken);
        localStorage.setItem('userEmail', userData.email);
        localStorage.setItem('userFullName', userData.fullName);
        localStorage.setItem('userName', userData.username);
        if (userData.profileImage) {
          localStorage.setItem('userProfileImage', userData.profileImage);
        }

        setToken(authToken);
        setUser(userData);
        setIsAuthenticated(true);
        
        success('Login successful!');
        return { success: true };
      } else {
        error(response.data.message || 'Login failed');
        return { success: false, message: response.data.message };
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Login failed. Please try again.';
      error(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Signup function
  const signup = async (userData) => {
    try {
      setLoading(true);
      
      const response = await axios.post(`${API_BASE_URL}/api/auth/signup`, userData);

      if (response.data.success) {
        const { token: authToken, user: newUser } = response.data;
        
        // Store token and user data
        localStorage.setItem('authToken', authToken);
        localStorage.setItem('userEmail', newUser.email);
        localStorage.setItem('userFullName', newUser.fullName);
        localStorage.setItem('userName', newUser.username);
        if (newUser.profileImage) {
          localStorage.setItem('userProfileImage', newUser.profileImage);
        }

        setToken(authToken);
        setUser(newUser);
        setIsAuthenticated(true);
        
        success('Account created successfully!');
        return { success: true };
      } else {
        error(response.data.message || 'Signup failed');
        return { success: false, message: response.data.message };
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Signup failed. Please try again.';
      error(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Google OAuth login
  const googleLogin = () => {
    window.location.href = `${API_BASE_URL}/api/auth/google`;
  };

  // Logout function
  const logout = () => {
    // Clear all stored data
    localStorage.removeItem('authToken');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userFullName');
    localStorage.removeItem('userName');
    localStorage.removeItem('userProfileImage');
    
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    
    success('Logged out successfully');
  };

  // Update user profile
  const updateProfile = async (updatedData) => {
    try {
      const response = await axios.put(`${API_BASE_URL}/api/auth/profile`, updatedData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.data.success) {
        const updatedUser = response.data.user;
        setUser(updatedUser);
        
        // Update localStorage
        localStorage.setItem('userEmail', updatedUser.email);
        localStorage.setItem('userFullName', updatedUser.fullName);
        localStorage.setItem('userName', updatedUser.username);
        if (updatedUser.profileImage) {
          localStorage.setItem('userProfileImage', updatedUser.profileImage);
        }
        
        success('Profile updated successfully');
        return { success: true };
      } else {
        error(response.data.message || 'Profile update failed');
        return { success: false, message: response.data.message };
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Profile update failed';
      error(errorMessage);
      return { success: false, message: errorMessage };
    }
  };

  const value = {
    user,
    isAuthenticated,
    loading,
    token,
    login,
    signup,
    googleLogin,
    logout,
    updateProfile,
    checkAuthStatus
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
