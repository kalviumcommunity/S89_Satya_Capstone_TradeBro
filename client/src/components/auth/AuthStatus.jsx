import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { FiUser, FiLock, FiArrowRight } from 'react-icons/fi'

const AuthStatus = ({ isAuthenticated, user }) => {
  if (isAuthenticated) {
    return null // Don't show anything if user is authenticated
  }

  return (
    <motion.div 
      className="card card-glass"
      style={{
        position: 'fixed',
        bottom: 'var(--space-xl)',
        right: 'var(--space-xl)',
        width: '320px',
        zIndex: 'var(--z-fixed)',
        background: 'var(--glass-bg-strong)',
        backdropFilter: 'blur(20px)',
        border: '1px solid var(--glass-border-strong)',
        boxShadow: 'var(--shadow-xl), var(--shadow-glow)'
      }}
      initial={{ opacity: 0, y: 100, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 100, scale: 0.8 }}
      transition={{ duration: 0.5, type: 'spring', stiffness: 100 }}
    >
      <div className="card-header">
        <div className="d-flex align-center gap-md">
          <div className="d-flex align-center justify-center" 
               style={{ 
                 width: '40px', 
                 height: '40px', 
                 background: 'var(--gradient-primary)', 
                 borderRadius: 'var(--radius-lg)',
                 color: 'var(--text-inverse)'
               }}>
            <FiLock size={20} />
          </div>
          <div>
            <h3 className="card-title" style={{ fontSize: '1rem', marginBottom: 'var(--space-xs)' }}>
              Sign In Required
            </h3>
            <p className="card-subtitle" style={{ fontSize: '0.75rem' }}>
              Access premium features
            </p>
          </div>
        </div>
      </div>
      
      <div className="card-body">
        <p style={{ 
          fontSize: '0.875rem', 
          color: 'var(--text-secondary)', 
          marginBottom: 'var(--space-lg)',
          lineHeight: '1.5'
        }}>
          Sign in to access your portfolio, trading tools, and personalized insights.
        </p>
        
        <div className="d-flex gap-sm">
          <Link to="/login" className="btn btn-primary btn-sm flex-1">
            <FiUser size={14} />
            Sign In
          </Link>
          <Link to="/signup" className="btn btn-outline btn-sm flex-1">
            <FiArrowRight size={14} />
            Sign Up
          </Link>
        </div>
      </div>
    </motion.div>
  )
}

export default AuthStatus
