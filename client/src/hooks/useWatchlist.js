import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';

/**
 * Hook to manage watchlist operations
 * Provides functions to add/remove stocks from watchlist and check if stock is in watchlist
 */
export const useWatchlist = () => {
  const { user } = useAuth();
  const [watchlists, setWatchlists] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch user's watchlists from localStorage
  const fetchWatchlists = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);

      // Get watchlists from localStorage
      const storageKey = `watchlists_${user.id}`;
      const storedWatchlists = localStorage.getItem(storageKey);

      if (storedWatchlists) {
        const parsedWatchlists = JSON.parse(storedWatchlists);
        setWatchlists(parsedWatchlists);
      } else {
        // Create default watchlist if none exists
        const defaultWatchlist = {
          _id: 'default',
          name: 'My Watchlist',
          stocks: [],
          isDefault: true,
          createdAt: new Date().toISOString()
        };
        setWatchlists([defaultWatchlist]);
        localStorage.setItem(storageKey, JSON.stringify([defaultWatchlist]));
      }
    } catch (err) {
      console.error('Error fetching watchlists:', err);
      setError(err.message);
      // Set default watchlist if fetch fails
      const defaultWatchlist = {
        _id: 'default',
        name: 'My Watchlist',
        stocks: [],
        isDefault: true,
        createdAt: new Date().toISOString()
      };
      setWatchlists([defaultWatchlist]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Load watchlists on mount
  useEffect(() => {
    fetchWatchlists();
  }, [fetchWatchlists]);

  // Check if stock is in any watchlist
  const isInWatchlist = useCallback((stockSymbol) => {
    return watchlists.some(watchlist => 
      watchlist.stocks.some(stock => 
        stock.symbol === stockSymbol || stock.stockSymbol === stockSymbol
      )
    );
  }, [watchlists]);

  // Get watchlist containing the stock
  const getWatchlistWithStock = useCallback((stockSymbol) => {
    return watchlists.find(watchlist => 
      watchlist.stocks.some(stock => 
        stock.symbol === stockSymbol || stock.stockSymbol === stockSymbol
      )
    );
  }, [watchlists]);

  // Add stock to watchlist
  const addToWatchlist = useCallback(async (stockData, watchlistId = null) => {
    if (!user?.id) {
      toast.error('Please login to add stocks to watchlist');
      return { success: false, message: 'User not authenticated' };
    }

    try {
      setLoading(true);

      // Use default watchlist if no specific watchlist provided
      const targetWatchlistId = watchlistId || watchlists.find(w => w.isDefault)?._id || watchlists[0]?._id;

      if (!targetWatchlistId) {
        // Create default watchlist if none exists
        const defaultWatchlist = {
          _id: 'default',
          name: 'My Watchlist',
          stocks: [],
          isDefault: true,
          createdAt: new Date().toISOString()
        };

        const updatedWatchlists = [...watchlists, defaultWatchlist];
        setWatchlists(updatedWatchlists);

        // Save to localStorage
        const storageKey = `watchlists_${user.id}`;
        localStorage.setItem(storageKey, JSON.stringify(updatedWatchlists));

        return addToWatchlist(stockData, defaultWatchlist._id);
      }

      // Check if stock already exists in the watchlist
      const targetWatchlist = watchlists.find(w => w._id === targetWatchlistId);
      const stockExists = targetWatchlist?.stocks.some(stock =>
        stock.symbol === (stockData.symbol || stockData.stockSymbol)
      );

      if (stockExists) {
        toast.info(`${stockData.symbol || stockData.stockSymbol} is already in your watchlist`);
        return { success: false, message: 'Stock already in watchlist' };
      }

      // Normalize stock data
      const normalizedStock = {
        symbol: stockData.symbol || stockData.stockSymbol,
        name: stockData.name || stockData.companyName || `${stockData.symbol} Corporation`,
        price: stockData.price || stockData.currentPrice || 0,
        change: stockData.change || stockData.priceChange || 0,
        changePercent: stockData.changePercent || stockData.changePercentage || 0,
        volume: stockData.volume || 0,
        marketCap: stockData.marketCap || 0,
        sector: stockData.sector || 'Unknown',
        addedAt: new Date().toISOString()
      };

      // Update local state
      const updatedWatchlists = watchlists.map(watchlist =>
        watchlist._id === targetWatchlistId
          ? { ...watchlist, stocks: [...watchlist.stocks, normalizedStock] }
          : watchlist
      );

      setWatchlists(updatedWatchlists);

      // Save to localStorage
      const storageKey = `watchlists_${user.id}`;
      localStorage.setItem(storageKey, JSON.stringify(updatedWatchlists));

      toast.success(`${normalizedStock.symbol} added to watchlist!`);
      return { success: true, data: updatedWatchlists.find(w => w._id === targetWatchlistId) };

    } catch (err) {
      console.error('Error adding to watchlist:', err);
      toast.error(err.message || 'Failed to add stock to watchlist');
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  }, [user?.id, watchlists]);

  // Remove stock from watchlist
  const removeFromWatchlist = useCallback(async (stockSymbol, watchlistId = null) => {
    if (!user?.id) {
      toast.error('Please login to manage watchlist');
      return { success: false, message: 'User not authenticated' };
    }

    try {
      setLoading(true);

      // Find the watchlist containing the stock if not specified
      const targetWatchlist = watchlistId
        ? watchlists.find(w => w._id === watchlistId)
        : getWatchlistWithStock(stockSymbol);

      if (!targetWatchlist) {
        toast.error('Stock not found in any watchlist');
        return { success: false, message: 'Stock not found in watchlist' };
      }

      // Update local state
      const updatedWatchlists = watchlists.map(watchlist =>
        watchlist._id === targetWatchlist._id
          ? {
              ...watchlist,
              stocks: watchlist.stocks.filter(stock =>
                stock.symbol !== stockSymbol && stock.stockSymbol !== stockSymbol
              )
            }
          : watchlist
      );

      setWatchlists(updatedWatchlists);

      // Save to localStorage
      const storageKey = `watchlists_${user.id}`;
      localStorage.setItem(storageKey, JSON.stringify(updatedWatchlists));

      toast.success(`${stockSymbol} removed from watchlist!`);
      return { success: true };

    } catch (err) {
      console.error('Error removing from watchlist:', err);
      toast.error(err.message || 'Failed to remove stock from watchlist');
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  }, [user?.id, watchlists, getWatchlistWithStock]);

  // Toggle stock in watchlist (add if not present, remove if present)
  const toggleWatchlist = useCallback(async (stockData) => {
    const stockSymbol = stockData.symbol || stockData.stockSymbol;
    
    if (isInWatchlist(stockSymbol)) {
      return await removeFromWatchlist(stockSymbol);
    } else {
      return await addToWatchlist(stockData);
    }
  }, [isInWatchlist, addToWatchlist, removeFromWatchlist]);

  // Create new watchlist
  const createWatchlist = useCallback(async (name, description = '') => {
    if (!user?.id) {
      toast.error('Please login to create watchlist');
      return { success: false, message: 'User not authenticated' };
    }

    try {
      setLoading(true);

      // Create new watchlist object
      const newWatchlist = {
        _id: `watchlist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name,
        description,
        stocks: [],
        isDefault: watchlists.length === 0, // First watchlist is default
        createdAt: new Date().toISOString()
      };

      // Update local state
      const updatedWatchlists = [...watchlists, newWatchlist];
      setWatchlists(updatedWatchlists);

      // Save to localStorage
      const storageKey = `watchlists_${user.id}`;
      localStorage.setItem(storageKey, JSON.stringify(updatedWatchlists));

      toast.success(`Watchlist "${name}" created successfully!`);
      return { success: true, data: newWatchlist };

    } catch (err) {
      console.error('Error creating watchlist:', err);
      toast.error(err.message || 'Failed to create watchlist');
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  }, [user?.id, watchlists]);

  // Delete watchlist
  const deleteWatchlist = useCallback(async (watchlistId) => {
    if (!user?.id) {
      toast.error('Please login to delete watchlist');
      return { success: false, message: 'User not authenticated' };
    }

    try {
      setLoading(true);

      // Update local state
      const updatedWatchlists = watchlists.filter(w => w._id !== watchlistId);
      setWatchlists(updatedWatchlists);

      // Save to localStorage
      const storageKey = `watchlists_${user.id}`;
      localStorage.setItem(storageKey, JSON.stringify(updatedWatchlists));

      toast.success('Watchlist deleted successfully!');
      return { success: true };

    } catch (err) {
      console.error('Error deleting watchlist:', err);
      toast.error(err.message || 'Failed to delete watchlist');
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  }, [user?.id, watchlists]);

  // Get stock count in all watchlists
  const getTotalStockCount = useCallback(() => {
    return watchlists.reduce((total, watchlist) => total + watchlist.stocks.length, 0);
  }, [watchlists]);

  // Get default watchlist
  const getDefaultWatchlist = useCallback(() => {
    return watchlists.find(w => w.isDefault) || watchlists[0] || null;
  }, [watchlists]);

  return {
    watchlists,
    loading,
    error,
    isInWatchlist,
    getWatchlistWithStock,
    addToWatchlist,
    removeFromWatchlist,
    toggleWatchlist,
    createWatchlist,
    deleteWatchlist,
    fetchWatchlists,
    getTotalStockCount,
    getDefaultWatchlist
  };
};

export default useWatchlist;
