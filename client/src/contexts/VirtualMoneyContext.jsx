import React, { createContext, useState, useContext, useEffect } from 'react';
import { useAuth } from './AuthContext';

// Create the context
const VirtualMoneyContext = createContext();

// Create a provider component
export const VirtualMoneyProvider = ({ children }) => {
  const { isAuthenticated, getToken } = useAuth();
  const [virtualMoney, setVirtualMoney] = useState({
    balance: 10000, // ₹10,000 initial amount for new users
    transactions: [],
    lastLoginReward: null,
    totalInvested: 0,
    totalGains: 0,
    portfolioValue: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Format currency to Indian Rupees
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  // Fetch virtual money data
  const fetchVirtualMoney = async () => {
    if (!isAuthenticated) return;

    setLoading(true);
    setError(null);

    try {
      const token = getToken();
      const response = await fetch('http://localhost:5001/api/virtual-money/account', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setVirtualMoney(data.data);
      } else {
        throw new Error('Failed to fetch virtual money data');
      }
    } catch (err) {
      setError(err.message);
      console.error('Error fetching virtual money:', err);
    } finally {
      setLoading(false);
    }
  };

  // Buy stock
  const buyStock = async (stockSymbol, quantity, price) => {
    if (!isAuthenticated) return { success: false, message: 'Not authenticated' };

    setLoading(true);
    setError(null);

    try {
      const token = getToken();
      const response = await fetch('http://localhost:5001/api/virtual-money/buy', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ stockSymbol, quantity, price })
      });

      const data = await response.json();

      if (response.ok) {
        setVirtualMoney(data.data);
        return { success: true, message: data.message };
      } else {
        throw new Error(data.message || 'Failed to buy stock');
      }
    } catch (err) {
      setError(err.message);
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Sell stock
  const sellStock = async (stockSymbol, quantity, price) => {
    if (!isAuthenticated) return { success: false, message: 'Not authenticated' };

    setLoading(true);
    setError(null);

    try {
      const token = getToken();
      const response = await fetch('http://localhost:5001/api/virtual-money/sell', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ stockSymbol, quantity, price })
      });

      const data = await response.json();

      if (response.ok) {
        setVirtualMoney(data.data);
        return { success: true, message: data.message };
      } else {
        throw new Error(data.message || 'Failed to sell stock');
      }
    } catch (err) {
      setError(err.message);
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Claim daily login reward
  const claimLoginReward = async () => {
    if (!isAuthenticated) return { success: false, message: 'Not authenticated' };

    setLoading(true);
    setError(null);

    try {
      const token = getToken();
      const response = await fetch('http://localhost:5001/api/virtual-money/login-reward', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (response.ok) {
        setVirtualMoney(data.data);
        return { success: true, message: data.message, reward: data.reward };
      } else {
        throw new Error(data.message || 'Failed to claim reward');
      }
    } catch (err) {
      setError(err.message);
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Fetch data when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchVirtualMoney();
    }
  }, [isAuthenticated]);

  // Listen for balance updates from trading service
  useEffect(() => {
    const handleBalanceUpdate = (event) => {
      console.log('🔄 Balance update received in VirtualMoneyContext:', event.detail);
      // Refresh data from server to ensure consistency
      fetchVirtualMoney();
    };

    window.addEventListener('balanceUpdated', handleBalanceUpdate);

    return () => {
      window.removeEventListener('balanceUpdated', handleBalanceUpdate);
    };
  }, [fetchVirtualMoney]);

  // Value to be provided to consumers
  const value = {
    virtualMoney,
    loading,
    error,
    formatCurrency,
    fetchVirtualMoney,
    buyStock,
    sellStock,
    claimLoginReward,
    // Computed values
    balance: virtualMoney.balance,
    formattedBalance: formatCurrency(virtualMoney.balance),
    transactions: virtualMoney.transactions || [],
    canClaimReward: virtualMoney.lastLoginReward ? 
      new Date() - new Date(virtualMoney.lastLoginReward) > 24 * 60 * 60 * 1000 : true
  };

  return (
    <VirtualMoneyContext.Provider value={value}>
      {children}
    </VirtualMoneyContext.Provider>
  );
};

// Custom hook to use the virtual money context
export const useVirtualMoney = () => {
  const context = useContext(VirtualMoneyContext);
  if (context === undefined) {
    throw new Error('useVirtualMoney must be used within a VirtualMoneyProvider');
  }
  return context;
};

export default VirtualMoneyContext;
