import { useEffect, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchIndianStockQuote,
  fetchIndianMarketMovers,
  fetchNiftyData,
  fetchSensexData,
  fetchBatchStockQuotes,
  updateBatchPrices,
  clearPriceChanges,
  updateMarketStatus
} from '../store/slices/stocksSlice';
import { usePerformanceOptimization, useBatchUpdates } from './usePerformanceOptimization';
import { PERFORMANCE_CONFIG } from '../config/performanceConfig';

// Indian market hours (IST)
const MARKET_OPEN_HOUR = 9;
const MARKET_OPEN_MINUTE = 15;
const MARKET_CLOSE_HOUR = 15;
const MARKET_CLOSE_MINUTE = 30;

export const useRealTimeStocks = (symbols = []) => {
  const dispatch = useDispatch();
  const intervalRef = useRef(null);
  const priceChangeTimeoutRef = useRef(null);
  
  const {
    quotes,
    topGainers,
    topLosers,
    mostActive,
    nifty,
    sensex,
    realTimeUpdates,
    updateInterval,
    lastGlobalUpdate,
    priceChanges,
    marketStatus,
    isLoading,
    error
  } = useSelector(state => state.stocks);

  // Check if market is open
  const isMarketOpen = useCallback(() => {
    const now = new Date();
    const istTime = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Kolkata"}));
    const currentHour = istTime.getHours();
    const currentMinute = istTime.getMinutes();
    const currentDay = istTime.getDay(); // 0 = Sunday, 6 = Saturday
    
    // Check if it's a weekday
    if (currentDay === 0 || currentDay === 6) {
      return false;
    }
    
    // Check if within market hours
    const marketOpenTime = MARKET_OPEN_HOUR * 60 + MARKET_OPEN_MINUTE;
    const marketCloseTime = MARKET_CLOSE_HOUR * 60 + MARKET_CLOSE_MINUTE;
    const currentTime = currentHour * 60 + currentMinute;
    
    return currentTime >= marketOpenTime && currentTime <= marketCloseTime;
  }, []);

  // Get next market open/close times
  const getNextMarketTimes = useCallback(() => {
    const now = new Date();
    const istTime = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Kolkata"}));
    const currentDay = istTime.getDay();
    const currentHour = istTime.getHours();
    const currentMinute = istTime.getMinutes();
    
    let nextOpen = new Date(istTime);
    let nextClose = new Date(istTime);
    
    if (isMarketOpen()) {
      // Market is open, next event is close
      nextClose.setHours(MARKET_CLOSE_HOUR, MARKET_CLOSE_MINUTE, 0, 0);
      
      // Next open is tomorrow (or Monday if Friday)
      nextOpen.setDate(nextOpen.getDate() + (currentDay === 5 ? 3 : 1));
      nextOpen.setHours(MARKET_OPEN_HOUR, MARKET_OPEN_MINUTE, 0, 0);
    } else {
      // Market is closed
      if (currentDay === 0) {
        // Sunday - next open is Monday
        nextOpen.setDate(nextOpen.getDate() + 1);
      } else if (currentDay === 6) {
        // Saturday - next open is Monday
        nextOpen.setDate(nextOpen.getDate() + 2);
      } else if (currentHour >= MARKET_CLOSE_HOUR && currentMinute >= MARKET_CLOSE_MINUTE) {
        // After market hours - next open is tomorrow (or Monday if Friday)
        nextOpen.setDate(nextOpen.getDate() + (currentDay === 5 ? 3 : 1));
      }
      
      nextOpen.setHours(MARKET_OPEN_HOUR, MARKET_OPEN_MINUTE, 0, 0);
      nextClose.setHours(MARKET_CLOSE_HOUR, MARKET_CLOSE_MINUTE, 0, 0);
    }
    
    return { nextOpen, nextClose };
  }, [isMarketOpen]);

  // Update market status
  const updateMarketStatusInfo = useCallback(() => {
    const marketOpen = isMarketOpen();
    const { nextOpen, nextClose } = getNextMarketTimes();
    
    dispatch(updateMarketStatus({
      isOpen: marketOpen,
      nextOpen: nextOpen.toISOString(),
      nextClose: nextClose.toISOString()
    }));
  }, [dispatch, isMarketOpen, getNextMarketTimes]);

  // Fetch single stock quote
  const fetchStockQuote = useCallback((symbol) => {
    dispatch(fetchIndianStockQuote(symbol));
  }, [dispatch]);

  // Fetch market movers
  const fetchMarketMovers = useCallback(() => {
    dispatch(fetchIndianMarketMovers());
  }, [dispatch]);

  // Fetch Indian indices
  const fetchIndices = useCallback(() => {
    dispatch(fetchNiftyData());
    dispatch(fetchSensexData());
  }, [dispatch]);

  // Fetch batch quotes
  const fetchBatchQuotes = useCallback((symbolList) => {
    if (symbolList && symbolList.length > 0) {
      dispatch(fetchBatchStockQuotes(symbolList));
    }
  }, [dispatch]);

  // Start real-time updates
  const startRealTimeUpdates = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    const updateData = () => {
      // Only update during market hours or if explicitly enabled
      if (realTimeUpdates && (isMarketOpen() || process.env.NODE_ENV === 'development')) {
        // Fetch indices
        fetchIndices();
        
        // Fetch market movers
        fetchMarketMovers();
        
        // Fetch batch quotes for provided symbols
        if (symbols.length > 0) {
          fetchBatchQuotes(symbols);
        }
        
        // Update market status
        updateMarketStatusInfo();
      }
    };

    // Initial update
    updateData();
    
    // Set up interval
    intervalRef.current = setInterval(updateData, updateInterval);
  }, [
    realTimeUpdates,
    updateInterval,
    symbols,
    isMarketOpen,
    fetchIndices,
    fetchMarketMovers,
    fetchBatchQuotes,
    updateMarketStatusInfo
  ]);

  // Stop real-time updates
  const stopRealTimeUpdates = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Clear price change animations after delay
  const clearPriceChangeAnimations = useCallback(() => {
    if (priceChangeTimeoutRef.current) {
      clearTimeout(priceChangeTimeoutRef.current);
    }
    
    priceChangeTimeoutRef.current = setTimeout(() => {
      dispatch(clearPriceChanges());
    }, 3000); // Clear after 3 seconds
  }, [dispatch]);

  // Format currency for Indian market
  const formatCurrency = useCallback((amount, decimals = 2) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(amount);
  }, []);

  // Format percentage
  const formatPercentage = useCallback((value, decimals = 2) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(decimals)}%`;
  }, []);

  // Get time since last update
  const getTimeSinceUpdate = useCallback((timestamp) => {
    if (!timestamp) return 'Never';
    
    const now = Date.now();
    const diff = now - timestamp;
    const seconds = Math.floor(diff / 1000);
    
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  }, []);

  // Start/stop updates based on realTimeUpdates flag
  useEffect(() => {
    if (realTimeUpdates) {
      startRealTimeUpdates();
    } else {
      stopRealTimeUpdates();
    }

    return () => {
      stopRealTimeUpdates();
    };
  }, [realTimeUpdates, startRealTimeUpdates, stopRealTimeUpdates]);

  // Clear price change animations when they occur
  useEffect(() => {
    if (Object.keys(priceChanges).length > 0) {
      clearPriceChangeAnimations();
    }
  }, [priceChanges, clearPriceChangeAnimations]);

  // Update market status on mount
  useEffect(() => {
    updateMarketStatusInfo();
  }, [updateMarketStatusInfo]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (priceChangeTimeoutRef.current) {
        clearTimeout(priceChangeTimeoutRef.current);
      }
    };
  }, []);

  return {
    // Data
    quotes,
    topGainers,
    topLosers,
    mostActive,
    nifty,
    sensex,
    priceChanges,
    marketStatus,
    lastGlobalUpdate,
    
    // State
    isLoading,
    error,
    realTimeUpdates,
    
    // Actions
    fetchStockQuote,
    fetchMarketMovers,
    fetchIndices,
    fetchBatchQuotes,
    startRealTimeUpdates,
    stopRealTimeUpdates,
    
    // Utilities
    formatCurrency,
    formatPercentage,
    getTimeSinceUpdate,
    isMarketOpen: isMarketOpen()
  };
};
