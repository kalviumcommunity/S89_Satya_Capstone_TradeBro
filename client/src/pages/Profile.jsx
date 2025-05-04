import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FiUser, FiMail, FiPhone, FiEdit2, FiCamera, FiCheckCircle, FiBarChart2, FiDollarSign, FiClock, FiAlertCircle } from "react-icons/fi";
import PageLayout from "../components/PageLayout";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import Loading from "../components/Loading";
import "./Profile.css";

const Profile = () => {
  const { isAuthenticated } = useAuth();
  const toast = useToast();

  const [user, setUser] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
    joinDate: new Date().toISOString(),
    profileImage: null,
    tradingExperience: "Beginner",
    preferredMarkets: ["Stocks", "ETFs", "Crypto"],
    bio: ""
  });

  const [stats, setStats] = useState({
    totalTrades: 0,
    successRate: 0,
    avgReturn: 0,
    portfolioValue: 0,
    activeWatchlists: 0
  });

  const [recentActivity, setRecentActivity] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState({ ...user });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      if (!isAuthenticated) {
        setLoading(false);
        return;
      }

      try {
        // Get user settings
        const response = await axios.get("http://localhost:5000/api/settings", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('authToken')}`
          }
        });

        if (response.data.success) {
          const userData = response.data.userSettings;

          // Format the data
          setUser({
            fullName: userData.fullName || "User",
            email: userData.email || "",
            phoneNumber: userData.phoneNumber || "",
            joinDate: userData.createdAt || new Date().toISOString(),
            profileImage: userData.profileImage
              ? `http://localhost:5000/uploads/${userData.profileImage}`
              : "https://randomuser.me/api/portraits/lego/1.jpg",
            tradingExperience: userData.tradingExperience || "Beginner",
            preferredMarkets: userData.preferredMarkets || ["Stocks"],
            bio: userData.bio || "No bio provided yet."
          });

          setEditedUser({
            fullName: userData.fullName || "User",
            email: userData.email || "",
            phoneNumber: userData.phoneNumber || "",
            joinDate: userData.createdAt || new Date().toISOString(),
            profileImage: userData.profileImage
              ? `http://localhost:5000/uploads/${userData.profileImage}`
              : "https://randomuser.me/api/portraits/lego/1.jpg",
            tradingExperience: userData.tradingExperience || "Beginner",
            preferredMarkets: userData.preferredMarkets || ["Stocks"],
            bio: userData.bio || "No bio provided yet."
          });
        }

        // Get trading statistics (this would be a separate API call in a real app)
        // For now, we'll use mock data
        setStats({
          totalTrades: 24,
          successRate: 65,
          avgReturn: 8.7,
          portfolioValue: 12500.00,
          activeWatchlists: 3
        });

        // Get recent activity (this would be a separate API call in a real app)
        // For now, we'll use mock data
        setRecentActivity([
          {
            id: 1,
            type: "trade",
            action: "Bought",
            symbol: "AAPL",
            quantity: 5,
            price: 178.25,
            date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() // 2 days ago
          },
          {
            id: 2,
            type: "watchlist",
            action: "Added",
            symbol: "TSLA",
            date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() // 3 days ago
          },
          {
            id: 3,
            type: "trade",
            action: "Sold",
            symbol: "MSFT",
            quantity: 2,
            price: 332.80,
            date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() // 5 days ago
          }
        ]);

      } catch (err) {
        console.error("Error fetching user data:", err);
        setError("Failed to load user data. Please try again later.");

        // Set default data for development
        setUser({
          fullName: "Demo User",
          email: "demo@example.com",
          phoneNumber: "+1 (555) 123-4567",
          joinDate: new Date().toISOString(),
          profileImage: "https://randomuser.me/api/portraits/lego/1.jpg",
          tradingExperience: "Beginner",
          preferredMarkets: ["Stocks", "ETFs"],
          bio: "This is a demo account."
        });

        setEditedUser({
          fullName: "Demo User",
          email: "demo@example.com",
          phoneNumber: "+1 (555) 123-4567",
          joinDate: new Date().toISOString(),
          profileImage: "https://randomuser.me/api/portraits/lego/1.jpg",
          tradingExperience: "Beginner",
          preferredMarkets: ["Stocks", "ETFs"],
          bio: "This is a demo account."
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [isAuthenticated]);

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
      // Store the file object directly for form submission
      setEditedUser({ ...editedUser, profileImage: file });

      // Also create a preview URL for display
      const reader = new FileReader();
      reader.onloadend = () => {
        // This is just for preview, we'll use the file object for upload
        setEditedUser(prev => ({ ...prev, profileImagePreview: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Prepare form data for API
      const formData = new FormData();
      formData.append('fullName', editedUser.fullName);
      formData.append('phoneNumber', editedUser.phoneNumber);
      formData.append('tradingExperience', editedUser.tradingExperience);
      formData.append('bio', editedUser.bio);

      // Check if profile image is a File object (new upload) or a string (existing URL)
      if (editedUser.profileImage instanceof File) {
        formData.append('profileImage', editedUser.profileImage);
      }

      // Send data to API
      const response = await axios.put('http://localhost:5000/api/settings', formData, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        // Update user state with new data
        setUser({
          ...editedUser,
          profileImage: response.data.userSettings.profileImage
            ? `http://localhost:5000/uploads/${response.data.userSettings.profileImage}`
            : editedUser.profileImage
        });

        setIsEditing(false);
        toast.success('Profile updated successfully!');
      } else {
        toast.error('Failed to update profile. Please try again.');
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      toast.error(err.response?.data?.message || 'Failed to update profile. Please try again.');

      // For development, still update the UI
      setUser(editedUser);
      setIsEditing(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageLayout>
      <div className="profile-container">
        <div className="profile-header">
          <h1>My Profile</h1>
          {!isEditing && !loading && (
            <button className="edit-profile-btn" onClick={() => setIsEditing(true)}>
              <FiEdit2 /> Edit Profile
            </button>
          )}
        </div>

        {loading ? (
          <div className="loading-container">
            <Loading size="large" text="Loading profile data..." />
          </div>
        ) : error ? (
          <div className="error-container">
            <FiAlertCircle className="error-icon" />
            <p>{error}</p>
          </div>
        ) : (
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
                    src={editedUser.profileImagePreview || editedUser.profileImage}
                    alt={editedUser.fullName}
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
                    name="fullName"
                    value={editedUser.fullName}
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
                    disabled
                  />
                  <small>Email cannot be changed</small>
                </div>

                <div className="form-group">
                  <label>Phone</label>
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={editedUser.phoneNumber}
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
                    alt={user.fullName}
                    className="profile-image"
                  />
                </div>
                <h2 className="profile-name">{user.fullName}</h2>
                <div className="profile-details">
                  <div className="detail-item">
                    <FiMail className="detail-icon" />
                    <span>{user.email}</span>
                  </div>
                  <div className="detail-item">
                    <FiPhone className="detail-icon" />
                    <span>{user.phoneNumber || "No phone number provided"}</span>
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
        )}
      </div>
    </PageLayout>
  );
};

export default Profile;
