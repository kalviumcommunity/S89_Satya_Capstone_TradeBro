import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiArrowLeft, FiLock, FiShield, FiEye, FiDatabase, FiUsers } from 'react-icons/fi';
import '../styles/legal.css';

const PrivacyPolicy = () => {
  const lastUpdated = "JULY 22, 2025";

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
              <FiLock size={32} />
            </div>
            <h1 className="legal-title">Privacy Policy</h1>
            <p className="legal-subtitle">
              How we collect, use, and protect your personal information
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
          {/* Privacy Commitment */}
          <div className="privacy-commitment">
            <FiShield size={20} />
            <div>
              <strong>Our Commitment:</strong> We are committed to protecting your privacy and ensuring the security of your personal information. 
              This Privacy Policy explains how we collect, use, and safeguard your data.
            </div>
          </div>

          {/* Section 1 */}
          <section className="legal-section">
            <h2><FiDatabase size={20} /> 1. Information We Collect</h2>
            
            <h3>1.1 Personal Information</h3>
            <p>When you register for TradeBro, we may collect:</p>
            <ul>
              <li><strong>Account Information:</strong> Name, email address, username</li>
              <li><strong>Profile Information:</strong> Profile picture, bio, trading preferences</li>
              <li><strong>Authentication Data:</strong> Password (encrypted), OAuth tokens from third-party providers</li>
              <li><strong>Contact Information:</strong> Email address for communications</li>
            </ul>

            <h3>1.2 Trading and Usage Data</h3>
            <p>We collect information about your use of our platform:</p>
            <ul>
              <li><strong>Virtual Trading Activity:</strong> Buy/sell orders, portfolio performance, trading history</li>
              <li><strong>Platform Usage:</strong> Pages visited, features used, time spent on platform</li>
              <li><strong>Device Information:</strong> IP address, browser type, device type, operating system</li>
              <li><strong>Preferences:</strong> Theme settings, notification preferences, dashboard customizations</li>
            </ul>

            <h3>1.3 Automatically Collected Information</h3>
            <ul>
              <li><strong>Cookies and Tracking:</strong> Session cookies, preference cookies, analytics cookies</li>
              <li><strong>Log Data:</strong> Server logs, error logs, access logs</li>
              <li><strong>Analytics Data:</strong> User behavior, feature usage, performance metrics</li>
            </ul>
          </section>

          {/* Section 2 */}
          <section className="legal-section">
            <h2><FiEye size={20} /> 2. How We Use Your Information</h2>
            
            <h3>2.1 Service Provision</h3>
            <ul>
              <li>Create and manage your account</li>
              <li>Process virtual trading transactions</li>
              <li>Provide personalized trading experience</li>
              <li>Display portfolio and performance data</li>
              <li>Enable social features and leaderboards</li>
            </ul>

            <h3>2.2 Communication</h3>
            <ul>
              <li>Send account-related notifications</li>
              <li>Provide customer support</li>
              <li>Send educational content and market updates</li>
              <li>Notify about platform updates and new features</li>
            </ul>

            <h3>2.3 Platform Improvement</h3>
            <ul>
              <li>Analyze usage patterns to improve our service</li>
              <li>Develop new features and functionality</li>
              <li>Ensure platform security and prevent fraud</li>
              <li>Conduct research and analytics</li>
            </ul>

            <h3>2.4 Legal and Safety</h3>
            <ul>
              <li>Comply with legal obligations</li>
              <li>Protect against fraud and abuse</li>
              <li>Enforce our Terms of Service</li>
              <li>Respond to legal requests</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="legal-section">
            <h2><FiUsers size={20} /> 3. Information Sharing and Disclosure</h2>
            
            <h3>3.1 We Do Not Sell Your Data</h3>
            <div className="highlight-box">
              <FiShield size={16} />
              <span>We do not sell, rent, or trade your personal information to third parties for marketing purposes.</span>
            </div>

            <h3>3.2 Limited Sharing</h3>
            <p>We may share your information only in these circumstances:</p>
            <ul>
              <li><strong>Service Providers:</strong> Third-party services that help us operate our platform (hosting, analytics, email)</li>
              <li><strong>Legal Requirements:</strong> When required by law, court order, or government request</li>
              <li><strong>Safety and Security:</strong> To protect the rights, property, or safety of TradeBro, our users, or others</li>
              <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
            </ul>

            <h3>3.3 Public Information</h3>
            <p>Some information may be publicly visible:</p>
            <ul>
              <li>Username and profile picture (if you choose to make them public)</li>
              <li>Leaderboard rankings (anonymized or with consent)</li>
              <li>Public posts or comments in community features</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="legal-section">
            <h2>4. Data Security</h2>
            
            <h3>4.1 Security Measures</h3>
            <p>We implement industry-standard security measures:</p>
            <ul>
              <li><strong>Encryption:</strong> Data encrypted in transit and at rest</li>
              <li><strong>Access Controls:</strong> Limited access to personal data on need-to-know basis</li>
              <li><strong>Secure Infrastructure:</strong> Secure servers and databases</li>
              <li><strong>Regular Audits:</strong> Security assessments and vulnerability testing</li>
              <li><strong>Authentication:</strong> Secure login with optional two-factor authentication</li>
            </ul>

            <h3>4.2 Data Retention</h3>
            <p>We retain your information:</p>
            <ul>
              <li>As long as your account is active</li>
              <li>As necessary to provide our services</li>
              <li>To comply with legal obligations</li>
              <li>To resolve disputes and enforce agreements</li>
            </ul>
          </section>

          {/* Section 5 */}
          <section className="legal-section">
            <h2>5. Your Privacy Rights</h2>
            
            <h3>5.1 Access and Control</h3>
            <p>You have the right to:</p>
            <ul>
              <li><strong>Access:</strong> Request a copy of your personal data</li>
              <li><strong>Update:</strong> Correct or update your information</li>
              <li><strong>Delete:</strong> Request deletion of your account and data</li>
              <li><strong>Export:</strong> Download your trading data and history</li>
              <li><strong>Opt-out:</strong> Unsubscribe from marketing communications</li>
            </ul>

            <h3>5.2 Cookie Preferences</h3>
            <p>You can control cookies through:</p>
            <ul>
              <li>Browser settings to block or delete cookies</li>
              <li>Our cookie preference center</li>
              <li>Opting out of analytics tracking</li>
            </ul>

            <h3>5.3 Account Settings</h3>
            <p>Manage your privacy through your account settings:</p>
            <ul>
              <li>Profile visibility settings</li>
              <li>Notification preferences</li>
              <li>Data sharing preferences</li>
              <li>Communication settings</li>
            </ul>
          </section>

          {/* Section 6 */}
          <section className="legal-section">
            <h2>6. Third-Party Services</h2>
            
            <h3>6.1 OAuth Providers</h3>
            <p>When you sign in with Google or other OAuth providers:</p>
            <ul>
              <li>We receive limited profile information (name, email, profile picture)</li>
              <li>We do not access your other accounts or data</li>
              <li>You can revoke access at any time through the provider's settings</li>
            </ul>

            <h3>6.2 Market Data Providers</h3>
            <p>We use third-party APIs for market data:</p>
            <ul>
              <li>Financial Modeling Prep (FMP) for stock prices and data</li>
              <li>These providers may have their own privacy policies</li>
              <li>We do not share your personal information with data providers</li>
            </ul>

            <h3>6.3 Analytics Services</h3>
            <p>We may use analytics services to improve our platform:</p>
            <ul>
              <li>Google Analytics (anonymized data)</li>
              <li>Error tracking services</li>
              <li>Performance monitoring tools</li>
            </ul>
          </section>

          {/* Section 7 */}
          <section className="legal-section">
            <h2>7. Children's Privacy</h2>
            <p>
              TradeBro is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. 
              If you are a parent or guardian and believe your child has provided us with personal information, please contact us.
            </p>
            <p>
              Users between 13-18 years old should have parental consent before using our service.
            </p>
          </section>

          {/* Section 8 */}
          <section className="legal-section">
            <h2>8. International Data Transfers</h2>
            <p>
              Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place 
              to protect your personal information in accordance with this Privacy Policy.
            </p>
          </section>

          {/* Section 9 */}
          <section className="legal-section">
            <h2>9. Changes to Privacy Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of any material changes by:
            </p>
            <ul>
              <li>Posting the new Privacy Policy on this page</li>
              <li>Sending an email notification</li>
              <li>Providing notice through our platform</li>
            </ul>
            <p>
              Your continued use of our service after any changes constitutes acceptance of the new Privacy Policy.
            </p>
          </section>

          {/* Section 10 */}
          <section className="legal-section">
            <h2>10. Contact Us</h2>
            <p>If you have questions about this Privacy Policy or our privacy practices, please contact us:</p>
            <div className="contact-info">
              <p><strong>Privacy Officer:</strong> privacy@tradebro.com</p>
              <p><strong>Data Protection:</strong> dpo@tradebro.com</p>
              <p><strong>General Support:</strong> support@tradebro.com</p>
              <p><strong>Address:</strong> TradeBro Privacy Department<br />
              123 Trading Street<br />
              Financial District, Mumbai 400001<br />
              India</p>
            </div>
          </section>

          {/* Footer */}
          <div className="legal-footer">
            <p>
              We are committed to protecting your privacy and will continue to update our practices to ensure your data remains secure.
            </p>
            <div className="legal-actions">
              <Link to="/terms" className="btn btn-outline">
                Terms of Service
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

export default PrivacyPolicy;
