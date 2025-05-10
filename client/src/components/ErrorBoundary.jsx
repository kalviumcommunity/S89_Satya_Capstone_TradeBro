import React, { Component } from 'react';
import { FiAlertTriangle, FiRefreshCw } from 'react-icons/fi';
import { motion } from 'framer-motion';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to an error reporting service
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
    this.setState({ errorInfo });
    
    // You could also log to an error tracking service here
    // Example: logErrorToService(error, errorInfo);
  }

  handleRefresh = () => {
    // Reload the current page
    window.location.reload();
  }

  handleGoHome = () => {
    // Navigate to home page
    window.location.href = '/';
  }

  render() {
    if (this.state.hasError) {
      // Render fallback UI
      return (
        <div className="error-boundary-container">
          <motion.div 
            className="error-boundary-content"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <motion.div 
              className="error-icon"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ 
                duration: 0.5,
                repeat: Infinity,
                repeatType: "reverse",
                repeatDelay: 1
              }}
            >
              <FiAlertTriangle size={60} color="#e74c3c" />
            </motion.div>
            
            <h2>Oops! Something went wrong</h2>
            
            <p className="error-message">
              {this.state.error && this.state.error.toString()}
            </p>
            
            <div className="error-actions">
              <motion.button 
                className="refresh-button"
                onClick={this.handleRefresh}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <FiRefreshCw size={18} />
                Refresh Page
              </motion.button>
              
              <motion.button 
                className="home-button"
                onClick={this.handleGoHome}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Go to Home
              </motion.button>
            </div>
            
            {this.props.showDetails && this.state.errorInfo && (
              <details className="error-details">
                <summary>Technical Details</summary>
                <pre>{this.state.errorInfo.componentStack}</pre>
              </details>
            )}
          </motion.div>
        </div>
      );
    }

    // If there's no error, render children normally
    return this.props.children;
  }
}

export default ErrorBoundary;
