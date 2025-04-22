import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import "./Sidebar.css";

const Sidebar = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Fetch user details when the component mounts
    const fetchUserDetails = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/user", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        setUser(res.data); // Assuming the API returns user data
      } catch (err) {
        console.error("Error fetching user details:", err);
      }
    };

    fetchUserDetails();
  }, []);

  return (
    <div className="sidebar">
      <div className="navbar-logo">🚀 TradeBro</div>
      
      {/* User details section */}
      <div className="user-details">
        {user ? (
          <>
            <div className="user-profile-pic">
              <img
                src={user.profilePicture || "default-avatar.png"} // Use default if no picture
                alt="User Profile"
                className="profile-pic"
              />
            </div>
            <div className="user-info">
              <p className="username">{user.username}</p>
              <p className="email">{user.email}</p>
            </div>
          </>
        ) : (
          <p>Loading...</p>
        )}
      </div>

      {/* Navigation links */}
      <ul>
        <li><Link to="/">🏠 Dashboard</Link></li>
        <li><Link to="/watchlist">📈 Watchlist</Link></li>
        <li><Link to="/portfolio">💼 Portfolio</Link></li>
        <li><Link to="/orders">🧾 Orders</Link></li>
        <li><Link to="/history">📜 History</Link></li>
        <li><Link to="/settings">⚙️ Settings</Link></li>
        <li><Link to="/assistant">🤖 Trading Assistant</Link></li>
      </ul>
    </div>
  );
};

export default Sidebar;
