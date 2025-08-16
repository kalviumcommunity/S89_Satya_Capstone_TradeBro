import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FiBarChart2,
  FiSearch,
  FiRefreshCw,
  FiMaximize2,
  FiSettings,
  FiTrendingUp,
  FiTrendingDown,
  FiActivity,
  FiClock,
  FiVolume2,
  FiTarget,
  FiLayers,
  FiZoomIn,
  FiDownload
} from 'react-icons/fi';
import { useSidebar } from '../contexts/SidebarContext';
import StockPrice from '../components/StockPrice';
import TradingViewChart from '../components/charts/TradingViewChart';
import StockSearchPanel from '../components/StockSearchPanel';
import WatchlistButton from '../components/trading/WatchlistButton';
import { useStockSearch } from '../hooks/useSearch';
import SearchInput from '../components/common/SearchInput';
import { chartAPI, stockAPI } from '../services/api';
import fmpAPI from '../services/fmpAPI';
import { toast } from 'react-toastify';
import '../styles/charts-el-classico.css';
import '../styles/stock-search-panel.css';
import '../styles/tradingview-chart.css';
import '../styles/trading.css';
import '../styles/charts-responsive-enhancement.css';

const Charts = ({ user, theme }) => {
  const { isCollapsed } = useSidebar();
  const [selectedStock, setSelectedStock] = useState('RELIANCE');
  const [timeframe, setTimeframe] = useState('1D');
  const [chartType, setChartType] = useState('candlestick');
  const [refreshing, setRefreshing] = useState(false);
  const [indicators, setIndicators] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [stockInfo, setStockInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Live chart functionality
  const [isLive, setIsLive] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [livePrice, setLivePrice] = useState(null);
  const [priceChange, setPriceChange] = useState(null);
  const [updateInterval, setUpdateInterval] = useState(null);

  // Search functionality
  const {
    query: searchQuery,
    setQuery: setSearchQuery,
    results: searchResults,
    loading: isSearching,
    recentSearches,
    clearSearch: clearRecentSearches
  } = useStockSearch({
    limit: 10,
    debounceMs: 300
  });

  // Debug search results
  console.log('🔍 Charts - Search Query:', searchQuery);
  console.log('📊 Charts - Search Results:', searchResults);
  console.log('⏳ Charts - Is Searching:', isSearching);

  // Transform Indian stock symbols for FMP API compatibility
  const transformSymbolForFMP = (symbol) => {
    // Remove .NS or .BO suffix if present for FMP API
    const cleanSymbol = symbol.replace(/\.(NS|BO)$/, '');
    
    // For Indian stocks, use clean symbol without exchange suffix
    // FMP API works better with clean symbols for Indian stocks
    return cleanSymbol;
  };



  // Timeframe options
  const timeframes = ['1D', '5D', '1M', '3M', '6M', '1Y', '5Y'];

  // Chart type options
  const chartTypes = [
    { id: 'candlestick', name: 'Candlestick', icon: FiBarChart2 },
    { id: 'line', name: 'Line', icon: FiActivity },
    { id: 'area', name: 'Area', icon: FiLayers }
  ];

  // Technical indicators
  const availableIndicators = [
    { id: 'sma', name: 'SMA (20)', color: '#3B82F6' },
    { id: 'ema', name: 'EMA (12)', color: '#10B981' },
    { id: 'rsi', name: 'RSI (14)', color: '#F59E0B' },
    { id: 'macd', name: 'MACD', color: '#EF4444' },
    { id: 'bollinger', name: 'Bollinger Bands', color: '#8B5CF6' }
  ];

  // Format data for TradingView Lightweight Charts
  const formatChartData = (rawData) => {
    if (!rawData || rawData.length === 0) return [];

    const formatted = rawData.map(item => ({
      time: item.date || item.time,
      open: parseFloat(item.open),
      high: parseFloat(item.high),
      low: parseFloat(item.low),
      close: parseFloat(item.close),
      volume: parseInt(item.volume || 0)
    }));

    // Remove duplicates and sort by time (TradingView requirement)
    const uniqueData = [];
    const seenTimes = new Set();

    formatted
      .sort((a, b) => new Date(a.time) - new Date(b.time))
      .forEach(item => {
        if (!seenTimes.has(item.time)) {
          seenTimes.add(item.time);
          uniqueData.push(item);
        }
      });

    return uniqueData;
  };

  // Fetch chart data with fallback to mock data
  const fetchChartData = async (symbol, period) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log(`📊 Fetching chart data for ${symbol} (${period})`);
      
      // Transform symbol for API call
      const apiSymbol = transformSymbolForFMP(symbol);
      console.log(`🔄 Using API symbol: ${apiSymbol}`);

      // Try to get historical data from FMP API
      const historicalResponse = await fmpAPI.chart.getHistoricalData(apiSymbol, period);
      console.log('📈 Historical response:', historicalResponse);

      if (historicalResponse && historicalResponse.success && historicalResponse.data && historicalResponse.data.length > 0) {
        const formattedData = formatChartData(historicalResponse.data);
        setChartData(formattedData);
        console.log(`✅ Chart data loaded: ${formattedData.length} points`);
      } else {
        console.warn('⚠️ Using mock chart data for', symbol);
        // Generate mock chart data
        const mockData = generateMockChartData(symbol, period);
        setChartData(mockData);
      }

      // Try to get stock quote
      try {
        const quoteResponse = await fmpAPI.stock.getStockQuote(apiSymbol);
        if (quoteResponse.success) {
          setStockInfo(quoteResponse.data);
          console.log(`✅ Stock info loaded for ${symbol}`);
        }
      } catch (quoteError) {
        console.warn('⚠️ Quote fetch failed, using default stock info');
        // Use default stock info from popular stocks
        const defaultInfo = { symbol: 'RELIANCE', name: 'Reliance Industries Ltd', price: 2847.50, change: 15.25, changePercent: 0.54 };
        if (defaultInfo) {
          setStockInfo({
            symbol: defaultInfo.symbol,
            name: defaultInfo.name,
            price: defaultInfo.price,
            change: defaultInfo.change,
            changesPercentage: defaultInfo.changePercent
          });
        }
      }
      
    } catch (error) {
      console.error('❌ Error fetching chart data:', error);
      console.log('🎭 Using mock data as fallback');
      
      // Generate mock chart data as fallback
      const mockData = generateMockChartData(symbol, period);
      setChartData(mockData);
      
      // Use default stock info
      const defaultInfo = { symbol: 'RELIANCE', name: 'Reliance Industries Ltd', price: 2847.50, change: 15.25, changePercent: 0.54 };
      if (defaultInfo) {
        setStockInfo({
          symbol: defaultInfo.symbol,
          name: defaultInfo.name,
          price: defaultInfo.price,
          change: defaultInfo.change,
          changesPercentage: defaultInfo.changePercent
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Generate mock chart data for development
  const generateMockChartData = (symbol, period) => {
    const basePrice = 1000;
    const dataPoints = period === '1D' ? 100 : period === '5D' ? 500 : 1000;
    const data = [];
    
    let currentPrice = basePrice;
    const now = new Date();
    
    for (let i = dataPoints; i >= 0; i--) {
      const time = new Date(now.getTime() - i * (period === '1D' ? 5 * 60 * 1000 : 24 * 60 * 60 * 1000));
      const volatility = 0.02; // 2% volatility
      const change = (Math.random() - 0.5) * volatility * currentPrice;
      
      const open = currentPrice;
      const close = currentPrice + change;
      const high = Math.max(open, close) + Math.random() * 0.01 * currentPrice;
      const low = Math.min(open, close) - Math.random() * 0.01 * currentPrice;
      
      data.push({
        time: time.toISOString().split('T')[0],
        open: parseFloat(open.toFixed(2)),
        high: parseFloat(high.toFixed(2)),
        low: parseFloat(low.toFixed(2)),
        close: parseFloat(close.toFixed(2)),
        volume: Math.floor(Math.random() * 1000000) + 100000
      });
      
      currentPrice = close;
    }
    
    return data;
  };

  // Fetch live stock quote
  const fetchLiveQuote = async (symbol) => {
    try {
      console.log(`📈 Fetching live quote for ${symbol}`);
      const response = await fmpAPI.stock.getStockQuote(symbol);

      if (response.success && response.data) {
        const newPrice = response.data.price;
        const oldPrice = livePrice;

        setLivePrice(newPrice);
        setStockInfo(response.data);
        setLastUpdate(new Date());

        // Calculate price change direction for animation
        if (oldPrice && newPrice !== oldPrice) {
          setPriceChange({
            direction: newPrice > oldPrice ? 'up' : 'down',
            amount: newPrice - oldPrice,
            timestamp: Date.now()
          });

          // Update chart data with new price point if in 1D timeframe
          if (timeframe === '1D' && chartData.length > 0) {
            const lastPoint = { ...chartData[chartData.length - 1] };
            const newPoint = {
              ...lastPoint,
              close: newPrice,
              high: Math.max(lastPoint.high, newPrice),
              low: Math.min(lastPoint.low, newPrice),
              time: new Date().toISOString()
            };

            setChartData(prevData => [...prevData.slice(0, -1), newPoint]);
          }
        }

        console.log(`✅ Live price updated: ₹${newPrice}`);
        return response.data;
      }
    } catch (error) {
      console.warn('⚠️ Failed to fetch live quote:', error.message);
    }
    return null;
  };

  // Toggle live updates
  const toggleLiveUpdates = () => {
    const newLiveState = !isLive;
    setIsLive(newLiveState);

    if (newLiveState) {
      // Start live updates
      console.log('🔄 Starting live updates every 30 seconds');
      const interval = setInterval(() => {
        if (!refreshing) {
          const transformedSymbol = transformSymbolForFMP(selectedStock);
          fetchLiveQuote(transformedSymbol);
        }
      }, 30000); // Update every 30 seconds
      setUpdateInterval(interval);
    } else {
      // Stop live updates
      console.log('⏹️ Stopping live updates');
      if (updateInterval) {
        clearInterval(updateInterval);
        setUpdateInterval(null);
      }
    }
  };

  // Refresh chart data
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchChartData(selectedStock, timeframe);
    setRefreshing(false);
  };

  // Handle stock selection
  const handleStockSelect = async (symbol) => {
    console.log('🎯 Stock selected:', symbol);
    
    // Clean the symbol (remove exchange suffixes)
    const cleanSymbol = symbol.replace(/\.(NS|BO)$/, '');
    console.log('🔄 Clean symbol:', cleanSymbol);

    setSelectedStock(cleanSymbol);
    await fetchChartData(cleanSymbol, timeframe);
  };



  // Handle timeframe change
  const handleTimeframeChange = async (newTimeframe) => {
    setTimeframe(newTimeframe);
    await fetchChartData(selectedStock, newTimeframe);
  };

  // Toggle technical indicators
  const toggleIndicator = (indicatorId) => {
    setIndicators(prev => 
      prev.includes(indicatorId)
        ? prev.filter(id => id !== indicatorId)
        : [...prev, indicatorId]
    );
  };



  // Popular stocks state
  const [popularStocks, setPopularStocks] = useState([
    { symbol: 'RELIANCE', name: 'Reliance Industries Ltd', price: 2847.50, change: 15.25, changePercent: 0.54, isWatchlisted: false },
    { symbol: 'TCS', name: 'Tata Consultancy Services', price: 4125.80, change: -12.40, changePercent: -0.30, isWatchlisted: true },
    { symbol: 'HDFCBANK', name: 'HDFC Bank Limited', price: 1687.90, change: 8.75, changePercent: 0.52, isWatchlisted: false },
    { symbol: 'INFY', name: 'Infosys Limited', price: 1842.35, change: 22.15, changePercent: 1.22, isWatchlisted: false },
    { symbol: 'HINDUNILVR', name: 'Hindustan Unilever Ltd', price: 2456.70, change: -5.30, changePercent: -0.22, isWatchlisted: true },
    { symbol: 'ICICIBANK', name: 'ICICI Bank Limited', price: 1287.45, change: 18.90, changePercent: 1.49, isWatchlisted: false }
  ]);

  // Update popular stocks state
  const updatePopularStocks = (updatedStocks) => {
    setPopularStocks(updatedStocks);
  };

  // Get selected stock data
  const selectedStockData = popularStocks.find(stock => stock.symbol === selectedStock) || popularStocks[0] || { symbol: 'RELIANCE', name: 'Reliance Industries Ltd', price: 2847.50, change: 15.25, changePercent: 0.54, isWatchlisted: false };

  // Format currency
  // Format currency in Indian Rupees (₹)
  const formatCurrency = (amount) => {
    if (!amount) return '₹0.00';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };


  // Load initial data and start live updates
  useEffect(() => {

    const transformedSymbol = transformSymbolForFMP(selectedStock);
    fetchChartData(transformedSymbol, timeframe);

    // Start live updates if enabled
    if (isLive) {
      const interval = setInterval(() => {
        if (!refreshing) {
          const transformedSymbol = transformSymbolForFMP(selectedStock);
          fetchLiveQuote(transformedSymbol);
        }
      }, 30000); // Update every 30 seconds
      setUpdateInterval(interval);

      return () => {
        if (interval) clearInterval(interval);
      };
    }
  }, []);

  // Handle stock selection change
  useEffect(() => {
    const transformedSymbol = transformSymbolForFMP(selectedStock);
    fetchChartData(transformedSymbol, timeframe);

    // Reset live price when stock changes
    setLivePrice(null);
    setPriceChange(null);
  }, [selectedStock, timeframe]);

  // Handle live updates toggle
  useEffect(() => {
    if (isLive && !updateInterval) {
      const interval = setInterval(() => {
        if (!refreshing) {
          const transformedSymbol = transformSymbolForFMP(selectedStock);
          fetchLiveQuote(transformedSymbol);
        }
      }, 30000);
      setUpdateInterval(interval);
    } else if (!isLive && updateInterval) {
      clearInterval(updateInterval);
      setUpdateInterval(null);
    }

    return () => {
      if (updateInterval) clearInterval(updateInterval);
    };
  }, [isLive, selectedStock, refreshing]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (updateInterval) {
        clearInterval(updateInterval);
      }
    };
  }, []);

  return (
    <div className={`charts-page ${isCollapsed ? 'sidebar-collapsed' : 'sidebar-expanded'}`}>
      <div className="charts-container">
        {/* Header */}
        <motion.div
          className="charts-header"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="header-left">
            <div className="page-title">
              <FiBarChart2 size={24} />
              <h1>Charts</h1>
            </div>
            <div className="stock-info">
              <h2>{selectedStockData.name}</h2>
              <span className="symbol">({selectedStockData.symbol})</span>
              <StockPrice
                price={selectedStockData.price}
                change={selectedStockData.change}
                changePercent={selectedStockData.changePercent}
              />
              <div className="stock-actions-row">
                <button 
                  className="watchlist-btn" 
                  title={selectedStockData.isWatchlisted ? "Remove from Watchlist" : "Add to Watchlist"}
                  onClick={() => {
                    // Toggle watchlist state
                    const updatedStock = { ...selectedStockData, isWatchlisted: !selectedStockData.isWatchlisted };
                    // Update in popular stocks if it exists there
                    updatePopularStocks(popularStocks.map(s => 
                      s.symbol === selectedStockData.symbol ? updatedStock : s
                    ));
                  }}
                >
                  {selectedStockData.isWatchlisted ? '⭐ Remove' : '☆ Add to Watchlist'}
                </button>
              </div>
            </div>
          </div>
          <div className="header-actions">
            <button
              className="btn-premium btn-secondary"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <FiRefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
        </motion.div>

        <div className="charts-content">
          {/* Sidebar */}
          <motion.div
            className="charts-sidebar"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            {/* Enhanced Stock Search Panel */}
            <StockSearchPanel
              onStockSelect={(stock) => {
                console.log('🎯 Selected stock from panel:', stock);
                handleStockSelect(stock.symbol || stock);
              }}
              selectedStock={{ symbol: selectedStock }}
              className="charts-stock-search"
              popularStocks={popularStocks}
              onUpdatePopularStocks={updatePopularStocks}
            />

            {/* Timeframe Selection */}
            <div className="sidebar-section">
              <h3>Timeframe</h3>
              <div className="timeframe-buttons">
                {timeframes.map((tf) => (
                  <button
                    key={tf}
                    className={`timeframe-btn ${timeframe === tf ? 'active' : ''}`}
                    onClick={() => handleTimeframeChange(tf)}
                  >
                    {tf}
                  </button>
                ))}
              </div>
            </div>

            {/* Chart Type */}
            <div className="sidebar-section">
              <h3>Chart Type</h3>
              <div className="chart-type-buttons">
                {chartTypes.map((type) => (
                  <button
                    key={type.id}
                    className={`chart-type-btn ${chartType === type.id ? 'active' : ''}`}
                    onClick={() => setChartType(type.id)}
                  >
                    <type.icon size={16} />
                    {type.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Technical Indicators */}
            <div className="sidebar-section">
              <h3>Technical Indicators</h3>
              <div className="indicators-list">
                {availableIndicators.map((indicator) => (
                  <div
                    key={indicator.id}
                    className={`indicator-item ${indicators.includes(indicator.id) ? 'active' : ''}`}
                    onClick={() => toggleIndicator(indicator.id)}
                  >
                    <div className="indicator-color" style={{ backgroundColor: indicator.color }}></div>
                    <span>{indicator.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Main Chart Area with TradingView */}
          <motion.div
            className="chart-main"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <TradingViewChart
              data={chartData}
              symbol={selectedStock}
              timeframe={timeframe}
              chartType={chartType}
              theme={theme}
              onRefresh={handleRefresh}
              loading={loading}
              height={600}
            />

            {/* Chart Footer */}
            <div className="chart-footer">
              <div className="footer-left">
                <div className="volume-info">
                  <FiVolume2 size={16} />
                  <span>Volume: {stockInfo?.volume ? stockInfo.volume.toLocaleString() : 'N/A'}</span>
                </div>
                <div className="market-cap-info">
                  <FiTarget size={16} />
                  <span>Market Cap: {stockInfo?.marketCap ? '₹' + (stockInfo.marketCap / 10000000).toFixed(1) + ' Cr' : 'N/A'}</span>
                </div>
              </div>
              <div className="footer-right">
                <div className="last-updated">
                  <FiClock size={16} />
                  <span>Last updated: {stockInfo?.timestamp ? new Date(stockInfo.timestamp * 1000).toLocaleTimeString() : 'N/A'}</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Charts;
