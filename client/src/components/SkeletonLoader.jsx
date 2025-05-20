import React from 'react';
import PropTypes from 'prop-types';
import '../styles/components/SkeletonLoader.css';

/**
 * SkeletonLoader component
 * 
 * Displays a skeleton loading placeholder for content
 * 
 * @param {Object} props - Component props
 * @param {string} props.type - Type of skeleton (text, card, circle, avatar, button, input, table)
 * @param {number} props.count - Number of skeleton items to display
 * @param {string} props.width - Width of the skeleton
 * @param {string} props.height - Height of the skeleton
 * @param {string} props.className - Additional CSS class
 */
const SkeletonLoader = ({ 
  type = 'text', 
  count = 1, 
  width, 
  height, 
  className = '' 
}) => {
  // Generate skeleton items
  const renderSkeletons = () => {
    const skeletons = [];
    
    for (let i = 0; i < count; i++) {
      skeletons.push(
        <div 
          key={i} 
          className={`skeleton-item skeleton-${type} ${className}`}
          style={{ 
            width: width || undefined, 
            height: height || undefined,
            ...(type === 'text' && i === count - 1 && count > 1 ? { width: '80%' } : {})
          }}
        />
      );
    }
    
    return skeletons;
  };

  // Render different skeleton types
  const renderSkeletonType = () => {
    switch (type) {
      case 'card':
        return (
          <div className={`skeleton-card ${className}`} style={{ width, height }}>
            <div className="skeleton-card-image" />
            <div className="skeleton-card-content">
              <div className="skeleton-card-title" />
              <div className="skeleton-card-text" />
              <div className="skeleton-card-text" />
              <div className="skeleton-card-text" style={{ width: '60%' }} />
            </div>
          </div>
        );
        
      case 'profile':
        return (
          <div className={`skeleton-profile ${className}`}>
            <div className="skeleton-avatar" />
            <div className="skeleton-profile-content">
              <div className="skeleton-profile-name" />
              <div className="skeleton-profile-info" />
            </div>
          </div>
        );
        
      case 'table':
        return (
          <div className={`skeleton-table ${className}`} style={{ width }}>
            <div className="skeleton-table-header">
              <div className="skeleton-table-cell" style={{ width: '20%' }} />
              <div className="skeleton-table-cell" style={{ width: '30%' }} />
              <div className="skeleton-table-cell" style={{ width: '20%' }} />
              <div className="skeleton-table-cell" style={{ width: '30%' }} />
            </div>
            {Array.from({ length: count }).map((_, index) => (
              <div key={index} className="skeleton-table-row">
                <div className="skeleton-table-cell" style={{ width: '20%' }} />
                <div className="skeleton-table-cell" style={{ width: '30%' }} />
                <div className="skeleton-table-cell" style={{ width: '20%' }} />
                <div className="skeleton-table-cell" style={{ width: '30%' }} />
              </div>
            ))}
          </div>
        );
        
      case 'news':
        return (
          <div className={`skeleton-news ${className}`} style={{ width }}>
            <div className="skeleton-news-image" />
            <div className="skeleton-news-content">
              <div className="skeleton-news-title" />
              <div className="skeleton-news-meta" />
              <div className="skeleton-news-text" />
              <div className="skeleton-news-text" />
              <div className="skeleton-news-text" style={{ width: '70%' }} />
            </div>
          </div>
        );
        
      case 'stats':
        return (
          <div className={`skeleton-stats ${className}`}>
            {Array.from({ length: count }).map((_, index) => (
              <div key={index} className="skeleton-stat-card">
                <div className="skeleton-stat-title" />
                <div className="skeleton-stat-value" />
                <div className="skeleton-stat-change" />
              </div>
            ))}
          </div>
        );
        
      default:
        return renderSkeletons();
    }
  };

  return (
    <div className="skeleton-loader">
      {renderSkeletonType()}
    </div>
  );
};

SkeletonLoader.propTypes = {
  type: PropTypes.oneOf(['text', 'card', 'circle', 'avatar', 'button', 'input', 'table', 'profile', 'news', 'stats']),
  count: PropTypes.number,
  width: PropTypes.string,
  height: PropTypes.string,
  className: PropTypes.string
};

export default SkeletonLoader;
