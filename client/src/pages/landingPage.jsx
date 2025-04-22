import React from "react";
import { useNavigate } from "react-router-dom";
import "./landingPage.css";

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="landing-page">
      <header className="hero">
        <div className="hero-overlay" />
        <div className="hero-content">
          <h1>Welcome to <span className="brand-name">TradeBro</span></h1>
          <p>Your gateway to smarter, hands-on stock trading.</p>
          <button className="get-started-btn" onClick={() => navigate("/portfolio")}>
            Get Started
          </button>
        </div>
      </header>

      <section className="ticker-section">
        <div className="ticker-container">
          <marquee className="ticker">
            AAPL 187.43 ▲1.12% &nbsp;&nbsp; TSLA 716.24 ▼0.82% &nbsp;&nbsp; AMZN 3440.16 ▲0.63% &nbsp;&nbsp; GOOGL 2830.92 ▲0.74%
          </marquee>
        </div>
      </section>

      <section className="features">
        <div className="feature">
          <h3>📈 Real-Time Data</h3>
          <p>Track live market trends and performance metrics with up-to-the-minute accuracy.</p>
        </div>
        <div className="feature">
          <h3>📊 Build a Demo Portfolio</h3>
          <p>Simulate your stock strategy risk-free with our intuitive portfolio builder.</p>
        </div>
        <div className="feature">
          <h3>🤖 AI Trading Assistant</h3>
          <p>Receive intelligent, AI-powered insights to optimize your trading decisions.</p>
        </div>
      </section>

      <footer>
        <p>© 2025 <span className="brand-name">TradeBro</span>. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Landing;
