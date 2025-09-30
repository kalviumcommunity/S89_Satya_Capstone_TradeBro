import React from 'react';
import { motion } from 'framer-motion';
import { FiTrendingUp, FiDollarSign, FiTarget, FiAward } from 'react-icons/fi';
import './FloatingCards.css';

const FloatingCards = () => {
  const cards = [
    {
      icon: FiTrendingUp,
      title: 'Portfolio Growth',
      value: '+24.5%',
      subtitle: 'This Month',
      color: '#10B981',
      delay: 0
    },
    {
      icon: FiDollarSign,
      title: 'Total Profit',
      value: '₹45,230',
      subtitle: 'All Time',
      color: '#3B82F6',
      delay: 0.2
    },
    {
      icon: FiTarget,
      title: 'Success Rate',
      value: '87%',
      subtitle: 'Winning Trades',
      color: '#8B5CF6',
      delay: 0.4
    },
    {
      icon: FiAward,
      title: 'Rank',
      value: '#127',
      subtitle: 'Global Leaderboard',
      color: '#F59E0B',
      delay: 0.6
    }
  ];

  return (
    <div className="floating-cards">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <motion.div
            key={index}
            className="floating-card"
            initial={{ opacity: 0, y: 50, rotateX: -15 }}
            animate={{ opacity: 1, y: 0, rotateX: 0 }}
            transition={{ 
              duration: 0.6, 
              delay: card.delay,
              ease: "easeOut"
            }}
            whileHover={{ 
              y: -10, 
              rotateY: 5,
              scale: 1.05,
              transition: { duration: 0.3 }
            }}
            style={{
              '--card-color': card.color
            }}
          >
            <div className="card-glow" />
            <div className="card-content">
              <div className="card-icon">
                <Icon size={24} />
              </div>
              <div className="card-info">
                <h4 className="card-title">{card.title}</h4>
                <div className="card-value">{card.value}</div>
                <p className="card-subtitle">{card.subtitle}</p>
              </div>
            </div>
            <div className="card-shine" />
          </motion.div>
        );
      })}
    </div>
  );
};

export default FloatingCards;
