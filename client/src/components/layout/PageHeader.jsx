import React from 'react';
import { motion } from 'framer-motion';
import { FiBell } from 'react-icons/fi';
import NotificationBell from '../notifications/NotificationBell';
import './PageHeader.css';

/**
 * PageHeader Component
 * Unified header component matching tradebro.netlify.app design
 */
const PageHeader = ({
  icon: Icon,
  title,
  subtitle,
  actions = [],
  borderColor = 'primary',
  showNotifications = true,
  className = ''
}) => {
  // Get border color class
  const getBorderColorClass = (color) => {
    switch (color) {
      case 'primary': return 'border-primary';
      case 'success': return 'border-success';
      case 'warning': return 'border-warning';
      case 'info': return 'border-info';
      case 'purple': return 'border-purple';
      case 'orange': return 'border-orange';
      default: return 'border-primary';
    }
  };

  return (
    <motion.div
      className={`page-header ${getBorderColorClass(borderColor)} ${className}`}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      {/* Header Content */}
      <div className="header-content">
        {/* Left Section - Icon, Title, Subtitle */}
        <div className="header-left">
          <div className="header-title-section">
            {Icon && (
              <div className="header-icon">
                <Icon size={24} />
              </div>
            )}
            <div className="header-text">
              <h1 className="header-title">{title}</h1>
              {subtitle && (
                <p className="header-subtitle">{subtitle}</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Section - Actions & Notifications */}
        <div className="header-right">
          <div className="header-actions">
            {actions.map((action, index) => (
              <motion.button
                key={index}
                className={`header-action-btn ${action.variant || 'secondary'}`}
                onClick={action.onClick}
                disabled={action.disabled}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                title={action.tooltip}
              >
                {action.icon && <action.icon size={16} />}
                <span>{action.label}</span>
              </motion.button>
            ))}
            
            {/* Notification Bell */}
            {showNotifications && (
              <div className="header-notifications">
                <NotificationBell position="bottom-right" />
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default PageHeader;
