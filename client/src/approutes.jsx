// AppRoutes.jsx
import React from "react";
import { Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Layout from "./components/layout";
import WatchList from "./pages/watchList";
import Portfolio from "./pages/portfolio";
import Orders from "./pages/orders";
import History from "./pages/history";
import Settings from "./pages/settings";
import TradingAssistent from "./pages/TradingAssistent";
import OpeningPage from "./pages/openingPage";
import LandingPage from "./pages/landingPage";

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />}/>
      <Route path="/signup" element={<Signup />}/>
      <Route path="/" element={<OpeningPage />}/>
      <Route path="/openingPage" element={<OpeningPage />}/>
      <Route path="/landingPage" element={<LandingPage />}/>
      <Route path="/watchlist" element={<WatchList />}/>
      <Route path="/portfolio" element={<Portfolio />}/>
      <Route path="/orders" element={<Orders />}/>
      <Route path="/history" element={<History />}/>
      <Route path="/settings" element={<Settings />}/>
      <Route path="/assistant" element={<TradingAssistent />}/>
    </Routes>
  );
};

export default AppRoutes;
