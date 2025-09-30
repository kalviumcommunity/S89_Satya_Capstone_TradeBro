import { useState, useEffect, useCallback, useRef } from 'react';
import { debounce, throttle, LRUCache, useCleanup } from '../utils/performanceOptimizer';

/**
 * Custom hook for real-time price updates and live calculations
 * Provides debounced updates, WebSocket connections, and live data management
 */
export const useRealTimeUpdates = (symbols = [], enabled = true) => {
  const [prices, setPrices] = useState({});
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [updateCount, setUpdateCount] = useState(0);

  const wsRef = useRef(null);
  const intervalRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const updateQueueRef = useRef([]);
  const debounceTimeoutRef = useRef(null);
  const cacheRef = useRef(new LRUCache(1000)); // Cache for price data
  const cleanupManager = useCleanup();

  // Configuration with performance optimizations
  const config = {
    wsUrl: 'wss://ws.finnhub.io?token=YOUR_FINNHUB_TOKEN', // Replace with actual WebSocket URL
    fallbackInterval: enabled ? 30000 : 60000, // Longer interval when not actively needed
    debounceDelay: 50, // Reduced debounce for better responsiveness
    reconnectDelay: 5000, // 5 seconds reconnect delay
    maxReconnectAttempts: 5,
    batchSize: 10, // Process updates in batches
    maxCacheAge: 30000 // 30 seconds cache TTL
  };

  // Process queued updates with debouncing
  const processUpdateQueue = useCallback(() => {
    if (updateQueueRef.current.length === 0) return;

    const updates = [...updateQueueRef.current];
    updateQueueRef.current = [];

    // Merge updates by symbol (keep latest for each symbol)
    const mergedUpdates = updates.reduce((acc, update) => {
      acc[update.symbol] = update;
      return acc;
    }, {});

    setPrices(prevPrices => {
      const newPrices = { ...prevPrices };
      let hasChanges = false;

      Object.values(mergedUpdates).forEach(update => {
        const prevPrice = newPrices[update.symbol];
        if (!prevPrice || prevPrice.price !== update.price) {
          newPrices[update.symbol] = {
            ...update,
            previousPrice: prevPrice?.price || update.price,
            priceDirection: prevPrice ? (update.price > prevPrice.price ? 'up' : update.price < prevPrice.price ? 'down' : 'same') : 'same',
            lastUpdated: new Date().toISOString()
          };
          hasChanges = true;
        }
      });

      if (hasChanges) {
        setLastUpdate(new Date().toISOString());
        setUpdateCount(prev => prev + 1);
      }

      return newPrices;
    });
  }, []);

  // Debounced update processor
  const queueUpdate = useCallback((update) => {
    updateQueueRef.current.push(update);
    
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    
    debounceTimeoutRef.current = setTimeout(() => {
      processUpdateQueue();
    }, config.debounceDelay);
  }, [processUpdateQueue, config.debounceDelay]);

  // WebSocket connection management
  const connectWebSocket = useCallback(() => {
    if (!enabled || symbols.length === 0) return;

    try {
      wsRef.current = new WebSocket(config.wsUrl);
      
      wsRef.current.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        
        // Subscribe to symbols
        symbols.forEach(symbol => {
          wsRef.current.send(JSON.stringify({
            type: 'subscribe',
            symbol: symbol.toUpperCase()
          }));
        });
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'trade') {
            data.data.forEach(trade => {
              queueUpdate({
                symbol: trade.s,
                price: trade.p,
                volume: trade.v,
                timestamp: trade.t,
                change: 0, // Will be calculated
                changePercent: 0 // Will be calculated
              });
            });
          }
        } catch (error) {
          console.error('WebSocket message parsing error:', error);
        }
      };

      wsRef.current.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
        
        // Attempt reconnection
        if (enabled) {
          reconnectTimeoutRef.current = setTimeout(() => {
            connectWebSocket();
          }, config.reconnectDelay);
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsConnected(false);
      };

    } catch (error) {
      console.error('WebSocket connection error:', error);
      setIsConnected(false);
    }
  }, [enabled, symbols, queueUpdate, config.wsUrl, config.reconnectDelay]);

  // Fallback polling for when WebSocket is not available
  const startPolling = useCallback(async () => {
    if (!enabled || symbols.length === 0) return;

    try {
      const promises = symbols.map(async (symbol) => {
        try {
          const response = await fetch(`https://s89-satya-capstone-tradebro.onrender.com/api/stocks/quote/${symbol}`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
              'Content-Type': 'application/json'
            }
          });

          if (response.ok) {
            const data = await response.json();
            return {
              symbol: data.symbol,
              price: data.price || data.c,
              change: data.change || data.d,
              changePercent: data.changePercent || data.dp,
              volume: data.volume || data.v,
              high: data.high || data.h,
              low: data.low || data.l,
              timestamp: Date.now()
            };
          }
        } catch (error) {
          console.error(`Error fetching ${symbol}:`, error);
        }
        return null;
      });

      const results = await Promise.all(promises);
      results.filter(Boolean).forEach(queueUpdate);

    } catch (error) {
      console.error('Polling error:', error);
    }
  }, [enabled, symbols, queueUpdate]);

  // Start polling interval
  const startPollingInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(startPolling, config.fallbackInterval);
    startPolling(); // Initial fetch
  }, [startPolling, config.fallbackInterval]);

  // Initialize connections
  useEffect(() => {
    if (!enabled || symbols.length === 0) {
      return;
    }

    // Try WebSocket first, fallback to polling
    connectWebSocket();
    
    // Always start polling as backup
    const pollingTimeout = setTimeout(() => {
      if (!isConnected) {
        startPollingInterval();
      }
    }, 2000);

    return () => {
      clearTimeout(pollingTimeout);
    };
  }, [enabled, symbols, connectWebSocket, startPollingInterval, isConnected]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  // Get price for specific symbol
  const getPrice = useCallback((symbol) => {
    return prices[symbol?.toUpperCase()] || null;
  }, [prices]);

  // Get multiple prices
  const getPrices = useCallback((symbolList) => {
    return symbolList.map(symbol => ({
      symbol,
      ...getPrice(symbol)
    })).filter(Boolean);
  }, [getPrice]);

  // Subscribe to new symbol
  const subscribe = useCallback((symbol) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'subscribe',
        symbol: symbol.toUpperCase()
      }));
    }
  }, []);

  // Unsubscribe from symbol
  const unsubscribe = useCallback((symbol) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'unsubscribe',
        symbol: symbol.toUpperCase()
      }));
    }
  }, []);

  // Force refresh all prices
  const refresh = useCallback(() => {
    startPolling();
  }, [startPolling]);

  // Calculate profit/loss for a position
  const calculatePnL = useCallback((symbol, quantity, averagePrice) => {
    const currentPrice = getPrice(symbol);
    if (!currentPrice || !quantity || !averagePrice) {
      return { pnl: 0, pnlPercent: 0, unrealized: true };
    }

    const currentValue = quantity * currentPrice.price;
    const investedValue = quantity * averagePrice;
    const pnl = currentValue - investedValue;
    const pnlPercent = (pnl / investedValue) * 100;

    return {
      pnl,
      pnlPercent,
      currentValue,
      investedValue,
      unrealized: true,
      lastUpdated: currentPrice.lastUpdated
    };
  }, [getPrice]);

  return {
    // State
    prices,
    isConnected,
    lastUpdate,
    updateCount,
    
    // Methods
    getPrice,
    getPrices,
    subscribe,
    unsubscribe,
    refresh,
    calculatePnL,
    
    // Connection status
    connectionStatus: isConnected ? 'connected' : 'disconnected'
  };
};

// Utility function to format price changes
export const formatPriceChange = (change, changePercent) => {
  const sign = change >= 0 ? '+' : '';
  return {
    absolute: `${sign}₹${Math.abs(change).toFixed(2)}`,
    percent: `${sign}${changePercent.toFixed(2)}%`,
    direction: change > 0 ? 'up' : change < 0 ? 'down' : 'same'
  };
};

// Utility function to get price color
export const getPriceColor = (change) => {
  if (change > 0) return '#10B981'; // Green
  if (change < 0) return '#EF4444'; // Red
  return '#6B7280'; // Gray
};

export default useRealTimeUpdates;
