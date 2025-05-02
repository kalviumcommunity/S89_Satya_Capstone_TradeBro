import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./Settings.css";
import "./AuthPages.css";
import PageLayout from "../components/PageLayout";
import Squares from "../UI/squares";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";

const SettingsPage = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { logout } = useAuth();
  const [notifications, setNotifications] = useState(true); // Notifications setting
  const [successMessage, setSuccessMessage] = useState("");
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSaveNotifications = async () => {
    try {
      const response = await axios.put("http://localhost:5000/api/settings/notifications", {
        notifications
      });

      setSuccessMessage(response.data.message || "Notification settings updated successfully");
      toast.success("Settings saved successfully");
    } catch (error) {
      console.error("Error updating notification settings:", error);
      toast.error("Failed to update settings");
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
    <div className="auth-full-bg">
      <Squares
        speed={0.5}
        squareSize={40}
        direction="diagonal"
        borderColor="#cccccc"
        hoverFillColor="#ffffff"
        backgroundColor="#f0f8ff"
      />
      <PageLayout>
        <div className="settings-container-wrapper">
        <div className="settings-container">
          <h1 className="settings-header">⚙️ Application Settings</h1>
          <div className="settings-card">
            <h3>🔔 Notifications</h3>
            <div className="toggle-switch">
              <label>Enable Notifications</label>
              <input
                type="checkbox"
                checked={notifications}
                onChange={() => setNotifications(!notifications)}
              />
            </div>
            <p className="setting-description">
              Receive notifications about market updates, price alerts, and important news.
            </p>
          </div>
          <div className="settings-buttons">
            <button className="save-btn" onClick={handleSaveNotifications}>
              Save Changes
            </button>
          </div>

          <div className="settings-card account-actions">
            <h3>🔐 Account Actions</h3>
            <p>Sign out from your account or manage other account-related actions.</p>
            <button
              className="signout-btn"
              onClick={handleSignOut}
              disabled={isSigningOut}
            >
              {isSigningOut ? "Signing Out..." : "Sign Out"}
            </button>
          </div>
          {successMessage && <p className="success-message">{successMessage}</p>}
        </div>
        </div>
      </PageLayout>
    </div>
  );
};

export default SettingsPage;
