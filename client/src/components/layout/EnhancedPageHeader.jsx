import React from 'react';
import { motion } from 'framer-motion';
import { FiRefreshCw, FiSettings, FiMoreHorizontal } from 'react-icons/fi';
import './EnhancedPageHeader.css';

const EnhancedPageHeader = ({
  title,
  subtitle,
  icon: Icon,
  actions = [],
  showRefresh = false,
  onRefresh = () => {},
  refreshing = false,
  breadcrumbs = [],
  className = '',
  children
}) => {
  return (
    <motion.div
      className={`enhanced-page-header ${className}`}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      {/* Breadcrumbs */}
      {breadcrumbs.length > 0 && (
        <nav className="breadcrumbs" aria-label="Breadcrumb">
          <ol className="breadcrumb-list">
            {breadcrumbs.map((crumb, index) => (
              <li key={index} className="breadcrumb-item">
                {crumb.href ? (
                  <a href={crumb.href} className="breadcrumb-link">
                    {crumb.label}
                  </a>
                ) : (
                  <span className="breadcrumb-current">{crumb.label}</span>
                )}
                {index < breadcrumbs.length - 1 && (
                  <span className="breadcrumb-separator">/</span>
                )}
              </li>
            ))}
          </ol>
        </nav>
      )}

      {/* Main Header Content */}
      <div className="header-main">
        <div className="header-left">
          <div className="title-section">
            <h1 className="page-title">
              {Icon && <Icon className="title-icon" />}
              <span className="title-text">{title}</span>
            </h1>
            {subtitle && (
              <p className="page-subtitle">{subtitle}</p>
            )}
          </div>
        </div>

        <div className="header-right">
          <div className="header-actions">
            {/* Refresh Button */}
            {showRefresh && (
              <motion.button
                className="action-btn refresh-btn"
                onClick={onRefresh}
                disabled={refreshing}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                title="Refresh data"
              >
                <FiRefreshCw 
                  size={16} 
                  className={refreshing ? 'animate-spin' : ''} 
                />
                <span className="btn-text">Refresh</span>
              </motion.button>
            )}

            {/* Custom Actions */}
            {actions.map((action, index) => (
              <motion.button
                key={index}
                className={`action-btn ${action.variant || 'secondary'}`}
                onClick={action.onClick}
                disabled={action.disabled}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                title={action.title}
              >
                {action.icon && <action.icon size={16} />}
                <span className="btn-text">{action.label}</span>
              </motion.button>
            ))}

            {/* Settings/More Menu */}
            <div className="header-menu">
              <motion.button
                className="action-btn menu-btn"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                title="More options"
              >
                <FiMoreHorizontal size={16} />
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Content */}
      {children && (
        <div className="header-content">
          {children}
        </div>
      )}

      {/* Animated Border */}
      <motion.div
        className="header-border"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      />
    </motion.div>
  );
};

export default EnhancedPageHeader;
