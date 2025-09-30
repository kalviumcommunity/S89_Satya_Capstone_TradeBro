import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { FiLock, FiArrowRight, FiHome } from 'react-icons/fi'

const UnauthorizedAccess = ({ attemptedPath }) => {
  return (
    <div className="auth-page" style={{ 
      minHeight: '100vh', 
      background: 'var(--gradient-dark)', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      padding: 'var(--space-xl)'
    }}>
      <motion.div 
        className="card card-glass text-center"
        style={{ 
          width: '100%', 
          maxWidth: '500px',
          background: 'var(--glass-bg-strong)',
          backdropFilter: 'blur(30px)',
          border: '1px solid var(--glass-border-strong)',
          boxShadow: 'var(--shadow-2xl), var(--shadow-glow)'
        }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Icon */}
        <div className="d-flex align-center justify-center" 
             style={{ 
               width: '80px', 
               height: '80px', 
               background: 'var(--gradient-danger)', 
               borderRadius: 'var(--radius-full)',
               margin: '0 auto var(--space-xl)',
               color: 'var(--text-inverse)'
             }}>
          <FiLock size={40} />
        </div>

        {/* Content */}
        <div style={{ marginBottom: 'var(--space-3xl)' }}>
          <h1 style={{ 
            fontSize: '2rem', 
            fontWeight: '800', 
            color: 'var(--text-inverse)', 
            marginBottom: 'var(--space-lg)' 
          }}>
            Access Restricted
          </h1>
          <p style={{ 
            color: 'rgba(255, 255, 255, 0.8)', 
            fontSize: '1.125rem',
            marginBottom: 'var(--space-lg)',
            lineHeight: '1.6'
          }}>
            You need to be logged in to access this page.
          </p>
          {attemptedPath && (
            <p style={{ 
              color: 'rgba(255, 255, 255, 0.6)', 
              fontSize: '0.875rem',
              fontFamily: 'var(--font-family-mono)',
              background: 'rgba(255, 255, 255, 0.1)',
              padding: 'var(--space-sm) var(--space-md)',
              borderRadius: 'var(--radius-md)',
              display: 'inline-block'
            }}>
              Attempted to access: {attemptedPath}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="d-flex gap-md justify-center" style={{ marginBottom: 'var(--space-xl)' }}>
          <Link to="/login" className="btn btn-primary btn-lg">
            <FiArrowRight size={16} />
            Sign In
          </Link>
          <Link to="/signup" className="btn btn-secondary btn-lg">
            Create Account
          </Link>
        </div>

        {/* Footer */}
        <div style={{ paddingTop: 'var(--space-lg)', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <Link to="/" 
                className="d-flex align-center justify-center gap-sm"
                style={{ 
                  color: 'rgba(255, 255, 255, 0.7)', 
                  textDecoration: 'none',
                  fontSize: '0.875rem',
                  transition: 'var(--transition-normal)'
                }}>
            <FiHome size={16} />
            Back to Home
          </Link>
        </div>
      </motion.div>
    </div>
  )
}

export default UnauthorizedAccess
