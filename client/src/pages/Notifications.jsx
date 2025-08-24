import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiBell,
  FiCheck,
  FiTrash2,
  FiRefreshCw,
  FiSettings,
  FiSearch,
  FiEdit3, // Using a different icon for select mode toggle
  FiX
} from 'react-icons/fi';
import PageHeader from '../components/layout/PageHeader';
import { useNotifications } from '../contexts/NotificationContext';
import NotificationItem from '../components/notifications/NotificationItem';
import './Notifications.css';

/**
 * Notifications Page
 * Displays all user notifications with filtering, sorting, and bulk actions
 */
const Notifications = ({ user, theme }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNotifications, setSelectedNotifications] = useState(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [isSelectMode, setIsSelectMode] = useState(false);

  const {
    notifications,
    unreadCount,
    loading,
    error,
    filters,
    pagination,
    connectionStatus,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    setFilters,
    loadMore
  } = useNotifications();

  // Load notifications on mount
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Handle refresh (fetch fresh data)
  const handleRefresh = useCallback(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Handle filter change
  const handleFilterChange = useCallback((filterType, value) => {
    setFilters({ [filterType]: value });
  }, [setFilters]);

  // Filter notifications based on search and filters
  const filteredNotifications = notifications.filter(notification => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (!notification.title.toLowerCase().includes(query) &&
        !notification.message.toLowerCase().includes(query)) {
        return false;
      }
    }

    if (filters.type !== 'all' && notification.type !== filters.type) {
      return false;
    }

    if (filters.read === 'read' && !notification.read) {
      return false;
    }
    if (filters.read === 'unread' && notification.read) {
      return false;
    }

    return true;
  });

  // Handle notification selection
  const handleNotificationSelect = useCallback((notificationId) => {
    const newSelected = new Set(selectedNotifications);
    if (newSelected.has(notificationId)) {
      newSelected.delete(notificationId);
    } else {
      newSelected.add(notificationId);
    }
    setSelectedNotifications(newSelected);
  }, [selectedNotifications]);

  // Handle select all
  const handleSelectAll = useCallback(() => {
    if (selectedNotifications.size === filteredNotifications.length) {
      setSelectedNotifications(new Set());
    } else {
      setSelectedNotifications(new Set(filteredNotifications.map(n => n.id || n._id)));
    }
  }, [selectedNotifications, filteredNotifications]);

  // Handle bulk actions
  const handleBulkMarkAsRead = useCallback(async () => {
    // Note: A single API call for bulk action would be more efficient
    const promises = Array.from(selectedNotifications).map(id => markAsRead(id));
    await Promise.all(promises);
    setSelectedNotifications(new Set());
    setIsSelectMode(false);
  }, [selectedNotifications, markAsRead]);

  const handleBulkDelete = useCallback(async () => {
    // Note: A single API call for bulk action would be more efficient
    const promises = Array.from(selectedNotifications).map(id => deleteNotification(id));
    await Promise.all(promises);
    setSelectedNotifications(new Set());
    setIsSelectMode(false);
  }, [selectedNotifications, deleteNotification]);

  const handleToggleSelectMode = useCallback(() => {
    setIsSelectMode(prev => !prev);
    // Clear selection when exiting select mode
    if (isSelectMode) {
      setSelectedNotifications(new Set());
    }
  }, [isSelectMode]);

  return (
    <div className="notifications-page">
      <PageHeader
        icon={FiBell}
        title="Notifications"
        subtitle={`${unreadCount} unread • ${connectionStatus === 'connected' ? 'LIVE' : 'OFFLINE'}`}
        borderColor="primary"
        showNotifications={false}
        actions={[
          {
            label: isSelectMode ? 'Cancel' : 'Select',
            icon: isSelectMode ? FiX : FiEdit3,
            onClick: handleToggleSelectMode,
            variant: isSelectMode ? 'outline-danger' : 'outline'
          },
          {
            label: "Refresh",
            icon: FiRefreshCw,
            onClick: handleRefresh,
            variant: "secondary",
            disabled: loading
          },
          {
            label: "Settings",
            icon: FiSettings,
            onClick: () => {}, // Navigate to settings page
            variant: "outline"
          }
        ]}
      />

      <div className="notifications-content">
        {/* Quick Actions (Mark All Read) */}
        <AnimatePresence>
          {unreadCount > 0 && !isSelectMode && (
            <motion.div
              className="notifications-actions"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <motion.button
                className="action-btn mark-all"
                onClick={markAllAsRead}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <FiCheck />
                Mark all read
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>


        {/* Controls: Search, Filters */}
        <div className="notifications-controls">
          <div className="search-container">
            <FiSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search notifications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>

          <button className="filter-toggle" onClick={() => setShowFilters(prev => !prev)}>
            <FiCheck />
            <span>Filters</span>
          </button>
        </div>
        
        {/* Filters Dropdown */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              className="filters-container"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <div className="filter-group">
                <label>Type:</label>
                <select
                  value={filters.type}
                  onChange={(e) => handleFilterChange('type', e.target.value)}
                >
                  <option value="all">All Types</option>
                  <option value="info">Info</option>
                  <option value="success">Success</option>
                  <option value="warning">Warning</option>
                  <option value="error">Error</option>
                  <option value="alert">Alert</option>
                </select>
              </div>

              <div className="filter-group">
                <label>Status:</label>
                <select
                  value={filters.read}
                  onChange={(e) => handleFilterChange('read', e.target.value)}
                >
                  <option value="all">All</option>
                  <option value="unread">Unread</option>
                  <option value="read">Read</option>
                </select>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bulk Actions Bar */}
        <AnimatePresence>
          {selectedNotifications.size > 0 && (
            <motion.div
              className="bulk-actions"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="bulk-info">
                <input
                  type="checkbox"
                  checked={selectedNotifications.size === filteredNotifications.length}
                  onChange={handleSelectAll}
                />
                <span>{selectedNotifications.size} selected</span>
              </div>

              <div className="bulk-buttons">
                <button onClick={handleBulkMarkAsRead}>
                  <FiCheck /> Mark as read
                </button>
                <button onClick={handleBulkDelete} className="danger">
                  <FiTrash2 /> Delete
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Notifications List */}
        <div className="notifications-list">
          {error ? (
            <div className="error-state">
              <FiBell size={48} />
              <h3>Failed to load notifications</h3>
              <p>{error}</p>
              <button onClick={handleRefresh}>Try again</button>
            </div>
          ) : filteredNotifications.length > 0 ? (
            <>
              {filteredNotifications.map((notification, index) => (
                <motion.div
                  key={notification.id || notification._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="notification-wrapper"
                >
                  <AnimatePresence mode="wait">
                    {isSelectMode && (
                      <motion.input
                        key="checkbox"
                        type="checkbox"
                        checked={selectedNotifications.has(notification.id || notification._id)}
                        onChange={() => handleNotificationSelect(notification.id || notification._id)}
                        className="notification-checkbox"
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0 }}
                      />
                    )}
                  </AnimatePresence>
                  
                  <NotificationItem
                    notification={notification}
                    onClick={() => markAsRead(notification.id || notification._id)}
                    onDelete={() => deleteNotification(notification.id || notification._id)}
                    onMarkAsRead={() => markAsRead(notification.id || notification._id)}
                    compact={false}
                    showActions={!isSelectMode}
                  />
                </motion.div>
              ))}

              {pagination.hasMore && (
                <div className="load-more-container">
                  <motion.button
                    className="load-more-btn"
                    onClick={loadMore}
                    disabled={loading}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {loading ? 'Loading...' : 'Load More'}
                  </motion.button>
                </div>
              )}
            </>
          ) : (
            <div className="empty-state">
              <FiBell size={48} />
              <h3>No notifications found</h3>
              <p>
                {searchQuery || filters.type !== 'all' || filters.read !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'You\'re all caught up! New notifications will appear here.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Notifications;