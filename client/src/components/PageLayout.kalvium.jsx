import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Sidebar from './Sidebar.kalvium';
import FixedHeader from './FixedHeader.kalvium';
import { useSidebar } from '../context/SidebarContext';
import '../styles/components/PageLayout.kalvium.css';

/**
 * PageLayout component with Kalvium-inspired design
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Page content
 * @param {string} props.title - Page title
 * @param {boolean} props.showHeader - Whether to show the header
 */
const PageLayout = ({ 
  children, 
  title = 'TradeBro', 
  showHeader = true 
}) => {
  const { isCollapsed, toggleSidebar } = useSidebar();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Update isMobile state on window resize
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      
      // Close sidebar on mobile when resizing
      if (mobile && isSidebarOpen) {
        setIsSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isSidebarOpen]);

  // Toggle mobile sidebar
  const toggleMobileSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Page content variants for animation
  const pageContentVariants = {
    expanded: {
      marginLeft: isMobile ? 0 : '240px',
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 30
      }
    },
    collapsed: {
      marginLeft: isMobile ? 0 : '70px',
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 30
      }
    }
  };

  return (
    <div className="page-layout-kalvium">
      {/* Sidebar */}
      <Sidebar />

      {/* Mobile sidebar backdrop */}
      {isMobile && isSidebarOpen && (
        <div 
          className="sidebar-backdrop"
          onClick={toggleMobileSidebar}
        />
      )}

      {/* Page content */}
      <motion.main
        className="page-content-kalvium"
        variants={pageContentVariants}
        animate={isCollapsed ? 'collapsed' : 'expanded'}
        initial={isCollapsed ? 'collapsed' : 'expanded'}
      >
        {/* Header */}
        {showHeader && (
          <FixedHeader title={title} />
        )}

        {/* Mobile menu button */}
        {isMobile && (
          <button 
            className="mobile-menu-button"
            onClick={toggleMobileSidebar}
            aria-label="Toggle menu"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        )}

        {/* Page content */}
        <div className="content-wrapper">
          {children}
        </div>
      </motion.main>
    </div>
  );
};

export default PageLayout;
