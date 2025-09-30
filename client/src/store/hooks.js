import { useSelector, useDispatch } from 'react-redux';
import { useCallback } from 'react';

// Typed hooks for better TypeScript support and convenience
export const useAppDispatch = () => useDispatch();
export const useAppSelector = useSelector;

// Auth hooks
export const useAuth = () => {
  const dispatch = useAppDispatch();
  const auth = useAppSelector(state => state.auth);
  
  return {
    ...auth,
    dispatch
  };
};

// Portfolio hooks
export const usePortfolio = () => {
  const dispatch = useAppDispatch();
  const portfolio = useAppSelector(state => state.portfolio);
  
  return {
    ...portfolio,
    dispatch
  };
};

// Trading hooks
export const useTrading = () => {
  const dispatch = useAppDispatch();
  const trading = useAppSelector(state => state.trading);
  
  return {
    ...trading,
    dispatch
  };
};

// Watchlist hooks
export const useWatchlist = () => {
  const dispatch = useAppDispatch();
  const watchlist = useAppSelector(state => state.watchlist);
  
  return {
    ...watchlist,
    dispatch
  };
};

// Orders hooks
export const useOrders = () => {
  const dispatch = useAppDispatch();
  const orders = useAppSelector(state => state.orders);
  
  return {
    ...orders,
    dispatch
  };
};

// News hooks
export const useNews = () => {
  const dispatch = useAppDispatch();
  const news = useAppSelector(state => state.news);
  
  return {
    ...news,
    dispatch
  };
};

// UI hooks
export const useUI = () => {
  const dispatch = useAppDispatch();
  const ui = useAppSelector(state => state.ui);
  
  return {
    ...ui,
    dispatch
  };
};

// Virtual Money hooks
export const useVirtualMoney = () => {
  const dispatch = useAppDispatch();
  const { virtualMoney, user } = useAppSelector(state => state.auth);
  
  const updateVirtualMoney = useCallback((amount) => {
    dispatch({ type: 'auth/updateVirtualMoney', payload: amount });
  }, [dispatch]);
  
  const addVirtualMoney = useCallback((amount) => {
    dispatch({ type: 'auth/addVirtualMoney', payload: amount });
  }, [dispatch]);
  
  const subtractVirtualMoney = useCallback((amount) => {
    dispatch({ type: 'auth/subtractVirtualMoney', payload: amount });
  }, [dispatch]);
  
  return {
    virtualMoney,
    user,
    updateVirtualMoney,
    addVirtualMoney,
    subtractVirtualMoney
  };
};

// Theme hooks
export const useTheme = () => {
  const dispatch = useAppDispatch();
  const { theme } = useAppSelector(state => state.ui);
  
  const setTheme = useCallback((newTheme) => {
    dispatch({ type: 'ui/setTheme', payload: newTheme });
  }, [dispatch]);
  
  const toggleTheme = useCallback(() => {
    dispatch({ type: 'ui/toggleTheme' });
  }, [dispatch]);
  
  return {
    theme,
    setTheme,
    toggleTheme
  };
};

// Notification hooks will be replaced with new notification system

// Toast hooks
export const useToast = () => {
  const dispatch = useAppDispatch();
  const { toast } = useAppSelector(state => state.ui);
  
  const showToast = useCallback((message, type = 'info', duration = 3000) => {
    dispatch({ type: 'ui/showToast', payload: { message, type, duration } });
  }, [dispatch]);
  
  const showSuccess = useCallback((message) => {
    dispatch({ type: 'ui/showSuccessToast', payload: message });
  }, [dispatch]);
  
  const showError = useCallback((message) => {
    dispatch({ type: 'ui/showErrorToast', payload: message });
  }, [dispatch]);
  
  const showWarning = useCallback((message) => {
    dispatch({ type: 'ui/showWarningToast', payload: message });
  }, [dispatch]);
  
  const showInfo = useCallback((message) => {
    dispatch({ type: 'ui/showInfoToast', payload: message });
  }, [dispatch]);
  
  const hideToast = useCallback(() => {
    dispatch({ type: 'ui/hideToast' });
  }, [dispatch]);
  
  return {
    toast,
    showToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    hideToast
  };
};

// Modal hooks
export const useModals = () => {
  const dispatch = useAppDispatch();
  const { modals } = useAppSelector(state => state.ui);
  
  const openModal = useCallback((modalName, data = null) => {
    dispatch({ type: 'ui/openModal', payload: { modalName, data } });
  }, [dispatch]);
  
  const closeModal = useCallback((modalName) => {
    dispatch({ type: 'ui/closeModal', payload: modalName });
  }, [dispatch]);
  
  const closeAllModals = useCallback(() => {
    dispatch({ type: 'ui/closeAllModals' });
  }, [dispatch]);
  
  return {
    modals,
    openModal,
    closeModal,
    closeAllModals
  };
};

// Combined dashboard data hook
export const useDashboardData = () => {
  const portfolio = usePortfolio();
  const trading = useTrading();
  const auth = useAuth();
  
  return {
    portfolioSummary: portfolio.summary,
    holdings: portfolio.holdings,
    recentTrades: trading.recentTrades,
    virtualMoney: auth.virtualMoney,
    isLoading: portfolio.isLoading || trading.isLoading,
    lastUpdated: portfolio.lastUpdated
  };
};
