import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiMail, FiLock, FiEye, FiEyeOff, FiUser, FiCheck, FiX, FiSun, FiMoon } from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import './AuthForms.css';

const LoginForm = ({ onSwitchToSignup }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [validFields, setValidFields] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login, googleLogin, loading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  // Get the intended destination or default to dashboard
  const from = location.state?.from?.pathname || '/dashboard';

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Real-time validation
    validateField(name, value);

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateField = (name, value) => {
    let isValid = false;

    switch (name) {
      case 'email':
        isValid = /\S+@\S+\.\S+/.test(value) && value.length > 0;
        break;
      case 'password':
        isValid = value.length >= 6;
        break;
      default:
        isValid = false;
    }

    setValidFields(prev => ({
      ...prev,
      [name]: isValid
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const result = await login(formData.email, formData.password);

      if (result.success) {
        navigate(from, { replace: true });
      }
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = () => {
    // For local development, show a message instead of attempting Google OAuth
    if (window.location.hostname === 'localhost') {
      alert('Google OAuth is disabled in development mode. Please use email/password login or test with production deployment.');
      return;
    }

    googleLogin();
  };

  return (
    <motion.div
      className="auth-form-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Theme Toggle */}
      <motion.button
        className="theme-toggle"
        onClick={toggleTheme}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3 }}
      >
        {theme === 'dark' ? <FiSun /> : <FiMoon />}
      </motion.button>

      <motion.div
        className="auth-form"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <div className="auth-header">
          <motion.div
            className="auth-icon"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
          >
            <FiUser />
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            Welcome Back
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            Sign in to your TradeBro account
          </motion.p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form-fields">
          <motion.div
            className="form-group"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <label htmlFor="email">Email Address</label>
            <div className="input-wrapper">
              <FiMail className="input-icon" />
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                className={
                  errors.email ? 'error' :
                  validFields.email ? 'success' : ''
                }
                disabled={loading || isSubmitting}
              />
              {validFields.email && (
                <motion.div
                  className="validation-icon success"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  style={{
                    position: 'absolute',
                    right: '3rem',
                    color: '#22c55e',
                    fontSize: '1.125rem'
                  }}
                >
                  <FiCheck />
                </motion.div>
              )}
            </div>
            {errors.email && (
              <motion.span
                className="error-message"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <FiX style={{ marginRight: '0.25rem' }} />
                {errors.email}
              </motion.span>
            )}
          </motion.div>

          <motion.div
            className="form-group"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
          >
            <label htmlFor="password">Password</label>
            <div className="input-wrapper">
              <FiLock className="input-icon" />
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                className={
                  errors.password ? 'error' :
                  validFields.password ? 'success' : ''
                }
                disabled={loading || isSubmitting}
              />
              {validFields.password && (
                <motion.div
                  className="validation-icon success"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  style={{
                    position: 'absolute',
                    right: '3.5rem',
                    color: '#22c55e',
                    fontSize: '1.125rem'
                  }}
                >
                  <FiCheck />
                </motion.div>
              )}
              <motion.button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading || isSubmitting}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                {showPassword ? <FiEyeOff /> : <FiEye />}
              </motion.button>
            </div>
            {errors.password && (
              <motion.span
                className="error-message"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <FiX style={{ marginRight: '0.25rem' }} />
                {errors.password}
              </motion.span>
            )}
          </motion.div>

          <motion.button
            type="submit"
            className="auth-submit-btn"
            disabled={loading || isSubmitting}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            {loading || isSubmitting ? (
              <div className="loading-spinner-container">
                <div className="loading-spinner"></div>
                <span>Signing In...</span>
              </div>
            ) : (
              'Sign In'
            )}
          </motion.button>
        </form>

        <motion.div
          className="auth-divider"
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ delay: 0.8 }}
        >
          <span>or</span>
        </motion.div>

        <motion.button
          type="button"
          className="google-auth-btn"
          onClick={handleGoogleLogin}
          disabled={loading || isSubmitting}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
        >
          <FcGoogle />
          Continue with Google
        </motion.button>

        <motion.div
          className="auth-footer"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.0 }}
        >
          <p>
            Don't have an account?{' '}
            <motion.button
              type="button"
              className="auth-switch-btn"
              onClick={onSwitchToSignup}
              disabled={loading || isSubmitting}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Sign up
            </motion.button>
          </p>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default LoginForm;
