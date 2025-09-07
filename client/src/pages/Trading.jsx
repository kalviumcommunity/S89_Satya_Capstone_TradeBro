import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  FiShoppingCart,
  FiTrendingUp,
  FiTrendingDown,
  FiSearch,
  FiRefreshCw,
  FiDollarSign,
  FiBarChart2,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiArrowUpRight,
  FiArrowDownRight,
  FiPlus,
  FiMinus,
  FiActivity
} from 'react-icons/fi';
import CountUp from 'react-countup';
import StockPrice from '../components/StockPrice';
import { usePortfolio } from '../contexts/PortfolioContext';
import { useStockSearch } from '../hooks/useSearch';
import SearchInput from '../components/common/SearchInput';
import OrderModal from '../components/OrderModal';
import StockContextMenu, { useStockContextMenu } from '../components/StockContextMenu';
import SlideToBuy from '../components/trading/SlideToBuy';
import WatchlistButton from '../components/trading/WatchlistButton';
import { useOrderIntegration } from '../hooks/useOrderIntegration';
import { useSlideToBuy } from '../hooks/useSlideToBuy';
import useDragConfirm from '../hooks/useDragConfirm';
import DragConfirmModal from '../components/common/DragConfirmModal';
import '../styles/trading.css';

const Trading = ({ user, theme }) => {
  const [selectedStock, setSelectedStock] = useState(null);
  const [orderType, setOrderType] = useState('market');
  const [transactionType, setTransactionType] = useState('buy');
  const [quantity, setQuantity] = useState(1);
  const [price, setPrice] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [showAllStocks, setShowAllStocks] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [orderModalData, setOrderModalData] = useState(null);

  const location = useLocation();
  const navigate = useNavigate();
  const { portfolioData, buyStock, sellStock } = usePortfolio();
  const { isOpen, currentStock, defaultQuantity, openSlideToBuy, closeSlideToBuy } = useSlideToBuy();

  // Order integration and context menu hooks
  const {
    orderModalState,
    openOrderModal: openIntegratedOrderModal,
    closeOrderModal,
    quickBuy,
    quickSell,
    handleWatchlistStockClick,
    navigateToTrading
  } = useOrderIntegration();

  const { contextMenu, openContextMenu, closeContextMenu } = useStockContextMenu();

  // Drag confirmation modal
  const {
    isModalOpen: isDragModalOpen,
    orderData: dragOrderData,
    loading: dragLoading,
    closeConfirmation: closeDragConfirmation,
    processOrder: processDragOrder,
    confirmBuy,
    confirmSell
  } = useDragConfirm();

  // Stock search functionality
  const {
    query: searchQuery,
    setQuery: setSearchQuery,
    results: searchResults,
    suggestions,
    recentSearches,
    showHistory,
    handleHistoryClick,
    loading: searchLoading,
    clearSearch,
    hasResults
  } = useStockSearch({
    enableSuggestions: true,
    enableHistory: true,
    limit: 20,
    debounceMs: 300,
    onResults: (results, query) => {
      if (results.length > 0) {
        setShowAllStocks(true);
      }
    }
  });

  // Trading stats from real portfolio data
  const tradingStats = [
    {
      title: 'Available Balance',
      value: portfolioData.availableCash,
      icon: FiDollarSign,
      color: 'primary'
    },
    {
      title: 'Total Holdings',
      value: portfolioData.holdings?.length || 0,
      icon: FiShoppingCart,
      color: 'info'
    },
    {
      title: 'Total Invested',
      value: portfolioData.totalInvested,
      icon: FiBarChart2,
      color: 'warning'
    },
    {
      title: 'Total P&L',
      value: portfolioData.totalGainLoss,
      changePercent: portfolioData.totalGainLossPercentage,
      icon: portfolioData.totalGainLoss >= 0 ? FiTrendingUp : FiTrendingDown,
      color: portfolioData.totalGainLoss >= 0 ? 'success' : 'danger'
    }
  ];

  // Popular stocks for trading
  const popularStocks = [
    { symbol: 'RELIANCE', name: 'Reliance Industries', price: 2465.30, change: 2.71, changePercent: 0.11, volume: '2.5M' },
    { symbol: 'TCS', name: 'Tata Consultancy Services', price: 3185.45, change: -14.85, changePercent: -0.47, volume: '1.8M' },
    { symbol: 'HDFCBANK', name: 'HDFC Bank', price: 1650.20, change: 51.75, changePercent: 3.13, volume: '3.2M' },
    { symbol: 'INFY', name: 'Infosys', price: 1595.80, change: 19.70, changePercent: 1.25, volume: '2.1M' },
    { symbol: 'ICICIBANK', name: 'ICICI Bank', price: 945.15, change: 12.30, changePercent: 1.32, volume: '4.1M' },
    { symbol: 'WIPRO', name: 'Wipro Ltd', price: 420.85, change: -3.25, changePercent: -0.77, volume: '1.5M' },
    { symbol: 'BAJFINANCE', name: 'Bajaj Finance', price: 6845.30, change: 125.40, changePercent: 1.87, volume: '0.8M' },
    { symbol: 'MARUTI', name: 'Maruti Suzuki', price: 9245.60, change: -85.20, changePercent: -0.91, volume: '0.6M' }
  ];

  // Recent orders
  const recentOrders = [
    { id: 1, symbol: 'WIPRO', type: 'BUY', quantity: 50, price: 420, status: 'completed', time: '10:30 AM', total: 21000 },
    { id: 2, symbol: 'BAJFINANCE', type: 'SELL', quantity: 25, price: 6800, status: 'completed', time: '11:45 AM', total: 170000 },
    { id: 3, symbol: 'MARUTI', type: 'BUY', quantity: 10, price: 9200, status: 'pending', time: '12:15 PM', total: 92000 },
    { id: 4, symbol: 'ASIANPAINT', type: 'SELL', quantity: 15, price: 3100, status: 'cancelled', time: '01:30 PM', total: 46500 }
  ];

  // Handle URL parameters for search and symbol
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const searchParam = urlParams.get('search');
    const symbolParam = urlParams.get('symbol');

    if (searchParam) {
      setSearchQuery(searchParam);
    }

    if (symbolParam) {
      // Find stock by symbol in popular stocks or search results
      const stock = popularStocks.find(s => s.symbol === symbolParam) ||
                   searchResults.find(s => s.symbol === symbolParam);
      if (stock) {
        handleStockSelect(stock);
      }
    }
  }, [location.search, searchResults]);

  const handleStockSelect = (stock) => {
    setSelectedStock(stock);
    setPrice(stock.price?.toString() || '');
  };

  // Open order modal with stock data
  const openOrderModal = (stock, orderType = 'buy') => {
    setOrderModalData({
      ...stock,
      initialOrderType: orderType
    });
    setShowOrderModal(true);
  };

  // Handle order completion
  const handleOrderPlaced = () => {
    setShowOrderModal(false);
    setOrderModalData(null);
    // Refresh portfolio data or show success message
  };

  // Handle search suggestion click
  const handleSuggestionClick = (suggestion) => {
    const stock = {
      symbol: suggestion.symbol,
      name: suggestion.name,
      price: 0, // Will be updated with real price
      change: 0,
      changePercent: 0,
      volume: 'N/A'
    };
    handleStockSelect(stock);
    clearSearch();
  };

  const handlePlaceOrder = async () => {
    if (!selectedStock || !quantity) return;

    // Use drag confirmation modal for order placement
    const orderPrice = orderType === 'market' ? selectedStock.price : parseFloat(price);
    const orderQuantity = parseInt(quantity);

    const orderData = {
      symbol: selectedStock.symbol,
      name: selectedStock.name,
      price: orderPrice,
      quantity: orderQuantity,
      orderType: orderType,
      source: 'trading-page'
    };

    if (transactionType === 'buy') {
      confirmBuy(orderData.symbol, orderData.quantity, orderData.price, {
        name: orderData.name,
        orderType: orderData.orderType,
        source: orderData.source
      });
    } else {
      confirmSell(orderData.symbol, orderData.quantity, orderData.price, {
        name: orderData.name,
        orderType: orderData.orderType,
        source: orderData.source
      });
    }

    // Reset form after opening confirmation
    setQuantity(1);
    setPrice('');
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setRefreshing(false);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Determine which stocks to display
  const getDisplayStocks = () => {
    if (hasResults && showAllStocks) {
      // Show search results with proper formatting
      return searchResults.map(result => ({
        symbol: result.symbol,
        name: result.name,
        price: result.price || 0,
        change: result.change || 0,
        changePercent: result.changePercent || 0,
        volume: result.volume || 'N/A',
        exchange: result.exchange
      }));
    }

    // Show popular stocks (default or filtered locally if no API search)
    if (searchQuery && !hasResults) {
      return popularStocks.filter(stock =>
        stock.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        stock.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return popularStocks;
  };

  const displayStocks = getDisplayStocks();

  return (
    <div className="trading-page">
      <div className="trading-container">
        {/* Trading Header */}
        <motion.div
          className="trading-header"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="header-content">
            <div className="header-left">
              <h1 className="page-title">
                <FiShoppingCart className="title-icon" />
                Trading
              </h1>
              <p className="page-subtitle">
                Buy and sell stocks with real-time market data
              </p>
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
          </div>
        </motion.div>

        {/* Trading Stats */}
        <motion.div
          className="trading-stats"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          {tradingStats.map((stat, index) => {
            const Icon = stat.icon;
            const isPositive = stat.changePercent >= 0;
            
            return (
              <motion.div
                key={stat.title}
                className={`stat-card stat-${stat.color}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
              >
                <div className="stat-header">
                  <div className="stat-icon">
                    <Icon />
                  </div>
                  {stat.changePercent !== undefined && (
                    <div className={`stat-change ${isPositive ? 'positive' : 'negative'}`}>
                      {isPositive ? <FiArrowUpRight size={14} /> : <FiArrowDownRight size={14} />}
                      {Math.abs(stat.changePercent)}%
                    </div>
                  )}
                </div>
                <div className="stat-content">
                  <h3 className="stat-value">
                    {typeof stat.value === 'number' && stat.value > 1000 ? (
                      <CountUp
                        end={stat.value}
                        duration={2}
                        separator=","
                        prefix={stat.title.includes('Balance') || stat.title.includes('P&L') ? '₹' : ''}
                      />
                    ) : (
                      stat.value
                    )}
                  </h3>
                  <p className="stat-title">{stat.title}</p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Trading Content Grid */}
        <div className="trading-grid">
          {/* Stock Search & List */}
          <motion.div
            className="trading-card stocks-panel"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="card-header">
              <h3 className="card-title">
                <FiBarChart2 className="card-icon" />
                {hasResults && showAllStocks ? 'Search Results' : 'Popular Stocks'}
              </h3>
              <div className="search-container">
                <SearchInput
                  placeholder="Search stocks..."
                  value={searchQuery}
                  onChange={setSearchQuery}
                  onClear={() => {
                    clearSearch();
                    setShowAllStocks(false);
                  }}
                  suggestions={suggestions}
                  recentSearches={recentSearches}
                  onSuggestionClick={handleSuggestionClick}
                  onHistoryClick={handleHistoryClick}
                  showHistory={showHistory}
                  loading={searchLoading}
                  size="sm"
                  showSuggestions={true}
                  enableHistory={true}
                  className="trading-search-input"
                  renderSuggestion={(suggestion, index) => (
                    <div key={index} className="trading-search-suggestion">
                      <div className="suggestion-content">
                        <span className="suggestion-symbol">{suggestion.symbol}</span>
                        <span className="suggestion-name">{suggestion.name}</span>
                        {suggestion.exchange && (
                          <span className="suggestion-exchange">{suggestion.exchange}</span>
                        )}
                      </div>
                    </div>
                  )}
                />
              </div>
            </div>
            <div className="card-content">
              <div className="stocks-list">
                {searchLoading && (
                  <div className="loading-state">
                    <FiActivity className="loading-icon animate-spin" />
                    <span>Searching stocks...</span>
                  </div>
                )}

                {!searchLoading && displayStocks.length === 0 && searchQuery && (
                  <div className="empty-state">
                    <FiSearch className="empty-icon" />
                    <span>No stocks found for "{searchQuery}"</span>
                  </div>
                )}

                {!searchLoading && displayStocks.map((stock, index) => (
                  <motion.div
                    key={stock.symbol}
                    className={`stock-item ${selectedStock?.symbol === stock.symbol ? 'selected' : ''}`}
                    onClick={(e) => {
                      if (e.detail === 1) {
                        // Single click - select stock
                        handleStockSelect(stock);
                      } else if (e.detail === 2) {
                        // Double click - navigate to stock detail
                        navigate(`/stock/${stock.symbol}`);
                      }
                    }}
                    onContextMenu={(e) => openContextMenu(e, stock)}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <div className="stock-info">
                      <div className="stock-symbol">{stock.symbol}</div>
                      <div className="stock-name">{stock.name}</div>
                      <div className="stock-volume">Vol: {stock.volume}</div>
                    </div>
                    <div className="stock-price-info">
                      <StockPrice
                        price={stock.price}
                        change={stock.change}
                        changePercent={stock.changePercent}
                        size="small"
                      />
                    </div>
                    <div className="stock-actions">
                      <WatchlistButton
                        stockData={stock}
                        size="small"
                        variant="simple"
                        showText={false}
                      />
                      {/* Buy button removed from search results */}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Order Panel */}
          <motion.div
            className="trading-card order-panel"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <div className="card-header">
              <h3 className="card-title">
                <FiShoppingCart className="card-icon" />
                Place Order
              </h3>
            </div>
            <div className="card-content">
              {selectedStock ? (
                <div className="order-form">
                  <div className="selected-stock">
                    <div className="stock-details">
                      <h4>{selectedStock.symbol}</h4>
                      <p>{selectedStock.name}</p>
                    </div>
                    <StockPrice
                      price={selectedStock.price}
                      change={selectedStock.change}
                      changePercent={selectedStock.changePercent}
                      size="medium"
                    />
                  </div>

                  <div className="order-controls">
                    <div className="transaction-type">
                      <button
                        className={`type-btn ${transactionType === 'buy' ? 'active buy' : ''}`}
                        onClick={() => setTransactionType('buy')}
                      >
                        <FiTrendingUp size={16} />
                        BUY
                      </button>
                      <button
                        className={`type-btn ${transactionType === 'sell' ? 'active sell' : ''}`}
                        onClick={() => setTransactionType('sell')}
                      >
                        <FiTrendingDown size={16} />
                        SELL
                      </button>
                    </div>

                    <div className="order-type">
                      <label>Order Type</label>
                      <select
                        value={orderType}
                        onChange={(e) => setOrderType(e.target.value)}
                        className="order-select"
                      >
                        <option value="market">Market Order</option>
                        <option value="limit">Limit Order</option>
                        <option value="stop">Stop Order</option>
                      </select>
                    </div>

                    <div className="quantity-control">
                      <label>Quantity</label>
                      <div className="quantity-input">
                        <button
                          className="qty-btn"
                          onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        >
                          <FiMinus size={14} />
                        </button>
                        <input
                          type="number"
                          value={quantity}
                          onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                          className="qty-input"
                          min="1"
                        />
                        <button
                          className="qty-btn"
                          onClick={() => setQuantity(quantity + 1)}
                        >
                          <FiPlus size={14} />
                        </button>
                      </div>
                    </div>

                    {orderType !== 'market' && (
                      <div className="price-control">
                        <label>Price (₹)</label>
                        <input
                          type="number"
                          value={price}
                          onChange={(e) => setPrice(e.target.value)}
                          className="price-input"
                          placeholder="Enter price"
                          step="0.01"
                        />
                      </div>
                    )}

                    <div className="order-summary">
                      <div className="summary-row">
                        <span>Quantity:</span>
                        <span>{quantity} shares</span>
                      </div>
                      <div className="summary-row">
                        <span>Price:</span>
                        <span>{formatCurrency(orderType === 'market' ? selectedStock.price : parseFloat(price) || 0)}</span>
                      </div>
                      <div className="summary-row total">
                        <span>Total:</span>
                        <span>{formatCurrency((orderType === 'market' ? selectedStock.price : parseFloat(price) || 0) * quantity)}</span>
                      </div>
                    </div>

                    <div className="order-actions-grid">
                      <button
                        className={`place-order-btn ${transactionType}`}
                        onClick={handlePlaceOrder}
                        disabled={!quantity || (orderType !== 'market' && !price) || isPlacingOrder}
                      >
                        {isPlacingOrder ? (
                          <>
                            <div className="loading-spinner sm"></div>
                            Placing Order...
                          </>
                        ) : (
                          transactionType === 'buy' ? 'Place Buy Order' : 'Place Sell Order'
                        )}
                      </button>

                      <button
                        className="enhanced-order-btn"
                        onClick={() => openOrderModal(selectedStock, transactionType)}
                        disabled={!selectedStock}
                      >
                        <FiShoppingCart size={16} />
                        Enhanced Order
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="no-stock-selected">
                  <FiActivity size={48} />
                  <p>Select a stock to place an order</p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Recent Orders */}
          <motion.div
            className="trading-card orders-panel"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <div className="card-header">
              <h3 className="card-title">
                <FiClock className="card-icon" />
                Recent Orders
              </h3>
            </div>
            <div className="card-content">
              <div className="orders-list">
                {recentOrders.map((order, index) => (
                  <motion.div
                    key={order.id}
                    className="order-item"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <div className="order-info">
                      <div className="order-symbol">{order.symbol}</div>
                      <div className="order-details">
                        <span className={`order-type ${order.type.toLowerCase()}`}>
                          {order.type}
                        </span>
                        <span className="order-quantity">{order.quantity} shares</span>
                        <span className="order-time">{order.time}</span>
                      </div>
                    </div>
                    <div className="order-price">
                      <div className="price-value">{formatCurrency(order.price)}</div>
                      <div className="total-value">{formatCurrency(order.total)}</div>
                    </div>
                    <div className="order-status">
                      {order.status === 'completed' && <FiCheckCircle className="status-icon completed" />}
                      {order.status === 'pending' && <FiClock className="status-icon pending" />}
                      {order.status === 'cancelled' && <FiXCircle className="status-icon cancelled" />}
                      <span className={`status-text ${order.status}`}>{order.status}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Enhanced Order Modal - Note: Confirmation modal is handled at App level */}
        <OrderModal
          isOpen={showOrderModal || orderModalState.isOpen}
          onClose={() => {
            setShowOrderModal(false);
            closeOrderModal();
          }}
          stockData={orderModalData || orderModalState.stockData}
          initialOrderType={orderModalData?.initialOrderType || orderModalState.orderType}
          onOrderPlaced={() => {
            handleOrderPlaced();
            closeOrderModal();
          }}
          onShowConfirmation={null} // Trading page uses local modal, App level handles global confirmation
        />

        {/* Stock Context Menu */}
        <StockContextMenu
          isOpen={contextMenu.isOpen}
          position={contextMenu.position}
          stockData={contextMenu.stockData}
          onClose={closeContextMenu}
          onQuickBuy={quickBuy}
          onQuickSell={quickSell}
          onViewChart={(stock) => navigateToTrading(stock, 'buy')}
          onAddToWatchlist={(stock) => console.log('Add to watchlist:', stock.symbol)}
          onViewDetails={(stock) => console.log('View details:', stock.symbol)}
          hasHolding={contextMenu.stockData ? portfolioData.holdings.some(h => h.symbol === contextMenu.stockData.symbol) : false}
        />

        {/* Drag Confirmation Modal */}
        <DragConfirmModal
          isOpen={isDragModalOpen}
          onClose={closeDragConfirmation}
          onConfirm={processDragOrder}
          orderData={dragOrderData}
          loading={dragLoading}
        />

        {/* Slide to Buy Modal */}
        <SlideToBuy
          stockData={currentStock}
          isOpen={isOpen}
          onClose={closeSlideToBuy}
          defaultQuantity={defaultQuantity}
          onSuccess={() => {
            // Refresh portfolio data after successful purchase
            // portfolioData will be updated automatically by the context
          }}
        />
      </div>
    </div>
  );
};

export default Trading;
