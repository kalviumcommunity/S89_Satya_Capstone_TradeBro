import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiHome,
  FiPieChart,
  FiTrendingUp,
  FiSettings,
  FiUser,
  FiHeart,
  FiClock,
  FiShoppingCart,
  FiMenu,
  FiX,
  FiLogOut,
  FiMessageSquare,
  FiBell,
  FiBookOpen,
  FiDollarSign
} from "react-icons/fi";
import { useSidebar } from "../context/SidebarContext";
import { useAuth } from "../context/AuthContext";
import { useVirtualMoney } from "../context/VirtualMoneyContext";
import "../styles/Sidebar.kalvium.css";

// Enhanced Sidebar Component with Tooltips
const EnhancedSidebar = () => {
  const { isCollapsed, toggleSidebar, isMobile } = useSidebar();
  const { user, logout } = useAuth();
  const { virtualMoney } = useVirtualMoney();
  const location = useLocation();
  const [showTooltips, setShowTooltips] = useState(true);

  // Disable tooltips on mobile
  useEffect(() => {
    const handleResize = () => {
      setShowTooltips(window.innerWidth > 768);
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Sidebar animation variants
  const sidebarVariants = {
    expanded: {
      width: isMobile ? "100%" : "260px",
      transition: {
        duration: 0.3,
        ease: "easeInOut"
      }
    },
    collapsed: {
      width: isMobile ? "0" : "80px",
      transition: {
        duration: 0.3,
        ease: "easeInOut"
      }
    }
  };

  // Menu item animation variants
  const menuItemVariants = {
    expanded: {
      opacity: 1,
      x: 0,
      display: "block",
      transition: {
        duration: 0.2,
        ease: "easeInOut"
      }
    },
    collapsed: {
      opacity: 0,
      x: -10,
      transitionEnd: {
        display: "none"
      },
      transition: {
        duration: 0.2,
        ease: "easeInOut"
      }
    }
  };

  // Menu items with tooltips
  const menuItems = [
    {
      title: "Dashboard",
      icon: <FiHome />,
      path: "/dashboard",
      tooltip: "View your dashboard"
    },
    {
      title: "Portfolio",
      icon: <FiPieChart />,
      path: "/portfolio",
      tooltip: "Manage your portfolio"
    },
    {
      title: "Watchlist",
      icon: <FiHeart />,
      path: "/watchlist",
      tooltip: "Track your favorite stocks"
    },
    {
      title: "Market News",
      icon: <FiBookOpen />,
      path: "/news",
      tooltip: "Latest market news"
    },
    {
      title: "Orders",
      icon: <FiShoppingCart />,
      path: "/orders",
      tooltip: "View your orders"
    },
    {
      title: "History",
      icon: <FiClock />,
      path: "/history",
      tooltip: "Transaction history"
    },
    {
      title: "Trading Assistant",
      icon: <FiMessageSquare />,
      path: "/assistant",
      tooltip: "Get AI-powered trading advice"
    },
    {
      title: "Notifications",
      icon: <FiBell />,
      path: "/notifications",
      tooltip: "View your notifications"
    }
  ];

  // User menu items with tooltips
  const userMenuItems = [
    {
      title: "Profile",
      icon: <FiUser />,
      path: "/profile",
      tooltip: "Manage your profile"
    },
    {
      title: "Settings",
      icon: <FiSettings />,
      path: "/settings",
      tooltip: "Adjust your settings"
    }
  ];

  // Handle logout
  const handleLogout = () => {
    logout();
  };

  // Tooltip component
  const Tooltip = ({ text, children, show }) => {
    if (!show || !isCollapsed || !showTooltips) return children;
    
    return (
      <div className="tooltip">
        {children}
        <span className="tooltip-text">{text}</span>
      </div>
    );
  };

  return (
    <motion.div
      className={`sidebar-kalvium ${isMobile ? "mobile" : ""} enhanced`}
      variants={sidebarVariants}
      animate={isCollapsed ? "collapsed" : "expanded"}
      initial={isCollapsed ? "collapsed" : "expanded"}
    >
      <div className="sidebar-content">
        <div className="top-section">
          <Tooltip text="Toggle Sidebar" show={true}>
            <button className="toggle-btn" onClick={toggleSidebar}>
              {isCollapsed ? <FiMenu /> : <FiX />}
            </button>
          </Tooltip>
          <AnimatePresence>
            {!isCollapsed && (
              <motion.h1
                className="logo"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                TradeBro
              </motion.h1>
            )}
          </AnimatePresence>
        </div>

        <AnimatePresence>
          {!isCollapsed && (
            <motion.div
              className="user-profile"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              <div className="user-avatar">
                <img src={user?.profileImage || "https://via.placeholder.com/40"} alt={user?.fullName || "User"} />
              </div>
              <div className="user-info">
                <h3 className="user-name">{user?.fullName || "Guest User"}</h3>
                <p className="user-role">{user?.role || "User"}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Virtual Money Display */}
        <AnimatePresence>
          {!isCollapsed && (
            <motion.div
              className="virtual-money-display"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              <div className="money-icon">
                <FiDollarSign />
              </div>
              <div className="money-details">
                <span className="money-label">Virtual Balance</span>
                <span className="money-amount">₹{virtualMoney?.balance?.toLocaleString() || '17,832.33'}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="menu-section">
          <div className="menu-title">
            {!isCollapsed && <span>Main Menu</span>}
          </div>
          <ul className="menu-items">
            {menuItems.map((item) => (
              <li key={item.path}>
                <Tooltip text={item.tooltip} show={true}>
                  <Link
                    to={item.path}
                    className={location.pathname === item.path ? "active" : ""}
                  >
                    <div className="menu-icon">{item.icon}</div>
                    <AnimatePresence>
                      {!isCollapsed && (
                        <motion.span
                          className="menu-text"
                          variants={menuItemVariants}
                          initial="collapsed"
                          animate="expanded"
                          exit="collapsed"
                        >
                          {item.title}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </Link>
                </Tooltip>
              </li>
            ))}
          </ul>
        </div>

        <div className="menu-section">
          <div className="menu-title">
            {!isCollapsed && <span>User</span>}
          </div>
          <ul className="menu-items">
            {userMenuItems.map((item) => (
              <li key={item.path}>
                <Tooltip text={item.tooltip} show={true}>
                  <Link
                    to={item.path}
                    className={location.pathname === item.path ? "active" : ""}
                  >
                    <div className="menu-icon">{item.icon}</div>
                    <AnimatePresence>
                      {!isCollapsed && (
                        <motion.span
                          className="menu-text"
                          variants={menuItemVariants}
                          initial="collapsed"
                          animate="expanded"
                          exit="collapsed"
                        >
                          {item.title}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </Link>
                </Tooltip>
              </li>
            ))}
          </ul>
        </div>

        <div className="logout-section">
          <Tooltip text="Logout" show={true}>
            <button className="logout-btn" onClick={handleLogout}>
              <div className="menu-icon">
                <FiLogOut />
              </div>
              <AnimatePresence>
                {!isCollapsed && (
                  <motion.span
                    className="menu-text"
                    variants={menuItemVariants}
                    initial="collapsed"
                    animate="expanded"
                    exit="collapsed"
                  >
                    Logout
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </Tooltip>
        </div>
      </div>
    </motion.div>
  );
};

export default EnhancedSidebar;
