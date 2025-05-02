import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  FiHome,
  FiTrendingUp,
  FiBookOpen,
  FiClock,
  FiBriefcase,
  FiSettings,
  FiMenu,
  FiUser,
  FiBell,
  FiFileText,
  FiMessageSquare,
  FiCpu,
} from "react-icons/fi";
import NotificationsPopup from "./NotificationsPopup";
import ThemeToggle from "./ThemeToggle";
import { useSidebar } from "../context/SidebarContext";
import "./Sidebar.css";

const Sidebar = () => {
  // Use the sidebar context instead of local state
  const { isCollapsed, isMobile, toggleSidebar } = useSidebar();
  const location = useLocation();

  // Mock user data (in a real app, this would come from context or API)
  const [user, setUser] = useState({
    name: "John Doe",
    email: "john.doe@example.com",
    profileImage: "https://randomuser.me/api/portraits/men/32.jpg",
    role: "Premium Member"
  });

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
            <img src={user.profileImage} alt={user.name} />
          </div>
          <div className="user-info">
            <h3 className="user-name">{user.name}</h3>
            <p className="user-role">{user.role}</p>
          </div>
        </div>
      )}

      <ul className="sidebar-links">
        <li>
          <Link to="/" className={`sidebar-link ${location.pathname === "/" ? "active" : ""}`}>
            <FiHome />
            {!isCollapsed && <span>Dashboard</span>}
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
          <Link to="/portfolio" className={`sidebar-link ${location.pathname === "/portfolio" ? "active" : ""}`}>
            <FiBriefcase />
            {!isCollapsed && <span>Portfolio</span>}
          </Link>
        </li>
        <li>
          <Link to="/news" className={`sidebar-link ${location.pathname === "/news" ? "active" : ""}`}>
            <FiFileText />
            {!isCollapsed && <span>News</span>}
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
            <div className="notification-container">
              <NotificationsPopup />
            </div>
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
