// src/App.jsx
import { useState, useEffect, useCallback, memo, Suspense, lazy, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast, ToastContainer } from 'react-toastify';
import './App.css';
import 'react-toastify/dist/ReactToastify.css';
import Sidebar from './components/layout/Sidebar';
import AuthStatus from './components/auth/AuthStatus';
import GlobalSearchModal from './components/common/GlobalSearchModal';
import VoiceCommandModal from './components/voice/VoiceCommandModal';
import VoiceStatusIndicator from './components/voice/VoiceStatusIndicator';
import SaytrixActivationIndicator from './components/voice/SaytrixActivationIndicator';
import OrderModal from './components/OrderModal';
import EnhancedOrderConfirmationModal from './components/EnhancedOrderConfirmationModal';
import useGlobalSearch from './hooks/useGlobalSearch';
import { useOrderIntegration } from './hooks/useOrderIntegration';
import { usePerformanceOptimization } from './hooks/usePerformanceOptimization';
import balanceSyncManager from './utils/balanceSync';
import AppRoutes from './approutes';
import ErrorBoundary from './components/common/ErrorBoundary';
import { useAuth } from './contexts/AuthContext'; // Import useAuth
import { LandingProvider } from './contexts/LandingContext';

const PerformanceMonitor = lazy(() => import('./components/debug/PerformanceMonitor'));
// Suppress console logs in production
if (import.meta.env.PROD) {
  console.log = () => {};
  console.warn = () => {};
}

function App() {
  // Local states that will be synced with AuthContext
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [theme, setTheme] = useState('light');
  const [loading, setLoading] = useState(true); // Initial app loading state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false); // User's new sidebar state

  // Use the useAuth context for managing global auth state
  const { 
    user: authContextUser, 
    isAuthenticated: authContextIsAuthenticated, 
    loading: authContextLoading, 
    login: authContextLogin, 
    logout: authContextLogout 
  } = useAuth();

  // Sync local states with AuthContext's global state
  useEffect(() => {
    setUser(authContextUser);
    setIsAuthenticated(authContextIsAuthenticated);
    setLoading(authContextLoading);
  }, [authContextUser, authContextIsAuthenticated, authContextLoading]);

  const { debounce, throttle, cache } = usePerformanceOptimization('App');

  const {
    isGlobalSearchOpen,
    handleGlobalSearch,
    closeGlobalSearch
  } = useGlobalSearch();

  // Order modal functionality
  const { orderModalState, closeOrderModal } = useOrderIntegration();

  // Order confirmation modal state
  const [confirmationModalState, setConfirmationModalState] = useState({
    isOpen: false,
    orderData: null,
    stockData: null,
    orderSummary: null,
    profitLossEstimate: null,
    onConfirm: null,
    isProcessing: false
  });

  const handleShowConfirmation = useCallback((confirmationData) => {
    setConfirmationModalState({
      isOpen: true,
      ...confirmationData,
      isProcessing: false
    });
  }, []);

  const handleCloseConfirmation = useCallback(() => {
    setConfirmationModalState(prevState => {
      if (!prevState.isOpen) return prevState;
      return {
        ...prevState,
        isOpen: false,
        isProcessing: false
      };
    });
  }, []);

  const confirmOrderRef = useRef(null);

  const handleConfirmOrder = useCallback(async () => {
    const onConfirm = confirmOrderRef.current;
    if (onConfirm) {
      setConfirmationModalState(prev => ({ ...prev, isProcessing: true }));
      try {
        await onConfirm();
        setTimeout(() => {
          handleCloseConfirmation();
        }, 2000);
      } catch (error) {
        console.error('Order confirmation failed:', error);
        setConfirmationModalState(prev => ({ ...prev, isProcessing: false }));
      }
    }
  }, [handleCloseConfirmation]);

  useEffect(() => {
    confirmOrderRef.current = confirmationModalState.onConfirm;
  }, [confirmationModalState.onConfirm]);

  // Handle OAuth callback and initial token/user check
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Only run this effect if AuthContext is done loading
    if (authContextLoading) return;

    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    const userData = params.get('user');
    const oauthError = params.get('error');

    if (oauthError) {
      toast.error(`Login failed: ${oauthError.replace(/_/g, ' ')}`);
      // Clean URL
      navigate(location.pathname, { replace: true });
      return; // Exit as error handled
    }

    if (token && userData) {
      try {
        const parsedUser = JSON.parse(decodeURIComponent(userData));
        console.log("App.jsx: OAuth success, user data:", parsedUser);
        
        // Use the login function from AuthContext to update global state and localStorage
        authContextLogin(parsedUser, token); 
        
        toast.success('Welcome back!');
        balanceSyncManager.initialize();

        // Clean URL and redirect to dashboard
        navigate('/dashboard', { replace: true }); 

      } catch (error) {
        console.error('App.jsx: Error parsing OAuth user data:', error);
        authContextLogout(); // Ensure AuthContext is also logged out
        toast.error('Failed to process login data.');
        navigate('/login', { replace: true });
      }
    } else if (!authContextIsAuthenticated && !localStorage.getItem('token')) {
      // If no OAuth params and not already authenticated, and no token in localStorage,
      // then we might be on a page that requires auth, or it's a fresh load.
      // Set loading to false here if it's not handled by AuthContext's initial check
      // For now, relying on AuthContext's loading state.
    }
    // Ensure loading is false after all checks if not already set by AuthContext
    if (loading) setLoading(false); 

  }, [location.search, navigate, authContextLogin, authContextLogout, authContextLoading, authContextIsAuthenticated, loading]);

  // Theme management
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  }, [theme]);

  // These handlers now call the AuthContext functions
  const handleLogin = useCallback((userData, token) => {
    authContextLogin(userData, token);
    toast.success('Welcome back!');
  }, [authContextLogin]);

  const handleLogout = useCallback(() => {
    authContextLogout();
    toast.info('Logged out successfully');
    navigate('/login'); // Redirect to login after logout
  }, [authContextLogout, navigate]);

  const handleSignup = useCallback((userData, token) => {
    authContextLogin(userData, token);
    toast.success('Account created successfully!');
  }, [authContextLogin]);

  const handleUpdateProfile = (updatedUser) => {
    // When profile is updated, update AuthContext and localStorage
    const storedToken = localStorage.getItem('token');
    authContextLogin(updatedUser, storedToken); 
    toast.success('Profile updated successfully!');
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner lg"></div>
        <p className="loading-text">Loading TradeBro...</p>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <LandingProvider>
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
          sidebarCollapsed={sidebarCollapsed} // Pass sidebar state
          setSidebarCollapsed={setSidebarCollapsed} // Pass sidebar setter
          orderModalState={orderModalState}
          closeOrderModal={closeOrderModal}
          handleShowConfirmation={handleShowConfirmation}
          confirmationModalState={confirmationModalState}
          handleCloseConfirmation={handleCloseConfirmation}
          handleConfirmOrder={handleConfirmOrder}
        />

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
            background: theme === 'dark' ? 'var(--bg-secondary)' : '#FFFFFF',
            color: theme === 'dark' ? '#F9FAFB' : '#111827'
          }}
        />

        <Suspense fallback={null}>
          <PerformanceMonitor enabled={process.env.NODE_ENV === 'development'} />
        </Suspense>
        </div>
      </LandingProvider>
    </ErrorBoundary>
  );
}

