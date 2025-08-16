import { useState, useEffect, useCallback, useMemo, memo, Suspense, lazy, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { toast, ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import Sidebar from './components/layout/Sidebar'
import AuthStatus from './components/auth/AuthStatus'
import GlobalSearchModal from './components/common/GlobalSearchModal'
import VoiceCommandModal from './components/voice/VoiceCommandModal'
import VoiceStatusIndicator from './components/voice/VoiceStatusIndicator'
import SaytrixActivationIndicator from './components/voice/SaytrixActivationIndicator'
import OrderModal from './components/OrderModal'
import EnhancedOrderConfirmationModal from './components/EnhancedOrderConfirmationModal'
import useGlobalSearch from './hooks/useGlobalSearch'
import { useOrderIntegration } from './hooks/useOrderIntegration'
import { usePerformanceOptimization } from './hooks/usePerformanceOptimization'
import balanceSyncManager from './utils/balanceSync'
// Import routes inline to fix deployment
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import Dashboard from "./pages/Dashboard";
import Portfolio from "./pages/Portfolio";
import Trading from "./pages/Trading";
import Charts from "./pages/Charts";
import Watchlist from "./pages/Watchlist";
import Orders from "./pages/Orders";
import History from "./pages/History";
import News from "./pages/News";
import Notifications from "./pages/Notifications";
import Settings from "./pages/Settings";
import Profile from "./pages/Profile";
import Saytrix from "./pages/Saytrix";
import StockDetail from "./pages/StockDetail";
import TermsOfService from "./pages/TermsOfService";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import NotFound from "./pages/NotFound";
import { PortfolioProvider } from "./contexts/PortfolioContext";

const ProtectedRoute = ({ children, isAuthenticated, loading, user }) => {
  const location = useLocation();
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner lg"></div>
        <p className="loading-text">Verifying authentication...</p>
      </div>
    );
  }
  if (!isAuthenticated) {
    localStorage.setItem("redirectAfterLogin", location.pathname);
    return <Navigate to="/login" replace />;
  }
  return <PortfolioProvider user={user}>{children}</PortfolioProvider>;
};

const PublicRoute = ({ children, isAuthenticated }) => {
  if (isAuthenticated) {
    const redirectUrl = localStorage.getItem("redirectAfterLogin");
    localStorage.removeItem("redirectAfterLogin");
    return <Navigate to={redirectUrl || "/dashboard"} replace />;
  }
  return children;
};

const AppRoutes = ({ isAuthenticated, user, loading, onLogin, onSignup, onLogout, onUpdateProfile, theme, toggleTheme }) => {
  return (
    <Routes>
      <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" /> : <LandingPage />} />
      <Route path="/login" element={<PublicRoute isAuthenticated={isAuthenticated}><LoginPage onLogin={onLogin} /></PublicRoute>} />
      <Route path="/signup" element={<PublicRoute isAuthenticated={isAuthenticated}><SignupPage onSignup={onSignup} /></PublicRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute isAuthenticated={isAuthenticated} loading={loading} user={user}><Dashboard user={user} theme={theme} /></ProtectedRoute>} />
      <Route path="/portfolio" element={<ProtectedRoute isAuthenticated={isAuthenticated} loading={loading} user={user}><Portfolio user={user} theme={theme} /></ProtectedRoute>} />
      <Route path="/trading" element={<ProtectedRoute isAuthenticated={isAuthenticated} loading={loading} user={user}><Trading user={user} theme={theme} /></ProtectedRoute>} />
      <Route path="/charts" element={<ProtectedRoute isAuthenticated={isAuthenticated} loading={loading} user={user}><Charts user={user} theme={theme} /></ProtectedRoute>} />
      <Route path="/watchlist" element={<ProtectedRoute isAuthenticated={isAuthenticated} loading={loading} user={user}><Watchlist user={user} theme={theme} /></ProtectedRoute>} />
      <Route path="/orders" element={<ProtectedRoute isAuthenticated={isAuthenticated} loading={loading} user={user}><Orders user={user} theme={theme} /></ProtectedRoute>} />
      <Route path="/history" element={<ProtectedRoute isAuthenticated={isAuthenticated} loading={loading} user={user}><History user={user} theme={theme} /></ProtectedRoute>} />
      <Route path="/news" element={<ProtectedRoute isAuthenticated={isAuthenticated} loading={loading} user={user}><News user={user} theme={theme} /></ProtectedRoute>} />
      <Route path="/notifications" element={<ProtectedRoute isAuthenticated={isAuthenticated} loading={loading} user={user}><Notifications user={user} theme={theme} /></ProtectedRoute>} />
      <Route path="/saytrix" element={<ProtectedRoute isAuthenticated={isAuthenticated} loading={loading} user={user}><Saytrix user={user} theme={theme} /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute isAuthenticated={isAuthenticated} loading={loading} user={user}><Settings user={user} theme={theme} toggleTheme={toggleTheme} onLogout={onLogout} /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute isAuthenticated={isAuthenticated} loading={loading} user={user}><Profile /></ProtectedRoute>} />
      <Route path="/stock/:symbol" element={<ProtectedRoute isAuthenticated={isAuthenticated} loading={loading} user={user}><StockDetail user={user} theme={theme} /></ProtectedRoute>} />
      <Route path="/terms" element={<ProtectedRoute isAuthenticated={isAuthenticated} loading={loading} user={user}><TermsOfService /></ProtectedRoute>} />
      <Route path="/privacy" element={<ProtectedRoute isAuthenticated={isAuthenticated} loading={loading} user={user}><PrivacyPolicy /></ProtectedRoute>} />
      <Route path="*" element={isAuthenticated ? <NotFound /> : <Navigate to="/login" replace />} />
    </Routes>
  );
};

