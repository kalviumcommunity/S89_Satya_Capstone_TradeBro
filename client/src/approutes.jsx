// AppRoutes.jsx
import React from "react";
import { Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import OpeningPage from "./pages/openingPage";
import LandingPage from "./pages/landingPage";
import ForgetPassword from './pages/ForgetPassword';
import ResetPassword from './pages/ResetPassword';


const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />}/>
      <Route path="/signup" element={<Signup />}/>
      <Route path="/" element={<OpeningPage />}/>
      <Route path="/landingPage" element={<LandingPage />}/>
      <Route path="/forgot-password" element={<ForgetPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
    </Routes>
  );
};

export default AppRoutes;
