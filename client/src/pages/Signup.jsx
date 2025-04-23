import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import "./AuthPages.css";
import { GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";

const Signup = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (form.password !== form.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    try {
      const res = await axios.post("http://localhost:5000/api/auth/signup", {
        username: form.username,
        email: form.email,
        password: form.password,
      });
      alert("Signup successful!");
      console.log("Signup response:", res.data);
      navigate("/landingPage");
    } catch (err) {
      console.error("Signup error:", err);
      alert("Signup failed. Please try again.");
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const decoded = jwtDecode(credentialResponse.credential);
      const res = await axios.post("http://localhost:5000/api/auth/google-signup", {
        email: decoded.email,
        name: decoded.name,
        googleId: decoded.sub,
      });

      localStorage.setItem("token", res.data.token);
      alert("Google signup successful!");
      navigate("/landingPage");
    } catch (error) {
      console.error("Google signup error:", error);
      alert("Google signup failed.");
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2 className="auth-title">Sign Up</h2>
        <form onSubmit={handleSubmit} className="auth-form">
          <input
            type="text"
            name="username"
            placeholder="Username"
            value={form.username}
            onChange={handleChange}
            className="auth-input"
            required
          />
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            className="auth-input"
            required
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            className="auth-input"
            required
          />
          <input
            type="password"
            name="confirmPassword"
            placeholder="Confirm Password"
            value={form.confirmPassword}
            onChange={handleChange}
            className="auth-input"
            required
          />
          <button type="submit" className="auth-btn">Create Account</button>
        </form>
        <p className="auth-option">
          Already have an account? <Link to="/login">Log In</Link>
        </p>
        <div className="google-login">
          <GoogleLogin onSuccess={handleGoogleSuccess} onError={() => alert("Google signup error")} />
        </div>
      </div>
    </div>
  );
};

export default Signup;