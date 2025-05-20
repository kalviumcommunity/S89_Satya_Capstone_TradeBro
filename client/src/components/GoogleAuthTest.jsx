import React from 'react';
import { getGoogleAuthUrl, openGoogleAuthWindow, testGoogleAuth } from '../utils/testGoogleAuth';

/**
 * A simple component to test Google authentication
 */
const GoogleAuthTest = () => {
  return (
    <div style={{ 
      padding: '20px', 
      margin: '20px', 
      border: '1px solid #ccc', 
      borderRadius: '8px',
      backgroundColor: '#f9f9f9'
    }}>
      <h2>Google Authentication Test</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <h3>Environment Variables</h3>
        <p><strong>API Base URL:</strong> {import.meta.env.VITE_API_BASE_URL}</p>
        <p><strong>Google Client ID:</strong> {import.meta.env.VITE_GOOGLE_CLIENT_ID}</p>
      </div>
      
      <div style={{ marginBottom: '20px' }}>
        <h3>Google Auth URL</h3>
        <p>{getGoogleAuthUrl()}</p>
      </div>
      
      <div style={{ display: 'flex', gap: '10px' }}>
        <button 
          onClick={openGoogleAuthWindow}
          style={{
            padding: '10px 15px',
            backgroundColor: '#4285F4',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Open in New Window
        </button>
        
        <button 
          onClick={testGoogleAuth}
          style={{
            padding: '10px 15px',
            backgroundColor: '#34A853',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Redirect to Google Auth
        </button>
      </div>
    </div>
  );
};

export default GoogleAuthTest;
