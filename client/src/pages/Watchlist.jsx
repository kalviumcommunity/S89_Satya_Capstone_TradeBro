import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiEye,
  FiPlus,
  FiSearch,
  FiRefreshCw,
  FiTrash2,
  FiEdit,
  FiMoreHorizontal,
  FiTrendingUp,
  FiTrendingDown,
  FiBarChart2,
  FiStar,
  FiFilter,
  FiActivity,
  FiGrid,
  FiList,
  FiArrowUp,
  FiArrowDown,
  FiX,
  FiShoppingCart,
  FiBookmark,
  FiTarget,
  FiPieChart
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import StockPrice from '../components/StockPrice';
import WatchlistButton from '../components/trading/WatchlistButton';
import SlideToBuy from '../components/trading/SlideToBuy';
import StockSearchPanel from '../components/StockSearchPanel';
import { usePortfolio } from '../contexts/PortfolioContext';
import { useWatchlist } from '../hooks/useWatchlist';
import { useSlideToBuy } from '../hooks/useSlideToBuy';
import { useStockSearch } from '../hooks/useSearch';
import SearchInput from '../components/common/SearchInput';
import { formatCurrency, formatNumber } from '../utils/formatters';
import '../styles/watchlist.css';
import '../styles/stock-search-panel.css';

