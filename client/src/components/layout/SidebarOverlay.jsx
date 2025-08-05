import React from 'react';
import { useSidebar } from '../../contexts/SidebarContext';

const SidebarOverlay = () => {
  const { isCollapsed, isMobile, toggleSidebar } = useSidebar();

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

export default SidebarOverlay;
