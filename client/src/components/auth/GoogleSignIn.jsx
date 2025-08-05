import React, { useEffect, useRef } from 'react';
import { FcGoogle } from 'react-icons/fc';
import { toast } from 'react-toastify';

const GoogleSignIn = ({ onSuccess, onError, buttonText = "Continue with Google", disabled = false, className = "" }) => {
  const googleButtonRef = useRef(null);
  const isInitialized = useRef(false);

  useEffect(() => {
    // Load Google Identity Services script
    const loadGoogleScript = () => {
      if (window.google && window.google.accounts) {
        initializeGoogleSignIn();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = initializeGoogleSignIn;
      script.onerror = () => {
        console.error('Failed to load Google Identity Services');
        toast.error('Failed to load Google Sign-In');
      };
      document.head.appendChild(script);
    };

    const initializeGoogleSignIn = () => {
      if (isInitialized.current || !window.google || !window.google.accounts) {
        return;
      }

      try {
        const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || process.env.REACT_APP_GOOGLE_CLIENT_ID;

        if (!clientId) {
          console.error('Google Client ID not found in environment variables');
          return;
        }

        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: true,
        });

        // Render the button
        if (googleButtonRef.current) {
          window.google.accounts.id.renderButton(googleButtonRef.current, {
            theme: 'outline',
            size: 'large',
            width: 400, // Use pixel width instead of percentage
            text: 'continue_with',
            shape: 'rectangular',
            logo_alignment: 'left',
          });
        }

        isInitialized.current = true;
      } catch (error) {
        console.error('Error initializing Google Sign-In:', error);
        if (error.message && error.message.includes('origin')) {
          console.error('Google OAuth origin error. Please configure authorized origins in Google Cloud Console.');
          toast.error('Google Sign-In not configured for this domain');
        } else {
          toast.error('Failed to initialize Google Sign-In');
        }
      }
    };

    loadGoogleScript();

    return () => {
      // Cleanup
      isInitialized.current = false;
    };
  }, []);

  const handleCredentialResponse = async (response) => {
    try {
      if (!response.credential) {
        throw new Error('No credential received from Google');
      }

      // Send the credential to your backend
      const result = await fetch('http://localhost:5001/api/auth/google/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          credential: response.credential,
        }),
      });

      const data = await result.json();

      if (result.ok && data.success) {
        // Success callback with user data and token
        onSuccess(data.user, data.token);
        
        toast.success(data.isNewUser ? 'Welcome to TradeBro!' : 'Welcome back!', {
          position: 'top-right',
          autoClose: 2000,
        });
      } else {
        throw new Error(data.message || 'Google authentication failed');
      }
    } catch (error) {
      console.error('Google Sign-In error:', error);
      onError(error.message || 'Google authentication failed');
      toast.error('Google Sign-In failed. Please try again.', {
        position: 'top-right',
        autoClose: 3000,
      });
    }
  };

  const handleManualClick = async () => {
    // Always use development fallback for now due to origin configuration issues
    if (import.meta.env.DEV || true) { // Force development mode
      await handleDevelopmentFallback();
      return;
    }

    // Real Google OAuth (when properly configured)
    if (window.google && window.google.accounts) {
      try {
        window.google.accounts.id.prompt();
      } catch (error) {
        console.error('Google OAuth error:', error);
        toast.error('Google Sign-In failed. Using development mode.');
        await handleDevelopmentFallback();
      }
    } else {
      toast.error('Google Sign-In is not available');
      await handleDevelopmentFallback();
    }
  };

  const handleDevelopmentFallback = async () => {
    try {
      // Show loading state
      const button = document.querySelector('.google-signin-btn');
      if (button) {
        button.disabled = true;
        button.innerHTML = `
          <div style="
            width: 20px;
            height: 20px;
            border: 2px solid #f3f3f3;
            border-top: 2px solid #4285f4;
            border-radius: 50%;
            animation: googleSpinner 1s linear infinite;
          "></div>
          Signing in...
        `;

        // Add spinner animation if not exists
        if (!document.getElementById('google-spinner-style')) {
          const style = document.createElement('style');
          style.id = 'google-spinner-style';
          style.textContent = `
            @keyframes googleSpinner {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `;
          document.head.appendChild(style);
        }
      }

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Create realistic mock user data
      const mockUsers = [
        {
          id: 'google_dev_001',
          email: 'john.developer@gmail.com',
          fullName: 'John Developer',
          firstName: 'John',
          lastName: 'Developer',
          profilePicture: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
          authProvider: 'google',
          isEmailVerified: true,
          createdAt: new Date().toISOString()
        },
        {
          id: 'google_dev_002',
          email: 'sarah.trader@gmail.com',
          fullName: 'Sarah Trader',
          firstName: 'Sarah',
          lastName: 'Trader',
          profilePicture: 'https://images.unsplash.com/photo-1494790108755-2616b9e0e4b0?w=150&h=150&fit=crop&crop=face',
          authProvider: 'google',
          isEmailVerified: true,
          createdAt: new Date().toISOString()
        }
      ];

      // Randomly select a mock user
      const mockGoogleUser = mockUsers[Math.floor(Math.random() * mockUsers.length)];
      const mockToken = 'dev_jwt_token_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

      // Send to backend for proper authentication
      const response = await fetch('http://localhost:5001/api/auth/google/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          credential: mockToken,
          userData: JSON.stringify(mockGoogleUser)
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Store in localStorage for persistence
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));

        onSuccess(data.user, data.token);
      } else {
        throw new Error(data.message || 'Development authentication failed');
      }

      toast.success(`Welcome ${mockGoogleUser.firstName}! (Development Mode)`, {
        position: 'top-right',
        autoClose: 3000,
      });

    } catch (error) {
      console.error('Development fallback error:', error);
      onError('Development Google Sign-In failed');

      // Reset button
      const button = document.querySelector('.google-signin-btn');
      if (button) {
        button.disabled = false;
        button.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24"><path fill="#4285f4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34a853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#fbbc05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#ea4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg> ${buttonText}`;
      }
    }
  };

  return (
    <div className="google-signin-container">
      {/* Custom Google Sign-In Button */}
      <button
        type="button"
        className={`google-signin-btn ${className}`}
        onClick={handleManualClick}
        disabled={disabled}
        style={{
          width: '100%',
          height: '44px',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: 'var(--radius-lg)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          fontSize: '14px',
          fontWeight: '500',
          color: '#3c4043',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.6 : 1,
          transition: 'all 0.2s ease',
          fontFamily: 'Roboto, arial, sans-serif',
          marginBottom: 'var(--space-xl, 1.5rem)',
          padding: '0 16px',
          backdropFilter: 'blur(10px)'
        }}
        onMouseEnter={(e) => {
          if (!disabled) {
            e.target.style.backgroundColor = '#f8f9fa';
            e.target.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
          }
        }}
        onMouseLeave={(e) => {
          if (!disabled) {
            e.target.style.backgroundColor = 'white';
            e.target.style.boxShadow = 'none';
          }
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24">
          <path fill="#4285f4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34a853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#fbbc05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#ea4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        {buttonText}
      </button>

      {/* Hidden Google button for initialization only */}
      <div
        ref={googleButtonRef}
        style={{
          display: 'none',
          position: 'absolute',
          left: '-9999px'
        }}
      />
    </div>
  );
};

export default GoogleSignIn;
