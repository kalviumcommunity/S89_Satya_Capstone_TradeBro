import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiMessageCircle,
  FiShield,
  FiTrendingUp,
  FiBriefcase,
  FiZap,
  FiTarget,
  FiCheck,
  FiArrowRight
} from 'react-icons/fi';
import SectionHeader from '../ui/SectionHeader';
import './AnimatedFeaturesList.css';

const AnimatedFeaturesList = () => {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  const features = [
    {
      icon: FiMessageCircle,
      title: 'AI Assistant – Saytrix',
      description: 'Ask anything, get instant insights. Your personal finance mentor available 24/7 with voice commands.',
      color: '#3B82F6',
      badge: 'AI Powered',
      details: ['Voice-activated commands', 'Real-time market analysis', 'Personalized recommendations', 'Smart portfolio insights']
    },
    {
      icon: FiShield,
      title: 'Virtual Stock Trading',
      description: 'Learn risk-free with ₹1L demo money. Practice with real Indian stock prices and market conditions.',
      color: '#10B981',
      badge: 'Risk Free',
      details: ['₹1,00,000 virtual money', 'Real NSE & BSE prices', 'Zero financial risk', 'Practice trading strategies']
    },
    {
      icon: FiTrendingUp,
      title: 'Live Indian Stock Data',
      description: 'Real-time NSE & BSE data powered by FMP API. 30-second refresh with professional-grade accuracy.',
      color: '#F59E0B',
      badge: 'Real Time',
      details: ['30-second data refresh', 'NSE & BSE coverage', 'Professional-grade accuracy', 'Live market indicators']
    },
    {
      icon: FiBriefcase,
      title: 'Portfolio Tracker',
      description: 'Realistic P&L tracking, detailed charts, and comprehensive transaction history with analytics.',
      color: '#8B5CF6',
      badge: 'Professional',
      details: ['Real-time P&L tracking', 'Advanced analytics', 'Transaction history', 'Performance metrics']
    },
    {
      icon: FiZap,
      title: 'Secure Login',
      description: 'Google OAuth integration plus email OTP support. Your data is protected with enterprise security.',
      color: '#EF4444',
      badge: 'Secure',
      details: ['Google OAuth integration', 'Email OTP verification', 'Enterprise-grade security', 'Data encryption']
    },
    {
      icon: FiTarget,
      title: 'Dark & Light Mode',
      description: 'Beautiful El-Classico theme with seamless dark/light mode switching for comfortable trading.',
      color: '#6366F1',
      badge: 'Customizable',
      details: ['El-Classico theme', 'Seamless mode switching', 'Eye-friendly design', 'Professional aesthetics']
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    }
  };

  return (
    <section className="animated-features-section">
      <div className="container">
        <SectionHeader
          title="Complete Trading Ecosystem"
          subtitle="From beginner-friendly tools to advanced analytics, TradeBro provides everything you need to succeed"
          highlight="Everything You Need"
          variant="secondary"
        />

        <motion.div
          className="animated-features-list"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          {features.map((feature, index) => {
            const Icon = feature.icon;
            const isHovered = hoveredIndex === index;
            
            return (
              <motion.div
                key={index}
                className="feature-list-item"
                variants={itemVariants}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                style={{ '--feature-color': feature.color }}
              >
                <div className="feature-item-content">
                  <div className="feature-item-header">
                    <div className="feature-item-icon" style={{ color: feature.color }}>
                      <Icon size={24} />
                    </div>
                    <div className="feature-item-info">
                      <div className="feature-item-title-row">
                        <h3 className="feature-item-title">{feature.title}</h3>
                        <span className="feature-item-badge" style={{ backgroundColor: `${feature.color}15`, color: feature.color }}>
                          {feature.badge}
                        </span>
                      </div>
                      <p className="feature-item-description">{feature.description}</p>
                    </div>
                    <motion.div
                      className="feature-item-arrow"
                      animate={{ x: isHovered ? 4 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <FiArrowRight size={16} />
                    </motion.div>
                  </div>

                  <AnimatePresence>
                    {isHovered && (
                      <motion.div
                        className="feature-item-details"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                      >
                        <div className="feature-details-grid">
                          {feature.details.map((detail, detailIndex) => (
                            <motion.div
                              key={detailIndex}
                              className="feature-detail-item"
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: detailIndex * 0.05 }}
                            >
                              <FiCheck size={14} style={{ color: feature.color }} />
                              <span>{detail}</span>
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <motion.div
                  className="feature-item-glow"
                  style={{ background: `${feature.color}10` }}
                  animate={{ opacity: isHovered ? 1 : 0 }}
                  transition={{ duration: 0.3 }}
                />
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
};

export default AnimatedFeaturesList;
