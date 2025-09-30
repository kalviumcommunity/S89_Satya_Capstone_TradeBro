import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import tradingService from '../services/tradingService';
import { useWatchlist } from './useWatchlist';

const normalizeStockData = (stockData, source = 'manual') => {
  if (!stockData || typeof stockData.symbol !== 'string') {
    return null;
  }
  return {
    symbol: stockData.symbol.toUpperCase(),
    name: stockData.name || stockData.companyName || stockData.symbol,
    price: stockData.price || stockData.currentPrice || 0,
    change: stockData.change || stockData.priceChange || 0,
    changePercent: stockData.changePercent || stockData.percentChange || 0,
    volume: stockData.volume || 0,
    marketCap: stockData.marketCap || 0,
    source,
    ...stockData
  };
};

export const useOrderIntegration = () => {
  const [orderModalState, setOrderModalState] = useState({
    isOpen: false,
    stockData: null,
    orderType: 'buy',
    source: null
  });

  const navigate = useNavigate();
  const { addToWatchlist, removeFromWatchlist, isInWatchlist } = useWatchlist();
  const holdings = useSelector(state => state.portfolio.data?.holdings || [], (left, right) => JSON.stringify(left) === JSON.stringify(right));

  const hasHolding = useCallback((symbol) => {
    return holdings.some(h => h.symbol?.toUpperCase() === symbol?.toUpperCase());
  }, [holdings]);

  const openOrderModal = useCallback((stockData, orderType = 'buy', source = 'manual') => {
    const normalizedStockData = normalizeStockData(stockData, source);
    if (!normalizedStockData) {
      toast.error('Invalid stock data provided.');
      return;
    }
    setOrderModalState({ isOpen: true, stockData: normalizedStockData, orderType, source });
  }, []);

  const closeOrderModal = useCallback(() => {
    setOrderModalState(prevState => ({ ...prevState, isOpen: false, stockData: null, source: null }));
  }, []);

  const quickBuy = useCallback(async (stockData, quantity = 1) => {
    try {
      const normalizedData = normalizeStockData(stockData);
      if (!normalizedData) throw new Error('Invalid stock data');
      const result = await tradingService.placeOrder({
        type: 'BUY', stockSymbol: normalizedData.symbol, stockName: normalizedData.name,
        quantity, price: normalizedData.price, orderType: 'MARKET',
      });
      toast.success(result.message);
      return { success: true, data: result.data };
    } catch (error) {
      toast.error(error.message || 'Failed to buy stock');
      return { success: false, error: error.message };
    }
  }, []);

  const quickSell = useCallback(async (stockData, quantity = 1) => {
    try {
      const normalizedData = normalizeStockData(stockData);
      if (!normalizedData) throw new Error('Invalid stock data');
      const result = await tradingService.placeOrder({
        type: 'SELL', stockSymbol: normalizedData.symbol, stockName: normalizedData.name,
        quantity, price: normalizedData.price, orderType: 'MARKET',
      });
      toast.success(result.message);
      return { success: true, data: result.data };
    } catch (error) {
      toast.error(error.message || 'Failed to sell stock');
      return { success: false, error: error.message };
    }
  }, []);

  const getContextMenuActions = useCallback((stockData) => {
    const symbol = stockData.symbol?.toUpperCase();
    const isOwned = hasHolding(symbol);
    const inWatchlist = isInWatchlist(symbol);
    return [
      { label: 'Quick Buy', icon: 'FiTrendingUp', action: () => quickBuy(stockData), color: 'green' },
      { label: 'Quick Sell', icon: 'FiTrendingDown', action: () => quickSell(stockData), color: 'red', disabled: !isOwned },
      { label: 'View Chart', icon: 'FiBarChart2', action: () => navigate(`/trading?symbol=${stockData.symbol}`), color: 'blue' },
      {
        label: inWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist',
        icon: 'FiBookmark',
        action: () => inWatchlist ? removeFromWatchlist(stockData.symbol) : addToWatchlist(stockData),
        color: 'purple'
      }
    ];
  }, [quickBuy, quickSell, navigate, hasHolding, isInWatchlist, addToWatchlist, removeFromWatchlist]);

  return {
    orderModalState, openOrderModal, closeOrderModal, navigateToTrading: (stockData, orderType) => {
      const symbol = stockData.symbol || stockData.stockSymbol;
      navigate(`/trading?symbol=${symbol}&type=${orderType}`);
    }, handleChartStockClick: (chartData) => openOrderModal(chartData, 'buy', 'chart'),
    handleWatchlistStockClick: (watchlistItem, orderType) => openOrderModal(watchlistItem, orderType, 'watchlist'),
    handlePortfolioStockClick: (holding, orderType = 'sell') => openOrderModal(holding, orderType, 'portfolio'),
    handleMarketDataClick: (marketData, orderType = 'buy') => openOrderModal(marketData, orderType, 'market'),
    quickBuy, quickSell, handleBulkOrder: (stockList, orderType) => {
      if (stockList.length > 0) {
        openOrderModal({ ...normalizeStockData(stockList[0], 'bulk'), bulkList: stockList }, orderType, 'bulk');
      }
    },
    getContextMenuActions, normalizeStockData
  };
};

export default useOrderIntegration;