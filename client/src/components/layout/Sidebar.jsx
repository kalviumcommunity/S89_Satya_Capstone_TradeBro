import React, { useState, useEffect, useRef, createContext, useContext } from "react";
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
  FiX,
} from "react-icons/fi";

import { useAuth } from "../../contexts/AuthContext";
import { useNotifications } from "../../contexts/NotificationContext";
import SaytrixTriggerButton from "../voice/SaytrixTriggerButton";
import axios from "axios";
import API_ENDPOINTS from "../../config/apiConfig";
import "../../styles/components/Sidebar.css";

// Local Sidebar Context - only used within this component
const LocalSidebarContext = createContext();

const useLocalSidebar = () => {
  const context = useContext(LocalSidebarContext);
  if (!context) {
    throw new Error('useLocalSidebar must be used within LocalSidebarProvider');
  }
  return context;
};

// Local Sidebar Provider
const LocalSidebarProvider = ({ children }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check if mobile on mount and window resize
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (mobile) {
        setIsCollapsed(true); // Auto-collapse on mobile
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Update main content classes based on sidebar state
  useEffect(() => {
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
      mainContent.classList.add('with-sidebar');

      if (isCollapsed) {
        mainContent.classList.add('sidebar-collapsed');
        mainContent.classList.remove('sidebar-expanded');
      } else {
        mainContent.classList.add('sidebar-expanded');
        mainContent.classList.remove('sidebar-collapsed');
      }
    }

    // Cleanup on unmount
    return () => {
      if (mainContent) {
        mainContent.classList.remove('with-sidebar', 'sidebar-collapsed', 'sidebar-expanded');
      }
    };
  }, [isCollapsed]);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const value = {
    isCollapsed,
    isMobile,
    toggleSidebar,
    setIsCollapsed
  };

  return (
    <LocalSidebarContext.Provider value={value}>
      {children}
    </LocalSidebarContext.Provider>
  );
};

// Mobile Menu Button Component
const MobileMenuButton = () => {
  const { isCollapsed, isMobile, toggleSidebar } = useLocalSidebar();

  // Only show on mobile when sidebar is collapsed
  if (!isMobile || !isCollapsed) {
    return null;
  }

  return (
    <button
      className="mobile-menu-btn"
      onClick={toggleSidebar}
      aria-label="Open navigation menu"
      type="button"
    >
      <FiMenu />
    </button>
  );
};

// Sidebar Overlay Component
const SidebarOverlay = () => {
  const { isCollapsed, isMobile, toggleSidebar } = useLocalSidebar();

  // Only show on mobile when sidebar is open
  if (!isMobile || isCollapsed) {
    return null;
  }

  return (
    <div
      className={`sidebar-overlay ${!isCollapsed ? 'show' : ''}`}
      onClick={toggleSidebar}
      aria-hidden="true"
    />
  );
};

