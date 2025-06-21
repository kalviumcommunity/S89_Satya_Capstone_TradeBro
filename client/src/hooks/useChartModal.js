import { useState, useCallback } from 'react';

/**
 * Custom hook for managing chart modal state
 * Provides consistent chart modal functionality across all pages
 */
export const useChartModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedStock, setSelectedStock] = useState(null);
  const [stockName, setStockName] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Open chart modal for a specific stock
  const openChart = useCallback((symbol, name = '') => {
    if (!symbol) {
      console.warn('Cannot open chart: symbol is required');
      return;
    }
    
    setSelectedStock(symbol);
    setStockName(name);
    setIsOpen(true);
    setIsFullscreen(false);
    
    // Add to recently viewed stocks in localStorage
    try {
      const recentlyViewed = JSON.parse(localStorage.getItem('recentlyViewedStocks') || '[]');
      const filtered = recentlyViewed.filter(stock => stock.symbol !== symbol);
      const updated = [{ symbol, name, timestamp: Date.now() }, ...filtered].slice(0, 10);
      localStorage.setItem('recentlyViewedStocks', JSON.stringify(updated));
    } catch (error) {
      console.warn('Failed to update recently viewed stocks:', error);
    }
  }, []);

  // Close chart modal
  const closeChart = useCallback(() => {
    // Immediately set isOpen to false to start exit animation
    setIsOpen(false);

    // Restore body scroll immediately
    document.body.style.overflow = 'unset';

    // Delay clearing other states to allow exit animation to complete
    setTimeout(() => {
      setSelectedStock(null);
      setStockName('');
      setIsFullscreen(false);
    }, 400); // Slightly longer to ensure smooth animation
  }, []);

  // Toggle fullscreen mode
  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(prev => !prev);
  }, []);

  // Handle stock selection with optional name
  const handleStockSelect = useCallback((symbol, name = '') => {
    openChart(symbol, name);
  }, [openChart]);

  return {
    // State
    isOpen,
    selectedStock,
    stockName,
    isFullscreen,
    
    // Actions
    openChart,
    closeChart,
    toggleFullscreen,
    handleStockSelect,
    
    // Modal props (for easy spreading)
    modalProps: {
      isOpen,
      onClose: closeChart,
      symbol: selectedStock,
      stockName,
      isFullscreen,
      onToggleFullscreen: toggleFullscreen
    }
  };
};

export default useChartModal;
