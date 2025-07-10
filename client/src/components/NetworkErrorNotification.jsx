import React, { useEffect, useState } from 'react';
import { useOfflineMode } from '../context/OfflineContext';
import { useToast } from '../context/ToastContext';
import { FiWifi, FiWifiOff } from 'react-icons/fi';
import '../styles/components/NetworkErrorNotification.css';

/**
 * Component to handle network error notifications and provide offline mode toggle
 */
const NetworkErrorNotification = () => {
  const { isOffline, setOfflineMode } = useOfflineMode();
  const [showNotification, setShowNotification] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const { success, error, info } = useToast();

  // Listen for network error events
  useEffect(() => {
    const handleNetworkError = (event) => {
      if (!isOffline) {
        setErrorMessage(event.detail?.message || 'Server connection issue detected');
        setShowNotification(true);

        // Auto-hide after 10 seconds
        setTimeout(() => {
          setShowNotification(false);
        }, 10000);
      }
    };

    // Add event listener
    window.addEventListener('app:network-error', handleNetworkError);

    // Clean up
    return () => {
      window.removeEventListener('app:network-error', handleNetworkError);
    };
  }, [isOffline]);

  // Handle enabling offline mode
  const enableOfflineMode = () => {
    setOfflineMode(true);
    setShowNotification(false);
    info('Switched to offline mode. Using cached data.');
  };

  // Handle dismissing the notification
  const dismissNotification = () => {
    setShowNotification(false);
  };

  if (!showNotification) {
    return null;
  }

  return (
    <div className="network-error-notification">
      <div className="notification-icon">
        <FiWifiOff />
      </div>
      <div className="notification-content">
        <p>{errorMessage}</p>
      </div>
      <div className="notification-actions">
        <button className="offline-button" onClick={enableOfflineMode}>
          <FiWifi /> Go Offline
        </button>
        <button className="dismiss-button" onClick={dismissNotification}>
          Dismiss
        </button>
      </div>
    </div>
  );
};

export default NetworkErrorNotification;
