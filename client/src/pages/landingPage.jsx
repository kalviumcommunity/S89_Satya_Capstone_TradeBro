import React, { useState, memo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useScroll, useTransform, useInView } from "framer-motion";
import { FiMenu, FiX, FiBarChart2, FiPieChart, FiTrendingUp, FiArrowRight } from "react-icons/fi";
import "../styles/landing.css";

// Custom animation components
const ScrollReveal = ({ children, className = "" }) => {
  const ref = React.useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  
  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
};

const HoverElement = ({ children, effect = "lift", className = "" }) => {
  const hoverVariants = {
    lift: {
      hover: { y: -10, scale: 1.02, transition: { duration: 0.3 } }
    },
    both: {
      hover: { y: -5, scale: 1.05, transition: { duration: 0.3 } }
    }
  };
  
  return (
    <motion.div
      className={className}
      variants={hoverVariants[effect]}
      whileHover="hover"
    >
      {children}
    </motion.div>
  );
};

const FloatingElement = ({ children, amplitude = 10, duration = 2, className = "" }) => {
  return (
    <motion.div
      className={className}
      animate={{
        y: [-amplitude, amplitude, -amplitude],
      }}
      transition={{
        duration,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    >
      {children}
    </motion.div>
  );
};

const StaggerContainer = ({ children, className = "", childVariant = "fadeUp" }) => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };
  
  const itemVariants = {
    fadeUp: {
      hidden: { opacity: 0, y: 30 },
      visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
    },
    scale: {
      hidden: { opacity: 0, scale: 0.8 },
      visible: { opacity: 1, scale: 1, transition: { duration: 0.6 } }
    }
  };
  
  return (
    <motion.div
      className={className}
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
    >
      {React.Children.map(children, (child, index) => (
        <motion.div key={index} variants={itemVariants[childVariant]}>
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
};

const ParallaxSection = ({ children, speed = 0.5, direction = "up" }) => {
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], direction === "up" ? [0, -100 * speed] : [0, 100 * speed]);
  
  return (
    <motion.div style={{ y }}>
      {children}
    </motion.div>
  );
};

const AnimatedText = ({ text, type = "words", className = "" }) => {
  const words = text.split(" ");
  
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  
  const wordVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };
  
  return (
    <motion.h2
      className={className}
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
    >
      {words.map((word, index) => (
        <motion.span key={index} variants={wordVariants} style={{ display: "inline-block", marginRight: "0.25em" }}>
          {word}
        </motion.span>
      ))}
    </motion.h2>
  );
};



// Memoized components for better performance
const NavBar = memo(({ mobileMenuOpen, toggleMobileMenu, handleGetStarted }) => {
  const [scrolled, setScrolled] = useState(false);

  // Add scroll event listener
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <motion.header
      className={`navbar ${scrolled ? 'scrolled' : ''}`}
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.6, 0.05, 0.01, 0.9] }}
    >
      <motion.div
        className="logo"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        TradeBro
      </motion.div>
      <button className="mobile-menu-btn" onClick={toggleMobileMenu} aria-label="Toggle menu">
        {mobileMenuOpen ? <FiX /> : <FiMenu />}
      </button>
      <nav className={`nav-links ${mobileMenuOpen ? 'mobile-active' : ''}`}>
        <motion.a
          href="#features"
          onClick={() => toggleMobileMenu(false)}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          Features
        </motion.a>
        <motion.a
          href="#about"
          onClick={() => toggleMobileMenu(false)}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          About
        </motion.a>
        <motion.a
          href="#contact"
          onClick={() => toggleMobileMenu(false)}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          Contact
        </motion.a>
        <motion.button 
          className="cta-button" 
          onClick={handleGetStarted}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Get Started
        </motion.button>
      </nav>
    </motion.header>
  );
});

const HeroSection = memo(({ handleGetStarted }) => {
  // Parallax effect for hero section
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], [0, 300]);

  return (
    <section className="hero-section">
      <motion.div
        className="hero-content"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.6, 0.05, 0.01, 0.9] }}
      >
        <h1 className="hero-title">Master the Markets with Confidence</h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          TradeBro is your personal stock market companion — track live data, simulate portfolios, and unlock insights with AI-powered tools.
        </motion.p>
        <motion.div
          className="hero-buttons"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          <motion.button 
            className="primary-btn" 
            onClick={handleGetStarted}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Get Started <FiArrowRight style={{ marginLeft: '8px', verticalAlign: 'middle' }} />
          </motion.button>
          <motion.button 
            className="secondary-btn"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            View Demo
          </motion.button>
        </motion.div>
      </motion.div>
      <motion.div
        className="hero-visual"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      >
        <img
          src="https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80"
          alt="Stock Market Dashboard"
          loading="eager"
        />
      </motion.div>
    </section>
  );
});

