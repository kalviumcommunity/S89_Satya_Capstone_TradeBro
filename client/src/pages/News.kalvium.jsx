import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiSearch, FiFilter, FiX, FiBookmark, FiRefreshCw } from 'react-icons/fi';
import PageLayout from '../components/PageLayout';
import NewsCard from '../components/NewsCard';
import SquaresBackground from '../components/SquaresBackground';
import { useNotification } from '../context/NotificationContext';
import axios from 'axios';
import API_ENDPOINTS from '../config/apiConfig';
import '../styles/News.css';

// Mock news data (in case API fails)
const mockNewsData = [
  {
    id: '1',
    title: 'Sensex Surges 500 Points as IT Stocks Rally',
    description: 'Indian stock markets opened on a positive note with the Sensex gaining over 500 points, led by a rally in IT stocks following strong quarterly results from major tech companies.',
    image: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80',
    source: 'Economic Times',
    publishedAt: new Date(Date.now() - 3600000).toISOString(),
    url: 'https://example.com/news/1'
  },
  {
    id: '2',
    title: 'RBI Keeps Repo Rate Unchanged at 6.5%',
    description: 'The Reserve Bank of India (RBI) has decided to keep the repo rate unchanged at 6.5% in its latest monetary policy meeting, citing concerns over inflation and economic growth.',
    image: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80',
    source: 'Business Standard',
    publishedAt: new Date(Date.now() - 7200000).toISOString(),
    url: 'https://example.com/news/2'
  },
  {
    id: '3',
    title: 'Reliance Industries Reports Record Quarterly Profit',
    description: 'Reliance Industries Limited (RIL) has reported a record quarterly profit of ₹16,203 crore for Q1 FY24, up 19% year-on-year, driven by strong performance in its retail and telecom businesses.',
    image: 'https://images.unsplash.com/photo-1444653614773-995cb1ef9efa?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1176&q=80',
    source: 'Mint',
    publishedAt: new Date(Date.now() - 10800000).toISOString(),
    url: 'https://example.com/news/3'
  },
  {
    id: '4',
    title: 'Tata Motors Launches New Electric SUV',
    description: 'Tata Motors has launched its new electric SUV, the Nexon EV Max, with a range of up to 437 km on a single charge, priced at ₹17.74 lakh (ex-showroom).',
    image: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1169&q=80',
    source: 'Auto Car India',
    publishedAt: new Date(Date.now() - 14400000).toISOString(),
    url: 'https://example.com/news/4'
  },
  {
    id: '5',
    title: 'Infosys Wins $1.5 Billion Deal with Global Financial Services Firm',
    description: 'Infosys has secured a $1.5 billion deal with a global financial services firm for digital transformation services, marking one of the largest deals for the IT major in recent years.',
    image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80',
    source: 'CNBC-TV18',
    publishedAt: new Date(Date.now() - 18000000).toISOString(),
    url: 'https://example.com/news/5'
  },
  {
    id: '6',
    title: 'Government Announces New PLI Scheme for Semiconductor Manufacturing',
    description: 'The Indian government has announced a new Production Linked Incentive (PLI) scheme worth ₹76,000 crore for semiconductor manufacturing to boost domestic production and reduce import dependency.',
    image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80',
    source: 'The Hindu',
    publishedAt: new Date(Date.now() - 21600000).toISOString(),
    url: 'https://example.com/news/6'
  }
];

