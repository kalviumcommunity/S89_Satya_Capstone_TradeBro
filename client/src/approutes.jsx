import { Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect } from "react";
import { toast } from "react-toastify";
import { useLanding } from "./contexts/LandingContext";

// Pages
import LandingPage from "./pages/landingPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import Dashboard from "./pages/Dashboard";
import Portfolio from "./pages/portfolio";
import Trading from "./pages/Trading";
import Charts from "./pages/charts";
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
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import NotFound from "./pages/NotFound";

import { PortfolioProvider } from "./contexts/PortfolioContext";

// OAuth Callback Component
const OAuthCallback = ({ onLogin }) => {
  const navigate = useNavigate();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const userParam = urlParams.get('user');
    const error = urlParams.get('error');

    if (error) {
      toast.error('Google authentication failed. Please try again.');
      navigate('/login', { replace: true });
      return;
    }

    if (token && userParam && onLogin) {
      try {
        const userData = JSON.parse(decodeURIComponent(userParam));
        onLogin(userData, token);
        toast.success(`Welcome ${userData.fullName}!`);
        navigate('/dashboard', { replace: true });
      } catch (error) {
        console.error('Error parsing OAuth data:', error);
        toast.error('Authentication failed. Please try again.');
        navigate('/login', { replace: true });
      }
    } else {
      navigate('/login', { replace: true });
    }
  }, [onLogin, navigate]);

  return (
    <div className="loading-container">
      <div className="loading-spinner lg"></div>
      <p className="loading-text">Completing authentication...</p>
    </div>
  );
};

// ✅ Route Protection
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
  const { hasVisitedLanding } = useLanding();
  
  if (isAuthenticated) {
    const redirectUrl = localStorage.getItem("redirectAfterLogin");
    localStorage.removeItem("redirectAfterLogin");
    return <Navigate to={redirectUrl || "/dashboard"} replace />;
  }
  
  if (!hasVisitedLanding && window.location.pathname !== '/') {
    return <Navigate to="/" replace />;
  }
  
  return children;
};

// ✅ Page Animation Config
const pageVariants = {
  initial: { opacity: 0, y: 20 },
  in: { opacity: 1, y: 0 },
  out: { opacity: 0, y: -20 },
};

const pageTransition = {
  type: "tween",
  ease: "anticipate",
  duration: 0.4,
};

const AppRoutes = ({
  isAuthenticated = false,
  user = null,
  loading = false,
  onLogin,
  onSignup,
  onLogout,
  onUpdateProfile,
  theme,
  toggleTheme,
}) => {
  const location = useLocation();

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
          {/* Root Path */}
          <Route
            path="/"
            element={
              isAuthenticated ? <Navigate to="/dashboard" /> : <LandingPage />
            }
          />

          {/* Auth Pages */}
          <Route
            path="/login"
            element={
              <PublicRoute isAuthenticated={isAuthenticated}>
                <LoginPage onLogin={onLogin} />
              </PublicRoute>
            }
          />
          <Route
            path="/signup"
            element={
              <PublicRoute isAuthenticated={isAuthenticated}>
                <SignupPage onSignup={onSignup} />
              </PublicRoute>
            }
          />
          <Route
            path="/forgot-password"
            element={
              <PublicRoute isAuthenticated={isAuthenticated}>
                <ForgotPasswordPage />
              </PublicRoute>
            }
          />


          {/* Legal Pages */}
          <Route
            path="/terms"
            element={
              <ProtectedRoute
                isAuthenticated={isAuthenticated}
                loading={loading}
                user={user}
              >
                <TermsOfService />
              </ProtectedRoute>
            }
          />
          <Route
            path="/privacy"
            element={
              <ProtectedRoute
                isAuthenticated={isAuthenticated}
                loading={loading}
                user={user}
              >
                <PrivacyPolicy />
              </ProtectedRoute>
            }
          />

          {/* Dashboard & Features */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute
                isAuthenticated={isAuthenticated}
                loading={loading}
                user={user}
              >
                <Dashboard user={user} theme={theme} onLogin={onLogin} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/portfolio"
            element={
              <ProtectedRoute
                isAuthenticated={isAuthenticated}
                loading={loading}
                user={user}
              >
                <Portfolio user={user} theme={theme} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/trading"
            element={
              <ProtectedRoute
                isAuthenticated={isAuthenticated}
                loading={loading}
                user={user}
              >
                <Trading user={user} theme={theme} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/charts"
            element={
              <ProtectedRoute
                isAuthenticated={isAuthenticated}
                loading={loading}
                user={user}
              >
                <Charts user={user} theme={theme} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/watchlist"
            element={
              <ProtectedRoute
                isAuthenticated={isAuthenticated}
                loading={loading}
                user={user}
              >
                <Watchlist user={user} theme={theme} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders"
            element={
              <ProtectedRoute
                isAuthenticated={isAuthenticated}
                loading={loading}
                user={user}
              >
                <Orders user={user} theme={theme} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/history"
            element={
              <ProtectedRoute
                isAuthenticated={isAuthenticated}
                loading={loading}
                user={user}
              >
                <History user={user} theme={theme} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/news"
            element={
              <ProtectedRoute
                isAuthenticated={isAuthenticated}
                loading={loading}
                user={user}
              >
                <News user={user} theme={theme} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/notifications"
            element={
              <ProtectedRoute
                isAuthenticated={isAuthenticated}
                loading={loading}
                user={user}
              >
                <Notifications user={user} theme={theme} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/saytrix"
            element={
              <ProtectedRoute
                isAuthenticated={isAuthenticated}
                loading={loading}
                user={user}
              >
                <Saytrix user={user} theme={theme} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute
                isAuthenticated={isAuthenticated}
                loading={loading}
                user={user}
              >
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
              <ProtectedRoute
                isAuthenticated={isAuthenticated}
                loading={loading}
                user={user}
              >
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/stock/:symbol"
            element={
              <ProtectedRoute
                isAuthenticated={isAuthenticated}
                loading={loading}
                user={user}
              >
                <StockDetail user={user} theme={theme} />
              </ProtectedRoute>
            }
          />

          {/* Redirect Shortcuts */}
          <Route path="/home" element={<Navigate to="/" replace />} />
          <Route
            path="/app"
            element={<Navigate to="/dashboard" replace />}
          />
          <Route path="/trade" element={<Navigate to="/trading" replace />} />
          <Route path="/stocks" element={<Navigate to="/charts" replace />} />
          <Route path="/chat" element={<Navigate to="/saytrix" replace />} />
          <Route path="/ai" element={<Navigate to="/saytrix" replace />} />

          {/* 404 Not Found */}
          <Route
            path="*"
            element={
              isAuthenticated ? <NotFound /> : <Navigate to="/login" replace />
            }
          />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
};

export default AppRoutes;
