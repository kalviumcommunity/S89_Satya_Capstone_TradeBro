import React from 'react';
import './LoadingSpinner.css';

const LoadingSpinner = ({ size = 'md', message = 'Loading...', className = '' }) => {
  return (
    <div className={`loading-container ${className}`}>
      <div className={`loading-spinner ${size}`}></div>
      {message && <p className="loading-text">{message}</p>}
    </div>
  );
};

export default LoadingSpinner;