const News = () => {
  const [news, setNews] = useState([]);
  const [savedNews, setSavedNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const { showSuccess, showError } = useNotification();

  // Fetch news data
  const fetchNews = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.get(API_ENDPOINTS.NEWS.GET_ALL);
      
      if (response.data && response.data.success) {
        setNews(response.data.data);
      } else {
        throw new Error(response.data?.message || 'Failed to fetch news');
      }
    } catch (error) {
      console.error('Error fetching news:', error);
      setError('Failed to fetch news. Using mock data instead.');
      // Use mock data if API fails
      setNews(mockNewsData);
    } finally {
      setLoading(false);
    }
  };

  // Fetch saved news
  const fetchSavedNews = async () => {
    try {
      const response = await axios.get(API_ENDPOINTS.NEWS.GET_SAVED, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      if (response.data && response.data.success) {
        setSavedNews(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching saved news:', error);
      // Use empty array if API fails
      setSavedNews([]);
    }
  };

  // Fetch data on mount
  useEffect(() => {
    fetchNews();
    fetchSavedNews();
  }, []);

  // Handle search
  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  // Handle filter change
  const handleFilterChange = (filter) => {
    setActiveFilter(filter);
    setShowFilters(false);
  };

  // Handle save article
  const handleSaveArticle = async (article) => {
    try {
      // Check if already saved
      if (savedNews.some(item => item.id === article.id)) {
        // Remove from saved
        await axios.delete(`${API_ENDPOINTS.NEWS.DELETE_SAVED}/${article.id}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('authToken')}`
          }
        });
        
        // Update state
        setSavedNews(prev => prev.filter(item => item.id !== article.id));
        
        // Show success message
        showSuccess('Article removed from saved items');
      } else {
        // Save article
        await axios.post(API_ENDPOINTS.NEWS.SAVE, {
          articleId: article.id
        }, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('authToken')}`
          }
        });
        
        // Update state
        setSavedNews(prev => [...prev, article]);
        
        // Show success message
        showSuccess('Article saved successfully');
      }
    } catch (error) {
      console.error('Error saving article:', error);
      showError('Failed to save article');
    }
  };

  // Handle share article
  const handleShareArticle = (article) => {
    // Check if Web Share API is supported
    if (navigator.share) {
      navigator.share({
        title: article.title,
        text: article.description,
        url: article.url
      })
        .then(() => showSuccess('Article shared successfully'))
        .catch((error) => console.error('Error sharing article:', error));
    } else {
      // Fallback: Copy URL to clipboard
      navigator.clipboard.writeText(article.url)
        .then(() => showSuccess('Article URL copied to clipboard'))
        .catch((error) => showError('Failed to copy URL'));
    }
  };

  // Handle article click
  const handleArticleClick = (article) => {
    window.open(article.url, '_blank');
  };

  // Filter and search news
  const filteredNews = news.filter(article => {
    // Filter by category
    if (activeFilter !== 'all' && activeFilter !== 'saved') {
      if (article.category !== activeFilter) {
        return false;
      }
    }
    
    // Filter saved articles
    if (activeFilter === 'saved') {
      if (!savedNews.some(item => item.id === article.id)) {
        return false;
      }
    }
    
    // Search
    if (searchQuery) {
      return (
        article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    return true;
  });

  return (
    <PageLayout>
      <div className="news-container">
        <SquaresBackground color="info" count={15} />
        
        <motion.div
          className="news-header"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1>Market News</h1>
          <div className="news-search-container">
            <FiSearch className="news-search-icon" />
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearch}
              placeholder="Search news..."
              className="news-search-input"
            />
            {searchQuery && (
              <button 
                className="news-search-clear" 
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
              >
                <FiX />
              </button>
            )}
          </div>
        </motion.div>
        
        <div className="news-filters">
          <div className="news-filter-buttons">
            <button
              className={`news-filter-button ${activeFilter === 'all' ? 'active' : ''}`}
              onClick={() => handleFilterChange('all')}
            >
              All News
            </button>
            <button
              className={`news-filter-button ${activeFilter === 'saved' ? 'active' : ''}`}
              onClick={() => handleFilterChange('saved')}
            >
              <FiBookmark /> Saved
            </button>
            <button
              className="news-filter-button mobile-only"
              onClick={() => setShowFilters(!showFilters)}
            >
              <FiFilter /> {showFilters ? 'Hide Filters' : 'More Filters'}
            </button>
            <button
              className="news-filter-button desktop-only"
              onClick={fetchNews}
            >
              <FiRefreshCw /> Refresh
            </button>
          </div>
          
          {showFilters && (
            <motion.div
              className="news-filter-dropdown"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <button
                className={`news-filter-option ${activeFilter === 'markets' ? 'active' : ''}`}
                onClick={() => handleFilterChange('markets')}
              >
                Markets
              </button>
              <button
                className={`news-filter-option ${activeFilter === 'economy' ? 'active' : ''}`}
                onClick={() => handleFilterChange('economy')}
              >
                Economy
              </button>
              <button
                className={`news-filter-option ${activeFilter === 'companies' ? 'active' : ''}`}
                onClick={() => handleFilterChange('companies')}
              >
                Companies
              </button>
              <button
                className={`news-filter-option ${activeFilter === 'technology' ? 'active' : ''}`}
                onClick={() => handleFilterChange('technology')}
              >
                Technology
              </button>
            </motion.div>
          )}
        </div>
        
        {loading ? (
          <div className="news-loading">
            <div className="news-loading-spinner"></div>
            <p>Loading news...</p>
          </div>
        ) : error ? (
          <div className="news-error">
            <p>{error}</p>
            <button className="news-retry-button" onClick={fetchNews}>
              <FiRefreshCw /> Retry
            </button>
          </div>
        ) : filteredNews.length === 0 ? (
          <div className="news-empty">
            <p>No news found</p>
            {searchQuery && (
              <p>Try a different search term or clear filters</p>
            )}
          </div>
        ) : (
          <div className="news-card-grid">
            {filteredNews.map((article, index) => (
              <NewsCard
                key={article.id}
                article={article}
                onSave={handleSaveArticle}
                onShare={handleShareArticle}
                onClick={handleArticleClick}
              />
            ))}
          </div>
        )}
      </div>
    </PageLayout>
  );
};

export default News;
