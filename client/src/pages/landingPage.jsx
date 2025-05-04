import React, { useState, memo } from "react";
import { useNavigate } from "react-router-dom";
import { FiMenu, FiX, FiBarChart2, FiPieChart, FiTrendingUp, FiArrowRight } from "react-icons/fi";
import "./LandingPage.css";

// Memoized components for better performance
const NavBar = memo(({ mobileMenuOpen, toggleMobileMenu, handleGetStarted }) => (
  <header className="navbar">
    <div className="logo">TradeBro</div>
    <button className="mobile-menu-btn" onClick={toggleMobileMenu} aria-label="Toggle menu">
      {mobileMenuOpen ? <FiX /> : <FiMenu />}
    </button>
    <nav className={`nav-links ${mobileMenuOpen ? 'mobile-active' : ''}`}>
      <a href="#features" onClick={() => toggleMobileMenu(false)}>Features</a>
      <a href="#about" onClick={() => toggleMobileMenu(false)}>About</a>
      <a href="#contact" onClick={() => toggleMobileMenu(false)}>Contact</a>
      <button className="cta-button" onClick={handleGetStarted}>
        Get Started
      </button>
    </nav>
  </header>
));

const HeroSection = memo(({ handleGetStarted }) => (
  <section className="hero-section">
    <div className="hero-content">
      <h1>Master the Markets with Confidence</h1>
      <p>
        TradeBro is your personal stock market companion — track live data, simulate portfolios, and unlock insights with AI-powered tools.
      </p>
      <div className="hero-buttons">
        <button className="primary-btn" onClick={handleGetStarted}>
          Get Started <FiArrowRight style={{ marginLeft: '8px', verticalAlign: 'middle' }} />
        </button>
        <button className="secondary-btn">View Demo</button>
      </div>
    </div>
    <div className="hero-visual">
      <img src="https://i.pinimg.com/736x/51/bd/0f/51bd0f73220b38ec9066cab7b1df517c.jpg" alt="Stock Market Dashboard" loading="eager" />
    </div>
  </section>
));

// Feature component for reusability
const Feature = ({ icon: Icon, title, description }) => (
  <div className="feature">
    <span className="feature-highlight"></span>
    <div className="feature-icon-wrapper">
      <Icon className="feature-icon" />
    </div>
    <h3>{title}</h3>
    <p>{description}</p>
  </div>
);

// Gallery item component
const GalleryItem = ({ src, alt, caption }) => (
  <div className="gallery-item">
    <img src={src} alt={alt} loading="lazy" />
    <div className="gallery-caption">
      <h4>{caption}</h4>
    </div>
  </div>
);

// Testimonial component
const Testimonial = ({ quote, author }) => (
  <div className="testimonial">
    <p>"{quote}"</p>
    <h4>- {author}</h4>
  </div>
);

const LandingPage = () => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleGetStarted = () => navigate("/signup");
  const toggleMobileMenu = (value) => setMobileMenuOpen(value !== undefined ? value : !mobileMenuOpen);

  // Features data
  const features = [
    {
      icon: FiBarChart2,
      title: "Live NSE/BSE Data",
      description: "Stream real-time stock prices, volumes, and technical indicators from Indian and global markets."
    },
    {
      icon: FiPieChart,
      title: "Interactive Demo Portfolio",
      description: "Test your investment strategies risk-free. Simulate trades, monitor profits, and learn by doing."
    },
    {
      icon: FiTrendingUp,
      title: "AI-Powered Chat Assistant",
      description: "Ask anything about stocks, trends, or financial terms — our AI assistant delivers instant answers and analysis."
    },
    {
      icon: FiBarChart2,
      title: "Detailed Stock Analysis",
      description: "Access comprehensive stock data including price history, key metrics, and buy/sell functionality for informed trading decisions."
    }
  ];

  // Gallery data
  const galleryItems = [
    {
      src: "https://i.pinimg.com/736x/41/35/46/4135461de8f243948c5f35de57c91456.jpg",
      alt: "Trading Screen",
      caption: "Advanced Trading Interface"
    },
    {
      src: "https://i.pinimg.com/736x/a8/39/d3/a839d32b1fd0e47a94bb88fa6994b83d.jpg",
      alt: "Portfolio Analysis",
      caption: "Portfolio Performance Analytics"
    },
    {
      src: "https://i.pinimg.com/736x/69/6b/b3/696bb3f36d24d8f75c3fd9aec18c3a16.jpg",
      alt: "Mobile App",
      caption: "Mobile Trading Experience"
    }
  ];

  // Testimonials data
  const testimonials = [
    {
      quote: "TradeBro helped me understand the stock market without risking real money. The demo feature is incredibly useful.",
      author: "Ramesh P., Beginner Investor"
    },
    {
      quote: "I love how intuitive the screener and AI bot are. It's like having a financial expert with me 24/7.",
      author: "Sneha M., Technical Analyst"
    }
  ];

  return (
    <div className="landing-container">
      <NavBar 
        mobileMenuOpen={mobileMenuOpen} 
        toggleMobileMenu={toggleMobileMenu} 
        handleGetStarted={handleGetStarted} 
      />

      <HeroSection handleGetStarted={handleGetStarted} />

      <section className="features-section" id="features">
        <h2 className="section-title">Key Features</h2>
        <div className="features-grid">
          {features.map((feature, index) => (
            <Feature 
              key={index}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
            />
          ))}
        </div>
      </section>

      <section className="about-section" id="about">
        <h2>About TradeBro</h2>
        <p>
          Built for new investors and seasoned traders alike, TradeBro offers a modern platform for learning, testing, and mastering the stock market.
        </p>
        <p>
          From real-time market feeds to intelligent chat assistance and demo trading, we help you trade smarter — with confidence and clarity.
        </p>
      </section>

      <section className="gallery-section">
        <h2>Platform Showcase</h2>
        <div className="gallery-grid">
          {galleryItems.map((item, index) => (
            <GalleryItem 
              key={index}
              src={item.src}
              alt={item.alt}
              caption={item.caption}
            />
          ))}
        </div>
      </section>

      <section className="testimonials-section">
        <h2>What Our Users Say</h2>
        <div className="testimonials">
          {testimonials.map((testimonial, index) => (
            <Testimonial 
              key={index}
              quote={testimonial.quote}
              author={testimonial.author}
            />
          ))}
        </div>
      </section>

      <section className="contact-section" id="contact">
        <h2>Contact Us</h2>
        <p>Have a question or suggestion? We'd love to hear from you.</p>
        <form className="contact-form" onSubmit={(e) => e.preventDefault()}>
          <input type="text" placeholder="Your Name" required aria-label="Your Name" />
          <input type="email" placeholder="Your Email" required aria-label="Your Email" />
          <textarea placeholder="Your Message" required aria-label="Your Message"></textarea>
          <button type="submit" className="primary-btn">Send Message</button>
        </form>
      </section>

      <footer className="footer">
        <p>© {new Date().getFullYear()} TradeBro. All rights reserved.</p>
        <p>
          Follow us:
          {[
            { name: "Twitter", url: "https://twitter.com" },
            { name: "Facebook", url: "https://facebook.com" },
            { name: "LinkedIn", url: "https://linkedin.com" }
          ].map((social, index, arr) => (
            <React.Fragment key={social.name}>
              <a href={social.url} target="_blank" rel="noopener noreferrer"> {social.name} </a>
              {index < arr.length - 1 && "| "}
            </React.Fragment>
          ))}
        </p>
      </footer>
    </div>
  );
};

export default LandingPage;
