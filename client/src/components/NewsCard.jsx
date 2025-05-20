import React from 'react';
import { motion } from 'framer-motion';
import { FiClock, FiExternalLink, FiBookmark, FiShare2 } from 'react-icons/fi';
import '../styles/components/NewsCard.css';

/**
 * NewsCard component
 * 
 * Displays a news article in a card format
 * 
 * @param {Object} props - Component props
 * @param {Object} props.article - Article data
 * @param {Function} props.onSave - Function to call when article is saved
 * @param {Function} props.onShare - Function to call when article is shared
 * @param {Function} props.onClick - Function to call when card is clicked
 */
const NewsCard = ({ article, onSave, onShare, onClick }) => {
  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) {
      return 'Just now';
    } else if (diffMin < 60) {
      return `${diffMin} min ago`;
    } else if (diffHour < 24) {
      return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
    } else if (diffDay < 7) {
      return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  // Handle save button click
  const handleSave = (e) => {
    e.stopPropagation();
    if (onSave) onSave(article);
  };

  // Handle share button click
  const handleShare = (e) => {
    e.stopPropagation();
    if (onShare) onShare(article);
  };

  // Handle card click
  const handleClick = () => {
    if (onClick) onClick(article);
  };

  return (
    <motion.div
      className="news-card"
      whileHover={{ y: -5, boxShadow: '0 10px 20px rgba(0, 0, 0, 0.1)' }}
      onClick={handleClick}
    >
      {article.image && (
        <div className="news-card-image">
          <img src={article.image} alt={article.title} loading="lazy" />
          {article.source && (
            <div className="news-card-source">{article.source}</div>
          )}
        </div>
      )}
      <div className="news-card-content">
        <h3 className="news-card-title">{article.title}</h3>
        <p className="news-card-description">{article.description}</p>
        <div className="news-card-meta">
          <div className="news-card-time">
            <FiClock /> {formatDate(article.publishedAt)}
          </div>
          <div className="news-card-actions">
            <button className="news-card-action" onClick={handleSave} aria-label="Save article">
              <FiBookmark />
            </button>
            <button className="news-card-action" onClick={handleShare} aria-label="Share article">
              <FiShare2 />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default NewsCard;
