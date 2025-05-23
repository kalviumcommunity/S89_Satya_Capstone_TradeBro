import axios from 'axios';
import User from '../models/User';
import API_ENDPOINTS from '../../config/apiConfig';

/**
 * Repository for authentication-related API calls
 */
class AuthRepository {
  /**
   * Login with email and password
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<User>} User data
   */
  async login(email, password) {
    try {
      const response = await axios.post(API_ENDPOINTS.AUTH.LOGIN, { email, password });
      
      if (response.data && response.data.success) {
        // Store token in localStorage
        localStorage.setItem('authToken', response.data.token);
        localStorage.setItem('authTokenExpiry', response.data.expiresAt);
        localStorage.setItem('userEmail', email);
        
        return User.fromJson(response.data.user);
      } else {
        throw new Error(response.data?.message || 'Login failed');
      }
    } catch (error) {
      throw error.response?.data?.message || error.message || 'Login failed';
    }
  }

  /**
   * Login with Google
   * @param {string} token - Google token
   * @returns {Promise<User>} User data
   */
  async loginWithGoogle(token) {
    try {
      const response = await axios.post(API_ENDPOINTS.AUTH.GOOGLE, { token });
      
      if (response.data && response.data.success) {
        // Store token in localStorage
        localStorage.setItem('authToken', response.data.token);
        localStorage.setItem('authTokenExpiry', response.data.expiresAt);
        localStorage.setItem('userEmail', response.data.user.email);
        
        return User.fromJson(response.data.user);
      } else {
        throw new Error(response.data?.message || 'Google login failed');
      }
    } catch (error) {
      throw error.response?.data?.message || error.message || 'Google login failed';
    }
  }

  /**
   * Register a new user
   * @param {Object} userData - User data
   * @returns {Promise<User>} User data
   */
  async register(userData) {
    try {
      const response = await axios.post(API_ENDPOINTS.AUTH.SIGNUP, userData);
      
      if (response.data && response.data.success) {
        return User.fromJson(response.data.user);
      } else {
        throw new Error(response.data?.message || 'Registration failed');
      }
    } catch (error) {
      throw error.response?.data?.message || error.message || 'Registration failed';
    }
  }

  /**
   * Logout the current user
   */
  async logout() {
    // Clear localStorage
    localStorage.removeItem('authToken');
    localStorage.removeItem('authTokenExpiry');
    localStorage.removeItem('userEmail');
  }

  /**
   * Check if the user is authenticated
   * @returns {Promise<User|null>} User data or null if not authenticated
   */
  async checkAuth() {
    const token = localStorage.getItem('authToken');
    const tokenExpiry = localStorage.getItem('authTokenExpiry');
    
    if (!token || !tokenExpiry) {
      return null;
    }
    
    // Check if token is expired
    if (new Date(tokenExpiry) < new Date()) {
      this.logout();
      return null;
    }
    
    try {
      const response = await axios.get(API_ENDPOINTS.AUTH.CHECK, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.data && response.data.success) {
        return User.fromJson(response.data.user);
      } else {
        this.logout();
        return null;
      }
    } catch (error) {
      this.logout();
      return null;
    }
  }

  /**
   * Send a password reset email
   * @param {string} email - User email
   */
  async forgotPassword(email) {
    try {
      const response = await axios.post(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, { email });
      
      if (!response.data || !response.data.success) {
        throw new Error(response.data?.message || 'Failed to send password reset email');
      }
    } catch (error) {
      throw error.response?.data?.message || error.message || 'Failed to send password reset email';
    }
  }

  /**
   * Reset password
   * @param {string} token - Reset token
   * @param {string} password - New password
   */
  async resetPassword(token, password) {
    try {
      const response = await axios.post(API_ENDPOINTS.AUTH.RESET_PASSWORD, { token, password });
      
      if (!response.data || !response.data.success) {
        throw new Error(response.data?.message || 'Failed to reset password');
      }
    } catch (error) {
      throw error.response?.data?.message || error.message || 'Failed to reset password';
    }
  }
}

export default new AuthRepository();
