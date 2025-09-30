import { useEffect, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Global search shortcut hook
 * Handles Ctrl+K (Cmd+K on Mac) global search functionality
 */
export const useGlobalSearch = () => {
  const [isGlobalSearchOpen, setIsGlobalSearchOpen] = useState(false);
  const navigate = useNavigate();

  // Handle global search shortcut
  const handleGlobalShortcut = useCallback((event) => {
    // Check for Ctrl+K (Windows/Linux) or Cmd+K (Mac)
    const isCtrlK = (event.ctrlKey || event.metaKey) && event.key === 'k';
    
    if (isCtrlK) {
      event.preventDefault();
      event.stopPropagation();
      
      // Don't trigger if user is typing in an input field (except search inputs)
      const activeElement = document.activeElement;
      const isInInput = activeElement && (
        activeElement.tagName === 'INPUT' || 
        activeElement.tagName === 'TEXTAREA' ||
        activeElement.contentEditable === 'true'
      );
      
      // Allow if it's a search input
      const isSearchInput = activeElement && activeElement.classList.contains('search-input');
      
      if (isInInput && !isSearchInput) {
        return;
      }
      
      setIsGlobalSearchOpen(true);
    }
  }, []);

  // Handle escape key to close global search
  const handleEscapeKey = useCallback((event) => {
    if (event.key === 'Escape' && isGlobalSearchOpen) {
      setIsGlobalSearchOpen(false);
    }
  }, [isGlobalSearchOpen]);

  // Set up global event listeners
  useEffect(() => {
    document.addEventListener('keydown', handleGlobalShortcut);
    document.addEventListener('keydown', handleEscapeKey);
    
    return () => {
      document.removeEventListener('keydown', handleGlobalShortcut);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [handleGlobalShortcut, handleEscapeKey]);

  // Handle global search submission
  const handleGlobalSearch = useCallback((query, type = 'stocks') => {
    if (!query.trim()) return;
    
    // Navigate to appropriate page with search query
    switch (type) {
      case 'stocks':
        navigate(`/trading?search=${encodeURIComponent(query)}`);
        break;
      case 'news':
        navigate(`/news?search=${encodeURIComponent(query)}`);
        break;
      case 'orders':
        navigate(`/orders?search=${encodeURIComponent(query)}`);
        break;
      default:
        navigate(`/trading?search=${encodeURIComponent(query)}`);
    }
    
    setIsGlobalSearchOpen(false);
  }, [navigate]);

  // Close global search
  const closeGlobalSearch = useCallback(() => {
    setIsGlobalSearchOpen(false);
  }, []);

  return {
    isGlobalSearchOpen,
    setIsGlobalSearchOpen,
    handleGlobalSearch,
    closeGlobalSearch
  };
};

export default useGlobalSearch;
