import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Component to handle Google OAuth callback
 * This component redirects the callback to the server
 */
const GoogleAuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Get the current URL
    const currentUrl = window.location.href;

    // Extract the path and query parameters
    const url = new URL(currentUrl);
    const pathSegments = url.pathname.split('/');
    const queryParams = url.search;

    // Check if this is a Google OAuth callback
    if (pathSegments.includes('callback') && queryParams.includes('code=')) {
      console.log('Detected Google OAuth callback, redirecting to server...');

      // Use the API base URL from environment variables
      const serverCallbackUrl = `${import.meta.env.VITE_API_BASE_URL}/api/auth/google/callback${queryParams}`;

      console.log('Redirecting to server callback URL:', serverCallbackUrl);

      // Redirect to the server callback URL
      window.location.href = serverCallbackUrl;
    } else {
      // If not a callback, redirect to login page
      navigate('/login');
    }
  }, [navigate]);

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      flexDirection: 'column',
      backgroundColor: '#f5f5f5'
    }}>
      <h2>Processing Google Authentication...</h2>
      <p>Please wait while we redirect you.</p>
      <div style={{
        width: '50px',
        height: '50px',
        border: '5px solid #f3f3f3',
        borderTop: '5px solid #55828b',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
        marginTop: '20px'
      }}></div>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default GoogleAuthCallback;
