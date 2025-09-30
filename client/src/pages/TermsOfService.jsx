import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiArrowLeft, FiShield, FiAlertTriangle, FiCheckCircle } from 'react-icons/fi';
import '../styles/legal.css';

const TermsOfService = () => {
  const lastUpdated = "December 15, 2024";

  return (
    <div className="legal-page">
      <div className="legal-container">
        {/* Header */}
        <motion.div 
          className="legal-header"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Link to="/login" className="back-link">
            <FiArrowLeft size={20} />
            Back to Login
          </Link>
          
          <div className="legal-title-section">
            <div className="legal-icon">
              <FiShield size={32} />
            </div>
            <h1 className="legal-title">Terms of Service</h1>
            <p className="legal-subtitle">
              Please read these terms carefully before using TradeBro
            </p>
            <div className="last-updated">
              Last updated: {lastUpdated}
            </div>
          </div>
        </motion.div>

        {/* Content */}
        <motion.div 
          className="legal-content"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {/* Important Notice */}
          <div className="legal-notice">
            <FiAlertTriangle size={20} />
            <div>
              <strong>Important Notice:</strong> TradeBro is a virtual trading platform for educational purposes only. 
              No real money or actual securities are involved in any transactions.
            </div>
          </div>

          {/* Section 1 */}
          <section className="legal-section">
            <h2>1. Acceptance of Terms</h2>
            <p>
              By accessing and using TradeBro ("the Platform", "our Service"), you accept and agree to be bound by the terms and provision of this agreement. 
              If you do not agree to abide by the above, please do not use this service.
            </p>
            <p>
              These Terms of Service ("Terms") govern your use of our virtual stock trading platform operated by TradeBro ("us", "we", or "our").
            </p>
          </section>

          {/* Section 2 */}
          <section className="legal-section">
            <h2>2. Description of Service</h2>
            <p>TradeBro provides:</p>
            <ul>
              <li>Virtual stock trading simulation using real market data</li>
              <li>Educational tools and resources for learning about stock trading</li>
              <li>Portfolio management and tracking features</li>
              <li>AI-powered trading assistant (Saytrix)</li>
              <li>Market news and analysis</li>
              <li>Social features for connecting with other virtual traders</li>
            </ul>
            <div className="highlight-box">
              <FiCheckCircle size={16} />
              <span>All trading on TradeBro is virtual and for educational purposes only.</span>
            </div>
          </section>

          {/* Section 3 */}
          <section className="legal-section">
            <h2>3. User Accounts and Registration</h2>
            <h3>3.1 Account Creation</h3>
            <p>
              To use certain features of our Service, you must register for an account. You may register using your email address or through third-party authentication providers like Google.
            </p>
            
            <h3>3.2 Account Security</h3>
            <p>You are responsible for:</p>
            <ul>
              <li>Maintaining the confidentiality of your account credentials</li>
              <li>All activities that occur under your account</li>
              <li>Notifying us immediately of any unauthorized use</li>
              <li>Ensuring your account information is accurate and up-to-date</li>
            </ul>

            <h3>3.3 Account Termination</h3>
            <p>
              We reserve the right to terminate or suspend your account at any time for violations of these Terms or for any other reason at our sole discretion.
            </p>
          </section>

          {/* Section 4 */}
          <section className="legal-section">
            <h2>4. Virtual Trading Rules</h2>
            <h3>4.1 Virtual Currency</h3>
            <p>
              All users start with virtual currency (₹10,000 by default) for trading purposes. This virtual currency has no real-world value and cannot be exchanged for real money.
            </p>

            <h3>4.2 Market Data</h3>
            <p>
              We use real market data from various sources including Financial Modeling Prep (FMP) API. While we strive for accuracy, we do not guarantee the completeness or accuracy of market data.
            </p>

            <h3>4.3 Trading Limitations</h3>
            <p>Virtual trading is subject to:</p>
            <ul>
              <li>Market hours and trading sessions</li>
              <li>Available virtual funds in your account</li>
              <li>Platform maintenance and technical limitations</li>
              <li>Fair usage policies to prevent system abuse</li>
            </ul>
          </section>

          {/* Section 5 */}
          <section className="legal-section">
            <h2>5. Prohibited Uses</h2>
            <p>You may not use our Service:</p>
            <ul>
              <li>For any unlawful purpose or to solicit others to unlawful acts</li>
              <li>To violate any international, federal, provincial, or state regulations, rules, laws, or local ordinances</li>
              <li>To infringe upon or violate our intellectual property rights or the intellectual property rights of others</li>
              <li>To harass, abuse, insult, harm, defame, slander, disparage, intimidate, or discriminate</li>
              <li>To submit false or misleading information</li>
              <li>To upload or transmit viruses or any other type of malicious code</li>
              <li>To spam, phish, pharm, pretext, spider, crawl, or scrape</li>
              <li>For any obscene or immoral purpose</li>
              <li>To interfere with or circumvent the security features of the Service</li>
            </ul>
          </section>

          {/* Section 6 */}
          <section className="legal-section">
            <h2>6. Intellectual Property Rights</h2>
            <p>
              The Service and its original content, features, and functionality are and will remain the exclusive property of TradeBro and its licensors. 
              The Service is protected by copyright, trademark, and other laws.
            </p>
            <p>
              Our trademarks and trade dress may not be used in connection with any product or service without our prior written consent.
            </p>
          </section>

          {/* Section 7 */}
          <section className="legal-section">
            <h2>7. Privacy Policy</h2>
            <p>
              Your privacy is important to us. Please review our Privacy Policy, which also governs your use of the Service, 
              to understand our practices.
            </p>
            <Link to="/privacy" className="inline-link">View Privacy Policy →</Link>
          </section>

          {/* Section 8 */}
          <section className="legal-section">
            <h2>8. Disclaimers and Limitations</h2>
            <h3>8.1 Educational Purpose</h3>
            <div className="warning-box">
              <FiAlertTriangle size={16} />
              <div>
                <strong>Important:</strong> TradeBro is for educational purposes only. Virtual trading results do not guarantee real trading success. 
                Past performance does not indicate future results.
              </div>
            </div>

            <h3>8.2 No Financial Advice</h3>
            <p>
              The information provided on TradeBro is not intended as financial advice. We do not provide investment recommendations or advice. 
              Always consult with qualified financial professionals before making real investment decisions.
            </p>

            <h3>8.3 Service Availability</h3>
            <p>
              We do not guarantee that the Service will be available at all times. We may experience hardware, software, or other problems 
              or need to perform maintenance related to the Service.
            </p>
          </section>

          {/* Section 9 */}
          <section className="legal-section">
            <h2>9. Limitation of Liability</h2>
            <p>
              In no event shall TradeBro, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, 
              incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, 
              or other intangible losses, resulting from your use of the Service.
            </p>
          </section>

          {/* Section 10 */}
          <section className="legal-section">
            <h2>10. Changes to Terms</h2>
            <p>
              We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material, 
              we will try to provide at least 30 days notice prior to any new terms taking effect.
            </p>
            <p>
              What constitutes a material change will be determined at our sole discretion. By continuing to access or use our Service 
              after those revisions become effective, you agree to be bound by the revised terms.
            </p>
          </section>

          {/* Section 11 */}
          <section className="legal-section">
            <h2>11. Contact Information</h2>
            <p>If you have any questions about these Terms of Service, please contact us:</p>
            <div className="contact-info">
              <p><strong>Email:</strong> legal@tradebro.com</p>
              <p><strong>Address:</strong> TradeBro Legal Department<br />
              123 Trading Street<br />
              Financial District, Mumbai 400001<br />
              India</p>
            </div>
          </section>

          {/* Footer */}
          <div className="legal-footer">
            <p>
              By using TradeBro, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
            </p>
            <div className="legal-actions">
              <Link to="/privacy" className="btn btn-outline">
                Privacy Policy
              </Link>
              <Link to="/login" className="btn btn-primary">
                Back to Login
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default TermsOfService;
