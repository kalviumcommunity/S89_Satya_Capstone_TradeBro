import React, { createContext, useContext, useEffect, useState } from 'react';
import Pusher from 'pusher-js';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

// Create context
const PusherContext = createContext();

// Pusher configuration
const pusherConfig = {
  appId: "1986015",
  key: "478146ed5eddba9a37cb",
  cluster: "ap2",
  useTLS: true
};

export const PusherProvider = ({ children }) => {
  const [pusher, setPusher] = useState(null);
  const [channel, setChannel] = useState(null);
  const [connectionError, setConnectionError] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const { error, info } = useToast();

  useEffect(() => {
    // Only initialize Pusher if user is authenticated and has valid data
    const userId = user?._id || user?.id;
    if (!isAuthenticated || !user || !userId) {
      console.log('Pusher: User not authenticated or user data not available', { isAuthenticated, user, userId });
      return;
    }

    try {
      // Check if pusherConfig is properly defined
      if (!pusherConfig || !pusherConfig.key) {
        console.error('Pusher configuration is missing');
        return;
      }

      // Initialize Pusher with better error handling
      const pusherClient = new Pusher(pusherConfig.key, {
          cluster: pusherConfig.cluster,
          encrypted: pusherConfig.useTLS,
          enabledTransports: ['ws', 'wss'],
          disabledTransports: ['xhr_streaming', 'xhr_polling', 'sockjs'],
          timeout: 10000,
          activityTimeout: 60000,
          pongTimeout: 10000,
          forceTLS: true,
          // Disable auto-reconnect in development to prevent multiple connections
          enableStats: false,
          enableLogging: process.env.NODE_ENV === 'development'
        });

        // Handle connection errors
        pusherClient.connection.bind('error', (err) => {
          console.error('Pusher connection error:', err);
          setConnectionError(true);
          error('Notification service connection error. Some features may not work properly.');
        });

        // Handle successful connection
        pusherClient.connection.bind('connected', () => {
          console.log('Pusher connected successfully');
          setConnectionError(false);
        });

        // Subscribe to user's channel
        const userChannel = pusherClient.subscribe(`user-${userId}`);

        // Handle subscription errors
        userChannel.bind('pusher:subscription_error', (error) => {
          console.error('Pusher subscription error:', error);
          error('Failed to subscribe to notification channel');
        });

        // Set up event listeners
        userChannel.bind('notification', (data) => {
          // Show toast notification
          info(`${data.title}: ${data.message}`);

          // Dispatch custom event for components to listen to
          window.dispatchEvent(new CustomEvent('new-notification', { detail: data }));
        });

        userChannel.bind('notification-update', (data) => {
          window.dispatchEvent(new CustomEvent('notification-update', { detail: data }));
        });

        userChannel.bind('notification-delete', (data) => {
          window.dispatchEvent(new CustomEvent('notification-delete', { detail: data }));
        });

        userChannel.bind('notifications-read-all', () => {
          window.dispatchEvent(new CustomEvent('notifications-read-all'));
        });

        // Store Pusher instance and channel
        setPusher(pusherClient);
        setChannel(userChannel);

        // Clean up on unmount
        return () => {
          if (userChannel) {
            userChannel.unbind_all();
            userChannel.unsubscribe();
          }
          if (pusherClient) {
            pusherClient.disconnect();
          }
        };
    } catch (error) {
      console.error('Error initializing Pusher:', error);
      error('Failed to initialize notification service');
      setConnectionError(true);
    }
  }, [isAuthenticated, user, error, info]);

  return (
    <PusherContext.Provider value={{ pusher, channel, connectionError }}>
      {children}
    </PusherContext.Provider>
  );
};

// Custom hook to use the Pusher context
export const usePusher = () => {
  const context = useContext(PusherContext);
  if (!context) {
    throw new Error('usePusher must be used within a PusherProvider');
  }
  return context;
};

export default PusherContext;
