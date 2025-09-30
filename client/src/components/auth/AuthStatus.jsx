import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FiUser, FiLock, FiArrowRight } from 'react-icons/fi';

const AuthStatus = ({ isAuthenticated }) => {
  if (isAuthenticated) return null;

  return (
    <motion.div
      className="card card-glass"
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        width: '320px',
        zIndex: 999,
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        boxShadow: '0 8px 20px rgba(0, 0, 0, 0.2)',
        borderRadius: '12px',
      }}
      initial={{ opacity: 0, y: 100, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 100, scale: 0.8 }}
      transition={{ duration: 0.5, type: 'spring', stiffness: 100 }}
    >
      <div className="card-header" style={{ padding: '16px' }}>
        <div className="d-flex align-center gap-md">
          <div
            style={{
              width: '40px',
              height: '40px',
              background: 'linear-gradient(135deg, #4facfe, #00f2fe)',
              borderRadius: '8px',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <FiLock size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: '1rem', marginBottom: '4px' }}>
              Sign In Required
            </h3>
            <p style={{ fontSize: '0.75rem', color: '#ccc' }}>
              Access premium features
            </p>
          </div>
        </div>
      </div>

      <div className="card-body" style={{ padding: '16px' }}>
        <p
          style={{
            fontSize: '0.875rem',
            color: '#bbb',
            marginBottom: '16px',
            lineHeight: 1.5,
          }}
        >
          Sign in to access your portfolio, trading tools, and personalized insights.
        </p>

        <div className="d-flex gap-sm">
          <Link to="/login" className="btn btn-primary btn-sm flex-1">
            <FiUser size={14} /> Sign In
          </Link>
          <Link to="/signup" className="btn btn-outline btn-sm flex-1">
            <FiArrowRight size={14} /> Sign Up
          </Link>
        </div>
      </div>
    </motion.div>
  );
};

export default AuthStatus;
