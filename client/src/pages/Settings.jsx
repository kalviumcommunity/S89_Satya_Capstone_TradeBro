import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./Settings.css";
import PageLayout from "../components/PageLayout";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";
import API_ENDPOINTS from "../config/apiConfig";

const SettingsPage = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { logout } = useAuth();
  const [notifications, setNotifications] = useState(false); // Notifications setting
  const [successMessage, setSuccessMessage] = useState("");
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Fetch current notification settings
  useEffect(() => {
    const fetchNotificationSettings = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/settings/notifications");
        if (response.data.success) {
          // Ensure we're setting a boolean value
          setNotifications(response.data.notifications === true);
        }
      } catch (error) {
        console.error("Error fetching notification settings:", error);
        // Use default value (true) if fetch fails
        setNotifications(true);
      }
    };

    fetchNotificationSettings();
  }, []);

  // Function to update notifications setting automatically when toggled
  const handleNotificationsToggle = async () => {
    const newValue = !notifications;
    setNotifications(newValue);
    setIsUpdating(true);

    try {
      const response = await axios.put("http://localhost:5000/api/settings/notifications", {
        notifications: newValue
      });

      // Set success message and clear it after 3 seconds
      setSuccessMessage(response.data.message || "Notification settings updated successfully");
      setTimeout(() => {
        setSuccessMessage("");
      }, 3000);

      // Show toast notification
      toast.success("Notifications " + (newValue ? "enabled" : "disabled"));
    } catch (error) {
      console.error("Error updating notification settings:", error);
      toast.error("Failed to update notification settings");
      // Revert the toggle if the API call fails
      setNotifications(!newValue);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      // Use the logout function from AuthContext
      await logout();

      // Show success message
      toast.success("Successfully signed out");

      // Redirect to login page after a short delay
      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (error) {
      console.error("Error signing out:", error);
      toast.error("Failed to sign out. Please try again.");
      setIsSigningOut(false);
    }
  };

  return (
    <PageLayout>
      <div className="settings-container-wrapper">
        <div className="settings-container">
          <h1 className="settings-header">⚙️ Application Settings</h1>

          <div className="settings-card">
            <h3>🔔 Notifications</h3>
            <div className="toggle-switch">
              <label>Enable Notifications</label>
              <div>
                <input
                  type="checkbox"
                  checked={notifications === true}
                  onChange={handleNotificationsToggle}
                  disabled={isUpdating}
                />
                {isUpdating && <span className="updating-indicator">Updating</span>}
              </div>
            </div>
            <p className="setting-description">
              Receive notifications about market updates, price alerts, and important news.
              You'll be notified when there are significant changes in your watchlist stocks.
            </p>
          </div>

          <div className="settings-card">
            <h3>🔐 Account Actions</h3>
            <p className="setting-description">
              Sign out from your account to end your current session. All your data will remain
              secure and you can log back in anytime.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
              <button
                className="signout-btn"
                onClick={handleSignOut}
                disabled={isSigningOut}
              >
                {isSigningOut ? "Signing Out..." : "Sign Out"}
              </button>
            </div>
          </div>

          {successMessage && <div className="success-message">{successMessage}</div>}
        </div>
      </div>
    </PageLayout>
  );
};

export default SettingsPage;
