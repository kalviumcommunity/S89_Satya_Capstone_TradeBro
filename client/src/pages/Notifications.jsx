import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiBell,
  FiFilter,
  FiCheck,
  FiTrash2,
  FiRefreshCw,
  FiSettings,
  FiSearch,
  FiChevronDown
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

  // Filter notifications based on search and filters
  const filteredNotifications = notifications.filter(notification => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (!notification.title.toLowerCase().includes(query) && 
          !notification.message.toLowerCase().includes(query)) {
        return false;
      }
    }

    // Type filter
    if (filters.type !== 'all' && notification.type !== filters.type) {
      return false;
    }

    // Read status filter
    if (filters.read === 'read' && !notification.read) {
      return false;
    }
    if (filters.read === 'unread' && notification.read) {
      return false;
    }

    return true;
  });

  // Handle notification selection
  const handleNotificationSelect = (notificationId) => {
    const newSelected = new Set(selectedNotifications);
    if (newSelected.has(notificationId)) {
      newSelected.delete(notificationId);
    } else {
      newSelected.add(notificationId);
    }
    setSelectedNotifications(newSelected);
  };

  // Handle select all
  const handleSelectAll = () => {
    if (selectedNotifications.size === filteredNotifications.length) {
      setSelectedNotifications(new Set());
    } else {
      setSelectedNotifications(new Set(filteredNotifications.map(n => n.id)));
    }
  };

  // Handle bulk actions
  const handleBulkMarkAsRead = async () => {
    const promises = Array.from(selectedNotifications).map(id => markAsRead(id));
    await Promise.all(promises);
    setSelectedNotifications(new Set());
  };

  const handleBulkDelete = async () => {
    const promises = Array.from(selectedNotifications).map(id => deleteNotification(id));
    await Promise.all(promises);
    setSelectedNotifications(new Set());
  };

  // Handle filter change
  const handleFilterChange = (filterType, value) => {
    setFilters({ [filterType]: value });
  };

  // Handle refresh
  const handleRefresh = () => {
    fetchNotifications();
  };

  return (
    <div className="notifications-page">
      {/* Page Header */}
      <PageHeader
        icon={FiBell}
        title="Notifications"
        subtitle={`${unreadCount} unread • ${connectionStatus === 'connected' ? 'LIVE' : 'OFFLINE'}`}
        borderColor="primary"
        showNotifications={false}
        actions={[
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
            onClick: () => {},
            variant: "outline"
          }
        ]}
      />

      <div className="notifications-content">
        {/* Quick Actions */}
        <div className="notifications-actions">
          {unreadCount > 0 && (
            <motion.button
              className="action-btn mark-all"
              onClick={markAllAsRead}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <FiCheck />
              Mark all read
            </motion.button>
          )}
        </div>

        {/* Search and Filters */}
        <div className="notifications-controls">
          {/* Search */}
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

          {/* Filters */}
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
        </div>

        {/* Bulk Actions */}
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
              <h3>Failed to load notifications</h3>
              <p>{error}</p>
              <button onClick={handleRefresh}>Try again</button>
            </div>
          ) : filteredNotifications.length > 0 ? (
            <>
              {filteredNotifications.map((notification, index) => (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="notification-wrapper"
                >
                  {isSelectMode && (
                    <input
                      type="checkbox"
                      checked={selectedNotifications.has(notification.id)}
                      onChange={() => handleNotificationSelect(notification.id)}
                      className="notification-checkbox"
                    />
                  )}
                  
                  <NotificationItem
                    notification={notification}
                    onClick={() => markAsRead(notification.id)}
                    onDelete={() => deleteNotification(notification.id)}
                    onMarkAsRead={markAsRead}
                    compact={false}
                    showActions={true}
                  />
                </motion.div>
              ))}

              {/* Load More */}
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
