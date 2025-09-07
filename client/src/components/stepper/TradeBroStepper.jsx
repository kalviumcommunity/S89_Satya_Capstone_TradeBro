import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  FiUsers,
  FiBriefcase,
  FiTrendingUp,
  FiAward,
  FiCheck,
  FiArrowRight
} from 'react-icons/fi';
import SectionHeader from '../ui/SectionHeader';
import './TradeBroStepper.css';

const TradeBroStepper = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    {
      step: '01',
      title: 'Create Your Account',
      description: 'Sign up in under 2 minutes and get ₹10,000 virtual money to start trading risk-free',
      icon: FiUsers,
      details: [
        'Quick email or Google signup',
        '₹10,000 virtual trading money',
        'Instant account activation',
        'No documents required'
      ],
      color: '#3B82F6'
    },
    {
      step: '02',
      title: 'Learn with Saytrix AI',
      description: 'Get personalized market insights, stock analysis, and trading recommendations from our AI assistant',
      icon: FiBriefcase,
      details: [
        'Voice-activated AI assistant',
        'Real-time market analysis',
        'Personalized recommendations',
        'Interactive learning modules'
      ],
      color: '#10B981'
    },
    {
      step: '03',
      title: 'Trade & Grow',
      description: 'Execute trades, track your portfolio performance, and build wealth with professional-grade tools',
      icon: FiTrendingUp,
      details: [
        'Real NSE & BSE stock prices',
        'Professional trading charts',
        'Portfolio performance tracking',
        'Risk-free practice environment'
      ],
      color: '#F59E0B'
    },
    {
      step: '04',
      title: 'Master the Markets',
      description: 'Compete on leaderboards, earn rewards, and become a confident trader with our gamified learning system',
      icon: FiAward,
      details: [
        'Global leaderboards',
        'Achievement system',
        'Daily trading challenges',
        'Community competitions'
      ],
      color: '#8B5CF6'
    }
  ];

  const handleStepClick = (index) => {
    setActiveStep(index);
  };

  return (
    <section className="tradebro-stepper-section">
      <div className="container">
        <SectionHeader
          title="How TradeBro Works"
          subtitle="Master trading with our step-by-step approach"
          highlight="TradeBro"
          variant="primary"
        />

        <div className="stepper-container">
          <div className="stepper-navigation">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = index === activeStep;
              const isCompleted = index < activeStep;
              
              return (
                <motion.div
                  key={index}
                  className={`step-item ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
                  onClick={() => handleStepClick(index)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  style={{ '--step-color': step.color }}
                >
                  <div className="step-indicator">
                    <div className="step-number">
                      {isCompleted ? (
                        <FiCheck size={16} />
                      ) : (
                        <span>{step.step}</span>
                      )}
                    </div>
                    <div className="step-icon" style={{ color: step.color }}>
                      <Icon size={20} />
                    </div>
                  </div>
                  
                  <div className="step-content">
                    <h3 className="step-title">{step.title}</h3>
                    <p className="step-description">{step.description}</p>
                  </div>


                </motion.div>
              );
            })}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeStep}
              className="step-details"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="step-details-header">
                <div className="step-details-icon" style={{ color: steps[activeStep].color }}>
                  {React.createElement(steps[activeStep].icon, { size: 32 })}
                </div>
                <div>
                  <h3 className="step-details-title">{steps[activeStep].title}</h3>
                  <p className="step-details-description">{steps[activeStep].description}</p>
                </div>
              </div>

              <div className="step-details-list">
                {steps[activeStep].details.map((detail, index) => (
                  <motion.div
                    key={index}
                    className="detail-item"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <FiCheck size={16} style={{ color: steps[activeStep].color }} />
                    <span>{detail}</span>
                  </motion.div>
                ))}
              </div>

              <motion.div
                className="step-actions"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                {activeStep < steps.length - 1 ? (
                  <button
                    className="next-step-btn"
                    onClick={() => setActiveStep(activeStep + 1)}
                    style={{ backgroundColor: steps[activeStep].color }}
                  >
                    Next Step
                    <FiArrowRight size={16} />
                  </button>
                ) : (
                  <button
                    className="get-started-btn"
                    onClick={() => navigate('/signup')}
                    style={{ backgroundColor: steps[activeStep].color }}
                  >
                    Get Started Now
                    <FiArrowRight size={16} />
                  </button>
                )}
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
};

export default TradeBroStepper;