const PerformanceMonitor = lazy(() => import('./components/debug/PerformanceMonitor'))
function App() {
  const [user, setUser] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [theme, setTheme] = useState('light')
  const [loading, setLoading] = useState(true)

  const { debounce, throttle, cache } = usePerformanceOptimization('App')

  const {
    isGlobalSearchOpen,
    handleGlobalSearch,
    closeGlobalSearch
  } = useGlobalSearch()



  // Order modal functionality
  const { orderModalState, closeOrderModal } = useOrderIntegration()

  // Order confirmation modal state - optimized to prevent frequent re-renders
  const [confirmationModalState, setConfirmationModalState] = useState({
    isOpen: false,
    orderData: null,
    stockData: null,
    orderSummary: null,
    profitLossEstimate: null,
    onConfirm: null,
    isProcessing: false
  })

  // Memoized handlers to prevent unnecessary re-renders
  const handleShowConfirmation = useCallback((confirmationData) => {
    setConfirmationModalState({
      isOpen: true,
      ...confirmationData,
      isProcessing: false
    });
  }, [])

  const handleCloseConfirmation = useCallback(() => {
    setConfirmationModalState(prevState => {
      if (!prevState.isOpen) return prevState; // Prevent unnecessary updates
      return {
        ...prevState,
        isOpen: false,
        isProcessing: false
      };
    });
  }, [])

  // Stable reference for onConfirm to prevent re-renders
  const confirmOrderRef = useRef(null);

  const handleConfirmOrder = useCallback(async () => {
    const onConfirm = confirmOrderRef.current;
    if (onConfirm) {
      setConfirmationModalState(prev => ({ ...prev, isProcessing: true }));
      try {
        await onConfirm();
        // Close confirmation modal after successful order
        setTimeout(() => {
          handleCloseConfirmation();
        }, 2000); // Allow success animation to play
      } catch (error) {
        console.error('Order confirmation failed:', error);
        setConfirmationModalState(prev => ({ ...prev, isProcessing: false }));
      }
    }
  }, [handleCloseConfirmation])

  // Update ref when onConfirm changes
  useEffect(() => {
    confirmOrderRef.current = confirmationModalState.onConfirm;
  }, [confirmationModalState.onConfirm])


  // Check authentication status on app load
  useEffect(() => {
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')

    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData)
        setUser(parsedUser)
        setIsAuthenticated(true)
        balanceSyncManager.initialize()
      } catch (error) {
        console.error('Error parsing user data:', error)
        localStorage.removeItem('token')
        localStorage.removeItem('user')
      }
    }
    
    setLoading(false)
  }, [])

  // Theme management
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light'
    setTheme(savedTheme)
    document.documentElement.setAttribute('data-theme', savedTheme)
  }, [])

  const toggleTheme = useCallback(() => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
    localStorage.setItem('theme', newTheme)
    document.documentElement.setAttribute('data-theme', newTheme)
  }, [theme])



  const handleLogin = useCallback((userData, token) => {
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(userData))
    setUser(userData)
    setIsAuthenticated(true)
    toast.success('Welcome back!')
  }, [])

  const handleLogout = useCallback(() => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
    setIsAuthenticated(false)
    toast.info('Logged out successfully')
  }, [])

  const handleSignup = useCallback((userData, token) => {
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(userData))
    setUser(userData)
    setIsAuthenticated(true)
    toast.success('Account created successfully!')
  }, [])

  const handleUpdateProfile = (updatedUser) => {
    setUser(updatedUser)
    toast.success('Profile updated successfully!')
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner lg"></div>
        <p className="loading-text">Loading TradeBro...</p>
      </div>
    )
  }

  return (
    <div className="app">
      <AppContent
        isAuthenticated={isAuthenticated}
        user={user}
        loading={loading}
        theme={theme}
        onLogin={handleLogin}
        onLogout={handleLogout}
        onSignup={handleSignup}
        onUpdateProfile={handleUpdateProfile}
        toggleTheme={toggleTheme}
        isGlobalSearchOpen={isGlobalSearchOpen}
        handleGlobalSearch={handleGlobalSearch}
        closeGlobalSearch={closeGlobalSearch}

        orderModalState={orderModalState}
        closeOrderModal={closeOrderModal}
        handleShowConfirmation={handleShowConfirmation}
        confirmationModalState={confirmationModalState}
        handleCloseConfirmation={handleCloseConfirmation}
        handleConfirmOrder={handleConfirmOrder}
      />

      {/* Toast Notifications */}
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme={theme}
        toastStyle={{
          background: theme === 'dark' ? '#1F2937' : '#FFFFFF',
          color: theme === 'dark' ? '#F9FAFB' : '#111827'
        }}
      />

      {/* Performance Monitor (Development Only) */}
      <Suspense fallback={null}>
        <PerformanceMonitor enabled={process.env.NODE_ENV === 'development'} />
      </Suspense>
    </div>
  )
}

