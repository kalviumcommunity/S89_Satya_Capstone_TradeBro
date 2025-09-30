import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  FiBarChart2,
  FiRefreshCw,
  FiActivity,
  FiClock,
  FiVolume2,
  FiTarget,
  FiLayers,
  FiPlay,
  FiPause
} from 'react-icons/fi';
import { useSidebar } from '../contexts/SidebarContext';
import StockPrice from '../components/StockPrice';
import TradingViewChart from '../components/charts/TradingViewChart';
import StockSearchPanel from '../components/StockSearchPanel';
import WatchlistButton from '../components/trading/WatchlistButton';
import { useStockSearch } from '../hooks/useSearch';
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
  const [isLive, setIsLive] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [updateInterval, setUpdateInterval] = useState(null);

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

  const timeframes = ['1D', '5D', '1M', '3M', '6M', '1Y', '5Y'];

  const chartTypes = [
    { id: 'candlestick', name: 'Candlestick', icon: FiBarChart2 },
    { id: 'line', name: 'Line', icon: FiActivity },
    { id: 'area', name: 'Area', icon: FiLayers }
  ];

  const availableIndicators = [
    { id: 'sma', name: 'SMA (20)', color: '#3B82F6' },
    { id: 'ema', name: 'EMA (12)', color: '#10B981' },
    { id: 'rsi', name: 'RSI (14)', color: '#F59E0B' },
    { id: 'macd', name: 'MACD', color: '#EF4444' },
    { id: 'bollinger', name: 'Bollinger Bands', color: '#8B5CF6' }
  ];

  const [popularStocks, setPopularStocks] = useState([
    { symbol: 'RELIANCE', name: 'Reliance Industries Ltd', price: 2847.50, change: 15.25, changePercent: 0.54, isWatchlisted: false },
    { symbol: 'TCS', name: 'Tata Consultancy Services', price: 4125.80, change: -12.40, changePercent: -0.30, isWatchlisted: true },
    { symbol: 'HDFCBANK', name: 'HDFC Bank Limited', price: 1687.90, change: 8.75, changePercent: 0.52, isWatchlisted: false },
    { symbol: 'INFY', name: 'Infosys Limited', price: 1842.35, change: 22.15, changePercent: 1.22, isWatchlisted: false },
    { symbol: 'HINDUNILVR', name: 'Hindustan Unilever Ltd', price: 2456.70, change: -5.30, changePercent: -0.22, isWatchlisted: true },
    { symbol: 'ICICIBANK', name: 'ICICI Bank Limited', price: 1287.45, change: 18.90, changePercent: 1.49, isWatchlisted: false }
  ]);

  const transformSymbolForFMP = (symbol) => {
    return symbol.replace(/\.(NS|BO)$/, '');
  };

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

  const generateMockChartData = (symbol, period) => {
    const basePrice = 1000;
    const dataPoints = period === '1D' ? 100 : period === '5D' ? 500 : 1000;
    const data = [];
    
    let currentPrice = basePrice;
    const now = new Date();
    
    for (let i = dataPoints; i >= 0; i--) {
      const time = new Date(now.getTime() - i * (period === '1D' ? 5 * 60 * 1000 : 24 * 60 * 60 * 1000));
      const volatility = 0.02;
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

  const fetchChartData = async (symbol, period) => {
    setLoading(true);
    setError(null);
    
    try {
      const apiSymbol = transformSymbolForFMP(symbol);
      const historicalResponse = await fmpAPI.chart.getHistoricalData(apiSymbol, period);

      if (historicalResponse && historicalResponse.success && historicalResponse.data && historicalResponse.data.length > 0) {
        const formattedData = formatChartData(historicalResponse.data);
        setChartData(formattedData);
      } else {
        const mockData = generateMockChartData(symbol, period);
        setChartData(mockData);
      }

      try {
        const quoteResponse = await fmpAPI.stock.getStockQuote(apiSymbol);
        if (quoteResponse.success) {
          setStockInfo(quoteResponse.data);
        }
      } catch (quoteError) {
        const defaultInfo = popularStocks.find(s => s.symbol === symbol) || popularStocks[0];
        setStockInfo({
          symbol: defaultInfo.symbol,
          name: defaultInfo.name,
          price: defaultInfo.price,
          change: defaultInfo.change,
          changesPercentage: defaultInfo.changePercent
        });
      }
      
    } catch (error) {
      const mockData = generateMockChartData(symbol, period);
      setChartData(mockData);
      
      const defaultInfo = popularStocks.find(s => s.symbol === symbol) || popularStocks[0];
      setStockInfo({
        symbol: defaultInfo.symbol,
        name: defaultInfo.name,
        price: defaultInfo.price,
        change: defaultInfo.change,
        changesPercentage: defaultInfo.changePercent
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchLiveQuote = async (symbol) => {
    try {
      const response = await fmpAPI.stock.getStockQuote(symbol);
      if (response.success && response.data) {
        setStockInfo(response.data);
        setLastUpdate(new Date());
        return response.data;
      }
    } catch (error) {
      console.warn('Failed to fetch live quote:', error.message);
    }
    return null;
  };

  const toggleLiveUpdates = () => {
    const newLiveState = !isLive;
    setIsLive(newLiveState);

    if (newLiveState) {
      const interval = setInterval(() => {
        if (!refreshing) {
          const transformedSymbol = transformSymbolForFMP(selectedStock);
          fetchLiveQuote(transformedSymbol);
        }
      }, 30000);
      setUpdateInterval(interval);
      toast.success('Live updates enabled');
    } else {
      if (updateInterval) {
        clearInterval(updateInterval);
        setUpdateInterval(null);
      }
      toast.info('Live updates paused');
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchChartData(selectedStock, timeframe);
    setRefreshing(false);
  };

  const handleStockSelect = async (symbol) => {
    const cleanSymbol = symbol.replace(/\.(NS|BO)$/, '');
    setSelectedStock(cleanSymbol);
    await fetchChartData(cleanSymbol, timeframe);
  };

  const handleTimeframeChange = async (newTimeframe) => {
    setTimeframe(newTimeframe);
    await fetchChartData(selectedStock, newTimeframe);
  };

  const toggleIndicator = (indicatorId) => {
    setIndicators(prev => 
      prev.includes(indicatorId)
        ? prev.filter(id => id !== indicatorId)
        : [...prev, indicatorId]
    );
  };

  const updatePopularStocks = useCallback((updatedStocks) => {
    setPopularStocks(updatedStocks);
  }, []);

  const selectedStockData = popularStocks.find(stock => stock.symbol === selectedStock) || {
    symbol: selectedStock,
    name: `${selectedStock} Co.`,
    price: stockInfo?.price || 0,
    change: stockInfo?.change || 0,
    changePercent: stockInfo?.changesPercentage || 0,
    isWatchlisted: false
  };

  const formatCurrency = useCallback((amount) => {
    if (amount === null || amount === undefined) return '₹ N/A';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }, []);

  useEffect(() => {
    fetchChartData(selectedStock, timeframe);
  }, [selectedStock, timeframe]);

  useEffect(() => {
    return () => {
      if (updateInterval) {
        clearInterval(updateInterval);
      }
    };
  }, [updateInterval]);

  return (
    <div className={`charts-page ${isCollapsed ? 'sidebar-collapsed' : 'sidebar-expanded'}`}>
      <div className="charts-container">
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
                price={stockInfo?.price || selectedStockData.price}
                change={stockInfo?.change || selectedStockData.change}
                changePercent={stockInfo?.changesPercentage || selectedStockData.changePercent}
              />
              <div className="stock-actions-row">
                <WatchlistButton
                  symbol={selectedStockData.symbol}
                  isWatchlisted={selectedStockData.isWatchlisted}
                  onToggleWatchlist={() => {
                    const updatedStock = { ...selectedStockData, isWatchlisted: !selectedStockData.isWatchlisted };
                    setPopularStocks(popularStocks.map(s => 
                      s.symbol === selectedStockData.symbol ? updatedStock : s
                    ));
                    toast.info(updatedStock.isWatchlisted ? `${updatedStock.name} added to watchlist!` : `${updatedStock.name} removed from watchlist!`);
                  }}
                />
              </div>
            </div>
          </div>
          <div className="header-actions">
            <button
              className="btn-premium btn-secondary"
              onClick={handleRefresh}
              disabled={refreshing || loading}
            >
              <FiRefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
              Refresh
            </button>
            <button
              className={`btn-premium ${isLive ? 'btn-danger' : 'btn-success'}`}
              onClick={toggleLiveUpdates}
            >
              {isLive ? <FiPause size={16} /> : <FiPlay size={16} />}
              {isLive ? 'Pause Live' : 'Go Live'}
            </button>
          </div>
        </motion.div>

        <div className="charts-content">
          <motion.div
            className="charts-sidebar"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <StockSearchPanel
              onStockSelect={handleStockSelect}
              selectedStock={{ symbol: selectedStock }}
              className="charts-stock-search"
              popularStocks={popularStocks}
              onUpdatePopularStocks={updatePopularStocks}
            />

            <div className="sidebar-section">
              <h3>Timeframe</h3>
              <div className="timeframe-buttons">
                {timeframes.map((tf) => (
                  <button
                    key={tf}
                    className={`timeframe-btn ${timeframe === tf ? 'active' : ''}`}
                    onClick={() => handleTimeframeChange(tf)}
                    disabled={loading}
                  >
                    {tf}
                  </button>
                ))}
              </div>
            </div>

            <div className="sidebar-section">
              <h3>Chart Type</h3>
              <div className="chart-type-buttons">
                {chartTypes.map((type) => (
                  <button
                    key={type.id}
                    className={`chart-type-btn ${chartType === type.id ? 'active' : ''}`}
                    onClick={() => setChartType(type.id)}
                    disabled={loading}
                  >
                    <type.icon size={16} />
                    {type.name}
                  </button>
                ))}
              </div>
            </div>

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

          <motion.div
            className="chart-main"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {loading && <div className="chart-loading-overlay">Loading Chart Data...</div>}
            {error && <div className="chart-error-message">Error: {error}</div>}
            
            <TradingViewChart
              data={chartData}
              symbol={selectedStock}
              timeframe={timeframe}
              chartType={chartType}
              theme={theme}
              onRefresh={handleRefresh}
              loading={loading}
              height={600}
              indicators={indicators}
            />

            <div className="chart-footer">
              <div className="footer-left">
                <div className="volume-info">
                  <FiVolume2 size={16} />
                  <span>Volume: {stockInfo?.volume ? stockInfo.volume.toLocaleString() : 'N/A'}</span>
                </div>
                <div className="market-cap-info">
                  <FiTarget size={16} />
                  <span>Market Cap: {stockInfo?.marketCap ? formatCurrency(stockInfo.marketCap) : 'N/A'}</span>
                </div>
              </div>
              <div className="footer-right">
                <div className="last-updated">
                  <FiClock size={16} />
                  <span>Last updated: {lastUpdate ? lastUpdate.toLocaleTimeString() : 'N/A'}</span>
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