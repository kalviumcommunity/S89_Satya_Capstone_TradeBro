import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FiMail, FiArrowRight, FiAlertCircle, FiCheckCircle } from 'react-icons/fi'
import { toast } from 'react-toastify'
import '../styles/auth.css'

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!email.trim()) {
      setError('Email is required')
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address')
      return
    }

    setLoading(true)
    setError('')

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'https://s89-satya-capstone-tradebro.onrender.com'
      const response = await fetch(`${apiUrl}/api/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setSent(true)
        toast.success('Password reset instructions sent to your email')
      } else {
        setError(data.message || 'Failed to send reset email')
        toast.error(data.message || 'Failed to send reset email')
      }
    } catch (error) {
      console.error('Forgot password error:', error)
      setError('Network error. Please try again.')
      toast.error('Network error. Please check your connection.')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="auth-page">
        <motion.div
          className="auth-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="auth-header">
            <div className="auth-logo">
              <div className="auth-logo-icon">📈</div>
              <h1 className="auth-logo-text">TradeBro</h1>
            </div>
            <div>
              <h2 className="auth-title">Check Your Email</h2>
              <p className="auth-subtitle">
                We've sent password reset instructions to {email}
              </p>
            </div>
          </div>

          <div className="success-message">
            <FiCheckCircle size={48} />
            <p>If an account with that email exists, you'll receive a password reset link shortly.</p>
          </div>

          <div className="auth-footer">
            <p>
              Remember your password?{' '}
              <Link to="/login">Back to Sign In</Link>
            </p>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="auth-page">
      <motion.div
        className="auth-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="auth-header">
          <div className="auth-logo">
            <div className="auth-logo-icon">📈</div>
            <h1 className="auth-logo-text">TradeBro</h1>
          </div>
          <div>
            <h2 className="auth-title">Forgot Password?</h2>
            <p className="auth-subtitle">
              Enter your email address and we'll send you a link to reset your password
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && (
            <div className="error-message">
              <FiAlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">
              <FiMail size={16} />
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                if (error) setError('')
              }}
              className={`form-input ${error ? 'form-input-error' : ''}`}
              placeholder="Enter your email"
              disabled={loading}
              autoComplete="email"
              required
            />
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
                Send Reset Link
                <FiArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Remember your password?{' '}
            <Link to="/login">Back to Sign In</Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}

export default ForgotPasswordPage