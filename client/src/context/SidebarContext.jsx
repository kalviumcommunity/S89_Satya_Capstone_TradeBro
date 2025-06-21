import React, { createContext, useState, useContext, useEffect } from 'react';

// Create the context
const SidebarContext = createContext();

// Create a provider component
export const SidebarProvider = ({ children }) => {
  // Get initial state from localStorage or default based on screen size
  const getInitialCollapsedState = () => {
    const savedState = localStorage.getItem('sidebarCollapsed');
    if (savedState !== null) {
      return JSON.parse(savedState);
    }
    // Default to collapsed on mobile, expanded on desktop
    return window.innerWidth <= 768;
  };

  const [isCollapsed, setIsCollapsed] = useState(getInitialCollapsedState);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  // Check if screen is mobile size
  useEffect(() => {
    const checkIfMobile = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);

      // Auto-collapse on mobile, but preserve user preference on desktop
      // Use functional update to avoid dependency on isCollapsed
      if (mobile) {
        setIsCollapsed(prevCollapsed => {
          if (!prevCollapsed) {
            localStorage.setItem('sidebarCollapsed', 'true');
            return true;
          }
          return prevCollapsed;
        });
      }
    };

    // Initial check
    checkIfMobile();

    // Add event listener for window resize
    window.addEventListener('resize', checkIfMobile);

    // Cleanup
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []); // Remove isCollapsed from dependency array

  // Toggle sidebar state with localStorage persistence
  const toggleSidebar = () => {
    setIsCollapsed(prevCollapsed => {
      const newCollapsedState = !prevCollapsed;
      localStorage.setItem('sidebarCollapsed', JSON.stringify(newCollapsedState));
      return newCollapsedState;
    });
  };

  // Value to be provided to consumers
  const value = {
    isCollapsed,
    setIsCollapsed,
    isMobile,
    toggleSidebar,
    // Additional utility functions
    expandSidebar: () => {
      setIsCollapsed(() => {
        localStorage.setItem('sidebarCollapsed', 'false');
        return false;
      });
    },
    collapseSidebar: () => {
      setIsCollapsed(() => {
        localStorage.setItem('sidebarCollapsed', 'true');
        return true;
      });
    }
  };

  return (
    <SidebarContext.Provider value={value}>
      {children}
    </SidebarContext.Provider>
  );
};

// Custom hook to use the sidebar context
export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
};

// Remove default export to fix HMR issues
// export default SidebarContext;
