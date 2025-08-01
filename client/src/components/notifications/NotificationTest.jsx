import React from 'react';
import { motion } from 'framer-motion';
import { FiTestTube, FiCheck, FiX, FiAlertTriangle, FiInfo, FiAlertCircle } from 'react-icons/fi';
import { useNotifications } from '../../contexts/NotificationContext';
import notificationService from '../../services/notificationService';
import { showNotificationToast } from './NotificationToast';

/**
 * NotificationTest Component
 * Test component for creating and testing notifications
 */
const NotificationTest = () => {
  const { connectionStatus } = useNotifications();

  // Test notification creation
  const createTestNotification = async (type) => {
    const notifications = {
      success: {
        type: 'success',
        title: 'Order Executed Successfully',
        message: 'Your buy order for 100 shares of RELIANCE has been executed at ₹2,450.00',
        link: '/orders'
      },
      error: {
        type: 'error',
        title: 'Order Failed',
        message: 'Insufficient funds to complete the buy order for TATASTEEL',
        link: '/portfolio'
      },
      warning: {
        type: 'warning',
        title: 'Market Volatility Alert',
        message: 'High volatility detected in NIFTY 50. Consider reviewing your positions.',
        link: '/dashboard'
      },
      info: {
        type: 'info',
        title: 'Market Update',
        message: 'NSE trading session will close in 30 minutes',
        link: '/trading'
      },
      alert: {
        type: 'alert',
        title: 'Price Alert Triggered',
        message: 'HDFC Bank has reached your target price of ₹1,600',
        link: '/watchlist'
      }
    };

    try {
      const notification = notifications[type];
      
      // Create notification via API
      await notificationService.createNotification(notification);
      
      // Also show toast for immediate feedback
      showNotificationToast(notification, document.documentElement.getAttribute('data-theme') || 'light');
      
      console.log(`✅ Created ${type} notification`);
    } catch (error) {
      console.error(`❌ Failed to create ${type} notification:`, error);
    }
  };

  // Test connection status
  const testConnection = () => {
    const status = notificationService.getConnectionStatus();
    console.log('🔗 Connection Status:', status);
    alert(`Connection Status: ${status.isConnected ? 'Connected' : 'Disconnected'}\nPusher State: ${status.pusherState}\nReconnect Attempts: ${status.reconnectAttempts}`);
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      background: 'var(--surface-primary)',
      border: '1px solid var(--border-color)',
      borderRadius: '12px',
      padding: '16px',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
      zIndex: 1000,
      minWidth: '280px'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '12px',
        fontSize: '14px',
        fontWeight: '600',
        color: 'var(--text-primary)'
      }}>
        <FiTestTube size={16} />
        Notification Test Panel
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '16px',
        fontSize: '12px',
        color: 'var(--text-secondary)'
      }}>
        <div style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          background: connectionStatus === 'connected' ? 'var(--success-color)' : 'var(--error-color)'
        }} />
        {connectionStatus === 'connected' ? 'Real-time Connected' : 'Offline Mode'}
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '8px',
        marginBottom: '12px'
      }}>
        <motion.button
          onClick={() => createTestNotification('success')}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',
            padding: '8px',
            border: '1px solid var(--success-color)',
            borderRadius: '6px',
            background: 'transparent',
            color: 'var(--success-color)',
            fontSize: '12px',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          <FiCheck size={12} />
          Success
        </motion.button>

        <motion.button
          onClick={() => createTestNotification('error')}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',
            padding: '8px',
            border: '1px solid var(--error-color)',
            borderRadius: '6px',
            background: 'transparent',
            color: 'var(--error-color)',
            fontSize: '12px',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          <FiX size={12} />
          Error
        </motion.button>

        <motion.button
          onClick={() => createTestNotification('warning')}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',
            padding: '8px',
            border: '1px solid var(--warning-color)',
            borderRadius: '6px',
            background: 'transparent',
            color: 'var(--warning-color)',
            fontSize: '12px',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          <FiAlertTriangle size={12} />
          Warning
        </motion.button>

        <motion.button
          onClick={() => createTestNotification('info')}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',
            padding: '8px',
            border: '1px solid var(--info-color)',
            borderRadius: '6px',
            background: 'transparent',
            color: 'var(--info-color)',
            fontSize: '12px',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          <FiInfo size={12} />
          Info
        </motion.button>
      </div>

      <motion.button
        onClick={() => createTestNotification('alert')}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          width: '100%',
          padding: '8px',
          border: '1px solid var(--accent-color)',
          borderRadius: '6px',
          background: 'transparent',
          color: 'var(--accent-color)',
          fontSize: '12px',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          marginBottom: '8px'
        }}
      >
        <FiAlertCircle size={12} />
        Alert
      </motion.button>

      <motion.button
        onClick={testConnection}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          width: '100%',
          padding: '8px',
          border: '1px solid var(--primary-color)',
          borderRadius: '6px',
          background: 'var(--primary-color)',
          color: 'white',
          fontSize: '12px',
          cursor: 'pointer',
          transition: 'all 0.2s ease'
        }}
      >
        Test Connection
      </motion.button>

      <div style={{
        fontSize: '10px',
        color: 'var(--text-tertiary)',
        textAlign: 'center',
        marginTop: '8px'
      }}>
        Development Mode Only
      </div>
    </div>
  );
};

export default NotificationTest;
