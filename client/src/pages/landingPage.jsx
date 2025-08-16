import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  FiArrowRight,
  FiZap
} from 'react-icons/fi'

import TradeBroHeader from '../components/layout/TradeBroHeader'
import OrbBackground from '../components/animations/OrbBackground'
import GridMotion from '../components/animations/GridMotion'
import InteractiveChart from '../components/hero/InteractiveChart'
import TypewriterText from '../components/hero/TypewriterText'

import SaytrixChatPreview from '../components/ai/SaytrixChatPreview'
import AnimatedFeaturesList from '../components/features/AnimatedFeaturesList'
import TradeBroStepper from '../components/stepper/TradeBroStepper'
import '../styles/premium-landing.css'

const LandingPage = ({ theme = 'light', onToggleTheme = () => {} }) => {
  const navigate = useNavigate()

  const handleLogin = () => {
    navigate('/login')
  }

  const handleSignup = () => {
    navigate('/signup')
  }









  return (
    <div className="landing-page">
      {/* Perfect TradeBro Header */}
      <TradeBroHeader
        isAuthenticated={false}
        theme={theme}
        onToggleTheme={onToggleTheme}
        onLogin={handleLogin}
        onSignup={handleSignup}
      />

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-background">
          <GridMotion
            gridSize={40}
            lineColor="rgba(59, 130, 246, 0.1)"
            speed={20}
          />
          <OrbBackground
            orbCount={3}
            colors={['#3B82F6', '#10B981', '#8B5CF6']}
            size="large"
          />
        </div>

        <div className="hero-container-grid">
          <motion.div
            className="hero-content"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.h1
              className="hero-title"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              Master the Markets with
              <br />
              <TypewriterText />
            </motion.h1>

            <motion.p
              className="hero-subtitle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              Experience the future of stock trading with Saytrix AI assistant, real-time market data,
              professional-grade charts, and risk-free virtual trading. Join 75,000+ traders building wealth intelligently.
            </motion.p>

            <motion.div
              className="hero-actions"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link to="/signup" className="btn-premium btn-primary btn-large">
                  <FiZap />
                  Start Trading Free
                  <FiArrowRight />
                </Link>
              </motion.div>
            </motion.div>
          </motion.div>

          <motion.div
            className="hero-visual"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <div className="interactive-dashboard">
              <div className="dashboard-header">
                <div className="header-dots">
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.8, duration: 0.3 }}
                  />
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.9, duration: 0.3 }}
                  />
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 1.0, duration: 0.3 }}
                  />
                </div>
                <motion.span
                  className="dashboard-title"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.1, duration: 0.5 }}
                >
                  TradeBro Dashboard
                </motion.span>
              </div>

              <div className="dashboard-content">
                <InteractiveChart />
              </div>
            </div>
          </motion.div>
        </div>
      </section>



      {/* Animated Features List */}
      <section id="features">
        <AnimatedFeaturesList />
      </section>

      {/* Saytrix AI Demo */}
      <section id="ai-demo">
        <SaytrixChatPreview />
      </section>

      {/* How TradeBro Works - Stepper */}
      <section id="how-it-works">
        <TradeBroStepper />
      </section>
    </div>
  )
}

export default LandingPage
