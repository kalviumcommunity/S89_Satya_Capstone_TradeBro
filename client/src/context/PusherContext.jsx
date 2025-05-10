import React, { createContext, useContext, useEffect, useState } from 'react';
import Pusher from 'pusher-js';
import { useAuth } from './AuthContext';
import { useToast } from '../hooks/useToast';

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
  const toast = useToast();

  useEffect(() => {
    // Only initialize Pusher if user is authenticated
    if (isAuthenticated && user && user._id) {
      try {
        // Initialize Pusher with better error handling
        const pusherClient = new Pusher(pusherConfig.key, {
          cluster: pusherConfig.cluster,
          encrypted: pusherConfig.useTLS,
          enabledTransports: ['ws', 'wss'], // Only use WebSocket, not HTTP fallbacks
          disabledTransports: ['xhr_streaming', 'xhr_polling', 'sockjs'],
          timeout: 10000 // Increase connection timeout to 10 seconds
        });

        // Handle connection errors
        pusherClient.connection.bind('error', (err) => {
          console.error('Pusher connection error:', err);
          setConnectionError(true);
          toast.error('Notification service connection error. Some features may not work properly.', 5000);
        });

        // Handle successful connection
        pusherClient.connection.bind('connected', () => {
          console.log('Pusher connected successfully');
          setConnectionError(false);
        });

        // Subscribe to user's channel
        const userChannel = pusherClient.subscribe(`user-${user._id}`);

        // Handle subscription errors
        userChannel.bind('pusher:subscription_error', (error) => {
          console.error('Pusher subscription error:', error);
          toast.error('Failed to subscribe to notification channel', 5000);
        });

        // Set up event listeners
        userChannel.bind('notification', (data) => {
          // Show toast notification
          toast.info(`${data.title}: ${data.message}`, 5000);

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
        toast.error('Failed to initialize notification service', 5000);
        setConnectionError(true);
      }
    }
  }, [isAuthenticated, user, toast]);

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
