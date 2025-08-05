import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FiMail, FiLock, FiEye, FiEyeOff, FiArrowRight, FiAlertCircle } from 'react-icons/fi'
import { toast } from 'react-toastify'
import GoogleSignIn from '../components/auth/GoogleSignIn'
import '../styles/auth.css'

const LoginPage = ({ onLogin }) => {
  const navigate = useNavigate()
  const location = useLocation()
  
  // Form state
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false)

  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [rememberMe, setRememberMe] = useState(false)

  // Redirect handling
  const from = location.state?.from?.pathname || '/dashboard'
  const redirectUrl = localStorage.getItem('redirectAfterLogin') || from

  useEffect(() => {
    // Show message if redirected from protected route
    if (location.state?.from) {
      toast.info('Please log in to access that page', {
        position: 'top-right',
        autoClose: 3000,
      })
    }
  }, [location.state])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
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
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
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
      const response = await fetch('http://localhost:5001/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        onLogin(data.user, data.token)
        
        toast.success('Welcome back! Login successful', {
          position: 'top-right',
          autoClose: 2000,
        })

        setTimeout(() => {
          navigate(redirectUrl, { replace: true })
          localStorage.removeItem('redirectAfterLogin')
        }, 1000)
      } else {
        setErrors({ general: data.message || 'Login failed. Please try again.' })
        toast.error(data.message || 'Invalid credentials. Please try again.', {
          position: 'top-right',
          autoClose: 3000,
        })
      }
    } catch (error) {
      console.error('Login error:', error)
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
    onLogin(userData, token)
    setTimeout(() => {
      navigate(redirectUrl, { replace: true })
      localStorage.removeItem('redirectAfterLogin')
    }, 1000)
  }

  const handleGoogleError = (error) => {
    setErrors({ general: error || 'Google login failed. Please try again.' })
    toast.error('Google login failed. Please try again.', {
      position: 'top-right',
      autoClose: 3000,
    })
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
            <h2 className="auth-title">Welcome Back</h2>
            <p className="auth-subtitle">Sign in to your account to continue trading</p>
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
                placeholder="Enter your password"
                disabled={loading}
                autoComplete="current-password"
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
          </div>

          <div className="form-options">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => {
                  console.log('Checkbox clicked:', e.target.checked)
                  setRememberMe(e.target.checked)
                }}
                disabled={loading}
                id="remember-me"
              />
              <span>Remember me</span>
            </label>
            <Link to="/forgot-password" className="forgot-link">
              Forgot password?
            </Link>
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
                Sign In
                <FiArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="auth-divider">
          <span>or continue with</span>
        </div>

        {/* Google Login */}
        <GoogleSignIn
          onSuccess={handleGoogleSuccess}
          onError={handleGoogleError}
          buttonText="Sign in with Google"
          disabled={loading}
          className="google-button"
        />

        {/* Footer */}
        <div className="auth-footer">
          <p>
            Don't have an account?{' '}
            <Link to="/signup">
              Sign up for free
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}

export default LoginPage
