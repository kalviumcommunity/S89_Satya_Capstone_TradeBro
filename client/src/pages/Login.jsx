import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import "./AuthPages.css";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "email") setEmail(value);
    else if (name === "password") setPassword(value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return alert("Email and password are required");

    try {
      const response = await axios.post("http://localhost:5000/api/auth/login", {
        email,
        password,
      });
      console.log("Login successful:", response.data);
      alert("Login successful!");
      navigate("/Landingpage");
    } catch (error) {
      console.error("Login error:", error.response?.data || error.message);
      alert("Login failed. Please try again.");
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = "http://localhost:5000/api/auth/auth/google";
  };

  return (
    <div className="auth-full-bg">
      <div className="auth-box">
        <h2 className="auth-title">Log In</h2>
        <form onSubmit={handleSubmit} className="auth-form">
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={email}
            onChange={handleChange}
            className="auth-input"
            required
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={password}
            onChange={handleChange}
            className="auth-input"
            required
          />
          <button type="submit" className="auth-btn">Log In</button>
        </form>
        <p className="auth-option">
          Don't have an account? <Link to="/signup">Sign Up</Link>
        </p>
        <p className="auth-forgot">
          <Link to="/forgotpassword">Forgot Password?</Link>
        </p>
        <div className="google-signup">
          <p>Or</p>
          <button className="google-button" onClick={handleGoogleLogin}>
          <img
            src="/Google.jpg"
            alt="Google logo"
          />
            Log In with Google
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
