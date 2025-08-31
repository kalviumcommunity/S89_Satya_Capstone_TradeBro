import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiBell, FiSettings } from 'react-icons/fi';
import { useNotifications } from '../../contexts/NotificationContext';
import NotificationDropdown from './NotificationDropdown';
import './NotificationBell.css';

/**
 * NotificationBell Component
 * Displays notification bell icon with unread count badge and dropdown
 */
const NotificationBell = ({ className = '', position = 'bottom-right' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const bellRef = useRef(null);
  const dropdownRef = useRef(null);

  const {
    unreadCount,
    notifications,
    loading,
    markAllAsRead,
    connectionStatus
  } = useNotifications();

  // Close dropdown when clicking outside of the bell or dropdown itself
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        bellRef.current &&
        !bellRef.current.contains(event.target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // --- Bell Animation Logic ---
  const [isAnimating, setIsAnimating] = useState(false);
  useEffect(() => {
    if (unreadCount > 0 && !isAnimating) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 1200); // Animation duration is 0.6s
      return () => clearTimeout(timer);
    }
  }, [unreadCount, isAnimating]);

  // Handle bell click
  const handleBellClick = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  // Handle mark all as read from the dropdown
  const handleMarkAllAsRead = useCallback(async () => {
    try {
      await markAllAsRead();
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  }, [markAllAsRead]);

  // Get connection status indicator
  const getConnectionIndicator = () => {
    switch (connectionStatus) {
      case 'connected': return 'connected';
      case 'connecting': return 'connecting';
      case 'disconnected': return 'disconnected';
      default: return 'unknown';
    }
  };

  return (
    <div className={`notification-bell-container ${className}`} ref={bellRef}>
      {/* Bell Button */}
      <motion.button
        className={`notification-bell ${isAnimating ? 'animate' : ''} ${isOpen ? 'active' : ''}`}
        onClick={handleBellClick}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
      >
        {/* Bell Icon */}
        <motion.div
          className="bell-icon"
          animate={isAnimating ? {
            rotate: [0, -10, 10, -10, 10, 0],
            transition: { duration: 0.6, ease: "easeInOut", repeat: 1, repeatDelay: 0.6 }
          } : {}}
        >
          <FiBell size={20} />
        </motion.div>

        {/* Unread Count Badge */}
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.div
              className="notification-badge"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Connection Status Indicator */}
        <div className={`connection-indicator ${getConnectionIndicator()}`} />
      </motion.button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={dropdownRef}
            className={`notification-dropdown-wrapper ${position}`}
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <NotificationDropdown
              notifications={notifications}
              unreadCount={unreadCount}
              loading={loading}
              onMarkAllAsRead={handleMarkAllAsRead}
              onClose={() => setIsOpen(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationBell;