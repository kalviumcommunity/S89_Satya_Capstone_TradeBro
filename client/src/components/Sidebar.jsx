import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  FiHome,
  FiTrendingUp,
  FiBookOpen,
  FiClock,
  FiBriefcase,
  FiSettings,
  FiMenu,
} from "react-icons/fi";
import "./Sidebar.css";

const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check if screen is mobile size
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    // Initial check
    checkIfMobile();

    // Add event listener for window resize
    window.addEventListener('resize', checkIfMobile);

    // Cleanup
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  const toggleSidebar = () => setIsCollapsed(!isCollapsed);

  return (
    <div className={`sidebar ${isCollapsed ? "collapsed" : ""} ${isMobile ? "mobile" : ""}`}>
      <div className="top-section">
        <button className="toggle-btn" onClick={toggleSidebar}>
          <FiMenu />
        </button>
        {!isCollapsed && <h1 className="logo">🚀 TradeBro</h1>}
      </div>

      <ul className="sidebar-links">
        <li>
          <Link to="/" className="sidebar-link">
            <FiHome />
            {!isCollapsed && <span>Dashboard</span>}
          </Link>
        </li>
        <li>
          <Link to="/watchlist" className="sidebar-link">
            <FiTrendingUp />
            {!isCollapsed && <span>Watchlist</span>}
          </Link>
        </li>
        <li>
          <Link to="/orders" className="sidebar-link">
            <FiBookOpen />
            {!isCollapsed && <span>Orders</span>}
          </Link>
        </li>
        <li>
          <Link to="/history" className="sidebar-link">
            <FiClock />
            {!isCollapsed && <span>History</span>}
          </Link>
        </li>
        <li>
          <Link to="/portfolio" className="sidebar-link">
            <FiBriefcase />
            {!isCollapsed && <span>Portfolio</span>}
          </Link>
        </li>
      </ul>

      <div className="sidebar-bottom">
        <Link to="/settings" className="sidebar-link">
          <FiSettings />
          {!isCollapsed && <span>Settings</span>}
        </Link>
      </div>
    </div>
  );
};

export default Sidebar;
