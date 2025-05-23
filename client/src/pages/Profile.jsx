import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion } from "framer-motion";
import { FiUser, FiMail, FiPhone, FiEdit2, FiCamera, FiCheckCircle, FiBarChart2, FiDollarSign, FiClock, FiAlertCircle } from "react-icons/fi";
import PageLayout from "../components/PageLayout";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import Loading from "../components/common/Loading";
import { fetchProfileSuccess, setEditedUser } from "../redux/reducers/profileReducer";
import { setIsEditing, setLoading, setError } from "../redux/reducers/uiReducer";
import { showSuccessToast, showErrorToast } from "../redux/reducers/toastReducer";
<<<<<<< HEAD
import API_ENDPOINTS from "../config/apiConfig";
=======
>>>>>>> b1a8bb87a9f2e1b3c2ce0c8518a40cf83a513f40
import "../styles/pages/Profile.css";

const Profile = () => {
  const dispatch = useDispatch();
  const { isAuthenticated } = useAuth();

  // Get state from Redux
  const { userData: user, editedUser, stats, recentActivity } = useSelector(state => state.profile);
  const { isEditing, loading, error } = useSelector(state => state.ui);

  // Fetch user data
  useEffect(() => {
    if (!isAuthenticated) {
      dispatch(setLoading(false));
      return;
    }

    dispatch(setLoading(true));

    const fetchUserData = async () => {
      try {
        // Get user settings
<<<<<<< HEAD
        const response = await axios.get(API_ENDPOINTS.SETTINGS.BASE, {
=======
        const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/settings`, {
>>>>>>> b1a8bb87a9f2e1b3c2ce0c8518a40cf83a513f40
          headers: {
            Authorization: `Bearer ${localStorage.getItem('authToken')}`
          }
        });

        if (response.data.success) {
          const userData = response.data.userSettings;

          // Format the data
          const formattedUserData = {
            fullName: userData.fullName || "User",
            email: userData.email || "",
            phoneNumber: userData.phoneNumber || "",
            joinDate: userData.createdAt || new Date().toISOString(),
            profileImage: userData.profileImage
<<<<<<< HEAD
              ? API_ENDPOINTS.UPLOADS(userData.profileImage)
=======
              ? `${import.meta.env.VITE_API_BASE_URL}/uploads/${userData.profileImage}`
>>>>>>> b1a8bb87a9f2e1b3c2ce0c8518a40cf83a513f40
              : "https://randomuser.me/api/portraits/lego/1.jpg",
            tradingExperience: userData.tradingExperience || "Beginner",
            preferredMarkets: userData.preferredMarkets || ["Stocks"],
            bio: userData.bio || "No bio provided yet."
          };

          // Mock statistics data
          const statsData = {
            totalTrades: 24,
            successRate: 65,
            avgReturn: 8.7,
            portfolioValue: 12500.00,
            activeWatchlists: 3
          };

          // Mock recent activity data
          const activityData = [
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
          ];

          // Dispatch to Redux
          dispatch(fetchProfileSuccess({
            userData: formattedUserData,
            stats: statsData,
            recentActivity: activityData
          }));

          // Also set the edited user data
          dispatch(setEditedUser(formattedUserData));
        }
      } catch (err) {
        console.error("Error fetching user data:", err);
        dispatch(setError("Failed to load user data. Please try again later."));

        // Set default data for development
        const defaultUserData = {
          fullName: "Demo User",
          email: "demo@example.com",
          phoneNumber: "+1 (555) 123-4567",
          joinDate: new Date().toISOString(),
          profileImage: "https://randomuser.me/api/portraits/lego/1.jpg",
          tradingExperience: "Beginner",
          preferredMarkets: ["Stocks", "ETFs"],
          bio: "This is a demo account."
        };

        // Dispatch default data to Redux
        dispatch(fetchProfileSuccess({
          userData: defaultUserData,
          stats: {
            totalTrades: 24,
            successRate: 65,
            avgReturn: 8.7,
            portfolioValue: 12500.00,
            activeWatchlists: 3
          },
          recentActivity: []
        }));

        // Also set the edited user data
        dispatch(setEditedUser(defaultUserData));
      } finally {
        dispatch(setLoading(false));
      }
    };

    fetchUserData();
  }, [isAuthenticated, dispatch]);

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
    dispatch(setEditedUser({ ...editedUser, [name]: value }));
  };

  // Handle profile image change
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type and size
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      const maxSize = 2 * 1024 * 1024; // 2MB

      if (!validTypes.includes(file.type)) {
        dispatch(showErrorToast('Please select a valid image file (JPEG, PNG, GIF, or WebP)'));
        return;
      }

      if (file.size > maxSize) {
        dispatch(showErrorToast('Image size should be less than 2MB'));
        return;
      }

      // Store the file object directly for form submission
      dispatch(setEditedUser({ ...editedUser, profileImage: file }));

      // Also create a preview URL for display
      const reader = new FileReader();
      reader.onloadend = () => {
        // This is just for preview, we'll use the file object for upload
        dispatch(setEditedUser({ ...editedUser, profileImagePreview: reader.result }));
      };
      reader.readAsDataURL(file);

      // Show success message
      dispatch(showSuccessToast('Image selected successfully. Click Save Changes to update your profile.'));
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch(setLoading(true));

    try {
      // Validate form data
      if (!editedUser.fullName.trim()) {
        dispatch(showErrorToast('Full name is required'));
        dispatch(setLoading(false));
        return;
      }

      // Prepare form data for API
      const formData = new FormData();
      formData.append('fullName', editedUser.fullName.trim());
      formData.append('phoneNumber', editedUser.phoneNumber.trim());
      formData.append('tradingExperience', editedUser.tradingExperience);
      formData.append('bio', editedUser.bio.trim());

      // Add preferredMarkets if it exists
      if (editedUser.preferredMarkets && Array.isArray(editedUser.preferredMarkets)) {
        formData.append('preferredMarkets', JSON.stringify(editedUser.preferredMarkets));
      }

      // Check if profile image is a File object (new upload) or a string (existing URL)
      if (editedUser.profileImage instanceof File) {
        formData.append('profileImage', editedUser.profileImage);
        console.log('Uploading new profile image:', editedUser.profileImage.name);
      }

<<<<<<< HEAD
      // Send data to API with timeout and retry logic
      const maxRetries = 2;
      let retries = 0;
      let success = false;
      let response;
=======
      // Send data to API
      const response = await axios.put(`${import.meta.env.VITE_API_BASE_URL}/api/settings`, formData, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'multipart/form-data'
        }
      });
>>>>>>> b1a8bb87a9f2e1b3c2ce0c8518a40cf83a513f40

      while (retries <= maxRetries && !success) {
        try {
          response = await axios.put(API_ENDPOINTS.SETTINGS.BASE, formData, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
              'Content-Type': 'multipart/form-data'
            },
            timeout: 15000 // 15 seconds timeout
          });
          success = true;
        } catch (error) {
          retries++;
          console.log(`Attempt ${retries} failed. ${retries <= maxRetries ? 'Retrying...' : 'Giving up.'}`);
          if (retries > maxRetries) throw error;
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      if (response && response.data.success) {
        // Update user state with new data
        const updatedUserData = {
          ...editedUser,
          profileImage: response.data.userSettings.profileImage
<<<<<<< HEAD
            ? API_ENDPOINTS.UPLOADS(response.data.userSettings.profileImage)
            : editedUser.profileImage
        };

        // Remove the preview URL as we now have the actual URL
        delete updatedUserData.profileImagePreview;

        dispatch(fetchProfileSuccess({
          userData: updatedUserData,
          stats,
          recentActivity
        }));
=======
            ? `${import.meta.env.VITE_API_BASE_URL}/uploads/${response.data.userSettings.profileImage}`
            : editedUser.profileImage
        };

        // Update the user data in Redux
        dispatch(updateProfileSuccess(updatedUserData));

        // Exit editing mode
>>>>>>> b1a8bb87a9f2e1b3c2ce0c8518a40cf83a513f40
        dispatch(setIsEditing(false));

        // Show success message
        dispatch(showSuccessToast('Profile updated successfully!'));

        // Also update the auth state if needed
        if (dispatch.updateUserData) {
          dispatch(updateUserData(updatedUserData));
        }
      } else {
        dispatch(showErrorToast('Failed to update profile. Please try again.'));
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      dispatch(showErrorToast(err.response?.data?.message || 'Failed to update profile. Please try again.'));

      // For development, still update the UI
<<<<<<< HEAD
      if (process.env.NODE_ENV === 'development') {
        const updatedUserData = { ...editedUser };

        // If there's a preview URL, use it as the profile image in development
        if (editedUser.profileImagePreview) {
          updatedUserData.profileImage = editedUser.profileImagePreview;
        }

        // Remove the preview URL property
        delete updatedUserData.profileImagePreview;

        dispatch(fetchProfileSuccess({
          userData: updatedUserData,
          stats,
          recentActivity
        }));
        dispatch(setIsEditing(false));
        dispatch(showSuccessToast('Profile updated in development mode'));
      }
=======
      // This allows testing the UI without a working backend
      dispatch(updateProfileSuccess(editedUser));
      dispatch(setIsEditing(false));
>>>>>>> b1a8bb87a9f2e1b3c2ce0c8518a40cf83a513f40
    } finally {
      dispatch(setLoading(false));
    }
  };

  return (
    <PageLayout>
      <div className="profile-container">
        <div className="profile-header">
          <h1>My Profile</h1>
          {!isEditing && !loading && (
            <button className="edit-profile-btn" onClick={() => dispatch(setIsEditing(true))}>
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
                  <motion.img
                    src={editedUser.profileImagePreview || editedUser.profileImage}
                    alt={editedUser.fullName}
                    className="profile-image"
                    initial={{ scale: 1 }}
                    whileHover={{ scale: 1.05 }}
                    transition={{ type: "spring", stiffness: 300, damping: 15 }}
                  />
                  <motion.label
                    className="image-upload-label"
                    whileHover={{ scale: 1.1, backgroundColor: "rgba(85, 130, 139, 0.9)" }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  >
                    <FiCamera />
                    <span className="upload-text">Change Photo</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/gif,image/webp"
                      onChange={handleImageChange}
                      className="image-upload-input"
                    />
                  </motion.label>
                  <div className="image-upload-help">
                    Click to upload a new profile photo (max 2MB)
                  </div>
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
                      dispatch(setIsEditing(false));
                      dispatch(setEditedUser({ ...user }));
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
