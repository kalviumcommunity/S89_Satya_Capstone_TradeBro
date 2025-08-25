import { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';
import { v4 as uuidv4 } from 'uuid'; // Import UUID for unique IDs

/**
 * Hook to manage watchlist operations
 * Provides functions to add/remove stocks from watchlist and check if stock is in watchlist
 */
export const useWatchlist = () => {
  const { user } = useAuth();
  const [watchlists, setWatchlists] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingState, setLoadingState] = useState({ active: false, action: null });
  const [refreshingState, setRefreshingState] = useState(false);
  const [error, setError] = useState(null);

  const storageKey = useMemo(() => user?.id ? `watchlists_${user.id}` : null, [user?.id]);

  // Fetch user's watchlists from localStorage
  const fetchWatchlists = useCallback(async () => {
    if (!storageKey) {
      console.warn('User not authenticated, skipping watchlist fetch.');
      return;
    }
    setLoading(true);
    setLoadingState({ active: true, action: 'fetch' });
    setError(null);

    try {
      const storedWatchlists = localStorage.getItem(storageKey);

      if (storedWatchlists) {
        const parsedWatchlists = JSON.parse(storedWatchlists);
        setWatchlists(parsedWatchlists);
      } else {
        const defaultWatchlist = {
          _id: uuidv4(), // Use UUID for a robust, unique ID
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
      setError('Failed to load watchlists. Please try again.');
    } finally {
      setLoading(false);
      setLoadingState({ active: false, action: null });
    }
  }, [storageKey]);

  // Load watchlists on mount
  useEffect(() => {
    if (storageKey) {
      fetchWatchlists();
    }
  }, [fetchWatchlists, storageKey]);

  // Check if stock is in any watchlist
  const isInWatchlist = useCallback((stockSymbol) => {
    if (!stockSymbol) return false;
    return watchlists.some(watchlist =>
      watchlist.stocks.some(stock =>
        stock.symbol?.toLowerCase() === stockSymbol.toLowerCase() || stock.stockSymbol?.toLowerCase() === stockSymbol.toLowerCase()
      )
    );
  }, [watchlists]);

  const addToWatchlist = useCallback(async (stockData, watchlistId = null) => {
    if (!user?.id) {
      toast.error('Please login to add stocks to a watchlist.');
      return { success: false, message: 'User not authenticated' };
    }
    setLoading(true);
    setLoadingState({ active: true, action: 'add' });
    setError(null);

    try {
      const targetWatchlistId = watchlistId || (watchlists.find(w => w.isDefault)?._id || (watchlists.length > 0 ? watchlists[0]._id : null));

      if (!targetWatchlistId) {
        toast.error('No watchlists found. Please create one first.');
        return { success: false, message: 'No watchlists found' };
      }

      const targetWatchlist = watchlists.find(w => w._id === targetWatchlistId);
      const stockSymbol = stockData.symbol || stockData.stockSymbol;
      const stockExists = targetWatchlist?.stocks.some(s => s.symbol === stockSymbol);

      if (stockExists) {
        const message = `${stockSymbol} is already in this watchlist.`;
        toast.info(message);
        return { success: false, message };
      }

      const normalizedStock = {
        symbol: stockSymbol,
        name: stockData.name || `${stockSymbol} Corporation`,
        price: stockData.price || 0,
        change: stockData.change || 0,
        changePercent: stockData.changePercent || 0,
        volume: stockData.volume || 0,
        marketCap: stockData.marketCap || 0,
        sector: stockData.sector || 'Unknown',
        addedAt: new Date().toISOString()
      };

      const updatedWatchlists = watchlists.map(wl =>
        wl._id === targetWatchlistId
          ? { ...wl, stocks: [...wl.stocks, normalizedStock] }
          : wl
      );

      setWatchlists(updatedWatchlists);
      localStorage.setItem(storageKey, JSON.stringify(updatedWatchlists));
      toast.success(`${normalizedStock.symbol} added to watchlist!`);
      return { success: true };
    } catch (err) {
      console.error('Error adding to watchlist:', err);
      setError('Failed to add stock to watchlist.');
      toast.error('Failed to add stock to watchlist.');
      return { success: false, message: 'Failed to add stock' };
    } finally {
      setLoading(false);
      setLoadingState({ active: false, action: null });
    }
  }, [user?.id, watchlists, storageKey]);

  const removeFromWatchlist = useCallback(async (stockSymbol, watchlistId = null) => {
    if (!user?.id) {
      toast.error('Please login to manage your watchlist.');
      return { success: false, message: 'User not authenticated' };
    }
    setLoading(true);
    setLoadingState({ active: true, action: 'remove' });
    setError(null);

    try {
      let targetWatchlistId = watchlistId;
      if (!targetWatchlistId) {
        const watchlistWithStock = watchlists.find(wl =>
          wl.stocks.some(s => s.symbol === stockSymbol)
        );
        targetWatchlistId = watchlistWithStock?._id;
      }

      if (!targetWatchlistId) {
        toast.error('Stock not found in any watchlist.');
        return { success: false, message: 'Stock not found' };
      }

      const updatedWatchlists = watchlists.map(wl =>
        wl._id === targetWatchlistId
          ? {
            ...wl,
            stocks: wl.stocks.filter(s => s.symbol !== stockSymbol)
          }
          : wl
      );

      setWatchlists(updatedWatchlists);
      localStorage.setItem(storageKey, JSON.stringify(updatedWatchlists));
      toast.success(`${stockSymbol} removed from watchlist.`);
      return { success: true };
    } catch (err) {
      console.error('Error removing from watchlist:', err);
      setError('Failed to remove stock from watchlist.');
      toast.error('Failed to remove stock from watchlist.');
      return { success: false, message: 'Failed to remove stock' };
    } finally {
      setLoading(false);
      setLoadingState({ active: false, action: null });
    }
  }, [user?.id, watchlists, storageKey]);

  const createWatchlist = useCallback(async (name, description = '') => {
    if (!user?.id) {
      toast.error('Please login to create a watchlist.');
      return { success: false, message: 'User not authenticated' };
    }
    setLoading(true);
    setLoadingState({ active: true, action: 'create' });
    setError(null);

    try {
      const newWatchlist = {
        _id: uuidv4(),
        name,
        description,
        stocks: [],
        isDefault: watchlists.length === 0,
        createdAt: new Date().toISOString()
      };

      const updatedWatchlists = [...watchlists, newWatchlist];
      setWatchlists(updatedWatchlists);
      localStorage.setItem(storageKey, JSON.stringify(updatedWatchlists));
      toast.success(`Watchlist "${name}" created successfully.`);
      return { success: true, data: newWatchlist };
    } catch (err) {
      console.error('Error creating watchlist:', err);
      setError('Failed to create watchlist.');
      toast.error('Failed to create watchlist.');
      return { success: false, message: 'Failed to create watchlist' };
    } finally {
      setLoading(false);
      setLoadingState({ active: false, action: null });
    }
  }, [user?.id, watchlists, storageKey]);

  const deleteWatchlist = useCallback(async (watchlistId) => {
    if (!user?.id) {
      toast.error('Please login to delete a watchlist.');
      return { success: false, message: 'User not authenticated' };
    }
    setLoading(true);
    setLoadingState({ active: true, action: 'delete' });
    setError(null);

    try {
      const updatedWatchlists = watchlists.filter(wl => wl._id !== watchlistId);
      setWatchlists(updatedWatchlists);
      localStorage.setItem(storageKey, JSON.stringify(updatedWatchlists));
      toast.success('Watchlist deleted successfully.');
      return { success: true };
    } catch (err) {
      console.error('Error deleting watchlist:', err);
      setError('Failed to delete watchlist.');
      toast.error('Failed to delete watchlist.');
      return { success: false, message: 'Failed to delete watchlist' };
    } finally {
      setLoading(false);
      setLoadingState({ active: false, action: null });
    }
  }, [user?.id, watchlists, storageKey]);


  const refreshWatchlists = useCallback(async () => {
    console.log('🔄 Refreshing watchlists...');
    setRefreshingState(true);
    // Simulate API refresh to get latest data. This could be a real API call.
    await new Promise(resolve => setTimeout(resolve, 1500));
    setRefreshingState(false);
    toast.success('Watchlists refreshed successfully.');
  }, []);

  return {
    watchlists,
    loading,
    loadingState,
    refreshingState,
    error,
    isInWatchlist,
    addToWatchlist,
    removeFromWatchlist,
    createWatchlist,
    deleteWatchlist,
    refreshWatchlists,
  };
};

export default useWatchlist;