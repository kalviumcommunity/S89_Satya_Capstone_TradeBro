import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FiGlobe,
  FiSearch,
  FiRefreshCw,
  FiFilter,
  FiClock,
  FiTrendingUp,
  FiBookmark,
  FiShare2,
  FiExternalLink,
  FiCalendar,
  FiUser,
  FiTag,
  FiActivity
} from 'react-icons/fi';
import PageHeader from '../components/layout/PageHeader';
import WatchlistButton from '../components/trading/WatchlistButton';
import { useNewsSearch } from '../hooks/useSearch';
import SearchInput from '../components/common/SearchInput';
import '../styles/news.css';

const News = ({ user, theme }) => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [bookmarkedArticles, setBookmarkedArticles] = useState([]);

  // News search functionality
  const {
    query: searchQuery,
    setQuery: setSearchQuery,
    results: searchResults,
    recentSearches,
    showHistory,
    handleHistoryClick,
    loading: searchLoading,
    clearSearch,
    hasResults
  } = useNewsSearch({
    enableSuggestions: false,
    enableHistory: true,
    limit: 30,
    debounceMs: 500
  });

  // News categories
  const categories = [
    { id: 'all', name: 'All News', count: 45 },
    { id: 'market', name: 'Market', count: 12 },
    { id: 'stocks', name: 'Stocks', count: 8 },
    { id: 'economy', name: 'Economy', count: 10 },
    { id: 'policy', name: 'Policy', count: 6 },
    { id: 'earnings', name: 'Earnings', count: 9 }
  ];

  // Sample news articles
  const newsArticles = [
    {
      id: 1,
      title: 'Sensex Surges 500 Points as Banking Stocks Rally on RBI Policy Optimism',
      summary: 'Indian benchmark indices closed higher on Tuesday as banking and financial stocks led the rally following positive sentiment around the upcoming RBI monetary policy meeting.',
      content: 'The BSE Sensex gained 501.92 points to close at 65,953.48, while the NSE Nifty 50 advanced 145.30 points to end at 19,674.25. Banking stocks were the top performers with HDFC Bank, ICICI Bank, and Kotak Mahindra Bank leading the gains.',
      category: 'market',
      source: 'Economic Times',
      author: 'Rajesh Kumar',
      publishedAt: '2024-01-15T10:30:00Z',
      imageUrl: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400',
      readTime: '3 min read',
      tags: ['Sensex', 'Banking', 'RBI', 'Market Rally'],
      isBookmarked: false
    },
    {
      id: 2,
      title: 'Reliance Industries Reports Strong Q3 Results, Beats Estimates',
      summary: 'Reliance Industries Ltd reported better-than-expected quarterly results driven by strong performance in its retail and digital services segments.',
      content: 'The oil-to-telecom conglomerate posted a net profit of ₹18,549 crore for the quarter ended December 2023, up 8.5% year-on-year. Revenue from operations increased to ₹2.35 lakh crore.',
      category: 'earnings',
      source: 'Business Standard',
      author: 'Priya Sharma',
      publishedAt: '2024-01-15T09:15:00Z',
      imageUrl: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400',
      readTime: '4 min read',
      tags: ['Reliance', 'Earnings', 'Q3 Results'],
      isBookmarked: true
    },
    {
      id: 3,
      title: 'IT Stocks Under Pressure as US Fed Signals Hawkish Stance',
      summary: 'Indian IT stocks declined in early trade as the US Federal Reserve indicated a more aggressive approach to interest rate hikes.',
      content: 'TCS, Infosys, and Wipro were among the top losers as investors worried about the impact of higher interest rates on IT spending by US clients. The Nifty IT index fell 2.3%.',
      category: 'stocks',
      source: 'Mint',
      author: 'Amit Verma',
      publishedAt: '2024-01-15T08:45:00Z',
      imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400',
      readTime: '2 min read',
      tags: ['IT Stocks', 'Fed Policy', 'TCS', 'Infosys'],
      isBookmarked: false
    },
    {
      id: 4,
      title: 'Government Announces New PLI Scheme for Electronics Manufacturing',
      summary: 'The government unveiled a new Production Linked Incentive scheme worth ₹76,000 crore to boost electronics manufacturing in India.',
      content: 'The scheme aims to attract global electronics manufacturers and create employment opportunities. Companies like Apple, Samsung, and Foxconn are expected to benefit from this initiative.',
      category: 'policy',
      source: 'Financial Express',
      author: 'Neha Gupta',
      publishedAt: '2024-01-15T07:30:00Z',
      imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400',
      readTime: '5 min read',
      tags: ['PLI Scheme', 'Electronics', 'Manufacturing', 'Policy'],
      isBookmarked: false
    },
    {
      id: 5,
      title: 'Crude Oil Prices Rise on Middle East Tensions, OMCs in Focus',
      summary: 'Oil marketing companies gained as crude oil prices surged due to escalating tensions in the Middle East region.',
      content: 'Brent crude futures rose 2.5% to $85.40 per barrel. Indian Oil Corporation, BPCL, and HPCL were among the top gainers in the energy sector.',
      category: 'market',
      source: 'Reuters',
      author: 'Global Desk',
      publishedAt: '2024-01-15T06:00:00Z',
      imageUrl: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400',
      readTime: '3 min read',
      tags: ['Crude Oil', 'OMCs', 'Energy Sector'],
      isBookmarked: false
    },
    {
      id: 6,
      title: 'FII Inflows Continue as India Remains Attractive Investment Destination',
      summary: 'Foreign institutional investors pumped in ₹12,500 crore into Indian equities last week, showing continued confidence in the market.',
      content: 'The sustained FII inflows reflect positive sentiment towards Indian markets amid global uncertainties. Experts believe India\'s growth prospects remain strong.',
      category: 'economy',
      source: 'Moneycontrol',
      author: 'Investment Desk',
      publishedAt: '2024-01-14T16:20:00Z',
      imageUrl: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=400',
      readTime: '4 min read',
      tags: ['FII', 'Investment', 'Market Flows'],
      isBookmarked: true
    }
  ];

  const handleRefresh = async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setRefreshing(false);
  };

  const toggleBookmark = (articleId) => {
    setBookmarkedArticles(prev => 
      prev.includes(articleId) 
        ? prev.filter(id => id !== articleId)
        : [...prev, articleId]
    );
  };

  const shareArticle = (article) => {
    if (navigator.share) {
      navigator.share({
        title: article.title,
        text: article.summary,
        url: window.location.href
      });
    } else {
      // Fallback for browsers that don't support Web Share API
      navigator.clipboard.writeText(window.location.href);
    }
  };

  const formatTimeAgo = (dateString) => {
    const now = new Date();
    const publishedDate = new Date(dateString);
    const diffInHours = Math.floor((now - publishedDate) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${Math.floor(diffInHours / 24)}d ago`;
  };

  const filteredArticles = newsArticles.filter(article => {
    const matchesSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         article.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         article.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || article.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="news-page">
      {/* Page Header */}
      <PageHeader
        icon={FiGlobe}
        title="Market News"
        subtitle="Stay updated with the latest market news and analysis from trusted sources"
        borderColor="info"
        actions={[
          {
            label: "Refresh",
            icon: FiRefreshCw,
            onClick: handleRefresh,
            variant: "secondary",
            disabled: refreshing
          },
          {
            label: "Bookmarks",
            icon: FiBookmark,
            onClick: () => {},
            variant: "primary"
          }
        ]}
      />

      <div className="news-container">

        {/* News Controls */}
        <motion.div
          className="news-controls"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <div className="controls-left">
            <div className="search-container">
              <SearchInput
                placeholder="Search news articles..."
                value={searchQuery}
                onChange={setSearchQuery}
                onClear={clearSearch}
                recentSearches={recentSearches}
                onHistoryClick={handleHistoryClick}
                showHistory={showHistory}
                loading={searchLoading}
                size="md"
                showSuggestions={false}
                enableHistory={true}
                className="news-search-input"
              />
            </div>
            <div className="category-filter">
              {categories.map(category => (
                <button
                  key={category.id}
                  className={`category-btn ${selectedCategory === category.id ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(category.id)}
                >
                  {category.name}
                  <span className="category-count">{category.count}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="controls-right">
            <button className="btn-premium btn-ghost">
              <FiFilter size={16} />
              Filter
            </button>
          </div>
        </motion.div>

        {/* News Grid */}
        <motion.div
          className="news-grid"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {filteredArticles.map((article, index) => (
            <motion.article
              key={article.id}
              className="news-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
            >
              <div className="news-image">
                <img src={article.imageUrl} alt={article.title} />
                <div className="news-category">
                  <span className={`category-tag ${article.category}`}>
                    {article.category.toUpperCase()}
                  </span>
                </div>
              </div>
              
              <div className="news-content">
                <div className="news-meta">
                  <div className="meta-left">
                    <span className="news-source">
                      <FiUser size={12} />
                      {article.source}
                    </span>
                    <span className="news-time">
                      <FiClock size={12} />
                      {formatTimeAgo(article.publishedAt)}
                    </span>
                  </div>
                  <div className="meta-right">
                    <span className="read-time">{article.readTime}</span>
                  </div>
                </div>

                <h3 className="news-title">{article.title}</h3>
                <p className="news-summary">{article.summary}</p>

                <div className="news-tags">
                  {article.tags.slice(0, 3).map(tag => (
                    <span key={tag} className="news-tag">
                      <FiTag size={10} />
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="news-actions">
                  <div className="actions-left">
                    <button className="news-author">
                      By {article.author}
                    </button>
                  </div>
                  <div className="actions-right">
                    <button
                      className={`action-btn ${bookmarkedArticles.includes(article.id) || article.isBookmarked ? 'bookmarked' : ''}`}
                      onClick={() => toggleBookmark(article.id)}
                      title="Bookmark"
                    >
                      <FiBookmark size={16} />
                    </button>
                    <button
                      className="action-btn"
                      onClick={() => shareArticle(article)}
                      title="Share"
                    >
                      <FiShare2 size={16} />
                    </button>
                    <button className="action-btn" title="Read Full Article">
                      <FiExternalLink size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </motion.article>
          ))}
        </motion.div>

        {/* Load More */}
        <motion.div
          className="load-more-section"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <button className="btn-premium btn-secondary btn-lg">
            Load More Articles
          </button>
        </motion.div>
      </div>
    </div>
  );
};

export default News;
