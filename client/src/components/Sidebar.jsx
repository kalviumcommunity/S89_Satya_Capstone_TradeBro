import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  FiTrendingUp,
  FiBriefcase,
  FiSettings,
  FiMenu,
  FiUser,
  FiBarChart2,
  FiLogOut,
  FiClock,
  FiFileText,
  FiBell,
  FiMessageSquare,
  FiPieChart,
  FiActivity,
  FiBookmark,
  FiShoppingCart,
  FiStar,
  FiZap,
  FiMessageCircle,
  FiCpu,
} from "react-icons/fi";

import { useSidebar } from "../context/SidebarContext";
import { useAuth } from "../context/AuthContext";
import SaytrixTriggerButton from "./voice/SaytrixTriggerButton";
import axios from "axios";
import API_ENDPOINTS from "../config/apiConfig";
import "../styles/components/Sidebar.css";

const Sidebar = () => {
  // Use the sidebar context instead of local state
  const { isCollapsed, isMobile, toggleSidebar } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuth();



  // Loading and animation states
  const [isLoaded, setIsLoaded] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // User data state
  const [user, setUser] = useState({
    fullName: "User",
    email: "",
    profileImage: "https://randomuser.me/api/portraits/lego/1.jpg",
    role: "Member"
  });

  // Get user data from localStorage and handle loading
  useEffect(() => {
    const loadSidebar = async () => {
      // Simulate loading for smooth animation
      await new Promise(resolve => setTimeout(resolve, 100));

      if (!isAuthenticated) {
        setIsLoaded(true);
        return;
      }

      // Get user data directly from localStorage
      const userInfo = {
        fullName: localStorage.getItem('userFullName') || localStorage.getItem('userName') || "User",
        email: localStorage.getItem('userEmail') || "",
        profileImage: localStorage.getItem('userProfileImage')
          ? API_ENDPOINTS.UPLOADS(localStorage.getItem('userProfileImage'))
          : "https://randomuser.me/api/portraits/lego/1.jpg",
        role: "Member"
      };

      setUser(userInfo);
      setIsLoaded(true);
    };

    loadSidebar();
  }, [isAuthenticated]);

  // Handle sidebar toggle with animation
  const handleToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsAnimating(true);
    toggleSidebar();
    setTimeout(() => setIsAnimating(false), 300);
  };

  // Handle logout
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div
      className={`sidebar ${isCollapsed ? "collapsed" : ""} ${isMobile ? "mobile" : ""} ${isLoaded ? "loaded" : "loading"} ${isAnimating ? "animating" : ""}`}
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="top-section">
        <button
          className="toggle-btn"
          onClick={handleToggle}
          type="button"
          aria-label={isCollapsed ? "Expand sidebar navigation" : "Collapse sidebar navigation"}
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-expanded={!isCollapsed}
        >
          <FiMenu />
        </button>


        {!isCollapsed && (
          <div className="logo-section">
            <h1 className="logo" role="banner">
              ⚡ TradeBro
            </h1>
            <SaytrixTriggerButton
              position="navbar"
              size="small"
              showLabel={false}
              className="sidebar-voice-btn"
            />
          </div>
        )}
      </div>

      {!isCollapsed && (
        <div className="user-profile">
          <div className="user-avatar">
            <div className="avatar-symbol">👤</div>
          </div>
          <div className="user-info">
            <h3 className="user-name">{user.fullName}</h3>
            <p className="user-role">{user.role}</p>
          </div>
        </div>
      )}

      <nav role="navigation" aria-label="Main menu">
        <ul className="sidebar-links">
          <li>
            <Link
              to="/dashboard"
              className={`sidebar-link ${location.pathname === "/dashboard" ? "active" : ""}`}
              aria-current={location.pathname === "/dashboard" ? "page" : undefined}
              title="Dashboard"
            >
              <FiBarChart2 aria-hidden="true" />
              {!isCollapsed && <span>Dashboard</span>}
            </Link>
          </li>
        <li>
          <Link to="/charts" className={`sidebar-link ${location.pathname === "/charts" ? "active" : ""}`}>
            <FiTrendingUp />
            {!isCollapsed && <span>Charts</span>}
          </Link>
        </li>
        <li>
          <Link to="/portfolio" className={`sidebar-link ${location.pathname === "/portfolio" ? "active" : ""}`}>
            <FiPieChart />
            {!isCollapsed && <span>Portfolio</span>}
          </Link>
        </li>
        <li>
          <Link to="/watchlist" className={`sidebar-link ${location.pathname === "/watchlist" ? "active" : ""}`}>
            <FiBookmark />
            {!isCollapsed && <span>Watchlist</span>}
          </Link>
        </li>
        <li>
          <Link to="/orders" className={`sidebar-link ${location.pathname === "/orders" ? "active" : ""}`}>
            <FiShoppingCart />
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
          <Link to="/saytrix" className={`sidebar-link ${(location.pathname === "/saytrix" || location.pathname === "/chatbot") ? "active" : ""} highlight`}>
            <FiMessageCircle />
            {!isCollapsed && <span>Saytrix AI</span>}
          </Link>
        </li>
      </ul>
      </nav>

      <div className="sidebar-bottom">
        <div className="sidebar-actions">
          <Link to="/profile" className={`sidebar-link ${location.pathname === "/profile" ? "active" : ""}`}>
            <FiUser />
            {!isCollapsed && <span>Profile</span>}
          </Link>

          <Link to="/settings" className={`sidebar-link ${location.pathname === "/settings" ? "active" : ""}`}>
            <FiSettings />
            {!isCollapsed && <span>Settings</span>}
          </Link>

          <button
            onClick={handleLogout}
            className="sidebar-link logout-btn"
            aria-label="Logout from TradeBro"
            title="Logout from TradeBro"
          >
            <FiLogOut />
            {!isCollapsed && <span>Logout</span>}
          </button>
        </div>

        {!isCollapsed && (
          <div className="sidebar-footer">
            <p className="copyright">© 2024 TradeBro ⚡</p>
            <p className="version">v1.0.0 • 🚀</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
