import React, { useState } from "react";
import axios from "axios";
import "./AuthPages.css";
import { useNavigate, Link } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
import Magnet from "../UI/Magnet";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("http://localhost:5000/api/auth/login", {
        email,
        password,
      });
      alert("Login successful!");
      localStorage.setItem("token", res.data.token);
      navigate("/landingPage");
    } catch (err) {
      console.error("Login error:", err.response?.data || err.message);
      alert(err.response?.data?.message || "Login failed.");
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const decoded = jwtDecode(credentialResponse.credential);
      const res = await axios.post("http://localhost:5000/api/auth/google-login", {
        email: decoded.email,
        name: decoded.name,
        googleId: decoded.sub,
      });

      localStorage.setItem("token", res.data.token);
      alert("Google login successful!");
      navigate("/landingPage");
    } catch (error) {
      console.error("Google login error:", error);
      alert("Google login failed.");
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2 className="auth-title">Login</h2>
        <form onSubmit={handleSubmit} className="auth-form">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="auth-input"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="auth-input"
            required
          />
          <button type="submit" className="auth-btn">Login</button>
        </form>

        <p className="auth-option">
          Don't have an account? <Link to="/signup">Sign Up</Link>
        </p>
        <p className="auth-option">
          <Link to="/reset-password" className="auth-link">Reset Password</Link> or{" "}
          <Link to="/forgot-password" className="auth-link">Forgot Password?</Link>
        </p>

        <div className="google-login">
        <Magnet padding={50} disabled={false} magnetStrength={50}>
          <GoogleLogin onSuccess={handleGoogleSuccess} onError={() => alert("Google login error")} />
        </Magnet>
        </div>
      </div>
    </div>
  );
};

export default Login;