// Separate component to use useLocation hook - memoized to prevent unnecessary re-renders
const AppContent = memo(function AppContent({
  isAuthenticated,
  user,
  loading,
  theme,
  onLogin,
  onLogout,
  onSignup,
  onUpdateProfile,
  toggleTheme,
  isGlobalSearchOpen,
  handleGlobalSearch,
  closeGlobalSearch,
  orderModalState,
  closeOrderModal,
  handleShowConfirmation,
  confirmationModalState,
  handleCloseConfirmation,
  handleConfirmOrder
}) {
  const location = useLocation()

  return (
    <>
      {/* Self-contained Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main className="main-content">
        <AppRoutes
          isAuthenticated={isAuthenticated}
          user={user}
          loading={loading}
          onLogin={onLogin}
          onSignup={onSignup}
          onLogout={onLogout}
          onUpdateProfile={onUpdateProfile}
          theme={theme}
          toggleTheme={toggleTheme}
        />
      </main>

      {/* Authentication Status Indicator */}
      <AuthStatus isAuthenticated={isAuthenticated} user={user} />

      {/* Global Search Modal */}
      <GlobalSearchModal
        isOpen={isGlobalSearchOpen}
        onClose={closeGlobalSearch}
        onSearch={handleGlobalSearch}
      />

      {/* Toast Notifications */}
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme={theme === 'dark' ? 'dark' : 'light'}
        toastStyle={{
          background: theme === 'dark' ? 'var(--bg-secondary)' : 'var(--bg-elevated)',
          color: theme === 'dark' ? 'var(--text-primary)' : 'var(--text-primary)',
          border: `1px solid ${theme === 'dark' ? 'var(--border-primary)' : 'var(--border-primary)'}`,
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-lg)'
        }}
      />

      {/* Global Voice Components */}
      <VoiceCommandModal />
      <VoiceStatusIndicator />


      {/* Order Modal */}
      <OrderModal
        isOpen={orderModalState.isOpen}
        onClose={closeOrderModal}
        stockData={orderModalState.stockData}
        initialOrderType={orderModalState.orderType}
        onOrderPlaced={closeOrderModal}
        onShowConfirmation={handleShowConfirmation}
      />

      {/* Enhanced Order Confirmation Modal - Full-page experience */}
      <EnhancedOrderConfirmationModal
        isOpen={confirmationModalState.isOpen}
        onClose={handleCloseConfirmation}
        onConfirm={handleConfirmOrder}
        orderData={confirmationModalState.orderData}
        stockData={confirmationModalState.stockData}
        orderSummary={confirmationModalState.orderSummary}
        profitLossEstimate={confirmationModalState.profitLossEstimate}
        isProcessing={confirmationModalState.isProcessing}
      />
    </>
  )
})

export default App