import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiEye,
  FiPlus,
  FiRefreshCw,
  FiTrendingUp,
  FiTrendingDown,
  FiBarChart2,
  FiStar,
  FiFilter,
  FiActivity,
  FiArrowDown,
  FiX,
  FiBookmark,
  FiTrash2
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import WatchlistButton from '../components/trading/WatchlistButton';
import StockSearchPanel from '../components/StockSearchPanel';
import { useWatchlist } from '../hooks/useWatchlist';
import SearchInput from '../components/common/SearchInput';
import '../styles/watchlist.css';
import '../styles/watchlist-button.css';

const Watchlist = ({ user, theme }) => {
  const navigate = useNavigate();
  const {
    watchlists,
    loading,
    addToWatchlist,
    createWatchlist,
    refreshWatchlists,
    deleteWatchlist,
    loadingState,
    error,
    refreshingState
  } = useWatchlist();

  const [selectedWatchlistId, setSelectedWatchlistId] = useState('all');
  const [sortBy, setSortBy] = useState('symbol');
  const [sortOrder, setSortOrder] = useState('asc');
  const [localSearchQuery, setLocalSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newWatchlistName, setNewWatchlistName] = useState('');
  const [creating, setCreating] = useState(false);

  const currentWatchlist = useMemo(() => {
    if (!watchlists || watchlists.length === 0) {
      return { name: 'Unknown', stocks: [] };
    }
    if (selectedWatchlistId === 'all') {
      const allStocks = watchlists.reduce((acc, wl) => [...acc, ...(wl.stocks || [])], []);
      return { name: 'All Watchlists', stocks: allStocks, _id: 'all' };
    }
    return watchlists.find(wl => wl._id === selectedWatchlistId) || { name: 'Unknown', stocks: [] };
  }, [watchlists, selectedWatchlistId]);

  const filteredAndSortedStocks = useMemo(() => {
    let filtered = currentWatchlist.stocks || [];

    if (localSearchQuery) {
      const queryLower = localSearchQuery.toLowerCase();
      filtered = filtered.filter(stock =>
        stock.symbol?.toLowerCase().includes(queryLower) ||
        stock.name?.toLowerCase().includes(queryLower)
      );
    }

    return filtered.sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];

      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }

      const comparison = aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [currentWatchlist.stocks, localSearchQuery, sortBy, sortOrder]);

  const stats = useMemo(() => {
    const allStocks = currentWatchlist.stocks || [];
    return {
      gainers: allStocks.filter(stock => (stock.change || 0) > 0).length,
      losers: allStocks.filter(stock => (stock.change || 0) < 0).length,
      neutral: allStocks.filter(stock => (stock.change || 0) === 0).length
    };
  }, [currentWatchlist.stocks]);

  const getTotalStockCount = useCallback(() => {
    return watchlists.reduce((total, wl) => total + (wl.stocks?.length || 0), 0);
  }, [watchlists]);

  const handleRefresh = async () => {
    await refreshWatchlists();
  };

  const handleCreateWatchlist = async () => {
    if (!newWatchlistName.trim()) {
      toast.error('Watchlist name cannot be empty');
      return;
    }
    setCreating(true);
    await createWatchlist(newWatchlistName.trim());
    setNewWatchlistName('');
    setShowCreateModal(false);
    setCreating(false);
  };

  const handleAddStock = async (stock) => {
    if (selectedWatchlistId === 'all' || !selectedWatchlistId) {
      toast.warning('Please select a specific watchlist to add stocks to.');
      return;
    }
    await addToWatchlist(stock, selectedWatchlistId);
  };

  const handleDeleteWatchlist = async (watchlistId) => {
    if (window.confirm('Are you sure you want to delete this watchlist?')) {
      await deleteWatchlist(watchlistId);
      setSelectedWatchlistId('all');
    }
  };

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  useEffect(() => {
    if (watchlists.length > 0 && selectedWatchlistId === 'all') {
      setSelectedWatchlistId(watchlists[0]._id);
    }
  }, [watchlists, selectedWatchlistId]);

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
                className={`action-btn ${refreshingState ? 'loading' : ''}`}
                onClick={handleRefresh}
                disabled={refreshingState}
              >
                <FiRefreshCw className={refreshingState ? 'spinning' : ''} />
                {refreshingState ? 'Refreshing...' : 'Refresh'}
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
            <StockSearchPanel
              onStockSelect={handleAddStock}
              selectedStock={null}
              className="watchlist-stock-search"
            />

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
                    <span className="watchlist-name">{watchlist.name}</span>
                    <span className="tab-count">{watchlist.stocks?.length || 0}</span>
                    <button
                      className="delete-watchlist-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteWatchlist(watchlist._id);
                      }}
                      title="Delete Watchlist"
                    >
                      <FiTrash2 />
                    </button>
                  </button>
                ))}
              </div>
            </div>

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
                  disabled={refreshingState}
                >
                  <FiRefreshCw className={refreshingState ? 'spinning' : ''} />
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

            <div className="main-header">
              <div className="main-title">
                <h2>
                  <FiEye />
                  {currentWatchlist.name}
                </h2>
                <div className="main-controls">
                  <div className="sort-dropdown">
                    <button className="sort-btn">
                      <FiFilter />
                      Sort by {sortBy}
                      <FiArrowDown />
                    </button>
                  </div>
                </div>
              </div>

              <div className="search-section">
                <SearchInput
                  value={localSearchQuery}
                  onChange={setLocalSearchQuery}
                  placeholder="Search stocks in watchlist..."
                  className="watchlist-search"
                />
              </div>
            </div>

            <div className="stocks-section">
              {filteredAndSortedStocks.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">
                    <FiBookmark />
                  </div>
                  <h3>No stocks found</h3>
                  <p>
                    {localSearchQuery
                      ? `No stocks found matching "${localSearchQuery}" in this watchlist`
                      : currentWatchlist.stocks.length === 0
                        ? 'Start building your watchlist by adding stocks you want to track.'
                        : 'No stocks available in this list.'
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
                        <div className="stock-basic-info">
                          <div className="stock-symbol">{stock.symbol}</div>
                          <div className="stock-name">{stock.name}</div>
                        </div>
                      </div>
                      <div className="stock-price-inline">
                        <div className="stock-price-value">
                          ₹{(stock.price || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <div className={`stock-price-change ${
                          (stock.change || 0) > 0 ? 'positive' :
                            (stock.change || 0) < 0 ? 'negative' : 'neutral'
                        }`}>
                          {(stock.change || 0) >= 0 ? '+' : ''}{(stock.change || 0).toFixed(2)}
                          ({(stock.changePercent || 0).toFixed(2)}%)
                        </div>
                      </div>
                      <div className="stock-actions">
                        <WatchlistButton
                          stockData={stock}
                          size="small"
                          variant="simple"
                          showText={false}
                          onSuccess={(result, action) => {
                            toast.success(`${action === 'removed' ? 'Removed' : 'Added'} ${stock.symbol} ${action === 'removed' ? 'from' : 'to'} watchlist`);
                            refreshWatchlists();
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
    </div>
  );
};

export default Watchlist;