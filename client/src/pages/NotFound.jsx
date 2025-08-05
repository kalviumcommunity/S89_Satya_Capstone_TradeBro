import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FiHome, FiArrowLeft } from 'react-icons/fi'

const NotFound = () => {
  return (
    <div className="page">
      <div className="page-container">
        <motion.div 
          className="not-found-container"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          style={{
            textAlign: 'center',
            padding: 'var(--space-16) var(--space-4)',
            minHeight: '60vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <div style={{ fontSize: '6rem', marginBottom: 'var(--space-6)' }}>
            📈
          </div>
          
          <h1 style={{ 
            fontSize: 'var(--font-size-4xl)', 
            marginBottom: 'var(--space-4)',
            color: 'var(--text-primary)'
          }}>
            404 - Page Not Found
          </h1>
          
          <p style={{ 
            fontSize: 'var(--font-size-lg)', 
            color: 'var(--text-secondary)',
            marginBottom: 'var(--space-8)',
            maxWidth: '500px'
          }}>
            Oops! The page you're looking for doesn't exist. It might have been moved, deleted, or you entered the wrong URL.
          </p>

          <div style={{ 
            display: 'flex', 
            gap: 'var(--space-4)', 
            flexWrap: 'wrap',
            justifyContent: 'center'
          }}>
            <Link to="/" className="btn btn-primary btn-lg">
              <FiHome size={20} />
              Go Home
            </Link>
            
            <button 
              onClick={() => window.history.back()} 
              className="btn btn-secondary btn-lg"
            >
              <FiArrowLeft size={20} />
              Go Back
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default NotFound