const SidebarContent = () => {
  // Use the local sidebar context
  const { isCollapsed, isMobile, toggleSidebar } = useLocalSidebar();
  const { unreadCount } = useNotifications();
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, logout, user: authUser } = useAuth();

  // Ref for direct sidebar control
  const sidebarRef = useRef(null);



  // Get user data from AuthContext
  const user = authUser || {
    fullName: "User",
    email: "",
    profileImage: "https://randomuser.me/api/portraits/lego/1.jpg",
    role: "Member"
  };



  // No additional resize handling needed - SidebarContext handles this

  // Handle sidebar toggle
  const handleToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleSidebar();
  };

  // Handle logout
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Update CSS custom properties for responsive layout
  useEffect(() => {
    const updateLayoutProperties = () => {
      const root = document.documentElement;
      if (isMobile) {
        root.style.setProperty('--sidebar-current-width', '0px');
      } else {
        root.style.setProperty('--sidebar-current-width', isCollapsed ? '80px' : '280px');
      }
    };

    updateLayoutProperties();
  }, [isCollapsed, isMobile]);

  // Force sidebar positioning fix - JavaScript override using ref - NUCLEAR OPTION
  useEffect(() => {
    const forceSidebarPosition = () => {
      const sidebarElement = sidebarRef.current;
      if (sidebarElement) {
        // NUCLEAR POSITIONING FIX - Force positioning styles via JavaScript using ref
        sidebarElement.style.position = 'fixed';
        sidebarElement.style.zIndex = '2147483647';
        sidebarElement.style.transform = 'none';
        sidebarElement.style.webkitTransform = 'none';
        sidebarElement.style.mozTransform = 'none';
        sidebarElement.style.msTransform = 'none';
        sidebarElement.style.oTransform = 'none';
        sidebarElement.style.margin = '0px';
        sidebarElement.style.contain = 'none';
        sidebarElement.style.isolation = 'auto';
        sidebarElement.style.willChange = 'auto';
        sidebarElement.style.backgroundAttachment = 'fixed';
        sidebarElement.style.boxSizing = 'border-box';
        sidebarElement.style.clip = 'auto';
        sidebarElement.style.clipPath = 'none';
        sidebarElement.style.mask = 'none';
        sidebarElement.style.filter = 'none';
        sidebarElement.style.mixBlendMode = 'normal';
        sidebarElement.style.opacity = '1';
        sidebarElement.style.visibility = 'visible';
        sidebarElement.style.backfaceVisibility = 'visible';
        sidebarElement.style.webkitBackfaceVisibility = 'visible';
        sidebarElement.style.perspective = 'none';
        sidebarElement.style.webkitPerspective = 'none';

        if (isMobile) {
          // Mobile navbar positioning
          sidebarElement.style.top = '0px';
          sidebarElement.style.left = '0px';
          sidebarElement.style.right = '0px';
          sidebarElement.style.width = '100%';

          if (isCollapsed) {
            // Collapsed navbar (just top bar)
            sidebarElement.style.bottom = 'auto';
            sidebarElement.style.height = '70px';
            sidebarElement.style.maxHeight = '70px';
            sidebarElement.style.minHeight = '70px';
            sidebarElement.style.padding = '12px 20px';
            sidebarElement.style.display = 'flex';
            sidebarElement.style.flexDirection = 'row';
            sidebarElement.style.alignItems = 'center';
            sidebarElement.style.justifyContent = 'space-between';
            sidebarElement.style.overflow = 'hidden';
          } else {
            // Expanded navbar (full screen menu)
            sidebarElement.style.bottom = '0px';
            sidebarElement.style.height = '100vh';
            sidebarElement.style.maxHeight = '100vh';
            sidebarElement.style.minHeight = '100vh';
            sidebarElement.style.padding = '20px';
            sidebarElement.style.display = 'flex';
            sidebarElement.style.flexDirection = 'column';
            sidebarElement.style.alignItems = 'stretch';
            sidebarElement.style.justifyContent = 'flex-start';
            sidebarElement.style.overflowY = 'auto';
          }
        } else {
          // Desktop sidebar positioning
          sidebarElement.style.top = '0px';
          sidebarElement.style.left = '0px';
          sidebarElement.style.bottom = '0px';
          sidebarElement.style.right = 'auto';
          sidebarElement.style.width = isCollapsed ? '80px' : '280px';
          sidebarElement.style.height = '100vh';
          sidebarElement.style.maxHeight = '100vh';
          sidebarElement.style.minHeight = '100vh';
          sidebarElement.style.padding = isCollapsed ? '24px 16px' : '24px 20px';
          sidebarElement.style.display = 'flex';
          sidebarElement.style.flexDirection = 'column';
          sidebarElement.style.overflowY = 'auto';
        }
      }
    };

    // Apply immediately
    forceSidebarPosition();

    // Apply on scroll to prevent any movement
    const handleScroll = () => {
      forceSidebarPosition();
    };

    // Apply on resize
    const handleResize = () => {
      forceSidebarPosition();
    };

    // Apply on any DOM changes
    const observer = new MutationObserver(() => {
      forceSidebarPosition();
    });

    if (sidebarRef.current) {
      observer.observe(sidebarRef.current, {
        attributes: true,
        attributeFilter: ['style', 'class']
      });
    }

    // Add event listeners
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize, { passive: true });
    document.addEventListener('scroll', handleScroll, { passive: true });

    // Cleanup
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('scroll', handleScroll);
      observer.disconnect();
    };
  }, [isCollapsed, isMobile]);

  // Clean CSS-only approach - no inline styles needed

  return (
    <div
      ref={sidebarRef}
      className={`sidebar ${isCollapsed ? "collapsed" : ""} ${isMobile ? "mobile" : ""}`}
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

        {/* Show logo section based on mobile/desktop state */}
        {(!isCollapsed || isMobile) && (
          <div className="logo-section">
            <h1 className="logo" role="banner">
              ⚡ TradeBro
            </h1>
            {!isCollapsed && (
              <SaytrixTriggerButton
                position="navbar"
                size="small"
                showLabel={false}
                className="sidebar-voice-btn"
              />
            )}
          </div>
        )}
      </div>

      {!isCollapsed && (
        <div className="user-profile">
          <div className="user-avatar">
            {(user.profileImage || user.picture || user.avatar) ? (
              <img 
                src={user.profileImage || user.picture || user.avatar} 
                alt={user.fullName || user.name}
                className="avatar-image"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
            ) : null}
            <div className="avatar-symbol" style={{display: (user.profileImage || user.picture || user.avatar) ? 'none' : 'flex'}}>👤</div>
          </div>
          <div className="user-info">
            <h3 className="user-name">{user.fullName || user.name || user.email}</h3>
            <p className="user-role">{user.role || "Member"}</p>
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
            <div className="sidebar-link-content">
              <div className="sidebar-icon-wrapper">
                <FiBell />
                {unreadCount > 0 && (
                  <span className="notification-badge">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </div>
              {!isCollapsed && <span>Notifications</span>}
            </div>
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

// Main Sidebar Component with all functionality
const Sidebar = () => {
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  // Check if current route should show sidebar
  const showSidebar = isAuthenticated && !['/login', '/signup', '/'].includes(location.pathname);

  if (!showSidebar) {
    return null;
  }

  return (
    <LocalSidebarProvider>
      {/* Mobile Menu Button */}
      <MobileMenuButton />

      {/* Sidebar Overlay */}
      <SidebarOverlay />

      {/* Main Sidebar Content */}
      <SidebarContent />
    </LocalSidebarProvider>
  );
};

export default Sidebar;