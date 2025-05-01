import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AOS from "aos";
import "aos/dist/aos.css";
import { FiMenu, FiX, FiBarChart2, FiPieChart, FiTrendingUp, FiArrowRight } from "react-icons/fi";
import "./LandingPage.css";

const LandingPage = () => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    AOS.init({ duration: 1200, easing: "ease-in-out", once: false });
  }, []);

  const handleGetStarted = () => navigate("/signup");

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <div className="landing-container">
      <header className="navbar" data-aos="fade-down">
        <div className="logo">TradeBro</div>
        <button className="mobile-menu-btn" onClick={toggleMobileMenu}>
          {mobileMenuOpen ? <FiX /> : <FiMenu />}
        </button>
        <nav className={`nav-links ${mobileMenuOpen ? 'mobile-active' : ''}`}>
          <a href="#features" onClick={() => setMobileMenuOpen(false)}>Features</a>
          <a href="#about" onClick={() => setMobileMenuOpen(false)}>About</a>
          <a href="#contact" onClick={() => setMobileMenuOpen(false)}>Contact</a>
          <button className="cta-button" onClick={handleGetStarted}>
            Get Started
          </button>
        </nav>
      </header>

      <section className="hero-section" data-aos="fade-up">
        <div className="hero-content">
          <h1>Master the Markets with Confidence</h1>
          <p>
            TradeBro is your personal stock market companion — track live data, simulate portfolios, and unlock insights with AI-powered tools.
          </p>
          <div className="hero-buttons">
            <button className="primary-btn" onClick={handleGetStarted}>Get Started <FiArrowRight style={{ marginLeft: '8px', verticalAlign: 'middle' }} /></button>
            <button className="secondary-btn">View Demo</button>
          </div>
        </div>
        <div className="hero-visual" data-aos="zoom-in">
          <img src="/images/dashboard-mockup.jpg" alt="Stock Market Dashboard" />
        </div>
      </section>

      <section className="features-section" id="features">
        <h2 className="section-title" data-aos="fade-up">Key Features</h2>
        <div className="feature" data-aos="fade-right">
          <FiBarChart2 style={{ fontSize: '3rem', color: '#1B8E99', marginBottom: '1rem' }} />
          <h3>Live NSE/BSE Data</h3>
          <p>Stream real-time stock prices, volumes, and technical indicators from Indian and global markets.</p>
        </div>
        <div className="feature" data-aos="fade-left">
          <FiPieChart style={{ fontSize: '3rem', color: '#1B8E99', marginBottom: '1rem' }} />
          <h3>Interactive Demo Portfolio</h3>
          <p>Test your investment strategies risk-free. Simulate trades, monitor profits, and learn by doing.</p>
        </div>
        <div className="feature" data-aos="fade-up">
          <FiTrendingUp style={{ fontSize: '3rem', color: '#1B8E99', marginBottom: '1rem' }} />
          <h3>AI-Powered Chat Assistant</h3>
          <p>Ask anything about stocks, trends, or financial terms — our AI assistant delivers instant answers and analysis.</p>
        </div>
      </section>

      <section className="about-section" id="about" data-aos="fade-up">
        <h2>About TradeBro</h2>
        <p>
          Built for new investors and seasoned traders alike, TradeBro offers a modern platform for learning, testing, and mastering the stock market.
        </p>
        <p>
          From real-time market feeds to intelligent chat assistance and demo trading, we help you trade smarter — with confidence and clarity.
        </p>
      </section>

      <section className="gallery-section" data-aos="fade-up">
        <h2>Platform Showcase</h2>
        <div className="gallery-grid">
          <div className="gallery-item" data-aos="fade-up">
            <img src="/images/trading-screen.jpg" alt="Trading Screen" />
            <div className="gallery-caption">
              <h4>Advanced Trading Interface</h4>
            </div>
          </div>
          <div className="gallery-item" data-aos="fade-up" data-aos-delay="100">
            <img src="/images/portfolio-analysis.jpg" alt="Portfolio Analysis" />
            <div className="gallery-caption">
              <h4>Portfolio Performance Analytics</h4>
            </div>
          </div>
          <div className="gallery-item" data-aos="fade-up" data-aos-delay="200">
            <img src="/images/mobile-app.jpg" alt="Mobile App" />
            <div className="gallery-caption">
              <h4>Mobile Trading Experience</h4>
            </div>
          </div>
        </div>
      </section>

      <section className="testimonials-section" data-aos="fade-up">
        <h2>What Our Users Say</h2>
        <div className="testimonials">
          <div className="testimonial" data-aos="fade-right">
            <p>
              “TradeBro helped me understand the stock market without risking real money. The demo feature is incredibly useful.”
            </p>
            <h4>- Ramesh P., Beginner Investor</h4>
          </div>
          <div className="testimonial" data-aos="fade-left">
            <p>
              “I love how intuitive the screener and AI bot are. It’s like having a financial expert with me 24/7.”
            </p>
            <h4>- Sneha M., Technical Analyst</h4>
          </div>
        </div>
      </section>

      <section className="contact-section" id="contact" data-aos="fade-up">
        <h2>Contact Us</h2>
        <p>Have a question or suggestion? We'd love to hear from you.</p>
        <form className="contact-form">
          <input type="text" placeholder="Your Name" required />
          <input type="email" placeholder="Your Email" required />
          <textarea placeholder="Your Message" required></textarea>
          <button type="submit" className="primary-btn">Send Message</button>
        </form>
      </section>

      <footer className="footer" data-aos="fade-up">
        <p>© 2025 TradeBro. All rights reserved.</p>
        <p>
          Follow us:
          <a href="https://twitter.com" target="_blank" rel="noopener noreferrer"> Twitter </a>|
          <a href="https://facebook.com" target="_blank" rel="noopener noreferrer"> Facebook </a>|
          <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer"> LinkedIn </a>
        </p>
      </footer>
    </div>
  );
};

export default LandingPage;
