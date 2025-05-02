import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FiUser, FiMail, FiPhone, FiEdit2, FiCamera, FiCheckCircle, FiBarChart2, FiDollarSign, FiClock } from "react-icons/fi";
import PageLayout from "../components/PageLayout";
import "./Profile.css";

const Profile = () => {
  const [user, setUser] = useState({
    name: "John Doe",
    email: "john.doe@example.com",
    phone: "+1 (555) 123-4567",
    joinDate: "2023-01-15",
    profileImage: "https://randomuser.me/api/portraits/men/32.jpg",
    tradingExperience: "Intermediate",
    preferredMarkets: ["Stocks", "ETFs", "Crypto"],
    bio: "Passionate investor with a focus on technology and renewable energy sectors. I believe in long-term growth strategies and sustainable investing."
  });

  const [stats, setStats] = useState({
    totalTrades: 156,
    successRate: 68,
    avgReturn: 12.4,
    portfolioValue: 28750.65,
    activeWatchlists: 5
  });

  const [recentActivity, setRecentActivity] = useState([
    {
      id: 1,
      type: "trade",
      action: "Bought",
      symbol: "AAPL",
      quantity: 10,
      price: 178.25,
      date: "2023-10-15T14:30:00Z"
    },
    {
      id: 2,
      type: "watchlist",
      action: "Added",
      symbol: "TSLA",
      date: "2023-10-14T10:15:00Z"
    },
    {
      id: 3,
      type: "trade",
      action: "Sold",
      symbol: "MSFT",
      quantity: 5,
      price: 332.80,
      date: "2023-10-13T16:45:00Z"
    },
    {
      id: 4,
      type: "alert",
      action: "Created",
      symbol: "NVDA",
      condition: "Price above $450",
      date: "2023-10-12T09:20:00Z"
    }
  ]);

  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState({ ...user });
  const [loading, setLoading] = useState(false);

  // Format date
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Format time
  const formatTime = (dateString) => {
    const options = { hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleTimeString(undefined, options);
  };

  // Handle edit form changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditedUser({ ...editedUser, [name]: value });
  };

  // Handle profile image change
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditedUser({ ...editedUser, profileImage: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);

    // Simulate API call
    setTimeout(() => {
      setUser(editedUser);
      setIsEditing(false);
      setLoading(false);
    }, 1000);
  };

  return (
    <PageLayout>
      <div className="profile-container">
        <div className="profile-header">
          <h1>My Profile</h1>
          {!isEditing && (
            <button className="edit-profile-btn" onClick={() => setIsEditing(true)}>
              <FiEdit2 /> Edit Profile
            </button>
          )}
        </div>

        <div className="profile-grid">
          {/* Profile Info Card */}
          <motion.div
            className="profile-card info-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {isEditing ? (
              <form onSubmit={handleSubmit} className="edit-form">
                <div className="profile-image-container edit-mode">
                  <img
                    src={editedUser.profileImage}
                    alt={editedUser.name}
                    className="profile-image"
                  />
                  <label className="image-upload-label">
                    <FiCamera />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="image-upload-input"
                    />
                  </label>
                </div>

                <div className="form-group">
                  <label>Full Name</label>
                  <input
                    type="text"
                    name="name"
                    value={editedUser.name}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    name="email"
                    value={editedUser.email}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    value={editedUser.phone}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label>Trading Experience</label>
                  <select
                    name="tradingExperience"
                    value={editedUser.tradingExperience}
                    onChange={handleChange}
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                    <option value="Professional">Professional</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Bio</label>
                  <textarea
                    name="bio"
                    value={editedUser.bio}
                    onChange={handleChange}
                    rows="4"
                  ></textarea>
                </div>

                <div className="form-actions">
                  <button
                    type="button"
                    className="cancel-btn"
                    onClick={() => {
                      setIsEditing(false);
                      setEditedUser({ ...user });
                    }}
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="save-btn"
                    disabled={loading}
                  >
                    {loading ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            ) : (
              <>
                <div className="profile-image-container">
                  <img
                    src={user.profileImage}
                    alt={user.name}
                    className="profile-image"
                  />
                </div>
                <h2 className="profile-name">{user.name}</h2>
                <div className="profile-details">
                  <div className="detail-item">
                    <FiMail className="detail-icon" />
                    <span>{user.email}</span>
                  </div>
                  <div className="detail-item">
                    <FiPhone className="detail-icon" />
                    <span>{user.phone}</span>
                  </div>
                  <div className="detail-item">
                    <FiUser className="detail-icon" />
                    <span>{user.tradingExperience} Trader</span>
                  </div>
                  <div className="detail-item">
                    <FiClock className="detail-icon" />
                    <span>Member since {formatDate(user.joinDate)}</span>
                  </div>
                </div>
                <div className="profile-bio">
                  <h3>About Me</h3>
                  <p>{user.bio}</p>
                </div>
                <div className="profile-tags">
                  <h3>Preferred Markets</h3>
                  <div className="tags-container">
                    {user.preferredMarkets.map((market, index) => (
                      <span key={index} className="tag">{market}</span>
                    ))}
                  </div>
                </div>
              </>
            )}
          </motion.div>

          {/* Stats Card */}
          <motion.div
            className="profile-card stats-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <h3 className="card-title">Trading Statistics</h3>
            <div className="stats-grid">
              <div className="stat-item">
                <div className="stat-icon">
                  <FiBarChart2 />
                </div>
                <div className="stat-info">
                  <span className="stat-value">{stats.totalTrades}</span>
                  <span className="stat-label">Total Trades</span>
                </div>
              </div>
              <div className="stat-item">
                <div className="stat-icon success">
                  <FiCheckCircle />
                </div>
                <div className="stat-info">
                  <span className="stat-value">{stats.successRate}%</span>
                  <span className="stat-label">Success Rate</span>
                </div>
              </div>
              <div className="stat-item">
                <div className="stat-icon profit">
                  <FiDollarSign />
                </div>
                <div className="stat-info">
                  <span className="stat-value">{stats.avgReturn}%</span>
                  <span className="stat-label">Avg. Return</span>
                </div>
              </div>
              <div className="stat-item">
                <div className="stat-icon">
                  <FiDollarSign />
                </div>
                <div className="stat-info">
                  <span className="stat-value">${stats.portfolioValue.toLocaleString()}</span>
                  <span className="stat-label">Portfolio Value</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Recent Activity Card */}
          <motion.div
            className="profile-card activity-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <h3 className="card-title">Recent Activity</h3>
            <div className="activity-list">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="activity-item">
                  <div className={`activity-icon ${activity.type}`}>
                    {activity.type === "trade" && <FiBarChart2 />}
                    {activity.type === "watchlist" && <FiClock />}
                    {activity.type === "alert" && <FiCheckCircle />}
                  </div>
                  <div className="activity-details">
                    <div className="activity-header">
                      <span className="activity-action">{activity.action} {activity.symbol}</span>
                      <span className="activity-date">{formatDate(activity.date)}</span>
                    </div>
                    <div className="activity-info">
                      {activity.type === "trade" && (
                        <span>
                          {activity.quantity} shares at ${activity.price}
                        </span>
                      )}
                      {activity.type === "alert" && (
                        <span>{activity.condition}</span>
                      )}
                      <span className="activity-time">{formatTime(activity.date)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </PageLayout>
  );
};

export default Profile;
