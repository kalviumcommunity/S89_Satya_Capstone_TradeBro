import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  FiSettings,
  FiUser,
  FiBell,
  FiShield,
  FiMoon,
  FiSun,
  FiGlobe,
  FiDollarSign,
  FiMail,
  FiSmartphone,
  FiLock,
  FiKey,
  FiTrash2,
  FiSave,
  FiRefreshCw,
  FiEye,
  FiEyeOff,
  FiCheck,
  FiX
} from 'react-icons/fi';
import PageHeader from '../components/layout/PageHeader';
// import { useTheme } from '../contexts/ThemeContext';
import '../styles/settings.css';

const Settings = ({ user, theme }) => {
  const toggleTheme = () => {
    // Theme toggle functionality
    console.log('Toggle theme');
  };
  const [activeTab, setActiveTab] = useState('profile');
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Settings tabs
  const settingsTabs = [
    { id: 'profile', name: 'Profile', icon: FiUser },
    { id: 'notifications', name: 'Notifications', icon: FiBell },
    { id: 'security', name: 'Security', icon: FiShield },
    { id: 'preferences', name: 'Preferences', icon: FiSettings }
  ];

  // Form states
  const [profileData, setProfileData] = useState({
    firstName: user?.firstName || user?.fullName?.split(' ')[0] || '',
    lastName: user?.lastName || user?.fullName?.split(' ').slice(1).join(' ') || '',
    email: user?.email || '',
    phone: user?.phoneNumber || user?.phone || '',
    bio: user?.bio || 'Welcome to TradeBro! Start your trading journey today.',
    location: user?.location || user?.address || ''
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    priceAlerts: true,
    newsAlerts: true,
    portfolioUpdates: true,
    marketOpen: false,
    weeklyReports: true
  });

  const [securitySettings, setSecuritySettings] = useState({
    twoFactorAuth: user?.twoFactorEnabled || false,
    loginAlerts: user?.loginAlerts !== false,
    sessionTimeout: '30',
    allowedDevices: 3
  });

  const [showQRCode, setShowQRCode] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isEnabling2FA, setIsEnabling2FA] = useState(false);

  const [preferences, setPreferences] = useState({
    theme: theme,
    language: 'en',
    currency: 'INR',
    timezone: 'Asia/Kolkata',
    dateFormat: 'DD/MM/YYYY',
    numberFormat: 'Indian',
    defaultPage: 'dashboard'
  });

  const handleSave = async () => {
    setSaving(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setSaving(false);
  };

  const handleProfileUpdate = (field, value) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
  };

  const handleNotificationToggle = (setting) => {
    setNotificationSettings(prev => ({ ...prev, [setting]: !prev[setting] }));
  };

  const handleSecurityUpdate = async (field, value) => {
    if (field === 'twoFactorAuth') {
      if (value) {
        await enable2FA();
      } else {
        await disable2FA();
      }
    } else {
      setSecuritySettings(prev => ({ ...prev, [field]: value }));
    }
  };

  const enable2FA = async () => {
    try {
      setIsEnabling2FA(true);
      const apiUrl = import.meta.env.VITE_API_URL || 'https://s89-satya-capstone-tradebro.onrender.com';
      const response = await fetch(`${apiUrl}/api/auth/2fa/enable`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      if (data.success) {
        setQrCodeUrl(data.qrCodeUrl);
        setShowQRCode(true);
      }
    } catch (error) {
      console.error('Error enabling 2FA:', error);
    } finally {
      setIsEnabling2FA(false);
    }
  };

  const verify2FA = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'https://s89-satya-capstone-tradebro.onrender.com';
      const response = await fetch(`${apiUrl}/api/auth/2fa/verify`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ code: verificationCode })
      });
      
      const data = await response.json();
      if (data.success) {
        setSecuritySettings(prev => ({ ...prev, twoFactorAuth: true }));
        setShowQRCode(false);
        setVerificationCode('');
        alert('Two-factor authentication enabled successfully!');
      } else {
        alert('Invalid verification code. Please try again.');
      }
    } catch (error) {
      console.error('Error verifying 2FA:', error);
      alert('Error verifying code. Please try again.');
    }
  };

  const disable2FA = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'https://s89-satya-capstone-tradebro.onrender.com';
      const response = await fetch(`${apiUrl}/api/auth/2fa/disable`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      if (data.success) {
        setSecuritySettings(prev => ({ ...prev, twoFactorAuth: false }));
        alert('Two-factor authentication disabled successfully!');
      }
    } catch (error) {
      console.error('Error disabling 2FA:', error);
    }
  };

  const handlePreferenceUpdate = (field, value) => {
    setPreferences(prev => ({ ...prev, [field]: value }));
    if (field === 'theme' && value !== theme) {
      toggleTheme();
    }
  };

  const renderProfileSettings = () => (
    <div className="settings-section">
      <h3 className="section-title">Profile Information</h3>
      <div className="form-grid">
        <div className="form-group">
          <label className="form-label">First Name</label>
          <input
            type="text"
            className="form-input"
            value={profileData.firstName}
            onChange={(e) => handleProfileUpdate('firstName', e.target.value)}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Last Name</label>
          <input
            type="text"
            className="form-input"
            value={profileData.lastName}
            onChange={(e) => handleProfileUpdate('lastName', e.target.value)}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Email Address</label>
          <input
            type="email"
            className="form-input"
            value={profileData.email}
            onChange={(e) => handleProfileUpdate('email', e.target.value)}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Phone Number</label>
          <input
            type="tel"
            className="form-input"
            value={profileData.phone}
            onChange={(e) => handleProfileUpdate('phone', e.target.value)}
          />
        </div>
        <div className="form-group full-width">
          <label className="form-label">Bio</label>
          <textarea
            className="form-textarea"
            rows="3"
            value={profileData.bio}
            onChange={(e) => handleProfileUpdate('bio', e.target.value)}
          />
        </div>
        <div className="form-group full-width">
          <label className="form-label">Location</label>
          <input
            type="text"
            className="form-input"
            value={profileData.location}
            onChange={(e) => handleProfileUpdate('location', e.target.value)}
          />
        </div>
      </div>
    </div>
  );

  const renderNotificationSettings = () => (
    <div className="settings-section">
      <h3 className="section-title">Notification Preferences</h3>
      <div className="notification-groups">
        <div className="notification-group">
          <h4 className="group-title">Communication</h4>
          <div className="toggle-list">
            <div className="toggle-item">
              <div className="toggle-info">
                <FiMail className="toggle-icon" />
                <div>
                  <div className="toggle-label">Email Notifications</div>
                  <div className="toggle-description">Receive updates via email</div>
                </div>
              </div>
              <div 
                className={`toggle-switch ${notificationSettings.emailNotifications ? 'on' : 'off'}`}
                onClick={() => handleNotificationToggle('emailNotifications')}
              >
                <div className="toggle-thumb"></div>
              </div>
            </div>
            <div className="toggle-item">
              <div className="toggle-info">
                <FiBell className="toggle-icon" />
                <div>
                  <div className="toggle-label">Push Notifications</div>
                  <div className="toggle-description">Browser push notifications</div>
                </div>
              </div>
              <div 
                className={`toggle-switch ${notificationSettings.pushNotifications ? 'on' : 'off'}`}
                onClick={() => handleNotificationToggle('pushNotifications')}
              >
                <div className="toggle-thumb"></div>
              </div>
            </div>
            <div className="toggle-item">
              <div className="toggle-info">
                <FiSmartphone className="toggle-icon" />
                <div>
                  <div className="toggle-label">SMS Notifications</div>
                  <div className="toggle-description">Text message alerts</div>
                </div>
              </div>
              <div 
                className={`toggle-switch ${notificationSettings.smsNotifications ? 'on' : 'off'}`}
                onClick={() => handleNotificationToggle('smsNotifications')}
              >
                <div className="toggle-thumb"></div>
              </div>
            </div>
          </div>
        </div>

        <div className="notification-group">
          <h4 className="group-title">Market Alerts</h4>
          <div className="toggle-list">
            <div className="toggle-item">
              <div className="toggle-info">
                <FiDollarSign className="toggle-icon" />
                <div>
                  <div className="toggle-label">Price Alerts</div>
                  <div className="toggle-description">Stock price movement alerts</div>
                </div>
              </div>
              <div 
                className={`toggle-switch ${notificationSettings.priceAlerts ? 'on' : 'off'}`}
                onClick={() => handleNotificationToggle('priceAlerts')}
              >
                <div className="toggle-thumb"></div>
              </div>
            </div>
            <div className="toggle-item">
              <div className="toggle-info">
                <FiGlobe className="toggle-icon" />
                <div>
                  <div className="toggle-label">News Alerts</div>
                  <div className="toggle-description">Market news and updates</div>
                </div>
              </div>
              <div 
                className={`toggle-switch ${notificationSettings.newsAlerts ? 'on' : 'off'}`}
                onClick={() => handleNotificationToggle('newsAlerts')}
              >
                <div className="toggle-thumb"></div>
              </div>
            </div>
            <div className="toggle-item">
              <div className="toggle-info">
                <FiUser className="toggle-icon" />
                <div>
                  <div className="toggle-label">Portfolio Updates</div>
                  <div className="toggle-description">Portfolio performance updates</div>
                </div>
              </div>
              <div 
                className={`toggle-switch ${notificationSettings.portfolioUpdates ? 'on' : 'off'}`}
                onClick={() => handleNotificationToggle('portfolioUpdates')}
              >
                <div className="toggle-thumb"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSecuritySettings = () => (
    <div className="settings-section">
      <h3 className="section-title">Security & Privacy</h3>
      <div className="security-groups">
        <div className="security-group">
          <h4 className="group-title">Authentication</h4>
          <div className="security-item">
            <div className="security-info">
              <FiShield className="security-icon" />
              <div>
                <div className="security-label">Two-Factor Authentication</div>
                <div className="security-description">Add an extra layer of security</div>
              </div>
            </div>
            <div 
              className={`toggle-switch ${securitySettings.twoFactorAuth ? 'on' : 'off'} ${isEnabling2FA ? 'disabled' : ''}`}
              onClick={() => !isEnabling2FA && handleSecurityUpdate('twoFactorAuth', !securitySettings.twoFactorAuth)}
            >
              <div className="toggle-thumb"></div>
            </div>
          </div>

          {/* 2FA Setup Modal */}
          {showQRCode && (
            <div className="modal-overlay" onClick={() => setShowQRCode(false)}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h3>Setup Two-Factor Authentication</h3>
                  <button className="modal-close" onClick={() => setShowQRCode(false)}>
                    <FiX size={20} />
                  </button>
                </div>
                <div className="modal-body">
                  <div className="qr-section">
                    <p>1. Install Google Authenticator or similar app</p>
                    <p>2. Scan this QR code:</p>
                    {qrCodeUrl && (
                      <div className="qr-code">
                        <img src={qrCodeUrl} alt="QR Code" />
                      </div>
                    )}
                    <p>3. Enter the 6-digit code from your app:</p>
                    <input
                      type="text"
                      className="verification-input"
                      placeholder="000000"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      maxLength="6"
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button className="btn-premium btn-secondary" onClick={() => setShowQRCode(false)}>
                    Cancel
                  </button>
                  <button 
                    className="btn-premium btn-primary" 
                    onClick={verify2FA}
                    disabled={verificationCode.length !== 6}
                  >
                    Verify & Enable
                  </button>
                </div>
              </div>
            </div>
          )}
          <div className="security-item">
            <div className="security-info">
              <FiBell className="security-icon" />
              <div>
                <div className="security-label">Login Alerts</div>
                <div className="security-description">Get notified of new logins</div>
              </div>
            </div>
            <div 
              className={`toggle-switch ${securitySettings.loginAlerts ? 'on' : 'off'}`}
              onClick={() => handleSecurityUpdate('loginAlerts', !securitySettings.loginAlerts)}
            >
              <div className="toggle-thumb"></div>
            </div>
          </div>
        </div>

        <div className="security-group">
          <h4 className="group-title">Session Management</h4>
          <div className="form-group">
            <label className="form-label">Session Timeout (minutes)</label>
            <select
              className="form-select"
              value={securitySettings.sessionTimeout}
              onChange={(e) => handleSecurityUpdate('sessionTimeout', e.target.value)}
            >
              <option value="15">15 minutes</option>
              <option value="30">30 minutes</option>
              <option value="60">1 hour</option>
              <option value="120">2 hours</option>
              <option value="0">Never</option>
            </select>
          </div>
        </div>

        <div className="security-group">
          <h4 className="group-title">Password</h4>
          <div className="password-section">
            <button className="btn-premium btn-secondary">
              <FiKey size={16} />
              Change Password
            </button>
            <button className="btn-premium btn-ghost">
              <FiRefreshCw size={16} />
              Reset All Sessions
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPreferences = () => (
    <div className="settings-section">
      <h3 className="section-title">Application Preferences</h3>
      <div className="preferences-groups">
        <div className="preferences-group">
          <h4 className="group-title">Appearance</h4>
          <div className="form-group">
            <label className="form-label">Theme</label>
            <div className="theme-selector">
              <button
                className={`theme-option ${preferences.theme === 'light' ? 'active' : ''}`}
                onClick={() => handlePreferenceUpdate('theme', 'light')}
              >
                <FiSun size={16} />
                Light
              </button>
              <button
                className={`theme-option ${preferences.theme === 'dark' ? 'active' : ''}`}
                onClick={() => handlePreferenceUpdate('theme', 'dark')}
              >
                <FiMoon size={16} />
                Dark
              </button>
            </div>
          </div>
        </div>

        <div className="preferences-group">
          <h4 className="group-title">Localization</h4>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Language</label>
              <select
                className="form-select"
                value={preferences.language}
                onChange={(e) => handlePreferenceUpdate('language', e.target.value)}
              >
                <option value="en">English</option>
                <option value="hi">Hindi</option>
                <option value="mr">Marathi</option>
                <option value="gu">Gujarati</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Currency</label>
              <select
                className="form-select"
                value={preferences.currency}
                onChange={(e) => handlePreferenceUpdate('currency', e.target.value)}
              >
                <option value="INR">Indian Rupee (₹)</option>
                <option value="USD">US Dollar ($)</option>
                <option value="EUR">Euro (€)</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Timezone</label>
              <select
                className="form-select"
                value={preferences.timezone}
                onChange={(e) => handlePreferenceUpdate('timezone', e.target.value)}
              >
                <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                <option value="America/New_York">America/New_York (EST)</option>
                <option value="Europe/London">Europe/London (GMT)</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Date Format</label>
              <select
                className="form-select"
                value={preferences.dateFormat}
                onChange={(e) => handlePreferenceUpdate('dateFormat', e.target.value)}
              >
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
              </select>
            </div>
          </div>
        </div>

        <div className="preferences-group">
          <h4 className="group-title">Default Settings</h4>
          <div className="form-group">
            <label className="form-label">Default Page</label>
            <select
              className="form-select"
              value={preferences.defaultPage}
              onChange={(e) => handlePreferenceUpdate('defaultPage', e.target.value)}
            >
              <option value="dashboard">Dashboard</option>
              <option value="portfolio">Portfolio</option>
              <option value="trading">Trading</option>
              <option value="watchlist">Watchlist</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return renderProfileSettings();
      case 'notifications':
        return renderNotificationSettings();
      case 'security':
        return renderSecuritySettings();
      case 'preferences':
        return renderPreferences();
      default:
        return renderProfileSettings();
    }
  };

  return (
    <div className="settings-page">
      {/* Page Header */}
      <PageHeader
        icon={FiSettings}
        title="Settings"
        subtitle="Manage your account preferences and security settings"
        borderColor="success"
        actions={[
          {
            label: saving ? "Saving..." : "Save Changes",
            icon: saving ? FiRefreshCw : FiSave,
            onClick: handleSave,
            variant: "primary",
            disabled: saving
          }
        ]}
      />

      <div className="settings-container">

        {/* Settings Content */}
        <div className="settings-layout">
          {/* Settings Tabs */}
          <motion.div
            className="settings-tabs"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            {settingsTabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <Icon size={20} />
                  {tab.name}
                </button>
              );
            })}
          </motion.div>

          {/* Settings Content */}
          <motion.div
            className="settings-content"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            key={activeTab}
          >
            {renderTabContent()}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
