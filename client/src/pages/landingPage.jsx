import React from "react";
import "./LandingPage.css";
import { useNavigate } from "react-router-dom";

const LandingPage = () => {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate("/portfolio");
  };

  const handleLogout = () => {
    localStorage.removeItem("authToken"); // Remove token from localStorage
    alert("You have logged out successfully.");
    navigate("/login"); // Redirect to login page
  };

  return (
    <div className="landing-container">
      <div className="landing-content">
        <div className="hero">
          <h1 className="hero-title">Master the Markets</h1>
          <p className="hero-subtitle">
            Empower your trading journey with real-time insights, AI-driven tools, and powerful simulations.
          </p>
          <button className="get-started-btn" onClick={handleGetStarted}>
            Get Started
          </button>
          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>

        <section className="about-section">
          <h2>What is Stock Marketing?</h2>
          <p>
            Stock marketing refers to the global ecosystem of buying and selling shares of publicly listed companies.
            It’s where companies raise capital and investors grow wealth. The market thrives on supply and demand,
            news, trends, and investor sentiment.
          </p>
        </section>

        <div className="info-grid">
          <div className="info-card">
            <h3>📈 Wealth Building</h3>
            <p>Investing in stocks is one of the best long-term strategies to build personal wealth and grow assets.</p>
          </div>
          <div className="info-card">
            <h3>📊 Market Insight</h3>
            <p>Understand how companies perform, respond to global events, and adjust with time to make informed decisions.</p>
          </div>
          <div className="info-card">
            <h3>🤖 Smart Tools</h3>
            <p>With AI-driven platforms like TradeBro, users can analyze trends, forecast moves, and simulate trading without risks.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
