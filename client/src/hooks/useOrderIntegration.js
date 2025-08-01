import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import tradingService from '../services/tradingService';
import { toast } from 'react-toastify';

/**
 * Normalize stock data from different sources
 */
const normalizeStockData = (stockData, source = 'manual') => {
  if (!stockData) return null;

  return {
    symbol: stockData.symbol || stockData.ticker || stockData.stockSymbol,
    name: stockData.name || stockData.companyName || stockData.longName || stockData.symbol,
    price: stockData.price || stockData.currentPrice || stockData.close || stockData.regularMarketPrice || 0,
    change: stockData.change || stockData.priceChange || stockData.regularMarketChange || 0,
    changePercent: stockData.changePercent || stockData.percentChange || stockData.regularMarketChangePercent || 0,
    volume: stockData.volume || stockData.regularMarketVolume || 0,
    marketCap: stockData.marketCap || 0,
    sector: stockData.sector || stockData.sectorName || '',
    industry: stockData.industry || '',
    source: source,
    timestamp: new Date().toISOString(),
    ...stockData
  };
};

/**
 * Custom hook for order integration across different pages
 * Provides auto-fill functionality from charts, watchlist, and portfolio
 */
export const useOrderIntegration = () => {
  const [orderModalState, setOrderModalState] = useState({
    isOpen: false,
    stockData: null,
    orderType: 'buy',
    source: null
  });

  const navigate = useNavigate();

  // Open order modal with stock data from any source
  const openOrderModal = useCallback((stockData, orderType = 'buy', source = 'manual') => {
    console.log('🚀 openOrderModal called', { stockData, orderType, source });

    const normalizedStockData = normalizeStockData(stockData, source);
    console.log('📊 Normalized stock data', normalizedStockData);

    setOrderModalState({
      isOpen: true,
      stockData: normalizedStockData,
      orderType,
      source
    });

    console.log('✅ Order modal state updated');
  }, []);

  // Close order modal
  const closeOrderModal = useCallback(() => {
    setOrderModalState({
      isOpen: false,
      stockData: null,
      orderType: 'buy',
      source: null
    });
  }, []);

  // Quick buy function for immediate purchases
  const quickBuy = useCallback(async (stockData, quantity = 1) => {
    try {
      console.log('🚀 Quick buy:', { stockData, quantity });

      const normalizedData = normalizeStockData(stockData);
      if (!normalizedData) {
        throw new Error('Invalid stock data');
      }

      const result = await tradingService.buyStock(
        normalizedData.symbol,
        quantity,
        normalizedData.price,
        'market'
      );

      if (result.success) {
        toast.success(result.message);
        return { success: true, data: result.data };
      } else {
        toast.error(result.error);
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('Quick buy error:', error);
      toast.error(error.message || 'Failed to buy stock');
      return { success: false, error: error.message };
    }
  }, []);

  // Quick sell function for immediate sales
  const quickSell = useCallback(async (stockData, quantity = 1) => {
    try {
      console.log('🚀 Quick sell:', { stockData, quantity });

      const normalizedData = normalizeStockData(stockData);
      if (!normalizedData) {
        throw new Error('Invalid stock data');
      }

      const result = await tradingService.sellStock(
        normalizedData.symbol,
        quantity,
        normalizedData.price,
        'market'
      );

      if (result.success) {
        toast.success(result.message);
        return { success: true, data: result.data };
      } else {
        toast.error(result.error);
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('Quick sell error:', error);
      toast.error(error.message || 'Failed to sell stock');
      return { success: false, error: error.message };
    }
  }, []);

  // Navigate to trading page with pre-filled stock
  const navigateToTrading = useCallback((stockData, orderType = 'buy') => {
    const symbol = stockData.symbol || stockData.stockSymbol;
    navigate(`/trading?symbol=${symbol}&type=${orderType}`);
  }, [navigate]);

  // Auto-fill from chart click
  const handleChartStockClick = useCallback((chartData) => {
    const stockData = {
      symbol: chartData.symbol,
      name: chartData.name || chartData.symbol,
      price: chartData.price || chartData.close || chartData.c,
      change: chartData.change || chartData.d || 0,
      changePercent: chartData.changePercent || chartData.dp || 0,
      volume: chartData.volume || chartData.v || 0,
      high: chartData.high || chartData.h || 0,
      low: chartData.low || chartData.l || 0,
      open: chartData.open || chartData.o || 0,
      source: 'chart'
    };

    openOrderModal(stockData, 'buy', 'chart');
  }, [openOrderModal]);

  // Auto-fill from watchlist
  const handleWatchlistStockClick = useCallback((watchlistItem, orderType = 'buy') => {
    const stockData = {
      symbol: watchlistItem.symbol || watchlistItem.stockSymbol,
      name: watchlistItem.name || watchlistItem.stockName || watchlistItem.symbol,
      price: watchlistItem.price || watchlistItem.currentPrice || 0,
      change: watchlistItem.change || watchlistItem.dayChange || 0,
      changePercent: watchlistItem.changePercent || watchlistItem.dayChangePercent || 0,
      volume: watchlistItem.volume || 0,
      high: watchlistItem.high || watchlistItem.dayHigh || 0,
      low: watchlistItem.low || watchlistItem.dayLow || 0,
      open: watchlistItem.open || 0,
      source: 'watchlist'
    };

    openOrderModal(stockData, orderType, 'watchlist');
  }, [openOrderModal]);

  // Auto-fill from portfolio holdings
  const handlePortfolioStockClick = useCallback((holding, orderType = 'sell') => {
    const stockData = {
      symbol: holding.symbol || holding.stockSymbol,
      name: holding.name || holding.stockName || holding.symbol,
      price: holding.currentPrice || holding.price || 0,
      change: holding.dayChange || holding.change || 0,
      changePercent: holding.dayChangePercent || holding.changePercent || 0,
      volume: holding.volume || 0,
      high: holding.dayHigh || holding.high || 0,
      low: holding.dayLow || holding.low || 0,
      open: holding.open || 0,
      averagePrice: holding.averagePrice || holding.averageBuyPrice || 0,
      quantity: holding.quantity || 0,
      totalValue: holding.totalValue || holding.currentValue || 0,
      totalGains: holding.totalGains || holding.gainLoss || 0,
      gainsPercent: holding.gainsPercent || holding.gainLossPercentage || 0,
      source: 'portfolio'
    };

    openOrderModal(stockData, orderType, 'portfolio');
  }, [openOrderModal]);

  // Auto-fill from market movers or news
  const handleMarketDataClick = useCallback((marketData, orderType = 'buy') => {
    const stockData = {
      symbol: marketData.symbol || marketData.ticker,
      name: marketData.name || marketData.companyName || marketData.symbol,
      price: marketData.price || marketData.lastPrice || 0,
      change: marketData.change || marketData.priceChange || 0,
      changePercent: marketData.changePercent || marketData.percentChange || 0,
      volume: marketData.volume || marketData.totalVolume || 0,
      high: marketData.high || marketData.dayHigh || 0,
      low: marketData.low || marketData.dayLow || 0,
      open: marketData.open || marketData.openPrice || 0,
      source: 'market'
    };

    openOrderModal(stockData, orderType, 'market');
  }, [openOrderModal]);



  // Bulk order functionality
  const handleBulkOrder = useCallback((stockList, orderType = 'buy') => {
    // For bulk orders, we'll open the first stock and provide a way to add more
    if (stockList.length > 0) {
      const firstStock = stockList[0];
      const stockData = {
        ...normalizeStockData(firstStock, 'bulk'),
        bulkList: stockList,
        source: 'bulk'
      };
      
      openOrderModal(stockData, orderType, 'bulk');
    }
  }, [openOrderModal]);

  // Context menu actions for right-click
  const getContextMenuActions = useCallback((stockData) => {
    return [
      {
        label: 'Quick Buy',
        icon: 'FiTrendingUp',
        action: () => quickBuy(stockData),
        color: 'green'
      },
      {
        label: 'Quick Sell',
        icon: 'FiTrendingDown',
        action: () => quickSell(stockData),
        color: 'red',
        disabled: !hasHolding(stockData.symbol)
      },
      {
        label: 'View Chart',
        icon: 'FiBarChart2',
        action: () => navigate(`/charts?symbol=${stockData.symbol}`),
        color: 'blue'
      },
      {
        label: 'Add to Watchlist',
        icon: 'FiBookmark',
        action: () => addToWatchlist(stockData),
        color: 'purple'
      }
    ];
  }, [quickBuy, quickSell, navigate]);

  return {
    // State
    orderModalState,
    
    // Modal controls
    openOrderModal,
    closeOrderModal,
    
    // Navigation
    navigateToTrading,
    
    // Source-specific handlers
    handleChartStockClick,
    handleWatchlistStockClick,
    handlePortfolioStockClick,
    handleMarketDataClick,
    
    // Quick actions
    quickBuy,
    quickSell,
    handleBulkOrder,
    
    // Context menu
    getContextMenuActions
  };
};



// Helper function to check if user has holdings
const hasHolding = (symbol) => {
  // This would typically check the portfolio context
  // For now, return true as a placeholder
  return true;
};

// Helper function to add to watchlist
const addToWatchlist = (stockData) => {
  // This would typically call the watchlist API
  console.log('Adding to watchlist:', stockData.symbol);
};

// Export utility functions
export {
  normalizeStockData,
  hasHolding,
  addToWatchlist
};

export default useOrderIntegration;
