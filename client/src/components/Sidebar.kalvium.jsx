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
  FiBookOpen
} from "react-icons/fi";
import { useSidebar } from "../context/SidebarContext";
import { useAuth } from "../context/AuthContext";
import SquaresBackground from "./SquaresBackground";
import "../styles/Sidebar.kalvium.css";

const Sidebar = () => {
  const { isCollapsed, toggleSidebar } = useSidebar();
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Update isMobile state on window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Menu items
  const menuItems = [
    {
      title: "Dashboard",
      icon: <FiHome />,
      path: "/dashboard",
    },
    {
      title: "Portfolio",
      icon: <FiPieChart />,
      path: "/portfolio",
    },
    {
      title: "Watchlist",
      icon: <FiHeart />,
      path: "/watchlist",
    },
    {
      title: "Market News",
      icon: <FiBookOpen />,
      path: "/news",
    },
    {
      title: "Orders",
      icon: <FiShoppingCart />,
      path: "/orders",
    },
    {
      title: "History",
      icon: <FiClock />,
      path: "/history",
    },
    {
      title: "Trading Assistant",
      icon: <FiMessageSquare />,
      path: "/assistant",
    },
    {
      title: "Notifications",
      icon: <FiBell />,
      path: "/notifications",
    },
    {
      title: "UX Showcase",
      icon: <FiTrendingUp />,
      path: "/ux-showcase",
    },
  ];

  // User menu items
  const userMenuItems = [
    {
      title: "Profile",
      icon: <FiUser />,
      path: "/profile",
    },
    {
      title: "Settings",
      icon: <FiSettings />,
      path: "/settings",
    },
  ];

  // Sidebar variants for animation
  const sidebarVariants = {
    expanded: {
      width: "240px",
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30,
      },
    },
    collapsed: {
      width: "70px",
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30,
      },
    },
  };

  // Menu item variants for animation
  const menuItemVariants = {
    expanded: {
      opacity: 1,
      x: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30,
      },
    },
    collapsed: {
      opacity: 0,
      x: -10,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30,
      },
    },
  };

  return (
    <motion.div
      className={`sidebar-kalvium ${isMobile ? "mobile" : ""}`}
      variants={sidebarVariants}
      animate={isCollapsed ? "collapsed" : "expanded"}
      initial={isCollapsed ? "collapsed" : "expanded"}
    >
      <SquaresBackground color="primary" count={8} animated={true} />

      <div className="sidebar-content">
        <div className="top-section">
          <button className="toggle-btn" onClick={toggleSidebar}>
            {isCollapsed ? <FiMenu /> : <FiX />}
          </button>
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

        <div className="menu-section">
          <div className="menu-title">
            {!isCollapsed && <span>Main Menu</span>}
          </div>
          <ul className="menu-items">
            {menuItems.map((item) => (
              <li key={item.path}>
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
              </li>
            ))}
          </ul>
        </div>

        <div className="logout-section">
          <button className="logout-btn" onClick={logout}>
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
        </div>
      </div>
    </motion.div>
  );
};

export default Sidebar;
