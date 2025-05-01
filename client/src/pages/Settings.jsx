import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./Settings.css";
import "./AuthPages.css";
import Sidebar from "../components/Sidebar";
import Squares from "../UI/squares";
import { useToast } from "../context/ToastContext";

const SettingsPage = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
    language: "English",
  });
  const [profileImage, setProfileImage] = useState(null);
  const [notifications, setNotifications] = useState(true); // New state for notifications
  const [successMessage, setSuccessMessage] = useState("");
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleImageChange = (e) => {
    setProfileImage(e.target.files[0]);
  };

  const handleSave = async () => {
    const data = new FormData();
    data.append("fullName", formData.fullName);
    data.append("email", formData.email);
    data.append("phoneNumber", formData.phoneNumber);
    data.append("language", formData.language);
    data.append("notifications", notifications); // Include notifications in the request
    if (profileImage) {
      data.append("profileImage", profileImage);
    }

    try {
      const response = await axios.put("http://localhost:5000/api/settings", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setSuccessMessage(response.data.message);

      setFormData({
        fullName: "",
        email: "",
        phoneNumber: "",
        language: "English",
      });
      setProfileImage(null);
      setNotifications(true);
    } catch (error) {
      console.error("Error updating settings:", error);
      alert("Failed to update settings.");
    }
  };

  const handleDelete = async () => {
    try {
      const response = await axios.delete("http://localhost:5000/api/settings");
      setSuccessMessage(response.data.message);
      setFormData({
        fullName: "",
        email: "",
        phoneNumber: "",
        language: "English",
      });
      setProfileImage(null);
      setNotifications(true);
    } catch (error) {
      console.error("Error deleting settings:", error);
      alert("Failed to delete settings.");
    }
  };

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      // Call the logout endpoint
      await axios.get("http://localhost:5000/api/auth/logout");

      // Clear any local storage items related to authentication
      localStorage.removeItem("authToken");

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
      <Sidebar />
      <div className="settings-layout">
        <div className="settings-container">
          <h1 className="settings-header">⚙️ Account Settings</h1>
          <div className="settings-card">
            <label>Full Name</label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleInputChange}
            />
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
            />
            <label>Phone Number</label>
            <input
              type="text"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleInputChange}
            />
            <label>Language</label>
            <select
              name="language"
              value={formData.language}
              onChange={handleInputChange}
            >
              <option value="English">English</option>
              <option value="Spanish">Spanish</option>
              <option value="French">French</option>
            </select>
            <label>Profile Image</label>
            <input type="file" onChange={handleImageChange} />
          </div>
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
          </div>
          <div className="settings-buttons">
            <button className="save-btn" onClick={handleSave}>
              Save Changes
            </button>
            <button className="delete-btn" onClick={handleDelete}>
              Delete Settings
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
    </div>
  );
};

export default SettingsPage;
