import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  FiCheck,
  FiX
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import PageHeader from '../components/layout/PageHeader';
import ToggleSwitch from '../components/common/ToggleSwitch';
import TwoFASetupModal from '../components/modals/TwoFASetupModal';
import { useAuth } from '../contexts/AuthContext';
import settingsService from '../services/settingsService';
import '../styles/settings.css';

const Settings = ({ theme, toggleTheme }) => {
  const { user, updateProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [saving, setSaving] = useState(false);

  const [profileData, setProfileData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phoneNumber || user?.phone || '',
    bio: user?.bio || '',
    location: user?.location || ''
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: user?.notificationSettings?.emailNotifications ?? true,
    pushNotifications: user?.notificationSettings?.pushNotifications ?? true,
    smsNotifications: user?.notificationSettings?.smsNotifications ?? false,
    priceAlerts: user?.notificationSettings?.priceAlerts ?? true,
    newsAlerts: user?.notificationSettings?.newsAlerts ?? true,
    portfolioUpdates: user?.notificationSettings?.portfolioUpdates ?? true,
    weeklyReports: user?.notificationSettings?.weeklyReports ?? true,
  });

  const [securitySettings, setSecuritySettings] = useState({
    twoFactorAuth: user?.twoFactorEnabled || false,
    loginAlerts: user?.securitySettings?.loginAlerts ?? true,
    sessionTimeout: user?.securitySettings?.sessionTimeout ?? '30',
  });

  const [preferences, setPreferences] = useState({
    theme: theme,
    language: user?.preferences?.language ?? 'en',
    currency: user?.preferences?.currency ?? 'INR',
    timezone: user?.preferences?.timezone ?? 'Asia/Kolkata',
    defaultPage: user?.preferences?.defaultPage ?? 'dashboard',
  });

  const [show2FAModal, setShow2FAModal] = useState(false);
  const [isEnabling2FA, setIsEnabling2FA] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phoneNumber || user.phone || '',
        bio: user.bio || '',
        location: user.location || '',
        avatar: user.profileImage || user.picture || user.avatar || user.profilePicture || null
      });
      setNotificationSettings({
        emailNotifications: user.notificationSettings?.emailNotifications ?? true,
        pushNotifications: user.notificationSettings?.pushNotifications ?? true,
        smsNotifications: user.notificationSettings?.smsNotifications ?? false,
        priceAlerts: user.notificationSettings?.priceAlerts ?? true,
        newsAlerts: user.notificationSettings?.newsAlerts ?? true,
        portfolioUpdates: user.notificationSettings?.portfolioUpdates ?? true,
        weeklyReports: user.notificationSettings?.weeklyReports ?? true,
      });
      setSecuritySettings({
        twoFactorAuth: user.twoFactorEnabled || false,
        loginAlerts: user.securitySettings?.loginAlerts ?? true,
        sessionTimeout: user.securitySettings?.sessionTimeout ?? '30',
      });
      setPreferences(prev => ({
        ...prev,
        language: user.preferences?.language ?? 'en',
        currency: user.preferences?.currency ?? 'INR',
        timezone: user.preferences?.timezone ?? 'Asia/Kolkata',
        defaultPage: user.preferences?.defaultPage ?? 'dashboard',
      }));
    }
  }, [user]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updatedSettings = {
        profileData,
        notificationSettings,
        securitySettings,
        preferences,
      };
      
      // Save settings to backend
      const response = await settingsService.saveSettings(updatedSettings);
      
      // Update user profile in AuthContext
      const updatedUserData = {
        ...user,
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        fullName: `${profileData.firstName} ${profileData.lastName}`.trim(),
        email: profileData.email,
        phoneNumber: profileData.phone,
        phone: profileData.phone,
        location: profileData.location,
        bio: profileData.bio,
        notificationSettings,
        securitySettings,
        preferences
      };
      
      await updateProfile(updatedUserData);
      
      if (response.success) {
        toast.success('Settings saved successfully!');
      } else {
        toast.error(response.message || 'Failed to save settings.');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('An unexpected error occurred while saving.');
    } finally {
      setSaving(false);
    }
  };

  const handleProfileUpdate = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  };

  const handleNotificationToggle = (setting) => {
    setNotificationSettings(prev => ({ ...prev, [setting]: !prev[setting] }));
  };

  const handleSecurityUpdate = (e) => {
    const { name, value } = e.target;
    setSecuritySettings(prev => ({ ...prev, [name]: value }));
  };

  const handlePreferenceUpdate = (field, value) => {
    setPreferences(prev => ({ ...prev, [field]: value }));
    if (field === 'theme' && value !== theme) {
      toggleTheme();
    }
  };

  const handleEnable2FA = () => {
    setShow2FAModal(true);
  };

  const handleDisable2FA = async () => {
    if (window.confirm('Are you sure you want to disable 2FA?')) {
      try {
        const response = await settingsService.disable2FA();
        if (response.success) {
          setSecuritySettings(prev => ({ ...prev, twoFactorAuth: false }));
          toast.success('Two-factor authentication disabled.');
        } else {
          toast.error(response.message);
        }
      } catch (error) {
        console.error('Error disabling 2FA:', error);
        toast.error('Failed to disable 2FA.');
      }
    }
  };

  const settingsTabs = [
    { id: 'profile', name: 'Profile', icon: FiUser },
    { id: 'notifications', name: 'Notifications', icon: FiBell },
    { id: 'security', name: 'Security', icon: FiShield },
    { id: 'preferences', name: 'Preferences', icon: FiSettings }
  ];

  const renderProfileSettings = () => (
    <div className="settings-section">
      <h3 className="section-title">Profile Information</h3>
      <div className="form-grid">
        <div className="form-group">
          <label className="form-label">First Name</label>
          <input type="text" className="form-input" name="firstName" value={profileData.firstName} onChange={handleProfileUpdate} />
        </div>
        <div className="form-group">
          <label className="form-label">Last Name</label>
          <input type="text" className="form-input" name="lastName" value={profileData.lastName} onChange={handleProfileUpdate} />
        </div>
        <div className="form-group">
          <label className="form-label">Email Address</label>
          <input type="email" className="form-input" name="email" value={profileData.email} onChange={handleProfileUpdate} />
        </div>
        <div className="form-group">
          <label className="form-label">Phone Number</label>
          <input type="tel" className="form-input" name="phone" value={profileData.phone} onChange={handleProfileUpdate} />
        </div>
        <div className="form-group full-width">
          <label className="form-label">Bio</label>
          <textarea className="form-textarea" rows="3" name="bio" value={profileData.bio} onChange={handleProfileUpdate} />
        </div>
        <div className="form-group full-width">
          <label className="form-label">Location</label>
          <input type="text" className="form-input" name="location" value={profileData.location} onChange={handleProfileUpdate} />
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
            <ToggleSwitch
              label="Email Notifications"
              description="Receive updates via email"
              icon={FiMail}
              isToggled={notificationSettings.emailNotifications}
              onToggle={() => handleNotificationToggle('emailNotifications')}
            />
            <ToggleSwitch
              label="Push Notifications"
              description="Browser push notifications"
              icon={FiBell}
              isToggled={notificationSettings.pushNotifications}
              onToggle={() => handleNotificationToggle('pushNotifications')}
            />
            <ToggleSwitch
              label="SMS Notifications"
              description="Text message alerts"
              icon={FiSmartphone}
              isToggled={notificationSettings.smsNotifications}
              onToggle={() => handleNotificationToggle('smsNotifications')}
            />
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
              onClick={() => {
                if (isEnabling2FA) return;
                if (securitySettings.twoFactorAuth) {
                  handleDisable2FA();
                } else {
                  handleEnable2FA();
                }
              }}
            >
              <div className="toggle-thumb"></div>
            </div>
          </div>
        </div>
      </div>
      <TwoFASetupModal
        isOpen={show2FAModal}
        onClose={() => setShow2FAModal(false)}
        userEmail={user?.email}
        onVerifySuccess={() => {
          setSecuritySettings(prev => ({ ...prev, twoFactorAuth: true }));
          toast.success('Two-factor authentication enabled successfully!');
        }}
      />
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
                <FiSun size={16} /> Light
              </button>
              <button
                className={`theme-option ${preferences.theme === 'dark' ? 'active' : ''}`}
                onClick={() => handlePreferenceUpdate('theme', 'dark')}
              >
                <FiMoon size={16} /> Dark
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile': return renderProfileSettings();
      case 'notifications': return renderNotificationSettings();
      case 'security': return renderSecuritySettings();
      case 'preferences': return renderPreferences();
      default: return renderProfileSettings();
    }
  };

  return (
    <div className="settings-page">
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
            disabled: saving,
            className: saving ? 'spinning' : ''
          }
        ]}
      />

      <div className="settings-container">
        <div className="settings-layout">
          <motion.div className="settings-tabs" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.1 }}>
            {settingsTabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button key={tab.id} className={`tab-button ${activeTab === tab.id ? 'active' : ''}`} onClick={() => setActiveTab(tab.id)}>
                  <Icon size={20} />
                  {tab.name}
                </button>
              );
            })}
          </motion.div>

          <motion.div className="settings-content" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }} key={activeTab}>
            {renderTabContent()}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Settings;