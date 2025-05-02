import React, { useState, useEffect } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { FiSearch, FiExternalLink, FiClock, FiFilter } from "react-icons/fi";
import PageLayout from "../components/PageLayout";
import "./News.css";

const News = () => {
  const [newsItems, setNewsItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [category, setCategory] = useState("general");
  const [filteredNews, setFilteredNews] = useState([]);

  // Mock news data (replace with actual API call)
  useEffect(() => {
    const fetchNews = async () => {
      setLoading(true);
      try {
        // In a real app, replace this with an actual API call
        // const response = await axios.get(`https://api.example.com/news?category=${category}`);
        // setNewsItems(response.data);

        // Mock data for demonstration
        setTimeout(() => {
          const mockNews = [
            {
              id: 1,
              title: "Stock Market Reaches All-Time High",
              description: "Major indices hit record levels as tech stocks surge on positive earnings reports.",
              source: "Financial Times",
              url: "#",
              imageUrl: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80",
              publishedAt: "2023-10-15T14:30:00Z",
              category: "markets"
            },
            {
              id: 2,
              title: "Central Bank Announces Interest Rate Decision",
              description: "The central bank has decided to maintain current interest rates, citing stable inflation and employment figures.",
              source: "Bloomberg",
              url: "#",
              imageUrl: "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80",
              publishedAt: "2023-10-14T10:15:00Z",
              category: "economy"
            },
            {
              id: 3,
              title: "Tech Giant Announces New Product Line",
              description: "Leading technology company unveils innovative products expected to disrupt the market.",
              source: "TechCrunch",
              url: "#",
              imageUrl: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80",
              publishedAt: "2023-10-13T16:45:00Z",
              category: "technology"
            },
            {
              id: 4,
              title: "Oil Prices Fluctuate Amid Global Tensions",
              description: "Crude oil prices show volatility as geopolitical tensions rise in key producing regions.",
              source: "Reuters",
              url: "#",
              imageUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT1_79c_SHfoQyQJBX5Xg-WVqw4emcG0vwtRQ7LHDr3lxounWyzXcHHOcYZjLkc9boS9jg&usqp=CAU",
              publishedAt: "2023-10-12T09:20:00Z",
              category: "commodities"
            },
            {
              id: 5,
              title: "Major Merger Announced in Banking Sector",
              description: "Two leading banks have agreed to merge, creating one of the largest financial institutions in the region.",
              source: "Wall Street Journal",
              url: "#",
              imageUrl: "https://images.unsplash.com/photo-1501167786227-4cba60f6d58f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80",
              publishedAt: "2023-10-11T13:10:00Z",
              category: "finance"
            },
            {
              id: 6,
              title: "Cryptocurrency Market Shows Signs of Recovery",
              description: "After months of decline, major cryptocurrencies are showing positive momentum with increased trading volumes.",
              source: "CoinDesk",
              url: "#",
              imageUrl: "https://images.unsplash.com/photo-1518546305927-5a555bb7020d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1469&q=80",
              publishedAt: "2023-10-10T11:05:00Z",
              category: "crypto"
            }
          ];
          setNewsItems(mockNews);
          setFilteredNews(mockNews);
          setLoading(false);
        }, 1000);
      } catch (err) {
        setError("Failed to fetch news. Please try again later.");
        setLoading(false);
      }
    };

    fetchNews();
  }, [category]);

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
                  <img src={item.imageUrl} alt={item.title} className="news-image" />
                  <div className="news-source">{item.source}</div>
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