const AppContent = memo(function AppContent({
  isAuthenticated,
  user,
  loading, // Receive loading prop
  theme,
  onLogin,
  onLogout,
  onSignup,
  onUpdateProfile,
  toggleTheme,
  isGlobalSearchOpen,
  handleGlobalSearch,
  closeGlobalSearch,
  sidebarCollapsed, // Receive sidebar state
  setSidebarCollapsed, // Receive sidebar setter
  orderModalState,
  closeOrderModal,
  handleShowConfirmation,
  confirmationModalState,
  handleCloseConfirmation,
  handleConfirmOrder
}) {
  const location = useLocation();
  const isLandingPage = location.pathname === '/';
  const isAuthPage = location.pathname === '/login' || location.pathname === '/signup' || location.pathname === '/forgot-password';
  
  return (
    <>
      <Sidebar
        isCollapsed={sidebarCollapsed} // Use passed state
        setIsCollapsed={setSidebarCollapsed} // Use passed setter
      />
      {/* Main Content classes based on sidebar state and page type */}
      <main className={`${(isLandingPage || isAuthPage) ? "main-content-full" : "main-content"} ${isAuthenticated && !isLandingPage && !isAuthPage ? (sidebarCollapsed ? "sidebar-collapsed" : "with-sidebar") : ""}`}>
        <AppRoutes
          isAuthenticated={isAuthenticated}
          user={user}
          loading={loading} // Pass loading prop to AppRoutes
          onLogin={onLogin}
          onSignup={onSignup}
          onLogout={onLogout}
          onUpdateProfile={onUpdateProfile}
          theme={theme}
          toggleTheme={toggleTheme}
        />
      </main>

      <AuthStatus isAuthenticated={isAuthenticated} user={user} />

      <GlobalSearchModal
        isOpen={isGlobalSearchOpen}
        onClose={closeGlobalSearch}
        onSearch={handleGlobalSearch}
      />

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

      {!isLandingPage && !isAuthPage && (
        <>
          <VoiceCommandModal />
          <VoiceStatusIndicator />
        </>
      )}

      <OrderModal
        isOpen={orderModalState.isOpen}
        onClose={closeOrderModal}
        stockData={orderModalState.stockData}
        initialOrderType={orderModalState.orderType}
        onOrderPlaced={closeOrderModal}
        onShowConfirmation={handleShowConfirmation}
      />

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
  );
});

export default App;