const Watchlist = ({ user, theme }) => {
  const navigate = useNavigate();
  const { portfolioData } = usePortfolio();
  const { 
    watchlists, 
    loading, 
    isInWatchlist, 
    addToWatchlist, 
    removeFromWatchlist, 
    createWatchlist, 
    deleteWatchlist,
    refreshWatchlists 
  } = useWatchlist();

  // State management
  const [selectedWatchlistId, setSelectedWatchlistId] = useState('all');
  const [viewMode, setViewMode] = useState('list');
  const [sortBy, setSortBy] = useState('symbol');
  const [sortOrder, setSortOrder] = useState('asc');
  const [localSearchQuery, setLocalSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newWatchlistName, setNewWatchlistName] = useState('');
  const [newWatchlistDescription, setNewWatchlistDescription] = useState('');
  const [creating, setCreating] = useState(false);

  // Slide to buy functionality
  const { 
    isOpen, 
    currentStock, 
    defaultQuantity, 
    openSlideToBuy, 
    closeSlideToBuy 
  } = useSlideToBuy();

  // Get current watchlist
  const currentWatchlist = useMemo(() => {
    if (selectedWatchlistId === 'all') {
      const allStocks = watchlists.reduce((acc, wl) => {
        return [...acc, ...(wl.stocks || [])];
      }, []);
      return { name: 'All Watchlists', stocks: allStocks };
    }
    return watchlists.find(wl => wl._id === selectedWatchlistId) || { name: 'Unknown', stocks: [] };
  }, [watchlists, selectedWatchlistId]);

  // Filter and sort stocks
  const filteredAndSortedStocks = useMemo(() => {
    let filtered = currentWatchlist.stocks || [];
    
    if (localSearchQuery) {
      filtered = filtered.filter(stock =>
        stock.symbol.toLowerCase().includes(localSearchQuery.toLowerCase()) ||
        stock.name.toLowerCase().includes(localSearchQuery.toLowerCase())
      );
    }

    return filtered.sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];
      
      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }
      
      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });
  }, [currentWatchlist.stocks, localSearchQuery, sortBy, sortOrder]);

  // Stats calculation
  const stats = useMemo(() => {
    const allStocks = currentWatchlist.stocks || [];
    return {
      gainers: allStocks.filter(stock => (stock.change || 0) > 0).length,
      losers: allStocks.filter(stock => (stock.change || 0) < 0).length,
      neutral: allStocks.filter(stock => (stock.change || 0) === 0).length
    };
  }, [currentWatchlist.stocks]);

  // Get total stock count
  const getTotalStockCount = () => {
    return watchlists.reduce((total, wl) => total + (wl.stocks?.length || 0), 0);
  };

  // Handle sort
  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshWatchlists();
      toast.success('Watchlists refreshed successfully');
    } catch (error) {
      toast.error('Failed to refresh watchlists');
    } finally {
      setRefreshing(false);
    }
  };

  // Handle create watchlist
  const handleCreateWatchlist = async () => {
    if (!newWatchlistName.trim()) return;
    
    setCreating(true);
    try {
      await createWatchlist({
        name: newWatchlistName.trim(),
        description: newWatchlistDescription.trim()
      });
      setNewWatchlistName('');
      setNewWatchlistDescription('');
      setShowCreateModal(false);
      toast.success('Watchlist created successfully');
    } catch (error) {
      toast.error('Failed to create watchlist');
    } finally {
      setCreating(false);
    }
  };

  // Handle add stock
  const handleAddStock = async (symbol) => {
    if (selectedWatchlistId === 'all') {
      toast.warning('Please select a specific watchlist to add stocks');
      return;
    }
    
    try {
      await addToWatchlist(selectedWatchlistId, symbol);
      toast.success(`Added ${symbol} to watchlist`);
    } catch (error) {
      toast.error('Failed to add stock to watchlist');
    }
  };

  // Set initial watchlist
  useEffect(() => {
    if (watchlists.length > 0 && selectedWatchlistId === 'all') {
      setSelectedWatchlistId(watchlists[0]._id);
    }
  }, [watchlists]);

  if (loading) {
    return (
      <div className="watchlist-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading watchlists...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="watchlist-page">
      <div className="watchlist-container">
        {/* Header Section */}
        <motion.div
          className="watchlist-header"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="watchlist-header-top">
            <div className="header-left">
              <div className="header-icon">
                <FiEye />
              </div>
              <div className="header-text">
                <h1>My Watchlists</h1>
                <p>Track and manage your favorite stocks</p>
              </div>
            </div>
            <div className="header-actions">
              <button
                className={`action-btn ${refreshing ? 'loading' : ''}`}
                onClick={handleRefresh}
                disabled={refreshing}
              >
                <FiRefreshCw className={refreshing ? 'spinning' : ''} />
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </button>
              <button
                className="action-btn primary"
                onClick={() => setShowCreateModal(true)}
              >
                <FiPlus />
                New Watchlist
              </button>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="stats-overview">
            <div className="stat-card">
              <div className="stat-icon">
                <FiBarChart2 />
              </div>
              <div className="stat-content">
                <div className="stat-value">{getTotalStockCount()}</div>
                <div className="stat-label">Total Stocks</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon positive">
                <FiTrendingUp />
              </div>
              <div className="stat-content">
                <div className="stat-value">{stats.gainers}</div>
                <div className="stat-label">Gainers</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon negative">
                <FiTrendingDown />
              </div>
              <div className="stat-content">
                <div className="stat-value">{stats.losers}</div>
                <div className="stat-label">Losers</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">
                <FiStar />
              </div>
              <div className="stat-content">
                <div className="stat-value">{watchlists.length}</div>
                <div className="stat-label">Watchlists</div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Main Content Layout */}
        <div className="watchlist-content">
          {/* Sidebar */}
          <motion.div
            className="watchlist-sidebar"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            {/* Stock Search Panel */}
            <StockSearchPanel
              onStockSelect={(stock) => {
                console.log('🎯 Selected stock from panel:', stock);
                handleAddStock(stock.symbol || stock);
              }}
              selectedStock={null}
              className="watchlist-stock-search"
            />

            {/* Watchlist Management */}
            <div className="sidebar-section">
              <h3>My Watchlists</h3>
              <div className="watchlist-list">
                <button
                  className={`watchlist-tab ${selectedWatchlistId === 'all' ? 'active' : ''}`}
                  onClick={() => setSelectedWatchlistId('all')}
                >
                  <FiActivity />
                  All Watchlists
                  <span className="tab-count">{getTotalStockCount()}</span>
                </button>
                {watchlists.map((watchlist) => (
                  <button
                    key={watchlist._id}
                    className={`watchlist-tab ${selectedWatchlistId === watchlist._id ? 'active' : ''}`}
                    onClick={() => setSelectedWatchlistId(watchlist._id)}
                  >
                    <FiBookmark />
                    {watchlist.name}
                    <span className="tab-count">{watchlist.stocks?.length || 0}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="sidebar-section">
              <h3>Quick Actions</h3>
              <div className="quick-actions">
                <button
                  className="action-btn"
                  onClick={() => setShowCreateModal(true)}
                >
                  <FiPlus />
                  New Watchlist
                </button>
                <button
                  className="action-btn"
                  onClick={handleRefresh}
                  disabled={refreshing}
                >
                  <FiRefreshCw className={refreshing ? 'spinning' : ''} />
                  Refresh Data
                </button>
              </div>
            </div>
          </motion.div>

          {/* Main Content Area */}
          <motion.div
            className="watchlist-main"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {/* Watchlist Tabs */}
            <div className="watchlist-tabs">
              <button
                className={`watchlist-tab ${selectedWatchlistId === 'all' ? 'active' : ''}`}
                onClick={() => setSelectedWatchlistId('all')}
              >
                <FiActivity />
                All Watchlists
                <span className="tab-count">{getTotalStockCount()}</span>
              </button>
              {watchlists.map((watchlist) => (
                <button
                  key={watchlist._id}
                  className={`watchlist-tab ${selectedWatchlistId === watchlist._id ? 'active' : ''}`}
                  onClick={() => setSelectedWatchlistId(watchlist._id)}
                >
                  <FiBookmark />
                  {watchlist.name}
                  <span className="tab-count">{watchlist.stocks?.length || 0}</span>
                </button>
              ))}
            </div>

            {/* Search and Controls */}
            <div className="main-header">
              <div className="main-title">
                <h2>
                  <FiEye />
                  {currentWatchlist.name}
                </h2>
                <div className="main-controls">
                  <div className="view-toggle" data-active={viewMode}>
                    <button
                      className={viewMode === 'list' ? 'active' : ''}
                      onClick={() => setViewMode('list')}
                    >
                      <FiList />
                      List
                    </button>
                    <button
                      className={viewMode === 'grid' ? 'active' : ''}
                      onClick={() => setViewMode('grid')}
                    >
                      <FiGrid />
                      Grid
                    </button>
                  </div>
                  <div className="sort-dropdown">
                    <button className="sort-btn">
                      <FiFilter />
                      Sort by {sortBy}
                      <FiArrowDown />
                    </button>
                  </div>
                </div>
              </div>

              {/* Local Search */}
              <div className="search-section">
                <SearchInput
                  value={localSearchQuery}
                  onChange={setLocalSearchQuery}
                  placeholder="Search stocks in watchlist..."
                  className="watchlist-search"
                />
              </div>
            </div>

            {/* Stocks Display */}
            <div className="stocks-section">
              {filteredAndSortedStocks.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">
                    <FiBookmark />
                  </div>
                  <h3>No stocks found</h3>
                  <p>
                    {localSearchQuery
                      ? `No stocks found matching "${localSearchQuery}" in your watchlist`
                      : currentWatchlist.stocks.length === 0
                        ? 'Start building your watchlist by adding stocks you want to track'
                        : 'Use the search above to add new stocks to your watchlist'
                    }
                  </p>
                  {!localSearchQuery && currentWatchlist.stocks.length === 0 && (
                    <button
                      className="action-btn primary"
                      onClick={() => setShowCreateModal(true)}
                    >
                      <FiPlus />
                      Add Your First Stock
                    </button>
                  )}
                </div>
              ) : (
                <div className="stock-list">
                  {filteredAndSortedStocks.map((stock, index) => (
                    <motion.div
                      key={stock.symbol}
                      className="stock-item"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.03 }}
                      onClick={() => navigate(`/stock/${stock.symbol}`)}
                    >
                      <div className="stock-info">
                        <div className="stock-symbol">{stock.symbol}</div>
                        <div className="stock-name">{stock.name}</div>
                      </div>
                      <div className="stock-price">
                        <StockPrice
                          symbol={stock.symbol}
                          showChange={true}
                          size="medium"
                        />
                      </div>
                      <div className="stock-actions">
                        <WatchlistButton
                          stockData={stock}
                          size="small"
                          variant="simple"
                          showText={false}
                          onSuccess={(result, action) => {
                            if (action === 'removed') {
                              toast.success(`Removed ${stock.symbol} from watchlist`);
                              // Refresh watchlists to update the UI
                              refreshWatchlists();
                            } else if (action === 'added') {
                              toast.success(`Added ${stock.symbol} to watchlist`);
                              refreshWatchlists();
                            }
                          }}
                          onError={(message) => {
                            toast.error(message || 'Failed to update watchlist');
                          }}
                        />
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Create Watchlist Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              className="modal-content"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h3>Create New Watchlist</h3>
                <button
                  className="close-btn"
                  onClick={() => setShowCreateModal(false)}
                >
                  <FiX />
                </button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label htmlFor="watchlist-name">Watchlist Name</label>
                  <input
                    id="watchlist-name"
                    type="text"
                    value={newWatchlistName}
                    onChange={(e) => setNewWatchlistName(e.target.value)}
                    placeholder="Enter watchlist name..."
                    className="form-input"
                    autoFocus
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  className="action-btn"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="action-btn primary"
                  onClick={handleCreateWatchlist}
                  disabled={!newWatchlistName.trim() || creating}
                >
                  {creating ? (
                    <>
                      <FiRefreshCw className="spinning" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <FiPlus />
                      Create Watchlist
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Slide to Buy Modal */}
      <SlideToBuy
        stockData={currentStock}
        isOpen={isOpen}
        onClose={closeSlideToBuy}
        defaultQuantity={defaultQuantity}
        onSuccess={() => {
          // Refresh data after successful purchase
        }}
      />
    </div>
  );
};

export default Watchlist;
