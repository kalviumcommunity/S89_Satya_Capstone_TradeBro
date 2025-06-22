import React from 'react';
import { useSidebar } from '../context/SidebarContext';
import Sidebar from './Sidebar';
import VoiceStatusIndicator from './VoiceStatusIndicator';
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
      <VoiceStatusIndicator position="bottom-left" showToggle={true} />
    </div>
  );
};

export default PageLayout;
