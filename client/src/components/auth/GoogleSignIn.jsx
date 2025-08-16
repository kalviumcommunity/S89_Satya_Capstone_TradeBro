import React, { useEffect, useRef } from 'react';
import { toast } from 'react-toastify';

const GoogleSignIn = ({ onSuccess, onError }) => {
  const googleButtonRef = useRef(null);

  useEffect(() => {
    const loadGoogleScript = () => {
      if (window.google?.accounts) {
        initializeGoogle();
        return;
      }
      
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = initializeGoogle;
      script.onerror = () => console.error('Failed to load Google Sign-In');
      document.head.appendChild(script);
    };

    const initializeGoogle = () => {
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
      if (!clientId || !window.google?.accounts) {
        console.error('Google Sign-In not available');
        return;
      }

      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleGoogleResponse,
        auto_select: false,
      });

      window.google.accounts.id.renderButton(googleButtonRef.current, {
        theme: 'outline',
        size: 'large',
        text: 'continue_with',
        shape: 'rectangular'
      });
    };

    loadGoogleScript();
  }, [onSuccess, onError]);

  const handleGoogleResponse = async (response) => {
    try {
      const result = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: response.credential })
      });

      const data = await result.json();
      if (data.success) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        onSuccess(data.user, data.token);
        toast.success(`Welcome ${data.user.fullName}!`);
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error('Google auth error:', error);
      toast.error('Google Sign-In failed');
      onError?.(error.message);
    }
  };

  return <div ref={googleButtonRef} />;
};

export default GoogleSignIn;