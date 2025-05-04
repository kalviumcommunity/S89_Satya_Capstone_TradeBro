// AppRoutes.jsx
import React, { useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import LandingPage from "./pages/landingPage";
import ForgetPassword from './pages/ForgetPassword';
import ResetPassword from './pages/ResetPassword';
import PortfolioPage from "./pages/portfolio";
import Dashboard from "./pages/Dashboard";
import Settings from "./pages/Settings";
import News from "./pages/News";
import Notifications from "./pages/Notifications";
import Profile from "./pages/Profile";
import Watchlist from "./pages/Watchlist";
import History from "./pages/History";
import Orders from "./pages/Orders";
import TradingAssistantPage from "./pages/TradingAssistantPage";
import PageTransition from "./components/PageTransition";
import TradingAssistant from "./components/TradingAssistant";

const AppRoutes = () => {
  const location = useLocation();

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/login" element={
            <PageTransition>
              <Login />
            </PageTransition>
          }/>
          <Route path="/signup" element={
            <PageTransition>
              <Signup />
            </PageTransition>
          }/>
          <Route path="/" element={
            <PageTransition>
              <LandingPage />
            </PageTransition>
          }/>
          <Route path="/forgotpassword" element={
            <PageTransition>
              <ForgetPassword />
            </PageTransition>
          } />
          <Route path="/resetpassword" element={
            <PageTransition>
              <ResetPassword />
            </PageTransition>
          } />
          <Route path="/dashboard" element={
            <PageTransition>
              <Dashboard />
            </PageTransition>
          }/>
          <Route path="/portfolio" element={
            <PageTransition>
              <PortfolioPage />
            </PageTransition>
          }/>
          <Route path="/settings" element={
            <PageTransition>
              <Settings />
            </PageTransition>
          }/>
          <Route path="/news" element={
            <PageTransition>
              <News />
            </PageTransition>
          }/>
          <Route path="/notifications" element={
            <PageTransition>
              <Notifications />
            </PageTransition>
          }/>
          <Route path="/profile" element={
            <PageTransition>
              <Profile />
            </PageTransition>
          }/>
          <Route path="/watchlist" element={
            <PageTransition>
              <Watchlist />
            </PageTransition>
          }/>
          <Route path="/history" element={
            <PageTransition>
              <History />
            </PageTransition>
          }/>
          <Route path="/orders" element={
            <PageTransition>
              <Orders />
            </PageTransition>
          }/>
          <Route path="/assistant" element={
            <PageTransition>
              <TradingAssistantPage />
            </PageTransition>
          }/>
        </Routes>
      </AnimatePresence>

      {/* Trading Assistant is available on all pages except landing, login, signup, and the dedicated assistant page */}
      {location.pathname !== "/" &&
       location.pathname !== "/login" &&
       location.pathname !== "/signup" &&
       location.pathname !== "/forgotpassword" &&
       location.pathname !== "/resetpassword" &&
       location.pathname !== "/assistant" && (
        <TradingAssistant />
      )}
    </>
  );
};

export default AppRoutes;
