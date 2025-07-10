import React, { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiTrendingUp, FiTrendingDown, FiDollarSign, FiBarChart2,
  FiActivity, FiInfo, FiClock, FiCalendar, FiRefreshCw,
  FiShoppingCart, FiStar, FiSearch, FiX
} from 'react-icons/fi';
import axios from 'axios';
import { ThemeContext } from '../context/ThemeContext';
import { useVirtualMoney } from '../context/VirtualMoneyContext';
import { useToast } from '../context/ToastContext';
import StockChart from './StockChart';
import BuySellModal from './BuySellModal';
import API_ENDPOINTS from '../config/apiConfig';
import { formatPrice, formatLargeNumber } from '../utils/chartUtils';
import '../styles/components/ModernStockDashboard.css';

const ModernStockDashboard = () => {
  const [marketData, setMarketData] = useState({
    indices: [],
    topGainers: [],
    topLosers: []
  });
  const [loading, setLoading] = useState(true);
  const [selectedStock, setSelectedStock] = useState('AAPL');
  const [stockData, setStockData] = useState(null);
  const [stockLoading, setStockLoading] = useState(true);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [showSellModal, setShowSellModal] = useState(false);
  const [selectedChartType, setSelectedChartType] = useState('area');
  const [selectedTimeRange, setSelectedTimeRange] = useState('1day');

  const { theme } = useContext(ThemeContext);
  const { virtualMoney, updateVirtualMoney } = useVirtualMoney();
  const { success, error } = useToast();

  // Chart type options
  const chartTypeOptions = [
    { label: 'Area', value: 'area' },
    { label: 'Line', value: 'line' },
    { label: 'Bar', value: 'bar' }
  ];

  // Time range options
  const timeRangeOptions = [
    { label: '1D', value: '1day' },
    { label: '1W', value: '1week' },
    { label: '1M', value: '1month' },
    { label: '3M', value: '3months' },
    { label: '1Y', value: '1year' }
  ];

  // Fetch market data
  useEffect(() => {
    const fetchMarketData = async () => {
      try {
        setLoading(true);

        // Use our proxy server instead of direct API calls
        const [indicesResponse, gainersResponse, losersResponse] = await Promise.all([
          axios.get(API_ENDPOINTS.PROXY.MARKET_INDICES),
          axios.get(API_ENDPOINTS.PROXY.TOP_GAINERS),
          axios.get(API_ENDPOINTS.PROXY.TOP_LOSERS)
        ]);

        setMarketData({
          indices: indicesResponse.data.slice(0, 5),
          topGainers: gainersResponse.data.slice(0, 5),
          topLosers: losersResponse.data.slice(0, 5)
        });
      } catch (error) {
        console.error('Error fetching market data:', error);
        error('Failed to fetch market data. Using mock data instead.');

        // Use mock data as fallback
        setMarketData({
          indices: [
            { symbol: "^GSPC", name: "S&P 500", price: 4500.53, changesPercentage: 0.75 },
            { symbol: "^DJI", name: "Dow Jones", price: 35000.25, changesPercentage: 0.5 },
            { symbol: "^IXIC", name: "NASDAQ", price: 14200.75, changesPercentage: 1.2 },
            { symbol: "^RUT", name: "Russell 2000", price: 2100.30, changesPercentage: -0.3 },
            { symbol: "^VIX", name: "Volatility Index", price: 18.25, changesPercentage: -2.1 }
          ],
          topGainers: [
            { symbol: "AAPL", name: "Apple Inc.", price: 178.25, changesPercentage: 3.5 },
            { symbol: "MSFT", name: "Microsoft Corp.", price: 332.80, changesPercentage: 2.8 },
            { symbol: "GOOGL", name: "Alphabet Inc.", price: 135.60, changesPercentage: 2.3 },
            { symbol: "AMZN", name: "Amazon.com Inc.", price: 145.20, changesPercentage: 1.9 },
            { symbol: "TSLA", name: "Tesla Inc.", price: 245.75, changesPercentage: 1.7 }
          ],
          topLosers: [
            { symbol: "META", name: "Meta Platforms Inc.", price: 310.50, changesPercentage: -2.1 },
            { symbol: "NFLX", name: "Netflix Inc.", price: 425.30, changesPercentage: -1.8 },
            { symbol: "NVDA", name: "NVIDIA Corp.", price: 450.20, changesPercentage: -1.5 },
            { symbol: "JPM", name: "JPMorgan Chase & Co.", price: 155.40, changesPercentage: -1.2 },
            { symbol: "BAC", name: "Bank of America Corp.", price: 35.75, changesPercentage: -0.9 }
          ]
        });
      } finally {
        setLoading(false);
      }
    };

    fetchMarketData();
  }, []);

  // Fetch stock data when selected stock changes
  useEffect(() => {
    const fetchStockData = async () => {
      if (!selectedStock) return;

      try {
        setStockLoading(true);

        const response = await axios.get(API_ENDPOINTS.PROXY.STOCK_BATCH(selectedStock));

        if (response.data && response.data.length > 0) {
          setStockData(response.data[0]);
        }
      } catch (error) {
        console.error('Error fetching stock data:', error);
        error('Failed to fetch stock data');
      } finally {
        setStockLoading(false);
      }
    };

    fetchStockData();
  }, [selectedStock]);

  // Handle stock selection
  const handleStockSelect = (symbol) => {
    setSelectedStock(symbol);
  };

  // Handle buy success
  const handleBuySuccess = (data) => {
    updateVirtualMoney(data);
    setShowBuyModal(false);
    success('Stock purchased successfully!');
  };

  // Handle sell success
  const handleSellSuccess = (data) => {
    updateVirtualMoney(data);
    setShowSellModal(false);
    success('Stock sold successfully!');
  };

  // Format date
  const formatDate = () => {
    const date = new Date();
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="modern-dashboard">
      <div className="dashboard-header">
        <div className="date-display">
          <FiCalendar className="calendar-icon" />
          <span>{formatDate()}</span>
        </div>
        <div className="refresh-button" onClick={() => window.location.reload()}>
          <FiRefreshCw />
          <span>Refresh</span>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* Market Overview */}
        <div className="market-overview-card">
          <h2 className="card-title">Market Overview</h2>
          <div className="market-indices">
            {loading ? (
              <div className="loading-placeholder">Loading market data...</div>
            ) : (
              marketData.indices.map((index) => (
                <div key={index.symbol} className="market-index-item">
                  <div className="index-name">{index.name}</div>
                  <div className="index-price">{formatPrice(index.price)}</div>
                  <div className={`index-change ${index.changesPercentage >= 0 ? 'positive' : 'negative'}`}>
                    {index.changesPercentage >= 0 ? <FiTrendingUp /> : <FiTrendingDown />}
                    <span>{index.changesPercentage.toFixed(2)}%</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Stock Chart */}
        <div className="chart-section">
          <div className="chart-header">
            <h2 className="chart-title">
              {stockData ? `${stockData.name} (${stockData.symbol})` : 'Stock Chart'}
            </h2>
            <div className="chart-controls">
              <div className="chart-type-selector">
                {chartTypeOptions.map((option) => (
                  <button
                    key={option.value}
                    className={selectedChartType === option.value ? 'active' : ''}
                    onClick={() => setSelectedChartType(option.value)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <div className="time-range-selector">
                {timeRangeOptions.map((option) => (
                  <button
                    key={option.value}
                    className={selectedTimeRange === option.value ? 'active' : ''}
                    onClick={() => setSelectedTimeRange(option.value)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {stockLoading ? (
            <div className="chart-loading">
              <div className="loading-spinner"></div>
              <p>Loading chart data...</p>
            </div>
          ) : (
            <>
              <div className="stock-price-display">
                <div className="current-price">{formatPrice(stockData?.price)}</div>
                {stockData && (
                  <div className={`price-change ${stockData.changesPercentage >= 0 ? 'positive' : 'negative'}`}>
                    {stockData.changesPercentage >= 0 ? <FiTrendingUp /> : <FiTrendingDown />}
                    <span>{stockData.changesPercentage.toFixed(2)}%</span>
                  </div>
                )}
              </div>

              <StockChart
                symbol={selectedStock}
                chartType={selectedChartType}
                timeRange={selectedTimeRange}
                height={350}
              />

              <div className="chart-actions">
                <button className="buy-button" onClick={() => setShowBuyModal(true)}>
                  <FiShoppingCart /> Buy
                </button>
                <button className="sell-button" onClick={() => setShowSellModal(true)}>
                  <FiBarChart2 /> Sell
                </button>
              </div>
            </>
          )}
        </div>

        {/* Top Movers */}
        <div className="top-movers-card">
          <h2 className="card-title">Top Gainers</h2>
          <div className="movers-list">
            {loading ? (
              <div className="loading-placeholder">Loading top gainers...</div>
            ) : (
              marketData.topGainers.map((stock) => (
                <div
                  key={stock.symbol}
                  className="mover-item"
                  onClick={() => handleStockSelect(stock.symbol)}
                >
                  <div className="mover-symbol">{stock.symbol}</div>
                  <div className="mover-name">{stock.name}</div>
                  <div className="mover-price">{formatPrice(stock.price)}</div>
                  <div className="mover-change positive">
                    <FiTrendingUp />
                    <span>{stock.changesPercentage.toFixed(2)}%</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="top-movers-card">
          <h2 className="card-title">Top Losers</h2>
          <div className="movers-list">
            {loading ? (
              <div className="loading-placeholder">Loading top losers...</div>
            ) : (
              marketData.topLosers.map((stock) => (
                <div
                  key={stock.symbol}
                  className="mover-item"
                  onClick={() => handleStockSelect(stock.symbol)}
                >
                  <div className="mover-symbol">{stock.symbol}</div>
                  <div className="mover-name">{stock.name}</div>
                  <div className="mover-price">{formatPrice(stock.price)}</div>
                  <div className="mover-change negative">
                    <FiTrendingDown />
                    <span>{stock.changesPercentage.toFixed(2)}%</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Buy Modal */}
      <AnimatePresence>
        {showBuyModal && stockData && (
          <BuySellModal
            isOpen={showBuyModal}
            onClose={() => setShowBuyModal(false)}
            type="BUY"
            stockData={stockData}
            onSuccess={handleBuySuccess}
            virtualMoney={virtualMoney}
          />
        )}
      </AnimatePresence>

      {/* Sell Modal */}
      <AnimatePresence>
        {showSellModal && stockData && (
          <BuySellModal
            isOpen={showSellModal}
            onClose={() => setShowSellModal(false)}
            type="SELL"
            stockData={stockData}
            onSuccess={handleSellSuccess}
            virtualMoney={virtualMoney}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default ModernStockDashboard;
