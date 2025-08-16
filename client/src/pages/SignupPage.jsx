import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FiUser, FiMail, FiLock, FiEye, FiEyeOff, FiArrowRight, FiAlertCircle, FiCheck } from 'react-icons/fi'
import { toast } from 'react-toastify'
import GoogleSignIn from '../components/auth/GoogleSignIn'
import '../styles/auth.css'

const SignupPage = ({ onSignup }) => {
  const navigate = useNavigate()
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false
  })

  // Redirect handling
  const redirectUrl = localStorage.getItem('redirectAfterLogin') || '/dashboard'

  const checkPasswordStrength = (password) => {
    const strength = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    }
    setPasswordStrength(strength)
    return strength
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))

    // Check password strength for password field
    if (name === 'password') {
      checkPasswordStrength(value)
    }
    
    // Clear field error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.name.trim()) {
      newErrors.name = 'Full name is required'
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters'
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters'
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password'
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }
    
    if (!acceptTerms) {
      newErrors.terms = 'You must accept the Terms of Service and Privacy Policy'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) return

    setLoading(true)
    setErrors({})

    try {
      // Generate a valid username from email (alphanumeric only)
      const emailUsername = formData.email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '');
      const timestamp = Date.now().toString().slice(-4); // Last 4 digits of timestamp
      const username = emailUsername + timestamp;

      console.log('📤 Sending signup data:', {
        username,
        email: formData.email,
        fullName: formData.name,
        passwordLength: formData.password.length
      });

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username,
          email: formData.email,
          password: formData.password,
          fullName: formData.name
        })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        onSignup(data.user, data.token)
        
        toast.success('Welcome to TradeBro! Account created successfully', {
          position: 'top-right',
          autoClose: 2000,
        })

        setTimeout(() => {
          navigate(redirectUrl, { replace: true })
          localStorage.removeItem('redirectAfterLogin')
        }, 1000)
      } else {
        console.log('❌ Signup failed:', data);

        // Handle validation errors
        if (data.errors && typeof data.errors === 'object') {
          setErrors(data.errors);
          const firstError = Object.values(data.errors)[0];
          toast.error(firstError || 'Please fix the validation errors.', {
            position: 'top-right',
            autoClose: 4000,
          });
        } else {
          setErrors({ general: data.message || 'Signup failed. Please try again.' });
          toast.error(data.message || 'Signup failed. Please try again.', {
            position: 'top-right',
            autoClose: 3000,
          });
        }
      }
    } catch (error) {
      console.error('Signup error:', error)
      setErrors({ general: 'Network error. Please try again.' })
      toast.error('Network error. Please check your connection.', {
        position: 'top-right',
        autoClose: 3000,
      })
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSuccess = (userData, token) => {
    onSignup(userData, token)
    setTimeout(() => {
      navigate(redirectUrl, { replace: true })
      localStorage.removeItem('redirectAfterLogin')
    }, 1000)
  }

  const handleGoogleError = (error) => {
    setErrors({ general: error || 'Google signup failed. Please try again.' })
    toast.error('Google signup failed. Please try again.', {
      position: 'top-right',
      autoClose: 3000,
    })
  }

  const getPasswordStrengthScore = () => {
    return Object.values(passwordStrength).filter(Boolean).length
  }

  const getPasswordStrengthText = () => {
    const score = getPasswordStrengthScore()
    if (score < 2) return 'Weak'
    if (score < 4) return 'Medium'
    return 'Strong'
  }

  const getPasswordStrengthColor = () => {
    const score = getPasswordStrengthScore()
    if (score < 2) return '#ef4444'
    if (score < 4) return '#f59e0b'
    return '#10b981'
  }

  return (
    <div className="auth-page">
      <motion.div
        className="auth-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Header */}
        <div className="auth-header">
          <div className="auth-logo">
            <div className="auth-logo-icon">📈</div>
            <h1 className="auth-logo-text">TradeBro</h1>
          </div>
          <div>
            <h2 className="auth-title">Create Account</h2>
            <p className="auth-subtitle">Join TradeBro and start your trading journey today</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="auth-form">
          {errors.general && (
            <div className="error-message">
              <FiAlertCircle size={16} />
              <span>{errors.general}</span>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">
              <FiUser size={16} />
              Full Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className={`form-input ${errors.name ? 'form-input-error' : ''}`}
              placeholder="Enter your full name"
              disabled={loading}
              autoComplete="name"
              required
            />
            {errors.name && (
              <div className="form-error">
                <FiAlertCircle size={14} />
                <span>{errors.name}</span>
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">
              <FiMail size={16} />
              Email Address
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className={`form-input ${errors.email ? 'form-input-error' : ''}`}
              placeholder="Enter your email"
              disabled={loading}
              autoComplete="email"
              required
            />
            {errors.email && (
              <div className="form-error">
                <FiAlertCircle size={14} />
                <span>{errors.email}</span>
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">
              <FiLock size={16} />
              Password
            </label>
            <div className="password-input">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className={`form-input ${errors.password ? 'form-input-error' : ''}`}
                placeholder="Create a password"
                disabled={loading}
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
              </button>
            </div>
            {errors.password && (
              <div className="form-error">
                <FiAlertCircle size={14} />
                <span>{errors.password}</span>
              </div>
            )}

            {/* Password Strength Indicator */}
            {formData.password && (
              <div className="password-strength">
                <div className="password-strength-bar">
                  <div
                    className="password-strength-fill"
                    style={{
                      width: `${(getPasswordStrengthScore() / 5) * 100}%`,
                      backgroundColor: getPasswordStrengthColor()
                    }}
                  />
                </div>
                <span
                  className="password-strength-text"
                  style={{ color: getPasswordStrengthColor() }}
                >
                  {getPasswordStrengthText()}
                </span>
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">
              <FiLock size={16} />
              Confirm Password
            </label>
            <div className="password-input">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className={`form-input ${errors.confirmPassword ? 'form-input-error' : ''}`}
                placeholder="Confirm your password"
                disabled={loading}
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={loading}
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
              </button>
            </div>
            {errors.confirmPassword && (
              <div className="form-error">
                <FiAlertCircle size={14} />
                <span>{errors.confirmPassword}</span>
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                disabled={loading}
              />
              <span>
                I agree to the{' '}
                <Link to="/terms">Terms of Service</Link>
                {' '}and{' '}
                <Link to="/privacy">Privacy Policy</Link>
              </span>
            </label>
            {errors.terms && (
              <div className="form-error">
                <FiAlertCircle size={14} />
                <span>{errors.terms}</span>
              </div>
            )}
          </div>

          <button
            type="submit"
            className="auth-submit"
            disabled={loading}
          >
            {loading ? (
              <div className="loading-spinner"></div>
            ) : (
              <>
                Create Account
                <FiArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="auth-divider">
          <span>or continue with</span>
        </div>

        {/* Google Signup */}
        <GoogleSignIn
          onSuccess={handleGoogleSuccess}
          onError={handleGoogleError}
          buttonText="Sign up with Google"
          disabled={loading}
          className="google-button"
        />

        {/* Footer */}
        <div className="auth-footer">
          <p>
            Already have an account?{' '}
            <Link to="/login">
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}

export default SignupPage
