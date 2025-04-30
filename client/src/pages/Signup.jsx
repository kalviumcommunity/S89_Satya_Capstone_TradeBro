import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import "./AuthPages.css";

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
      const res = await axios.post(
        "http://localhost:5000/api/auth/signup",
        {
          username: form.username,
          email: form.email,
          password: form.password,
        },
        { withCredentials: true }
      );
      alert("Signup successful!");
      navigate("/Landingpage");
    } catch (err) {
      console.error("Signup error:", err.response?.data || err.message);
      alert("Signup failed. Please try again.");
    }
  };

  const handleGoogleSignup = () => {
    window.location.href = "http://localhost:5000/api/auth/auth/google";
  };

  return (
    <div className="auth-full-bg">
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
          <button type="submit" className="auth-btn">Sign Up</button>
        </form>
        <p className="auth-option">
          Already have an account? <Link to="/login">Log In</Link>
        </p>
        <div className="google-signup">
          <p>Or</p>
          <button className="google-button" onClick={handleGoogleSignup}>
            <img src="/Google.png"
              style={{
                width:"20px",
                height:"20px",
                borderRadius: "50%",
                marginRight: "10px",
                verticalAlign: "middle",
              }}
            />
            Sign Up with Google
          </button>
        </div>
      </div>
    </div>
  );
};

export default Signup;
