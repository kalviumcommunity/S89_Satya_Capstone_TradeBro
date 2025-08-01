import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'

// Pages - Original TradeBro Components (matching live site)
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import Dashboard from './pages/Dashboard'
import Portfolio from './pages/Portfolio'
import Trading from './pages/Trading'
import Charts from './pages/Charts'
import Watchlist from './pages/Watchlist'
import Orders from './pages/Orders'
import History from './pages/History'
import News from './pages/News'
import Notifications from './pages/Notifications'
import Settings from './pages/Settings'
import Profile from './pages/Profile'
import Saytrix from './pages/Saytrix'
import StockDetail from './pages/StockDetail'
import TermsOfService from './pages/TermsOfService'
import PrivacyPolicy from './pages/PrivacyPolicy'
import NotFound from './pages/NotFound'

import { PortfolioProvider } from './contexts/PortfolioContext'

const ProtectedRoute = ({ children, isAuthenticated, loading, user }) => {
  const location = useLocation()
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner lg"></div>
        <p className="loading-text">Verifying authentication...</p>
      </div>
    )
  }

  if (!isAuthenticated) {
    localStorage.setItem('redirectAfterLogin', location.pathname)
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return (
    <PortfolioProvider user={user}>
      {children}
    </PortfolioProvider>
  )
}

const PublicRoute = ({ children, isAuthenticated }) => {
  if (isAuthenticated) {
    const redirectUrl = localStorage.getItem('redirectAfterLogin')
    if (redirectUrl) {
      localStorage.removeItem('redirectAfterLogin')
      return <Navigate to={redirectUrl} replace />
    }
    return <Navigate to="/dashboard" replace />
  }

  return children
}

