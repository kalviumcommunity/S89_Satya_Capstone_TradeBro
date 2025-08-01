import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FiZap,
  FiMenu,
  FiX,
  FiArrowRight,
  FiUser,
  FiLogIn,
  FiUserPlus,
  FiSun,
  FiMoon
} from 'react-icons/fi'
import './TradeBroHeader.css'

const TradeBroHeader = ({ 
  isAuthenticated = false, 
  user = null, 
  theme = 'light',
  onToggleTheme = () => {},
  onLogin = () => {},
  onSignup = () => {}
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const location = useLocation()

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [location.pathname])

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const navigationItems = [
    { name: 'Features', href: '#features', external: false },
    { name: 'How it Works', href: '#how-it-works', external: false },
    { name: 'AI Demo', href: '#ai-demo', external: false }
  ]

  const scrollToSection = (href) => {
    if (href.startsWith('#')) {
      const element = document.querySelector(href)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' })
      }
    }
  }

  return (
    <motion.header
      className={`tradebro-header ${isScrolled ? 'scrolled' : ''} ${theme}`}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className="header-container">
        {/* Logo Section */}
        <motion.div
          className="header-logo"
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
        >
          <Link to="/" className="logo-link">
            <div className="logo-text">
              <span className="logo-main">TradeBro</span>
              <span className="logo-tagline">AI Trading Platform</span>
            </div>
          </Link>
        </motion.div>

        {/* Desktop Navigation */}
        <nav className="header-nav desktop-nav">
          {navigationItems.map((item, index) => (
            <motion.button
              key={item.name}
              className="nav-item"
              onClick={() => scrollToSection(item.href)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              {item.name}
            </motion.button>
          ))}
        </nav>

        {/* Header Actions */}
        <div className="header-actions">
          {/* Theme Toggle */}
          <motion.button
            className="theme-toggle"
            onClick={onToggleTheme}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            aria-label="Toggle theme"
          >
            <AnimatePresence mode="wait">
              {theme === 'dark' ? (
                <motion.div
                  key="sun"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <FiSun />
                </motion.div>
              ) : (
                <motion.div
                  key="moon"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <FiMoon />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>

          {/* Authentication Actions */}
          {!isAuthenticated ? (
            <div className="auth-actions">
              <motion.button
                className="btn-header btn-ghost"
                onClick={onLogin}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <FiLogIn size={16} />
                <span className="btn-text">Login</span>
              </motion.button>
              <motion.button
                className="btn-header btn-primary"
                onClick={onSignup}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <FiZap size={16} />
                <span className="btn-text">Start Trading</span>
                <FiArrowRight size={14} />
              </motion.button>
            </div>
          ) : (
            <motion.div
              className="user-profile"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <Link to="/dashboard" className="profile-link">
                <div className="profile-avatar">
                  {user?.profilePicture ? (
                    <img src={user.profilePicture} alt={user.name} />
                  ) : (
                    <FiUser />
                  )}
                </div>
                <span className="profile-name">{user?.name || 'User'}</span>
              </Link>
            </motion.div>
          )}

          {/* Mobile Menu Toggle */}
          <motion.button
            className="mobile-menu-toggle"
            onClick={toggleMobileMenu}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            aria-label="Toggle mobile menu"
          >
            <AnimatePresence mode="wait">
              {isMobileMenuOpen ? (
                <motion.div
                  key="close"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <FiX />
                </motion.div>
              ) : (
                <motion.div
                  key="menu"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <FiMenu />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            className="mobile-nav-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={toggleMobileMenu}
          >
            <motion.nav
              className="mobile-nav"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mobile-nav-header">
                <div className="mobile-logo">
                  <FiZap className="mobile-logo-icon" />
                  <span>TradeBro</span>
                </div>
                <button
                  className="mobile-close-btn"
                  onClick={toggleMobileMenu}
                >
                  <FiX />
                </button>
              </div>

              <div className="mobile-nav-content">
                {navigationItems.map((item, index) => (
                  <motion.button
                    key={item.name}
                    className="mobile-nav-item"
                    onClick={() => {
                      scrollToSection(item.href)
                      toggleMobileMenu()
                    }}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    {item.name}
                  </motion.button>
                ))}

                {!isAuthenticated && (
                  <div className="mobile-auth-actions">
                    <motion.button
                      className="mobile-btn btn-ghost"
                      onClick={() => {
                        onLogin()
                        toggleMobileMenu()
                      }}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.4 }}
                    >
                      <FiLogIn size={16} />
                      Login
                    </motion.button>
                    <motion.button
                      className="mobile-btn btn-primary"
                      onClick={() => {
                        onSignup()
                        toggleMobileMenu()
                      }}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.5 }}
                    >
                      <FiZap size={16} />
                      Start Trading
                      <FiArrowRight size={14} />
                    </motion.button>
                  </div>
                )}
              </div>
            </motion.nav>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  )
}

export default TradeBroHeader
