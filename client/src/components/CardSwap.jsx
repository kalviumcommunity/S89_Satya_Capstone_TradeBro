import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiTrendingUp,
  FiTrendingDown,
  FiBarChart2,
  FiPieChart,
  FiActivity,
  FiDollarSign,
  FiTarget,
  FiZap,
  FiShield,
  FiAward,
  FiUsers,
  FiGlobe
} from 'react-icons/fi';
import '../styles/card-swap.css';

const CardSwap = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Trading feature cards data
  const cards = [
    {
      id: 1,
      icon: FiTrendingUp,
      title: 'Real-Time Trading',
      subtitle: 'Live Market Data',
      description: 'Execute trades with real-time NSE & BSE data. Get instant market updates and price movements.',
      stats: { value: '₹2.5L+', label: 'Daily Volume' },
      gradient: 'linear-gradient(135deg, #10B981 0%, #14F195 100%)',
      bgColor: '#ECFDF5',
      iconColor: '#10B981'
    },
    {
      id: 2,
      icon: FiBarChart2,
      title: 'Advanced Charts',
      subtitle: 'Technical Analysis',
      description: 'Professional-grade charting tools with 50+ technical indicators and drawing tools.',
      stats: { value: '50+', label: 'Indicators' },
      gradient: 'linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%)',
      bgColor: '#DBEAFE',
      iconColor: '#3B82F6'
    },
    {
      id: 3,
      icon: FiPieChart,
      title: 'Portfolio Analytics',
      subtitle: 'Smart Insights',
      description: 'AI-powered portfolio analysis with risk assessment and performance optimization.',
      stats: { value: '99.2%', label: 'Accuracy' },
      gradient: 'linear-gradient(135deg, #8B5CF6 0%, #A78BFA 100%)',
      bgColor: '#F3E8FF',
      iconColor: '#8B5CF6'
    },
    {
      id: 4,
      icon: FiZap,
      title: 'Saytrix AI',
      subtitle: 'Voice Assistant',
      description: 'Revolutionary voice-powered trading assistant with natural language processing.',
      stats: { value: '24/7', label: 'Available' },
      gradient: 'linear-gradient(135deg, #F59E0B 0%, #FCD34D 100%)',
      bgColor: '#FEF3C7',
      iconColor: '#F59E0B'
    },
    {
      id: 5,
      icon: FiShield,
      title: 'Secure Trading',
      subtitle: 'Bank-Grade Security',
      description: 'Military-grade encryption and multi-factor authentication for complete security.',
      stats: { value: '256-bit', label: 'Encryption' },
      gradient: 'linear-gradient(135deg, #EF4444 0%, #F87171 100%)',
      bgColor: '#FEF2F2',
      iconColor: '#EF4444'
    },
    {
      id: 6,
      icon: FiUsers,
      title: 'Community',
      subtitle: 'Social Trading',
      description: 'Connect with 75,000+ traders, share strategies, and learn from market experts.',
      stats: { value: '75K+', label: 'Traders' },
      gradient: 'linear-gradient(135deg, #06B6D4 0%, #67E8F9 100%)',
      bgColor: '#CFFAFE',
      iconColor: '#06B6D4'
    }
  ];

  // Auto-rotate cards every 4 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % cards.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [cards.length]);

  const currentCard = cards[currentIndex];
  const nextCard = cards[(currentIndex + 1) % cards.length];

  const cardVariants = {
    enter: {
      rotateY: 90,
      opacity: 0,
      scale: 0.8,
    },
    center: {
      rotateY: 0,
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.6,
        ease: [0.25, 0.46, 0.45, 0.94],
      },
    },
    exit: {
      rotateY: -90,
      opacity: 0,
      scale: 0.8,
      transition: {
        duration: 0.6,
        ease: [0.25, 0.46, 0.45, 0.94],
      },
    },
  };

  const handleCardClick = (index) => {
    setCurrentIndex(index);
  };

  return (
    <div className="card-swap-container">
      <div className="card-swap-header">
        <motion.h2
          className="card-swap-title"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          Powerful Trading Features
        </motion.h2>
        <motion.p
          className="card-swap-subtitle"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          Experience next-generation trading tools designed for Indian markets
        </motion.p>
      </div>

      <div className="card-swap-content">
        {/* Main Card Display */}
        <div className="card-display">
          <div className="card-wrapper">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentCard.id}
                className="feature-card"
                style={{
                  background: currentCard.gradient,
                }}
                variants={cardVariants}
                initial="enter"
                animate="center"
                exit="exit"
              >
                <div className="card-background">
                  <div className="card-pattern"></div>
                  <div className="card-glow"></div>
                </div>

                <div className="card-content">
                  <div className="card-header">
                    <div 
                      className="card-icon"
                      style={{ backgroundColor: currentCard.bgColor }}
                    >
                      <currentCard.icon 
                        size={32} 
                        style={{ color: currentCard.iconColor }}
                      />
                    </div>
                    <div className="card-badge">
                      <span>{currentCard.subtitle}</span>
                    </div>
                  </div>

                  <div className="card-body">
                    <h3 className="card-title">{currentCard.title}</h3>
                    <p className="card-description">{currentCard.description}</p>
                  </div>

                  <div className="card-footer">
                    <div className="card-stats">
                      <div className="stat-value">{currentCard.stats.value}</div>
                      <div className="stat-label">{currentCard.stats.label}</div>
                    </div>
                    <div className="card-action">
                      <motion.button
                        className="explore-btn"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        Explore
                      </motion.button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Next Card Preview */}
          <div className="next-card-preview">
            <motion.div
              className="preview-card"
              style={{
                background: nextCard.gradient,
                opacity: 0.3,
              }}
              animate={{
                scale: [0.8, 0.85, 0.8],
                opacity: [0.3, 0.4, 0.3],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <nextCard.icon size={24} color="white" />
              <span>{nextCard.title}</span>
            </motion.div>
          </div>
        </div>

        {/* Card Navigation Dots */}
        <div className="card-navigation">
          {cards.map((card, index) => (
            <motion.button
              key={card.id}
              className={`nav-dot ${index === currentIndex ? 'active' : ''}`}
              onClick={() => handleCardClick(index)}
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
              style={{
                backgroundColor: index === currentIndex ? card.iconColor : '#E5E7EB',
              }}
            >
              <card.icon size={12} />
            </motion.button>
          ))}
        </div>

        {/* Progress Bar */}
        <div className="progress-container">
          <div className="progress-bar">
            <motion.div
              className="progress-fill"
              style={{
                background: currentCard.gradient,
              }}
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{
                duration: 4,
                ease: 'linear',
                repeat: Infinity,
              }}
              key={currentIndex}
            />
          </div>
        </div>

        {/* Feature Grid */}
        <div className="feature-grid">
          {cards.map((card, index) => (
            <motion.div
              key={card.id}
              className={`feature-item ${index === currentIndex ? 'active' : ''}`}
              onClick={() => handleCardClick(index)}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              style={{
                borderColor: index === currentIndex ? card.iconColor : 'transparent',
              }}
            >
              <div 
                className="feature-icon"
                style={{
                  backgroundColor: index === currentIndex ? card.bgColor : '#F9FAFB',
                  color: index === currentIndex ? card.iconColor : '#6B7280',
                }}
              >
                <card.icon size={20} />
              </div>
              <div className="feature-info">
                <h4>{card.title}</h4>
                <p>{card.subtitle}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CardSwap;
