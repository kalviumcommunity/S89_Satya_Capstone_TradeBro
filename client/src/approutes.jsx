// AppRoutes.jsx
import React from "react";
import { Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import LandingPage from "./pages/landingPage";
import ForgetPassword from './pages/ForgetPassword';
import ResetPassword from './pages/ResetPassword';
import PortfolioPage from "./pages/portfolio";


const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />}/>
      <Route path="/signup" element={<Signup />}/>
      <Route path="/" element={<LandingPage />}/>
      <Route path="/forgotpassword" element={<ForgetPassword />} />
      <Route path="/resetpassword" element={<ResetPassword />} />
      <Route path="/portfolio" element={<PortfolioPage />}/>
    </Routes>
  );
};

export default AppRoutes;
