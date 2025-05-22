import React from 'react';
import { useSidebar } from '../context/SidebarContext';
import Sidebar from './Sidebar';
import '../styles/components/PageLayout.css';

const PageLayout = ({ children }) => {
  const { isCollapsed, isMobile } = useSidebar();

  return (
    <div className="page-layout">
      <Sidebar />
      <main
        className={`page-content ${isCollapsed ? 'sidebar-collapsed' : 'sidebar-expanded'} ${isMobile ? 'mobile' : ''}`}
      >
        {children}
      </main>
    </div>
  );
};

export default PageLayout;
