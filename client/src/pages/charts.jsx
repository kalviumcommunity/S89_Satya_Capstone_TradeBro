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
import StockPrice from '../components/StockPrice';
import TradingViewChart from '../components/charts/TradingViewChart';
import StockSearchPanel from '../components/StockSearchPanel';
import WatchlistButton from '../components/trading/WatchlistButton';
import { useStockSearch } from '../hooks/useSearch';
import SearchInput from '../components/common/SearchInput';
import { chartAPI, stockAPI } from '../services/api';
import fmpAPI from '../services/fmpAPI';
import { testIndianStockAPI } from '../utils/testIndianStocks';
import { toast } from 'react-toastify';
import '../styles/charts-el-classico.css';
import '../styles/stock-search-panel.css';
import '../styles/tradingview-chart.css';
import '../styles/trading.css';

const Charts = ({ user, theme }) => {
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
    // List of Indian stocks that need .NS suffix for NSE
    const indianStocks = [
      'RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'HINDUNILVR', 'ICICIBANK',
      'BHARTIARTL', 'SBIN', 'LICI', 'ITC', 'KOTAKBANK', 'LT', 'HCLTECH',
      'AXISBANK', 'ASIANPAINT', 'MARUTI', 'SUNPHARMA', 'TITAN', 'ULTRACEMCO',
      'WIPRO', 'NESTLEIND', 'POWERGRID', 'NTPC', 'BAJFINANCE', 'M&M'
    ];

    // If it's an Indian stock and doesn't already have an exchange suffix
    if (indianStocks.includes(symbol.toUpperCase()) && !symbol.includes('.')) {
      return `${symbol}.NS`; // Add NSE suffix
    }

    return symbol; // Return as-is for other stocks
  };

  // Popular Indian stocks for NSE and BSE (TradeBro focuses on Indian markets)
  const popularStocksRaw = [
    { symbol: 'RELIANCE.NS', name: 'Reliance Industries Ltd', price: 2847.50, change: 15.25, changePercent: 0.54 },
    { symbol: 'TCS.NS', name: 'Tata Consultancy Services', price: 4125.80, change: -12.40, changePercent: -0.30 },
    { symbol: 'HDFCBANK.NS', name: 'HDFC Bank Limited', price: 1687.90, change: 8.75, changePercent: 0.52 },
    { symbol: 'INFY.NS', name: 'Infosys Limited', price: 1842.35, change: 22.15, changePercent: 1.22 },
    { symbol: 'HINDUNILVR.NS', name: 'Hindustan Unilever Ltd', price: 2456.70, change: -5.30, changePercent: -0.22 },
    { symbol: 'ICICIBANK.NS', name: 'ICICI Bank Limited', price: 1287.45, change: 18.90, changePercent: 1.49 },
    { symbol: 'KOTAKBANK.NS', name: 'Kotak Mahindra Bank', price: 1798.25, change: -7.85, changePercent: -0.43 },
    { symbol: 'BHARTIARTL.NS', name: 'Bharti Airtel Limited', price: 1654.30, change: 12.60, changePercent: 0.77 },
    { symbol: 'ITC.NS', name: 'ITC Limited', price: 487.85, change: 3.25, changePercent: 0.67 },
    { symbol: 'SBIN.NS', name: 'State Bank of India', price: 825.40, change: -4.15, changePercent: -0.50 },
    { symbol: 'LT.NS', name: 'Larsen & Toubro Ltd', price: 3687.20, change: 28.45, changePercent: 0.78 },
    { symbol: 'ASIANPAINT.NS', name: 'Asian Paints Limited', price: 2398.75, change: -15.80, changePercent: -0.65 }
  ];

  // Ensure no duplicates in popular stocks
  const popularStocks = popularStocksRaw.filter((stock, index, self) =>
    index === self.findIndex(s => s.symbol === stock.symbol)
  );

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

  // Fetch chart data from FMP API
  const fetchChartData = async (symbol, period) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log(`📊 Fetching chart data for ${symbol} (${period})`);
      console.log('🔍 FMP API structure:', {
        hasChart: !!fmpAPI.chart,
        hasGetHistoricalData: !!fmpAPI.chart?.getHistoricalData
      });

      // Get historical data from FMP API
      const historicalResponse = await fmpAPI.chart.getHistoricalData(symbol, period);
      console.log('📈 Historical response:', historicalResponse);

      if (historicalResponse && historicalResponse.success && historicalResponse.data && historicalResponse.data.length > 0) {
        const formattedData = formatChartData(historicalResponse.data);
        setChartData(formattedData);
        console.log(`✅ Chart data loaded: ${formattedData.length} points`);
      } else {
        console.warn('⚠️ No historical data available', {
          hasResponse: !!historicalResponse,
          success: historicalResponse?.success,
          dataLength: historicalResponse?.data?.length || 0,
          response: historicalResponse
        });
        setChartData([]);
      }

      // Get stock quote
      const quoteResponse = await fmpAPI.stock.getStockQuote(symbol);
      if (quoteResponse.success) {
        setStockInfo(quoteResponse.data);
        console.log(`✅ Stock info loaded for ${symbol}`);
      }
      
    } catch (error) {
      console.error('❌ Error fetching chart data:', error);
      setError(error.message);
      setChartData([]);
    } finally {
      setLoading(false);
    }
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

    // Transform Indian stock symbols for FMP API
    const transformedSymbol = transformSymbolForFMP(symbol);
    console.log('🔄 Transformed symbol:', transformedSymbol);

    setSelectedStock(symbol); // Keep original symbol for display
    await fetchChartData(transformedSymbol, timeframe);
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

  // Filter stocks based on search and remove duplicates
  const filteredStocks = popularStocks
    .filter(stock => {
      if (!searchQuery || searchQuery.trim() === '') return true;
      const query = searchQuery.toLowerCase();
      return (
        stock.symbol?.toLowerCase().includes(query) ||
        stock.name?.toLowerCase().includes(query)
      );
    })
    // Remove duplicates based on symbol
    .filter((stock, index, self) =>
      index === self.findIndex(s => s.symbol === stock.symbol)
    );

  // Get selected stock data
  const getSelectedStockData = () => {
    return popularStocks.find(stock => stock.symbol === selectedStock) || popularStocks[0];
  };

  const selectedStockData = getSelectedStockData();

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

  // Test API functionality
  const testAPI = async () => {
    console.log('🧪 Testing FMP API functionality...');

    // Test with a popular US stock first
    try {
      const testResponse = await fmpAPI.chart.getHistoricalData('AAPL', '1D');
      console.log('🧪 US Stock (AAPL) test result:', testResponse);
    } catch (error) {
      console.log('🧪 US Stock test failed:', error);
    }

    // Test with Indian stock
    try {
      const testResponse2 = await fmpAPI.chart.getHistoricalData('RELIANCE.NS', '1D');
      console.log('🧪 Indian Stock (RELIANCE.NS) test result:', testResponse2);
    } catch (error) {
      console.log('🧪 Indian Stock test failed:', error);
    }
  };

  // Load initial data and start live updates
  useEffect(() => {
    // Run API test first
    testAPI();

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
    <div className="charts-page">
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
              <h1>Professional Charts</h1>
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
                {/* Buy/Sell buttons removed from charts */}
                <WatchlistButton
                  stockData={selectedStockData}
                  size="small"
                  variant="icon"
                  onSuccess={(result, action) => {
                    if (action === 'added') {
                      toast.success(`Added ${selectedStockData.symbol} to watchlist`);
                    } else if (action === 'removed') {
                      toast.success(`Removed ${selectedStockData.symbol} from watchlist`);
                    }
                  }}
                  onError={(message) => {
                    toast.error(message || 'Failed to update watchlist');
                  }}
                  showText={false}
                />
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
