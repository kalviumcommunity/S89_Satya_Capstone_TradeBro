import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FiUser,
  FiEdit,
  FiSave,
  FiCamera,
  FiMail,
  FiPhone,
  FiMapPin,
  FiCalendar,
  FiTrendingUp,
  FiDollarSign,
  FiAward,
  FiShield,
  FiSettings,
  FiLogOut,
  FiActivity
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import PageHeader from '../components/layout/PageHeader';
import { usePortfolio } from '../contexts/PortfolioContext';
import { useAuth } from '../contexts/AuthContext';
import { formatCurrency, formatJoinDate } from '../utils/profileUtils';
import '../styles/profile.css';

const Profile = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const { portfolioData } = usePortfolio();
  const { user, updateProfile, logout } = useAuth();

  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    location: '',
    bio: '',
    joinDate: '',
    avatar: null
  });

  useEffect(() => {
    if (user) {
      const fullName = user.fullName || user.name || '';
      const nameParts = fullName.split(' ');
      const firstName = user.firstName || nameParts[0] || '';
      const lastName = user.lastName || (nameParts.length > 1 ? nameParts.slice(1).join(' ') : '');

      setProfileData({
        firstName,
        lastName,
        email: user.email || '',
        phone: user.phoneNumber || user.phone || '',
        location: user.location || user.address || '',
        bio: user.bio || 'Welcome to TradeBro! Start your trading journey today.',
        joinDate: user.createdAt || new Date().toISOString(),
        avatar: user.profileImage || user.picture || user.avatar || user.profilePicture || null
      });
    }
  }, [user]);

  const tradingStats = [
    {
      title: 'Portfolio Value',
      value: formatCurrency(portfolioData?.totalValue || 0),
      change: portfolioData?.totalGainLossPercentage !== undefined
        ? `${portfolioData.totalGainLossPercentage >= 0 ? '+' : ''}${portfolioData.totalGainLossPercentage.toFixed(2)}%`
        : '0.00%',
      icon: FiDollarSign,
      color: (portfolioData?.totalGainLoss || 0) >= 0 ? '#10B981' : '#EF4444'
    },
    {
      title: 'Available Cash',
      value: formatCurrency(portfolioData?.availableCash || 0),
      change: 'Available',
      icon: FiDollarSign,
      color: '#3B82F6'
    },
    {
      title: 'Total Invested',
      value: formatCurrency(portfolioData?.totalInvested || 0),
      change: `${portfolioData?.holdings?.length || 0} holdings`,
      icon: FiTrendingUp,
      color: '#F59E0B'
    },
    {
      title: 'Total Transactions',
      value: portfolioData?.transactions?.length || 0,
      change: 'Completed',
      icon: FiActivity,
      color: '#8B5CF6'
    }
  ];

  const achievements = [
    {
      title: 'First Trade',
      description: 'Completed your first trade',
      earned: (portfolioData?.transactions?.length || 0) > 0
    },
    {
      title: 'Portfolio Builder',
      description: 'Built a diversified portfolio',
      earned: (portfolioData?.holdings?.length || 0) >= 3
    },
    {
      title: 'Profit Maker',
      description: 'Made positive returns',
      earned: (portfolioData?.totalGainLoss || 0) > 0
    },
    {
      title: 'Active Trader',
      description: 'Completed 10+ transactions',
      earned: (portfolioData?.transactions?.length || 0) >= 10
    },
    {
      title: 'Market Expert',
      description: 'Achieved 80% success rate',
      earned: false
    },
    {
      title: 'Long Term Investor',
      description: 'Held positions for 6+ months',
      earned: false
    }
  ];

  const handleSave = async () => {
    setSaving(true);
    try {
      const updatedUserData = {
        ...user,
        fullName: `${profileData.firstName} ${profileData.lastName}`.trim(),
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        email: profileData.email,
        phoneNumber: profileData.phone,
        location: profileData.location,
        bio: profileData.bio
      };

      await updateProfile(updatedUserData);
      toast.success('Profile updated successfully!');
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Failed to save profile changes.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (user) {
      const fullName = user.fullName || user.name || '';
      const nameParts = fullName.split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      setProfileData(prev => ({
        ...prev,
        firstName,
        lastName,
        email: user.email || '',
        phone: user.phoneNumber || user.phone || '',
        location: user.location || '',
        bio: user.bio || 'Welcome to TradeBro! Start your trading journey today.'
      }));
    }
    setIsEditing(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="profile-page">
      <PageHeader
        icon={FiUser}
        title="Profile"
        subtitle="Manage your account information and trading preferences"
        borderColor="purple"
        actions={
          !isEditing ? [
            {
              label: "Edit Profile",
              icon: FiEdit,
              onClick: () => setIsEditing(true),
              variant: "primary"
            }
          ] : [
            {
              label: "Cancel",
              icon: FiUser,
              onClick: handleCancel,
              variant: "secondary"
            },
            {
              label: saving ? "Saving..." : "Save Changes",
              icon: FiSave,
              onClick: handleSave,
              variant: "primary",
              disabled: saving
            }
          ]
        }
      />

      <div className="profile-container">
        <div className="profile-layout">
          <motion.div
            className="profile-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <div className="card-header">
              <h3 className="card-title">Personal Information</h3>
            </div>
            <div className="card-content">
              <div className="profile-avatar-section">
                <div className="avatar-container">
                  <div className="avatar">
                    {profileData.avatar ? (
                      <img
                        src={profileData.avatar}
                        alt={`${profileData.firstName} ${profileData.lastName}`}
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div
                      className="avatar-placeholder"
                      style={{ display: profileData.avatar ? 'none' : 'flex' }}
                    >
                      {profileData.firstName ? (
                        <span className="avatar-initial">
                          {profileData.firstName.charAt(0).toUpperCase()}
                          {profileData.lastName ? profileData.lastName.charAt(0).toUpperCase() : ''}
                        </span>
                      ) : (
                        <FiUser size={48} />
                      )}
                    </div>
                  </div>
                  {isEditing && (
                    <button className="avatar-edit-btn" onClick={() => toast.info('Avatar upload coming soon!')}>
                      <FiCamera size={16} />
                    </button>
                  )}
                </div>
                <div className="profile-basic-info">
                  <h2 className="profile-name">
                    {profileData.firstName} {profileData.lastName}
                  </h2>
                  <p className="profile-email">{profileData.email}</p>
                  <div className="profile-meta">
                    <span className="join-date">
                      <FiCalendar size={14} />
                      Joined {formatJoinDate(profileData.joinDate)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="profile-form">
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">First Name</label>
                    {isEditing ? (
                      <input type="text" className="form-input" name="firstName" value={profileData.firstName} onChange={handleInputChange} />
                    ) : (
                      <div className="form-display">{profileData.firstName}</div>
                    )}
                  </div>
                  <div className="form-group">
                    <label className="form-label">Last Name</label>
                    {isEditing ? (
                      <input type="text" className="form-input" name="lastName" value={profileData.lastName} onChange={handleInputChange} />
                    ) : (
                      <div className="form-display">{profileData.lastName}</div>
                    )}
                  </div>
                  <div className="form-group">
                    <label className="form-label"><FiMail size={16} /> Email Address</label>
                    {isEditing ? (
                      <input type="email" className="form-input" name="email" value={profileData.email} onChange={handleInputChange} />
                    ) : (
                      <div className="form-display">{profileData.email}</div>
                    )}
                  </div>
                  <div className="form-group">
                    <label className="form-label"><FiPhone size={16} /> Phone Number</label>
                    {isEditing ? (
                      <input type="tel" className="form-input" name="phone" value={profileData.phone} onChange={handleInputChange} />
                    ) : (
                      <div className="form-display">{profileData.phone}</div>
                    )}
                  </div>
                  <div className="form-group full-width">
                    <label className="form-label"><FiMapPin size={16} /> Location</label>
                    {isEditing ? (
                      <input type="text" className="form-input" name="location" value={profileData.location} onChange={handleInputChange} />
                    ) : (
                      <div className="form-display">{profileData.location}</div>
                    )}
                  </div>
                  <div className="form-group full-width">
                    <label className="form-label">Bio</label>
                    {isEditing ? (
                      <textarea className="form-textarea" rows="3" name="bio" value={profileData.bio} onChange={handleInputChange} />
                    ) : (
                      <div className="form-display">{profileData.bio}</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            className="stats-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="card-header">
              <h3 className="card-title"><FiTrendingUp className="card-icon" /> Trading Performance</h3>
            </div>
            <div className="card-content">
              <div className="stats-grid">
                {tradingStats.map((stat) => {
                  const Icon = stat.icon;
                  return (
                    <div key={stat.title} className="stat-item">
                      <div className="stat-icon" style={{ color: stat.color }}><Icon size={24} /></div>
                      <div className="stat-content">
                        <div className="stat-value">{stat.value}</div>
                        <div className="stat-title">{stat.title}</div>
                        <div className="stat-change" style={{ color: stat.color }}>{stat.change}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>

          <motion.div
            className="achievements-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <div className="card-header">
              <h3 className="card-title"><FiAward className="card-icon" /> Achievements</h3>
            </div>
            <div className="card-content">
              <div className="achievements-grid">
                {achievements.map((achievement) => (
                  <div
                    key={achievement.title}
                    className={`achievement-item ${achievement.earned ? 'earned' : 'locked'}`}
                  >
                    <div className="achievement-icon">
                      <FiAward size={20} />
                    </div>
                    <div className="achievement-content">
                      <h4 className="achievement-title">{achievement.title}</h4>
                      <p className="achievement-description">{achievement.description}</p>
                    </div>
                    {achievement.earned && (
                      <div className="achievement-badge"><FiShield size={16} /></div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          <motion.div
            className="actions-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <div className="card-header">
              <h3 className="card-title">Quick Actions</h3>
            </div>
            <div className="card-content">
              <div className="action-buttons">
                <button className="action-btn"><FiSettings size={20} /><span>Settings</span></button>
                <button className="action-btn"><FiShield size={20} /><span>Security</span></button>
                <button className="action-btn logout" onClick={logout}><FiLogOut size={20} /><span>Logout</span></button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Profile;