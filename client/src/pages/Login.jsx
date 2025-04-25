import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import "./AuthPages.css";

const Login = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.post(
        "http://localhost:5000/api/auth/login",
        {
          email: form.email,
          password: form.password,
        },
        { withCredentials: true } // Allow credentials for session storage
      );
      alert("Login successful!");
      console.log("Login response:", res.data);
      navigate("/dashboard");
    } catch (err) {
      console.error("Login error:", err);
      alert("Login failed. Please try again.");
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = "http://localhost:5000/api/auth/auth/google"; // Redirect to Google OAuth
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2 className="auth-title">Log In</h2>
        <form onSubmit={handleSubmit} className="auth-form">
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
          <button type="submit" className="auth-btn">Log In</button>
        </form>
        <p className="auth-option">
          Don't have an account? <Link to="/signup">Sign Up</Link>
        </p>
        <div className="google-signup">
          <p>Or</p>
          <button className="google-button" onClick={handleGoogleLogin}>
            Log In with Google
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
