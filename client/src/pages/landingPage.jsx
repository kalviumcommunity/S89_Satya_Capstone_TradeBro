import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AOS from "aos";
import "aos/dist/aos.css";
import "./LandingPage.css";

const LandingPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    AOS.init({
      duration: 1200,
      easing: "ease-in-out",
      once: false,
    });
  }, []);

  const handleGetStarted = () => {
    navigate("/signup");
  };

  return (
    <div className="landing-container">
      <header className="navbar" data-aos="fade-down">
        <div className="logo">TradeBro</div>
        <nav className="nav-links">
          <a href="#features">Features</a>
          <a href="#about">About</a>
          <a href="#contact">Contact</a>
          <button className="cta-button" onClick={handleGetStarted}>
            Get Started
          </button>
        </nav>
      </header>

      <section className="hero-section" data-aos="fade-up">
        <div className="hero-content">
          <h1>Analyze Stock Market Trends</h1>
          <p>
            Visualize live data, build portfolios, and make informed investment
            decisions in real-time.
          </p>
          <div className="hero-buttons">
            <button className="primary-btn" onClick={handleGetStarted}>
              Get Started
            </button>
            <button className="secondary-btn">View Demo</button>
          </div>
        </div>

        <div className="hero-visual" data-aos="zoom-in">
          <img src="/Landingpage.png" alt="Stock Market Analysis" />
        </div>
      </section>

      <section className="features-section" id="features">
        <h2 className="section-title" data-aos="fade-up">
          Features
        </h2>
        <div className="feature" data-aos="fade-right">
          <h3>Live NSE/BSE Data</h3>
          <p>Access real-time stock market data and trends to stay ahead.</p>
        </div>
        <div className="feature" data-aos="fade-left">
          <h3>Demo Portfolio</h3>
          <p>
            Create and manage a virtual stock portfolio to practice investing
            without risks.
          </p>
        </div>
        <div className="feature" data-aos="fade-up">
          <h3>AI-Powered Assistant</h3>
          <p>
            Chat with an AI bot to get instant insights, analysis, and
            recommendations.
          </p>
        </div>
      </section>

      <section className="about-section" id="about" data-aos="fade-up">
        <h2>About TradeBro</h2>
        <p>
          TradeBro is your one-stop solution for analyzing stock market trends,
          building portfolios, and making informed investment decisions. Our
          platform is designed to empower both beginners and experienced
          investors with cutting-edge tools and insights.
        </p>
        <p>
          Whether you're looking to track live market data, simulate trades, or
          get AI-powered assistance, TradeBro has you covered.
        </p>
      </section>

      <section className="testimonials-section" data-aos="fade-up">
        <h2>What Our Users Say</h2>
        <div className="testimonials">
          <div className="testimonial" data-aos="fade-right">
            <p>
              "TradeBro has completely transformed the way I invest. The
              real-time data and AI assistant are game-changers!"
            </p>
            <h4>- John Doe</h4>
          </div>
          <div className="testimonial" data-aos="fade-left">
            <p>
              "I love the demo portfolio feature. It helped me practice trading
              without any risk!"
            </p>
            <h4>- Jane Smith</h4>
          </div>
        </div>
      </section>

      <section className="contact-section" id="contact" data-aos="fade-up">
        <h2>Contact Us</h2>
        <p>
          Have questions or need support? Reach out to us, and we'll be happy
          to assist you.
        </p>
        <form className="contact-form">
          <input type="text" placeholder="Your Name" required />
          <input type="email" placeholder="Your Email" required />
          <textarea placeholder="Your Message" required></textarea>
          <button type="submit" className="primary-btn">
            Send Message
          </button>
        </form>
      </section>

      <footer className="footer" data-aos="fade-up">
        <p>© 2025 TradeBro. All rights reserved.</p>
        <p>
          Follow us on:
          <a href="https://twitter.com" target="_blank" rel="noopener noreferrer">
            Twitter
          </a>
          |
          <a href="https://facebook.com" target="_blank" rel="noopener noreferrer">
            Facebook
          </a>
          |
          <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer">
            LinkedIn
          </a>
        </p>
      </footer>
    </div>
  );
};

export default LandingPage;