// AppRoutes.jsx
import React, { useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import LandingPage from "./pages/landingPage";
import PortfolioPage from "./pages/portfolio";
import ChartsPage from "./pages/charts";
import Dashboard from "./pages/Dashboard";
import Settings from "./pages/Settings";
import News from "./pages/News";
import Notifications from "./pages/Notifications";
import Profile from "./pages/Profile";
import Watchlist from "./pages/Watchlist";
import History from "./pages/History";
import Orders from "./pages/Orders";
import SaytrixPage from "./pages/SaytrixPage";
import Login from "./pages/Login";
import FloatingSaytrix from "./components/saytrix/FloatingSaytrix";
import PageTransition from "./components/PageTransition";
import ProtectedRoute from "./components/ProtectedRoute";


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
          <Route path="/" element={
            <PageTransition>
              <LandingPage />
            </PageTransition>
          }/>
          <Route path="/login" element={
            <PageTransition>
              <Login />
            </PageTransition>
          }/>
          <Route path="/signup" element={
            <PageTransition>
              <Login />
            </PageTransition>
          }/>
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <PageTransition>
                <Dashboard />
              </PageTransition>
            </ProtectedRoute>
          }/>
          <Route path="/charts" element={
            <PageTransition>
              <ChartsPage />
            </PageTransition>
          }/>
          <Route path="/portfolio" element={
            <PageTransition>
              <PortfolioPage />
            </PageTransition>
          }/>
          <Route path="/settings" element={
            <ProtectedRoute>
              <PageTransition>
                <Settings />
              </PageTransition>
            </ProtectedRoute>
          }/>
          <Route path="/news" element={
            <ProtectedRoute>
              <PageTransition>
                <News />
              </PageTransition>
            </ProtectedRoute>
          }/>
          <Route path="/notifications" element={
            <ProtectedRoute>
              <PageTransition>
                <Notifications />
              </PageTransition>
            </ProtectedRoute>
          }/>
          <Route path="/profile" element={
            <ProtectedRoute>
              <PageTransition>
                <Profile />
              </PageTransition>
            </ProtectedRoute>
          }/>
          <Route path="/watchlist" element={
            <ProtectedRoute>
              <PageTransition>
                <Watchlist />
              </PageTransition>
            </ProtectedRoute>
          }/>
          <Route path="/history" element={
            <ProtectedRoute>
              <PageTransition>
                <History />
              </PageTransition>
            </ProtectedRoute>
          }/>
          <Route path="/orders" element={
            <ProtectedRoute>
              <PageTransition>
                <Orders />
              </PageTransition>
            </ProtectedRoute>
          }/>
          <Route path="/saytrix" element={
            <PageTransition>
              <SaytrixPage />
            </PageTransition>
          }/>
          {/* Legacy chatbot route redirects to Saytrix */}
          <Route path="/chatbot" element={
            <PageTransition>
              <SaytrixPage />
            </PageTransition>
          }/>
        </Routes>
      </AnimatePresence>

      {/* Floating Saytrix - Available on all pages except landing and saytrix page */}
      {location.pathname !== "/" &&
       location.pathname !== "/login" &&
       location.pathname !== "/signup" &&
       location.pathname !== "/forgotpassword" &&
       location.pathname !== "/resetpassword" &&
       location.pathname !== "/chatbot" &&
       location.pathname !== "/saytrix" &&
       location.pathname !== "/saytrix-demo" &&
       location.pathname !== "/jarvis-demo" && (
        <FloatingSaytrix />
      )}
    </>
  );
};

export default AppRoutes;
