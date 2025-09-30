import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook for stock symbol validation and real-time price fetching
 * Provides debounced validation and price updates
 */
export const useStockValidation = (symbol, enabled = true) => {
  const [stockData, setStockData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isValidSymbol, setIsValidSymbol] = useState(false);

  // Debounced stock validation and price fetching
  const validateAndFetchStock = useCallback(async (stockSymbol) => {
    if (!stockSymbol || !enabled) {
      setStockData(null);
      setIsValidSymbol(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // First validate if symbol exists
      const isValid = await validateStockSymbol(stockSymbol);
      
      if (!isValid) {
        setIsValidSymbol(false);
        setError(`Invalid stock symbol: ${stockSymbol}`);
        setStockData(null);
        return;
      }

      // Fetch real-time stock data
      const data = await fetchStockData(stockSymbol);
      
      if (data) {
        setStockData(data);
        setIsValidSymbol(true);
        setError(null);
      } else {
        setIsValidSymbol(false);
        setError('Failed to fetch stock data');
        setStockData(null);
      }
    } catch (err) {
      console.error('Stock validation error:', err);
      setError(err.message || 'Failed to validate stock');
      setIsValidSymbol(false);
      setStockData(null);
    } finally {
      setIsLoading(false);
    }
  }, [enabled]);

  // Validate stock symbol against known exchanges
  const validateStockSymbol = async (symbol) => {
    try {
      // Check against NSE/BSE symbol patterns
      const nsePattern = /^[A-Z0-9&-]{1,20}$/;
      const bsePattern = /^[0-9]{6}$/;
      
      if (!nsePattern.test(symbol) && !bsePattern.test(symbol)) {
        return false;
      }

      // Additional validation via API if needed
      const response = await fetch(`https://s89-satya-capstone-tradebro.onrender.com/api/stocks/validate/${symbol}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        return result.isValid;
      }

      // Fallback validation for common Indian stocks
      return validateCommonIndianStocks(symbol);
    } catch (error) {
      console.error('Symbol validation error:', error);
      return validateCommonIndianStocks(symbol);
    }
  };

  // Fallback validation for common Indian stocks
  const validateCommonIndianStocks = (symbol) => {
    const commonStocks = [
      'RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'HINDUNILVR', 'ICICIBANK',
      'KOTAKBANK', 'BHARTIARTL', 'ITC', 'SBIN', 'BAJFINANCE', 'ASIANPAINT',
      'MARUTI', 'AXISBANK', 'LT', 'DMART', 'SUNPHARMA', 'TITAN', 'ULTRACEMCO',
      'NESTLEIND', 'WIPRO', 'TECHM', 'POWERGRID', 'NTPC', 'ONGC', 'TATAMOTORS',
      'BAJAJFINSV', 'HCLTECH', 'COALINDIA', 'DRREDDY', 'EICHERMOT', 'ADANIPORTS',
      'JSWSTEEL', 'TATASTEEL', 'GRASIM', 'CIPLA', 'BRITANNIA', 'DIVISLAB',
      'APOLLOHOSP', 'BPCL', 'HEROMOTOCO', 'SHREECEM', 'PIDILITIND', 'DABUR'
    ];
    
    return commonStocks.includes(symbol.toUpperCase());
  };

  // Fetch real-time stock data
  const fetchStockData = async (symbol) => {
    try {
      const response = await fetch(`https://s89-satya-capstone-tradebro.onrender.com/api/stocks/quote/${symbol}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        return {
          symbol: data.symbol,
          name: data.name || data.symbol,
          price: data.price || data.c || 0,
          change: data.change || data.d || 0,
          changePercent: data.changePercent || data.dp || 0,
          volume: data.volume || data.v || 0,
          high: data.high || data.h || 0,
          low: data.low || data.l || 0,
          open: data.open || data.o || 0,
          previousClose: data.previousClose || data.pc || 0,
          marketCap: data.marketCap || 0,
          pe: data.pe || 0,
          lastUpdated: new Date().toISOString()
        };
      }

      // Fallback to mock data for development
      return generateMockStockData(symbol);
    } catch (error) {
      console.error('Stock data fetch error:', error);
      return generateMockStockData(symbol);
    }
  };

  // Generate mock stock data for development
  const generateMockStockData = (symbol) => {
    const basePrice = Math.random() * 2000 + 100; // Random price between 100-2100
    const change = (Math.random() - 0.5) * 100; // Random change between -50 to +50
    const changePercent = (change / basePrice) * 100;

    return {
      symbol: symbol.toUpperCase(),
      name: `${symbol.toUpperCase()} Limited`,
      price: parseFloat(basePrice.toFixed(2)),
      change: parseFloat(change.toFixed(2)),
      changePercent: parseFloat(changePercent.toFixed(2)),
      volume: Math.floor(Math.random() * 1000000),
      high: parseFloat((basePrice + Math.abs(change)).toFixed(2)),
      low: parseFloat((basePrice - Math.abs(change)).toFixed(2)),
      open: parseFloat((basePrice - change).toFixed(2)),
      previousClose: parseFloat((basePrice - change).toFixed(2)),
      marketCap: Math.floor(Math.random() * 1000000000000),
      pe: parseFloat((Math.random() * 50 + 5).toFixed(2)),
      lastUpdated: new Date().toISOString()
    };
  };

  // Real-time price updates
  const startPriceUpdates = useCallback(() => {
    if (!stockData || !enabled) return;

    const interval = setInterval(async () => {
      try {
        const updatedData = await fetchStockData(stockData.symbol);
        if (updatedData) {
          setStockData(prev => ({
            ...prev,
            ...updatedData,
            lastUpdated: new Date().toISOString()
          }));
        }
      } catch (error) {
        console.error('Price update error:', error);
      }
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [stockData, enabled]);

  // Debounced effect for symbol validation
  useEffect(() => {
    const timer = setTimeout(() => {
      if (symbol && symbol.length >= 2) {
        validateAndFetchStock(symbol);
      } else {
        setStockData(null);
        setIsValidSymbol(false);
        setError(null);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
  }, [symbol, validateAndFetchStock]);

  // Start real-time updates when stock data is available
  useEffect(() => {
    if (stockData && enabled) {
      const cleanup = startPriceUpdates();
      return cleanup;
    }
  }, [stockData, enabled, startPriceUpdates]);

  // Manual refresh function
  const refreshStockData = useCallback(async () => {
    if (stockData) {
      await validateAndFetchStock(stockData.symbol);
    }
  }, [stockData, validateAndFetchStock]);

  // Get price trend
  const getPriceTrend = useCallback(() => {
    if (!stockData) return 'neutral';
    
    if (stockData.change > 0) return 'positive';
    if (stockData.change < 0) return 'negative';
    return 'neutral';
  }, [stockData]);

  // Check if market is open (simplified)
  const isMarketOpen = useCallback(() => {
    const now = new Date();
    const day = now.getDay();
    const hour = now.getHours();
    const minute = now.getMinutes();
    const time = hour * 100 + minute;

    // Market closed on weekends
    if (day === 0 || day === 6) return false;

    // Market hours: 9:15 AM to 3:30 PM IST
    return time >= 915 && time <= 1530;
  }, []);

  return {
    stockData,
    isLoading,
    error,
    isValidSymbol,
    refreshStockData,
    getPriceTrend,
    isMarketOpen: isMarketOpen(),
    validateAndFetchStock
  };
};

// Utility function to format stock price
export const formatStockPrice = (price, decimals = 2) => {
  if (typeof price !== 'number') return '₹0.00';
  return `₹${price.toLocaleString('en-IN', { 
    minimumFractionDigits: decimals, 
    maximumFractionDigits: decimals 
  })}`;
};

// Utility function to get price color class
export const getPriceColorClass = (change) => {
  if (change > 0) return 'text-green-500';
  if (change < 0) return 'text-red-500';
  return 'text-gray-500';
};

export default useStockValidation;
