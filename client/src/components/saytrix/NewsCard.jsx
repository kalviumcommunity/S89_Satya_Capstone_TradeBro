import React from 'react';
import { motion } from 'framer-motion';
import { FiExternalLink, FiClock } from 'react-icons/fi';

const NewsCard = ({ article, isCompact = false }) => {
  if (!article) return null;

  const {
    title,
    description,
    url,
    publishedAt,
    source,
    urlToImage
  } = article;

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return date.toLocaleDateString();
  };

  const handleClick = () => {
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <motion.div
      className={`news-card ${isCompact ? 'compact' : ''}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      onClick={handleClick}
    >
      {urlToImage && !isCompact && (
        <div className="news-image">
          <img src={urlToImage} alt={title} loading="lazy" />
        </div>
      )}
      
      <div className="news-content">
        <div className="news-header">
          <h4 className="news-title">{title}</h4>
          <button className="news-link-btn" title="Read full article">
            <FiExternalLink size={14} />
          </button>
        </div>
        
        {description && !isCompact && (
          <p className="news-description">{description}</p>
        )}
        
        <div className="news-meta">
          <div className="news-source">
            {source?.name || 'Unknown Source'}
          </div>
          <div className="news-time">
            <FiClock size={12} />
            <span>{formatDate(publishedAt)}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default NewsCard;
