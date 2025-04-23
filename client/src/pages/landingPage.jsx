import Threads from "../UI/Threads";
import "./LandingPage.css";
import { Link } from "react-router-dom";
import ScrollReveal from "../UI/ScrollReveal";
import RotatingText from "../UI/RotatingText"; // Import RotatingText

const LandingPage = () => {
  return (
    <div className="landing-container">
      <Threads amplitude={1} distance={0} enableMouseInteraction={true} />

      <div className="landing-content">
        {/* Hero Section with ScrollReveal */}
        <ScrollReveal baseOpacity={1} enableBlur={false} baseRotation={0} blurStrength={0}>
          <div className="hero">
            <h1 className="hero-title">Master the Markets</h1>
            <p className="hero-subtitle">
              Empower your trading journey with real-time insights, AI-driven tools, and powerful simulations.
            </p>
            <button className="get-started-btn">
              <Link to="/portfolio">
                <RotatingText
                  texts={["Get Started", "Start Trading", "Start Investing"]}
                  rotationInterval={2000} // Rotate every 2 seconds
                  auto={true}
                  splitBy="words"
                />
              </Link>
            </button>
          </div>
        </ScrollReveal>

        {/* About Section with ScrollReveal */}
        <ScrollReveal baseOpacity={0.2} enableBlur={true} baseRotation={3} blurStrength={5}>
          <section className="about-section">
            <h2>What is Stock Marketing?</h2>
            <p>
              Stock marketing refers to the global ecosystem of buying and selling shares of publicly listed companies. 
              It’s where companies raise capital and investors grow wealth. The market thrives on supply and demand, 
              news, trends, and investor sentiment.
            </p>
          </section>
        </ScrollReveal>

        {/* Info Grid with ScrollReveal */}
        <div className="info-grid">
          <ScrollReveal baseOpacity={0.2} enableBlur={true} baseRotation={2} blurStrength={5}>
            <div className="info-card">
              <h3>📈 Wealth Building</h3>
              <p>Investing in stocks is one of the best long-term strategies to build personal wealth and grow assets.</p>
            </div>
          </ScrollReveal>
          <ScrollReveal baseOpacity={0.2} enableBlur={true} baseRotation={2} blurStrength={5}>
            <div className="info-card">
              <h3>📊 Market Insight</h3>
              <p>Understand how companies perform, respond to global events, and adjust with time to make informed decisions.</p>
            </div>
          </ScrollReveal>
          <ScrollReveal baseOpacity={0.2} enableBlur={true} baseRotation={2} blurStrength={5}>
            <div className="info-card">
              <h3>🤖 Smart Tools</h3>
              <p>With AI-driven platforms like TradeBro, users can analyze trends, forecast moves, and simulate trading without risks.</p>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
