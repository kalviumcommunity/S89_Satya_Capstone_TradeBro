import React, { useState, useEffect } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { FiSearch, FiExternalLink, FiClock, FiFilter, FiRefreshCw } from "react-icons/fi";
import PageLayout from "../components/PageLayout";
<<<<<<< HEAD
=======
import API_ENDPOINTS from "../config/apiConfig";
>>>>>>> b1a8bb87a9f2e1b3c2ce0c8518a40cf83a513f40
import "../styles/pages/News.css";

const News = () => {
  const [newsItems, setNewsItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [category, setCategory] = useState("general");
  const [filteredNews, setFilteredNews] = useState([]);

  // Function to refresh news data
  const refreshNews = () => {
    setLoading(true);
    setError(null);
    // This will trigger the useEffect to fetch news again
    setCategory(prevCategory => prevCategory);
  };

  // Fetch news data from the API
  useEffect(() => {
    const fetchNews = async () => {
      setLoading(true);
      setError(null);

      try {
        console.log(`Fetching news for category: ${category}, search: ${searchTerm || 'none'}`);

        // Use the real news API with the API key
        const response = await axios.get(
          category === 'general'
            ? API_ENDPOINTS.NEWS.GET_ALL
            : API_ENDPOINTS.NEWS.GET_BY_CATEGORY(category),
          {
            params: {
              q: searchTerm || 'stocks'
            }
          }
        );

        if (response.data && response.data.success) {
          // Check if we have data
          if (response.data.data && Array.isArray(response.data.data) && response.data.data.length > 0) {
            const newsData = response.data.data.map(article => ({
              id: article.id,
              title: article.title,
              description: article.description,
              source: article.source,
              url: article.url,
              imageUrl: article.image,
              publishedAt: article.publishedAt,
              category: article.category
            }));

            setNewsItems(newsData);
            setFilteredNews(newsData);

            // If data is from mock source, show a small notification
            if (response.data.source === 'mock' || response.data.source === 'fallback') {
              setError("Using fallback news data. Some features may be limited.");
            }
          } else {
            // No data returned
            throw new Error('No news data available');
          }
        } else {
          throw new Error(response.data?.message || 'Failed to fetch news data');
        }
      } catch (err) {
        console.error('Error fetching news:', err);
        setError("Failed to fetch news. Using local fallback data.");

        // Fallback to local mock data if API fails completely
        const mockNews = [
          {
            id: 1,
            title: "Stock Market Reaches All-Time High",
            description: "Major indices hit record levels as tech stocks surge on positive earnings reports.",
            source: "Financial Times",
            url: "#",
            imageUrl: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80",
            publishedAt: new Date(Date.now() - 3600000).toISOString(),
            category: "markets"
          },
          {
            id: 2,
            title: "Central Bank Announces Interest Rate Decision",
            description: "The central bank has decided to maintain current interest rates, citing stable inflation and employment figures.",
            source: "Bloomberg",
            url: "#",
            imageUrl: "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80",
            publishedAt: new Date(Date.now() - 7200000).toISOString(),
            category: "economy"
          },
          {
            id: 3,
            title: "Tech Giant Announces New Product Line",
            description: "Leading technology company unveils innovative products expected to disrupt the market.",
            source: "TechCrunch",
            url: "#",
            imageUrl: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80",
            publishedAt: new Date(Date.now() - 10800000).toISOString(),
            category: "technology"
          }
        ];

        // Filter mock news by category if needed
        const filteredMockNews = category !== 'general'
          ? mockNews.filter(item => item.category === category)
          : mockNews;

        setNewsItems(filteredMockNews.length > 0 ? filteredMockNews : mockNews);
        setFilteredNews(filteredMockNews.length > 0 ? filteredMockNews : mockNews);
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, [category, searchTerm]);

  // Filter news based on search term
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredNews(newsItems);
    } else {
      const filtered = newsItems.filter(
        (item) =>
          item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredNews(filtered);
    }
  }, [searchTerm, newsItems]);

  // Format date
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <PageLayout>
      <div className="news-container">
        <h1 className="news-header">Market News</h1>

        <div className="news-filters">
          <div className="search-container">
            <FiSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search news..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="category-filters">
            <FiFilter className="filter-icon" />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="category-select"
            >
              <option value="general">All Categories</option>
              <option value="markets">Markets</option>
              <option value="economy">Economy</option>
              <option value="technology">Technology</option>
              <option value="commodities">Commodities</option>
              <option value="finance">Finance</option>
              <option value="crypto">Cryptocurrency</option>
            </select>
          </div>

          <button
            className="refresh-button"
            onClick={refreshNews}
            disabled={loading}
          >
            <FiRefreshCw className={loading ? "spinning" : ""} />
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading news...</p>
          </div>
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : (
          <div className="news-grid">
            {filteredNews.map((item) => (
              <motion.div
                key={item.id}
                className="news-card"
                whileHover={{ y: -5, boxShadow: "0 10px 20px rgba(0,0,0,0.1)" }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="news-image-container">
                  <img
                    src={item.imageUrl || item.image || "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1470&q=80"}
                    alt={item.title}
                    className="news-image"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1470&q=80";
                    }}
                  />
                  <div className="news-source">{item.source || "TradeBro"}</div>
                </div>
                <div className="news-content-container">
                  <h3 className="news-title">{item.title}</h3>
                  <p className="news-description">{item.description}</p>
                  <div className="news-footer">
                    <div className="news-date">
                      <FiClock className="clock-icon" />
                      {formatDate(item.publishedAt)}
                    </div>
                    <a href={item.url} target="_blank" rel="noopener noreferrer" className="read-more">
                      Read More <FiExternalLink />
                    </a>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </PageLayout>
  );
};

export default News;
