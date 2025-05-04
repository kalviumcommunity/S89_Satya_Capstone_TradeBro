import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  FiTrendingUp,
  FiBriefcase,
  FiSettings,
  FiMenu,
  FiUser,
  FiCpu,
  FiBarChart2,
  FiLogOut,
  FiClock,
  FiBookOpen,
  FiFileText,
  FiBell,
} from "react-icons/fi";
import ThemeToggle from "./ThemeToggle";
import { useSidebar } from "../context/SidebarContext";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import "./Sidebar.css";

const Sidebar = () => {
  // Use the sidebar context instead of local state
  const { isCollapsed, isMobile, toggleSidebar } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuth();

  // User data state
  const [user, setUser] = useState({
    fullName: "User",
    email: "",
    profileImage: "https://randomuser.me/api/portraits/lego/1.jpg",
    role: "Member"
  });

  // Get user data from localStorage
  useEffect(() => {
    if (!isAuthenticated) return;

    // Get user data directly from localStorage
    const userInfo = {
      fullName: localStorage.getItem('userFullName') || localStorage.getItem('userName') || "User",
      email: localStorage.getItem('userEmail') || "",
      profileImage: localStorage.getItem('userProfileImage')
        ? `http://localhost:5000/uploads/${localStorage.getItem('userProfileImage')}`
        : "https://randomuser.me/api/portraits/lego/1.jpg",
      role: "Member"
    };

    setUser(userInfo);
  }, [isAuthenticated]);

  // Handle logout
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className={`sidebar ${isCollapsed ? "collapsed" : ""} ${isMobile ? "mobile" : ""}`}>
      <div className="top-section">
        <button className="toggle-btn" onClick={toggleSidebar}>
          <FiMenu />
        </button>
        {!isCollapsed && <h1 className="logo">🚀 TradeBro</h1>}
      </div>

      {!isCollapsed && (
        <div className="user-profile">
          <div className="user-avatar">
            <img src={user.profileImage} alt={user.fullName} />
          </div>
          <div className="user-info">
            <h3 className="user-name">{user.fullName}</h3>
            <p className="user-role">{user.role}</p>
          </div>
        </div>
      )}

      <ul className="sidebar-links">
        <li>
          <Link to="/dashboard" className={`sidebar-link ${location.pathname === "/dashboard" ? "active" : ""}`}>
            <FiBarChart2 />
            {!isCollapsed && <span>Dashboard</span>}
          </Link>
        </li>
        <li>
          <Link to="/portfolio" className={`sidebar-link ${location.pathname === "/portfolio" ? "active" : ""}`}>
            <FiBriefcase />
            {!isCollapsed && <span>Portfolio</span>}
          </Link>
        </li>
        <li>
          <Link to="/watchlist" className={`sidebar-link ${location.pathname === "/watchlist" ? "active" : ""}`}>
            <FiTrendingUp />
            {!isCollapsed && <span>Watchlist</span>}
          </Link>
        </li>
        <li>
          <Link to="/orders" className={`sidebar-link ${location.pathname === "/orders" ? "active" : ""}`}>
            <FiBookOpen />
            {!isCollapsed && <span>Orders</span>}
          </Link>
        </li>
        <li>
          <Link to="/history" className={`sidebar-link ${location.pathname === "/history" ? "active" : ""}`}>
            <FiClock />
            {!isCollapsed && <span>History</span>}
          </Link>
        </li>
        <li>
          <Link to="/news" className={`sidebar-link ${location.pathname === "/news" ? "active" : ""}`}>
            <FiFileText />
            {!isCollapsed && <span>News</span>}
          </Link>
        </li>
        <li>
          <Link to="/notifications" className={`sidebar-link ${location.pathname === "/notifications" ? "active" : ""}`}>
            <FiBell />
            {!isCollapsed && <span>Notifications</span>}
          </Link>
        </li>
        <li>
          <Link to="/assistant" className={`sidebar-link ${location.pathname === "/assistant" ? "active" : ""} highlight`}>
            <FiCpu />
            {!isCollapsed && <span>Trading Assistant</span>}
          </Link>
        </li>
      </ul>

      <div className="sidebar-bottom">
        <div className="sidebar-actions">
          <div className="action-buttons">
            <div className="theme-toggle-container">
              <ThemeToggle />
            </div>
          </div>

          <Link to="/profile" className={`sidebar-link ${location.pathname === "/profile" ? "active" : ""}`}>
            <FiUser />
            {!isCollapsed && <span>Profile</span>}
          </Link>

          <Link to="/settings" className={`sidebar-link ${location.pathname === "/settings" ? "active" : ""}`}>
            <FiSettings />
            {!isCollapsed && <span>Settings</span>}
          </Link>

          <button onClick={handleLogout} className="sidebar-link logout-btn">
            <FiLogOut />
            {!isCollapsed && <span>Logout</span>}
          </button>
        </div>

        {!isCollapsed && (
          <div className="sidebar-footer">
            <p className="copyright">© 2023 TradeBro</p>
            <p className="version">v1.0.0</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