const AppRoutes = ({
  isAuthenticated,
  user,
  loading,
  onLogin,
  onSignup,
  onLogout,
  onUpdateProfile,
  theme,
  toggleTheme
}) => {
  const location = useLocation()

  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    in: { opacity: 1, y: 0 },
    out: { opacity: 0, y: -20 }
  }

  const pageTransition = {
    type: 'tween',
    ease: 'anticipate',
    duration: 0.4
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial="initial"
        animate="in"
        exit="out"
        variants={pageVariants}
        transition={pageTransition}
      >
        <Routes>
          {/* Redirect root to dashboard if authenticated, otherwise to login */}
          <Route
            path="/"
            element={
              isAuthenticated ?
                <Navigate to="/dashboard" replace /> :
                <Navigate to="/login" replace />
            }
          />

          {/* Authentication Pages - Only accessible when NOT authenticated */}
          <Route
            path="/login"
            element={
              <PublicRoute isAuthenticated={isAuthenticated}>
                <LoginPage
                  onLogin={onLogin}
                />
              </PublicRoute>
            }
          />

          <Route
            path="/signup"
            element={
              <PublicRoute isAuthenticated={isAuthenticated}>
                <SignupPage
                  onSignup={onSignup}
                />
              </PublicRoute>
            }
          />

          {/* Legal Pages - Protected but accessible */}
          <Route
            path="/terms"
            element={
              <ProtectedRoute isAuthenticated={isAuthenticated} loading={loading} user={user}>
                <TermsOfService />
              </ProtectedRoute>
            }
          />
          <Route
            path="/privacy"
            element={
              <ProtectedRoute isAuthenticated={isAuthenticated} loading={loading} user={user}>
                <PrivacyPolicy />
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute isAuthenticated={isAuthenticated} loading={loading} user={user}>
                <Dashboard
                  user={user}
                  theme={theme}
                />
              </ProtectedRoute>
            }
          />
          <Route
            path="/portfolio"
            element={
              <ProtectedRoute isAuthenticated={isAuthenticated} loading={loading} user={user}>
                <Portfolio
                  user={user}
                  theme={theme}
                />
              </ProtectedRoute>
            }
          />
          <Route
            path="/trading"
            element={
              <ProtectedRoute isAuthenticated={isAuthenticated} loading={loading} user={user}>
                <Trading
                  user={user}
                  theme={theme}
                />
              </ProtectedRoute>
            }
          />
          <Route 
            path="/charts" 
            element={
              <ProtectedRoute isAuthenticated={isAuthenticated} loading={loading} user={user}>
                <Charts
                  user={user}
                  theme={theme}
                />
              </ProtectedRoute>
            } 
          />
          <Route
            path="/watchlist"
            element={
              <ProtectedRoute isAuthenticated={isAuthenticated} loading={loading} user={user}>
                <Watchlist
                  user={user}
                  theme={theme}
                />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders"
            element={
              <ProtectedRoute isAuthenticated={isAuthenticated} loading={loading} user={user}>
                <Orders
                  user={user}
                  theme={theme}
                />
              </ProtectedRoute>
            }
          />
          <Route
            path="/history"
            element={
              <ProtectedRoute isAuthenticated={isAuthenticated} loading={loading} user={user}>
                <History
                  user={user}
                  theme={theme}
                />
              </ProtectedRoute>
            }
          />
          <Route
            path="/news"
            element={
              <ProtectedRoute isAuthenticated={isAuthenticated} loading={loading} user={user}>
                <News
                  user={user}
                  theme={theme}
                />
              </ProtectedRoute>
            }
          />
          <Route
            path="/notifications"
            element={
              <ProtectedRoute isAuthenticated={isAuthenticated} loading={loading} user={user}>
                <Notifications
                  user={user}
                  theme={theme}
                />
              </ProtectedRoute>
            }
          />
          <Route
            path="/saytrix"
            element={
              <ProtectedRoute isAuthenticated={isAuthenticated} loading={loading} user={user}>
                <Saytrix
                  user={user}
                  theme={theme}
                />
              </ProtectedRoute>
            }
          />
          <Route 
            path="/settings" 
            element={
              <ProtectedRoute isAuthenticated={isAuthenticated} loading={loading} user={user}>
                <Settings
                  user={user}
                  theme={theme}
                  toggleTheme={toggleTheme}
                  onLogout={onLogout}
                />
              </ProtectedRoute>
            } 
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute isAuthenticated={isAuthenticated} loading={loading} user={user}>
                <Profile
                  user={user}
                  onUpdateProfile={onUpdateProfile}
                  theme={theme}
                  toggleTheme={toggleTheme}
                />
              </ProtectedRoute>
            }
          />
          <Route
            path="/stock/:symbol"
            element={
              <ProtectedRoute isAuthenticated={isAuthenticated} loading={loading} user={user}>
                <StockDetail
                  user={user}
                  theme={theme}
                />
              </ProtectedRoute>
            }
          />
          <Route 
            path="/home" 
            element={
              isAuthenticated ? 
                <Navigate to="/dashboard" replace /> : 
                <Navigate to="/" replace />
            } 
          />
          <Route 
            path="/app" 
            element={
              <ProtectedRoute isAuthenticated={isAuthenticated}>
                <Navigate to="/dashboard" replace />
              </ProtectedRoute>
            } 
          />
          {/* Protected redirect routes */}
          <Route
            path="/trade"
            element={
              <ProtectedRoute isAuthenticated={isAuthenticated} loading={loading} user={user}>
                <Navigate to="/trading" replace />
              </ProtectedRoute>
            }
          />
          <Route
            path="/stocks"
            element={
              <ProtectedRoute isAuthenticated={isAuthenticated} loading={loading} user={user}>
                <Navigate to="/charts" replace />
              </ProtectedRoute>
            }
          />
          <Route
            path="/chat"
            element={
              <ProtectedRoute isAuthenticated={isAuthenticated} loading={loading} user={user}>
                <Navigate to="/saytrix" replace />
              </ProtectedRoute>
            }
          />
          <Route
            path="/ai"
            element={
              <ProtectedRoute isAuthenticated={isAuthenticated} loading={loading} user={user}>
                <Navigate to="/saytrix" replace />
              </ProtectedRoute>
            }
          />

          {/* 404 Page - Redirect unauthenticated users to login */}
          <Route
            path="*"
            element={
              isAuthenticated ?
                <NotFound /> :
                <Navigate to="/login" replace />
            }
          />
        </Routes>
      </motion.div>
    </AnimatePresence>
  )
}

export default AppRoutes
