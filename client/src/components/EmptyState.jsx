import React from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import { 
  FiInbox, 
  FiSearch, 
  FiAlertCircle, 
  FiFileText, 
  FiList, 
  FiShoppingCart, 
  FiHeart, 
  FiUsers, 
  FiBarChart2, 
  FiFilter 
} from 'react-icons/fi';
import '../styles/components/EmptyState.css';

/**
 * EmptyState component
 * 
 * Displays an empty state with icon, title, description, and action
 * 
 * @param {Object} props - Component props
 * @param {string} props.type - Type of empty state (default, search, error, filter, data, list, cart, wishlist, users, stats)
 * @param {string} props.title - Title text
 * @param {string} props.description - Description text
 * @param {React.ReactNode} props.action - Action button or link
 * @param {React.ReactNode} props.icon - Custom icon
 * @param {string} props.className - Additional CSS class
 * @param {string} props.imageUrl - URL for custom image
 */
const EmptyState = ({
  type = 'default',
  title,
  description,
  action,
  icon,
  className = '',
  imageUrl
}) => {
  // Get default title and description based on type
  const getDefaults = () => {
    switch (type) {
      case 'search':
        return {
          icon: <FiSearch />,
          title: 'No results found',
          description: 'We couldn\'t find any results matching your search. Try different keywords or filters.'
        };
      case 'error':
        return {
          icon: <FiAlertCircle />,
          title: 'Something went wrong',
          description: 'An error occurred while loading the data. Please try again later.'
        };
      case 'filter':
        return {
          icon: <FiFilter />,
          title: 'No matching results',
          description: 'No items match your current filters. Try adjusting or clearing your filters.'
        };
      case 'data':
        return {
          icon: <FiFileText />,
          title: 'No data available',
          description: 'There is no data available to display at this time.'
        };
      case 'list':
        return {
          icon: <FiList />,
          title: 'Empty list',
          description: 'This list is empty. Add items to get started.'
        };
      case 'cart':
        return {
          icon: <FiShoppingCart />,
          title: 'Your cart is empty',
          description: 'Add items to your cart to continue shopping.'
        };
      case 'wishlist':
        return {
          icon: <FiHeart />,
          title: 'Your wishlist is empty',
          description: 'Save items to your wishlist for later.'
        };
      case 'users':
        return {
          icon: <FiUsers />,
          title: 'No users found',
          description: 'There are no users to display at this time.'
        };
      case 'stats':
        return {
          icon: <FiBarChart2 />,
          title: 'No statistics available',
          description: 'There is no statistical data available to display.'
        };
      case 'default':
      default:
        return {
          icon: <FiInbox />,
          title: 'Nothing here yet',
          description: 'There\'s nothing here yet. Get started by adding some content.'
        };
    }
  };

  const defaults = getDefaults();
  
  // Use provided values or defaults
  const displayIcon = icon || defaults.icon;
  const displayTitle = title || defaults.title;
  const displayDescription = description || defaults.description;

  return (
    <motion.div 
      className={`empty-state ${type} ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {imageUrl ? (
        <div className="empty-state-image">
          <img src={imageUrl} alt={displayTitle} />
        </div>
      ) : (
        <div className="empty-state-icon">
          {displayIcon}
        </div>
      )}
      
      <h3 className="empty-state-title">{displayTitle}</h3>
      
      <p className="empty-state-description">{displayDescription}</p>
      
      {action && (
        <div className="empty-state-action">
          {action}
        </div>
      )}
    </motion.div>
  );
};

EmptyState.propTypes = {
  type: PropTypes.oneOf([
    'default', 'search', 'error', 'filter', 'data', 
    'list', 'cart', 'wishlist', 'users', 'stats'
  ]),
  title: PropTypes.string,
  description: PropTypes.string,
  action: PropTypes.node,
  icon: PropTypes.node,
  className: PropTypes.string,
  imageUrl: PropTypes.string
};

export default EmptyState;
