import React from 'react';
import { FiMenu } from 'react-icons/fi';
import { useSidebar } from '../../contexts/SidebarContext';

const MobileMenuButton = () => {
  const { isCollapsed, isMobile, toggleSidebar } = useSidebar();

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

export default MobileMenuButton;
