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
import Settings from "./pages/Settings";
import PageTransition from "./components/PageTransition";

const AppRoutes = () => {
  const location = useLocation();

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
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
      </Routes>
    </AnimatePresence>
  );
};

export default AppRoutes;
