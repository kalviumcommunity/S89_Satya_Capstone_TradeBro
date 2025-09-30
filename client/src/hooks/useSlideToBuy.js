import { useState, useCallback } from 'react';

/**
 * Hook to manage slide-to-buy modal state
 * Provides functions to open/close the modal and track current stock
 */
export const useSlideToBuy = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStock, setCurrentStock] = useState(null);
  const [defaultQuantity, setDefaultQuantity] = useState(1);

  // Open slide-to-buy modal with stock data
  const openSlideToBuy = useCallback((stockData, quantity = 1) => {
    if (!stockData) {
      console.warn('No stock data provided to openSlideToBuy');
      return;
    }

    // Normalize stock data to ensure consistent format
    const normalizedStock = {
      symbol: stockData.symbol || stockData.stockSymbol,
      name: stockData.name || stockData.companyName || `${stockData.symbol} Corporation`,
      price: stockData.price || stockData.currentPrice || 0,
      change: stockData.change || stockData.priceChange || 0,
      changePercent: stockData.changePercent || stockData.changePercentage || 0,
      volume: stockData.volume || 0,
      marketCap: stockData.marketCap || 0,
      sector: stockData.sector || 'Unknown',
      // Include any additional data
      ...stockData
    };

    setCurrentStock(normalizedStock);
    setDefaultQuantity(quantity);
    setIsOpen(true);
  }, []);

  // Close slide-to-buy modal
  const closeSlideToBuy = useCallback(() => {
    setIsOpen(false);
    // Clear stock data after animation completes
    setTimeout(() => {
      setCurrentStock(null);
      setDefaultQuantity(1);
    }, 300);
  }, []);

  // Quick buy function that opens modal with quantity 1
  const quickBuy = useCallback((stockData) => {
    openSlideToBuy(stockData, 1);
  }, [openSlideToBuy]);

  return {
    isOpen,
    currentStock,
    defaultQuantity,
    openSlideToBuy,
    closeSlideToBuy,
    quickBuy
  };
};

export default useSlideToBuy;
