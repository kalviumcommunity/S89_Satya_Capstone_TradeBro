import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import tradingService from '../services/tradingService';

const PortfolioContext = createContext();

export const usePortfolio = () => {
  const context = useContext(PortfolioContext);
  if (!context) {
    throw new Error('usePortfolio must be used within a PortfolioProvider');
  }
  return context;
};

export const PortfolioProvider = ({ children, user }) => {
  const [portfolioData, setPortfolioData] = useState({
    totalValue: 10000,
    availableCash: 10000,
    totalInvested: 0,
    totalGainLoss: 0,
    totalGainLossPercentage: 0,
    holdings: [],
    transactions: [],
    watchlist: []
  });

  const [loading, setLoading] = useState(false);

  // Listen to TradingEngine updates
  useEffect(() => {
    const updatePortfolioFromTradingEngine = (summary) => {
      console.log('🔄 Portfolio context updating from trading engine:', {
        availableCash: summary.availableCash,
        totalValue: summary.totalValue
      });

      setPortfolioData(prev => {
        const newData = {
          ...prev,
          totalValue: summary.totalValue,
          availableCash: summary.availableCash,
          totalInvested: summary.totalInvested,
          totalGainLoss: summary.totalPnL,
          totalGainLossPercentage: summary.totalPnLPercentage,
          holdings: summary.positions.map(pos => ({
            symbol: pos.symbol,
            quantity: pos.quantity,
            avgPrice: pos.avgPrice,
            currentPrice: pos.currentValue / pos.quantity || pos.avgPrice,
            totalValue: pos.currentValue || pos.totalInvested,
            gainLoss: (pos.currentValue || pos.totalInvested) - pos.totalInvested,
            gainLossPercentage: pos.totalInvested > 0 ? (((pos.currentValue || pos.totalInvested) - pos.totalInvested) / pos.totalInvested) * 100 : 0
          }))
        };

        console.log('📊 Setting new portfolio data:', {
          oldAvailableCash: prev.availableCash,
          newAvailableCash: newData.availableCash,
          oldTotalValue: prev.totalValue,
          newTotalValue: newData.totalValue
        });

        return newData;
      });
    };

    // Add listener to TradingEngine
    tradingService.addListener(updatePortfolioFromTradingEngine);

    // Initial load
    const summary = tradingService.getPortfolioSummary();
    console.log('📊 Initial portfolio load:', {
      availableCash: summary.availableCash,
      totalValue: summary.totalValue
    });
    updatePortfolioFromTradingEngine(summary);

    // Force refresh after a delay to ensure balance sync manager is initialized
    const refreshTimer = setTimeout(() => {
      console.log('🔄 Forcing portfolio refresh after delay...');
      const latestSummary = tradingService.getPortfolioSummary();
      console.log('📊 Latest summary after delay:', {
        availableCash: latestSummary.availableCash,
        totalValue: latestSummary.totalValue
      });
      updatePortfolioFromTradingEngine(latestSummary);
    }, 2000);

    // Listen for balance updates
    const handleBalanceUpdate = (event) => {
      console.log('🔄 Balance update received in PortfolioContext:', event.detail);
      // Refresh portfolio data
      const summary = tradingService.getPortfolioSummary();
      updatePortfolioFromTradingEngine(summary);
    };

    window.addEventListener('balanceUpdated', handleBalanceUpdate);

    // Cleanup
    return () => {
      tradingService.removeListener(updatePortfolioFromTradingEngine);
      window.removeEventListener('balanceUpdated', handleBalanceUpdate);
      clearTimeout(refreshTimer);
    };
  }, []);

  // Initialize portfolio data when user changes and token is available
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userId = user?.id || user?._id;

    if (user && userId && token) {
      // Add a small delay to ensure authentication is complete
      const timer = setTimeout(() => {
        initializePortfolio();
      }, 100);

      return () => clearTimeout(timer);
    } else {
      // Reset portfolio data if no user or token
      setPortfolioData({
        totalValue: 10000,
        availableCash: 10000,
        totalInvested: 0,
        totalGainLoss: 0,
        totalGainLossPercentage: 0,
        holdings: [],
        transactions: [],
        watchlist: []
      });
    }
  }, [user]);

  const initializePortfolio = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const userId = user?.id || user?._id;

      if (!userId || !token) {
        console.warn('Missing user ID or token for portfolio initialization');
        setLoading(false);
        return;
      }

      const response = await fetch(`https://s89-satya-capstone-tradebro.onrender.com/api/portfolio/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPortfolioData(data.data || data);
      } else if (response.status === 401) {
        // Authentication error - don't try to create portfolio
        console.warn('Authentication failed for portfolio access');
        return;
      } else if (response.status === 404) {
        // Portfolio doesn't exist, create one with default values
        await createDefaultPortfolio();
      } else {
        // Other error, use default values
        console.warn('Portfolio fetch failed with status:', response.status);
      }
    } catch (error) {
      console.error('Error initializing portfolio:', error);
      // Use default values if API fails
      setPortfolioData({
        totalValue: 10000,
        availableCash: 10000,
        totalInvested: 0,
        totalGainLoss: 0,
        totalGainLossPercentage: 0,
        holdings: [],
        transactions: [],
        watchlist: []
      });
    } finally {
      setLoading(false);
    }
  };

  const createDefaultPortfolio = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('https://s89-satya-capstone-tradebro.onrender.com/api/portfolio/create', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: user?.id || user?._id,
          initialCash: 10000
        })
      });

      if (response.ok) {
        const data = await response.json();
        setPortfolioData(data.data || data);
      } else if (response.status === 401) {
        console.warn('Authentication failed for portfolio creation');
        return;
      } else {
        console.warn('Portfolio creation failed with status:', response.status);
      }
    } catch (error) {
      console.error('Error creating default portfolio:', error);
    }
  };

  const buyStock = useCallback(async (stockSymbol, quantity, price, stockData = null) => {
    try {
      setLoading(true);

      // Use TradingEngine for the actual trade
      const result = await tradingService.buyStock(stockSymbol, quantity, price);

      if (!result.success) {
        throw new Error(result.error);
      }

      // After successful buy, remove from watchlist if it exists
      try {
        await removeFromWatchlist(stockSymbol);
        console.log(`✅ Removed ${stockSymbol} from watchlist after purchase`);
      } catch (watchlistError) {
        // Don't fail the buy operation if watchlist removal fails
        console.warn('⚠️ Could not remove from watchlist:', watchlistError.message);
      }

      console.log('✅ Buy order executed successfully:', result);
      return result;

    } catch (error) {
      console.error('❌ Error buying stock:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [portfolioData.holdings]); // Add portfolioData.holdings as dependency

  const sellStock = useCallback(async (stockSymbol, quantity, price, stockData = null) => {
    try {
      setLoading(true);

      // Check current holding before selling
      const currentHolding = portfolioData.holdings.find(h => h.symbol === stockSymbol);
      const isCompletelySellingOut = currentHolding && currentHolding.quantity <= quantity;

      // Use TradingEngine for the actual trade
      const result = await tradingService.sellStock(stockSymbol, quantity, price);

      if (!result.success) {
        throw new Error(result.error);
      }

      // If completely sold out, add back to watchlist
      if (isCompletelySellingOut) {
        try {
          const stockToAdd = stockData || {
            symbol: stockSymbol,
            name: currentHolding?.name || stockSymbol,
            price: price,
            sector: currentHolding?.sector || 'Unknown'
          };

          await addToWatchlist(stockSymbol, stockToAdd);
          console.log(`✅ Added ${stockSymbol} back to watchlist after complete sale`);
        } catch (watchlistError) {
          // Don't fail the sell operation if watchlist addition fails
          console.warn('⚠️ Could not add to watchlist:', watchlistError.message);
        }
      }

      console.log('✅ Sell order executed successfully:', result);
      return result;

    } catch (error) {
      console.error('❌ Error selling stock:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [portfolioData.holdings]); // Add portfolioData.holdings as dependency

  const addToWatchlist = async (stockSymbol, stockData = null) => {
    try {
      const token = localStorage.getItem('token');

      // Prepare the request body with additional stock data if provided
      const requestBody = {
        userId: user?.id || user?._id,
        symbol: stockSymbol
      };

      // Add additional stock data if provided
      if (stockData) {
        if (stockData.name) requestBody.name = stockData.name;
        if (stockData.sector) requestBody.sector = stockData.sector;
        if (stockData.price) requestBody.currentPrice = stockData.price;
      }

      const response = await fetch('https://s89-satya-capstone-tradebro.onrender.com/api/portfolio/watchlist/add', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (response.ok) {
        const updatedWatchlist = await response.json();
        setPortfolioData(prev => ({
          ...prev,
          watchlist: updatedWatchlist
        }));
        return updatedWatchlist;
      } else {
        // If the API call fails, try the watchlist API directly
        const watchlistResponse = await fetch('https://s89-satya-capstone-tradebro.onrender.com/api/watchlist/add', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            symbol: stockSymbol,
            name: stockData?.name || '',
            notes: `Added after selling position`
          })
        });

        if (watchlistResponse.ok) {
          console.log(`✅ Added ${stockSymbol} to watchlist via fallback API`);
          return true;
        }
      }
    } catch (error) {
      console.error('Error adding to watchlist:', error);
      throw error;
    }
  };

  const removeFromWatchlist = async (stockSymbol) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('https://s89-satya-capstone-tradebro.onrender.com/api/portfolio/watchlist/remove', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: user?.id || user?._id,
          symbol: stockSymbol
        })
      });

      if (response.ok) {
        const updatedWatchlist = await response.json();
        setPortfolioData(prev => ({
          ...prev,
          watchlist: updatedWatchlist
        }));
        return updatedWatchlist;
      } else {
        // Try the watchlist API directly as fallback
        const watchlistResponse = await fetch(`https://s89-satya-capstone-tradebro.onrender.com/api/watchlist/remove/${stockSymbol}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (watchlistResponse.ok) {
          console.log(`✅ Removed ${stockSymbol} from watchlist via fallback API`);
          return true;
        } else {
          // If stock is not in watchlist, that's okay - don't throw error
          console.log(`ℹ️ ${stockSymbol} was not in watchlist`);
          return true;
        }
      }
    } catch (error) {
      // Don't throw error if stock is not in watchlist
      console.warn('Could not remove from watchlist (may not exist):', error.message);
      return true;
    }
  };

  const updatePortfolioValues = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const userId = user?.id || user?._id;
      const response = await fetch(`https://s89-satya-capstone-tradebro.onrender.com/api/portfolio/update-values/${userId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const updatedPortfolio = await response.json();
        setPortfolioData(updatedPortfolio);
        return updatedPortfolio;
      }
    } catch (error) {
      console.error('Error updating portfolio values:', error);
    }
  }, [user?.id]); // Add user.id as dependency

  // Refresh portfolio data from TradingEngine
  const refreshPortfolio = useCallback(() => {
    const summary = tradingService.getPortfolioSummary();
    const rewardsInfo = tradingService.getDailyRewardsInfo();

    setPortfolioData(prev => ({
      ...prev,
      totalValue: summary.totalValue,
      availableCash: summary.availableCash,
      totalInvested: summary.totalInvested,
      totalGainLoss: summary.totalPnL,
      totalGainLossPercentage: summary.totalPnLPercentage,
      dailyRewards: rewardsInfo,
      holdings: summary.positions.map(pos => ({
        symbol: pos.symbol,
        quantity: pos.quantity,
        avgPrice: pos.avgPrice,
        currentPrice: pos.currentValue / pos.quantity || pos.avgPrice,
        totalValue: pos.currentValue || pos.totalInvested,
        gainLoss: (pos.currentValue || pos.totalInvested) - pos.totalInvested,
        gainLossPercentage: pos.totalInvested > 0 ? (((pos.currentValue || pos.totalInvested) - pos.totalInvested) / pos.totalInvested) * 100 : 0
      }))
    }));

    console.log('📊 Portfolio refreshed:', {
      totalValue: summary.totalValue,
      availableCash: summary.availableCash,
      totalRewards: rewardsInfo.totalRewards
    });
  }, []); // Empty dependency array since it only uses tradingService methods

  // Handle daily reward received
  const handleDailyReward = useCallback((rewardData) => {
    console.log('🎉 Daily reward received:', rewardData);

    // Force refresh portfolio data
    setTimeout(() => {
      refreshPortfolio();
    }, 100);
  }, [refreshPortfolio]); // Add refreshPortfolio as dependency

  const value = {
    portfolioData,
    loading,
    buyStock,
    sellStock,
    addToWatchlist,
    removeFromWatchlist,
    updatePortfolioValues,
    initializePortfolio,
    refreshPortfolio,
    handleDailyReward
  };

  return (
    <PortfolioContext.Provider value={value}>
      {children}
    </PortfolioContext.Provider>
  );
};