// Feature component with animations
const Feature = ({ icon: Icon, title, description }) => (
  <HoverElement effect="lift" className="feature">
    <span className="feature-highlight"></span>
    <FloatingElement amplitude={5} duration={3} className="feature-icon-wrapper">
      <Icon className="feature-icon" />
    </FloatingElement>
    <h3>{title}</h3>
    <p>{description}</p>
  </HoverElement>
);

// Gallery item component with animations
const GalleryItem = ({ src, alt, caption }) => (
  <HoverElement effect="both" className="gallery-item">
    <img src={src} alt={alt} loading="lazy" />
    <motion.div
      className="gallery-caption"
      initial={{ opacity: 0, y: 20 }}
      whileHover={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <h4>{caption}</h4>
    </motion.div>
  </HoverElement>
);

// Testimonial component with animations
const Testimonial = ({ quote, author }) => (
  <HoverElement effect="lift" className="testimonial">
    <p>"{quote}"</p>
    <h4>- {author}</h4>
  </HoverElement>
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

      <ScrollReveal>
        <section className="features-section" id="features">
          <h2 className="section-title">Key Features</h2>
          <StaggerContainer className="features-grid" childVariant="fadeUp">
            {features.map((feature, index) => (
              <Feature
                key={index}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
              />
            ))}
          </StaggerContainer>
        </section>
      </ScrollReveal>

      <ParallaxSection speed={0.2} direction="up">
        <ScrollReveal>
          <section className="about-section" id="about">
            <AnimatedText text="About TradeBro" type="words" className="section-title" />
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              Built for new investors and seasoned traders alike, TradeBro offers a modern platform for learning, testing, and mastering the stock market.
            </motion.p>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              From real-time market feeds to intelligent chat assistance and demo trading, we help you trade smarter — with confidence and clarity.
            </motion.p>
          </section>
        </ScrollReveal>
      </ParallaxSection>

      <ScrollReveal>
        <section className="gallery-section">
          <h2 className="section-title">Platform Showcase</h2>
          <StaggerContainer className="gallery-grid" childVariant="scale">
            {galleryItems.map((item, index) => (
              <GalleryItem
                key={index}
                src={item.src}
                alt={item.alt}
                caption={item.caption}
              />
            ))}
          </StaggerContainer>
        </section>
      </ScrollReveal>

      <ScrollReveal>
        <section className="testimonials-section">
          <h2 className="section-title">What Our Users Say</h2>
          <StaggerContainer className="testimonials" childVariant="fadeUp">
            {testimonials.map((testimonial, index) => (
              <Testimonial
                key={index}
                quote={testimonial.quote}
                author={testimonial.author}
              />
            ))}
          </StaggerContainer>
        </section>
      </ScrollReveal>

      <ScrollReveal>
        <section className="contact-section" id="contact">
          <h2 className="section-title">Contact Us</h2>
          <p>Have a question or suggestion? We'd love to hear from you.</p>
          <motion.form
            className="contact-form"
            onSubmit={(e) => e.preventDefault()}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <motion.input
              type="text"
              placeholder="Your Name"
              required
              aria-label="Your Name"
              whileFocus={{ scale: 1.02, boxShadow: "0 0 0 3px rgba(27, 142, 153, 0.2)" }}
            />
            <motion.input
              type="email"
              placeholder="Your Email"
              required
              aria-label="Your Email"
              whileFocus={{ scale: 1.02, boxShadow: "0 0 0 3px rgba(27, 142, 153, 0.2)" }}
            />
            <motion.textarea
              placeholder="Your Message"
              required
              aria-label="Your Message"
              whileFocus={{ scale: 1.02, boxShadow: "0 0 0 3px rgba(27, 142, 153, 0.2)" }}
            ></motion.textarea>
            <HoverElement effect="both">
              <button type="submit" className="primary-btn">Send Message</button>
            </HoverElement>
          </motion.form>
        </section>
      </ScrollReveal>

      <footer className="footer">
        <p>© {new Date().getFullYear()} TradeBro. All rights reserved.</p>
        <p>
          Follow us:
          {[
            { name: "Twitter", url: "https://x.com/@KakiHariSatya" },
            { name: "Facebook", url: "https://www.facebook.com/profile.php?id=61559417301452" },
            { name: "LinkedIn", url: "https://www.linkedin.com/in/hari-kaki-aa2a1a328" }
          ].map((social, index, arr) => (
            <React.Fragment key={social.name}>
              <motion.a
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ color: "#1B8E99", scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                {social.name}
              </motion.a>
              {index < arr.length - 1 && "| "}
            </React.Fragment>
          ))}
        </p>
      </footer>


    </div>
  );
};

export default LandingPage;