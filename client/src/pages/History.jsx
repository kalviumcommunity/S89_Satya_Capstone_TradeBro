import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiClock,
  FiTrendingUp,
  FiTrendingDown,
  FiFilter,
  FiDownload,
  FiCalendar,
  FiSearch,
  FiX,
  FiArrowUp,
  FiArrowDown,
  FiRefreshCw,
  FiBarChart2,
  FiDollarSign,
  FiActivity,
  FiTarget,
  FiCheckCircle,
  FiXCircle,
  FiAlertCircle,
  FiEye,
  FiMoreHorizontal
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import StockPrice from '../components/StockPrice';
import { usePortfolio } from '../contexts/PortfolioContext';
import { formatCurrency, formatNumber, formatDate } from '../utils/formatters';
import '../styles/history.css';

const History = ({ user, theme }) => {
  const navigate = useNavigate();
  const { portfolioData, getTransactionHistory } = usePortfolio();

  // State management
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all', 'buy', 'sell'
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'completed', 'pending', 'failed'
  const [dateRange, setDateRange] = useState('all'); // 'all', 'today', 'week', 'month', 'year'
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Mock transaction data (replace with real API data)
  const mockTransactions = [
    {
      id: 'txn_001',
      type: 'buy',
      symbol: 'RELIANCE',
      name: 'Reliance Industries Ltd',
      quantity: 10,
      price: 2847.65,
      totalAmount: 28476.50,
      fees: 14.24,
      netAmount: 28490.74,
      status: 'completed',
      timestamp: new Date('2024-01-15T10:30:00'),
      orderId: 'ORD_001',
      exchange: 'NSE',
      sector: 'Energy'
    },
    {
      id: 'txn_002',
      type: 'sell',
      symbol: 'TCS',
      name: 'Tata Consultancy Services',
      quantity: 5,
      price: 3892.40,
      totalAmount: 19462.00,
      fees: 9.73,
      netAmount: 19452.27,
      status: 'completed',
      timestamp: new Date('2024-01-14T14:45:00'),
      orderId: 'ORD_002',
      exchange: 'NSE',
      sector: 'IT',
      gainLoss: 1847.30,
      gainLossPercent: 10.5
    },
    {
      id: 'txn_003',
      type: 'buy',
      symbol: 'HDFC',
      name: 'HDFC Bank Ltd',
      quantity: 15,
      price: 1734.85,
      totalAmount: 26022.75,
      fees: 13.01,
      netAmount: 26035.76,
      status: 'pending',
      timestamp: new Date('2024-01-13T09:15:00'),
      orderId: 'ORD_003',
      exchange: 'NSE',
      sector: 'Banking'
    },
    {
      id: 'txn_004',
      type: 'buy',
      symbol: 'INFY',
      name: 'Infosys Ltd',
      quantity: 8,
      price: 1456.20,
      totalAmount: 11649.60,
      fees: 5.82,
      netAmount: 11655.42,
      status: 'completed',
      timestamp: new Date('2024-01-12T11:20:00'),
      orderId: 'ORD_004',
      exchange: 'NSE',
      sector: 'IT'
    },
    {
      id: 'txn_005',
      type: 'sell',
      symbol: 'WIPRO',
      name: 'Wipro Ltd',
      quantity: 20,
      price: 432.85,
      totalAmount: 8657.00,
      fees: 4.33,
      netAmount: 8652.67,
      status: 'failed',
      timestamp: new Date('2024-01-11T16:30:00'),
      orderId: 'ORD_005',
      exchange: 'NSE',
      sector: 'IT',
      gainLoss: -245.80,
      gainLossPercent: -2.8,
      failureReason: 'Insufficient shares'
    }
  ];

  // Load transaction history
  useEffect(() => {
    const loadTransactions = async () => {
      setLoading(true);
      try {
        // In real app, this would fetch from API
        // const history = await getTransactionHistory();
        // setTransactions(history);
        
        // For now, use mock data
        setTimeout(() => {
          setTransactions(mockTransactions);
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Error loading transaction history:', error);
        toast.error('Failed to load transaction history');
        setLoading(false);
      }
    };

    loadTransactions();
  }, []);

  // Filter and sort transactions
  const filteredAndSortedTransactions = useMemo(() => {
    let filtered = [...transactions];

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(txn => 
        txn.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        txn.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        txn.orderId.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(txn => txn.type === filterType);
    }

    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(txn => txn.status === filterStatus);
    }

    // Apply date range filter
    if (dateRange !== 'all') {
      const now = new Date();
      const startDate = new Date();
      
      switch (dateRange) {
        case 'today':
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(now.getMonth() - 1);
          break;
        case 'year':
          startDate.setFullYear(now.getFullYear() - 1);
          break;
      }
      
      filtered = filtered.filter(txn => txn.timestamp >= startDate);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'date':
          aValue = a.timestamp;
          bValue = b.timestamp;
          break;
        case 'symbol':
          aValue = a.symbol;
          bValue = b.symbol;
          break;
        case 'amount':
          aValue = a.totalAmount;
          bValue = b.totalAmount;
          break;
        case 'quantity':
          aValue = a.quantity;
          bValue = b.quantity;
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        default:
          aValue = a.timestamp;
          bValue = b.timestamp;
      }

      if (aValue instanceof Date && bValue instanceof Date) {
        return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
      } else if (typeof aValue === 'string') {
        return sortOrder === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      } else {
        return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
      }
    });

    return filtered;
  }, [transactions, searchQuery, filterType, filterStatus, dateRange, sortBy, sortOrder]);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalTransactions = filteredAndSortedTransactions.length;
    const completedTransactions = filteredAndSortedTransactions.filter(t => t.status === 'completed');
    const buyTransactions = completedTransactions.filter(t => t.type === 'buy');
    const sellTransactions = completedTransactions.filter(t => t.type === 'sell');
    
    const totalBuyAmount = buyTransactions.reduce((sum, t) => sum + t.totalAmount, 0);
    const totalSellAmount = sellTransactions.reduce((sum, t) => sum + t.totalAmount, 0);
    const totalFees = completedTransactions.reduce((sum, t) => sum + (t.fees || 0), 0);
    
    const totalGainLoss = sellTransactions.reduce((sum, t) => sum + (t.gainLoss || 0), 0);
    
    return {
      totalTransactions,
      completedTransactions: completedTransactions.length,
      buyTransactions: buyTransactions.length,
      sellTransactions: sellTransactions.length,
      totalBuyAmount,
      totalSellAmount,
      totalFees,
      totalGainLoss,
      successRate: totalTransactions > 0 ? (completedTransactions.length / totalTransactions) * 100 : 0
    };
  }, [filteredAndSortedTransactions]);

  // Event handlers
  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    // Simulate refresh
    setTimeout(() => {
      setRefreshing(false);
      toast.success('Transaction history refreshed!');
    }, 1000);
  };

  const handleExport = () => {
    // Export functionality
    toast.info('Export feature coming soon!');
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <FiCheckCircle className="status-icon completed" />;
      case 'pending':
        return <FiAlertCircle className="status-icon pending" />;
      case 'failed':
        return <FiXCircle className="status-icon failed" />;
      default:
        return <FiClock className="status-icon" />;
    }
  };

  const getTypeIcon = (type) => {
    return type === 'buy' 
      ? <FiTrendingUp className="type-icon buy" />
      : <FiTrendingDown className="type-icon sell" />;
  };

  // Loading state
  if (loading) {
    return (
      <div className="history-page">
        <div className="history-container">
          <div className="loading-container">
            <div className="loading-spinner" />
            <p>Loading transaction history...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="history-page">
      {/* Header Section */}
      <div className="history-header">
        <div className="header-content">
          <div className="header-left">
            <div className="header-icon">
              <FiClock />
            </div>
            <div className="header-text">
              <h1>Transaction History</h1>
              <p>Track all your trading activities and portfolio changes</p>
            </div>
          </div>
          <div className="header-actions">
            <button
              className={`action-btn ${showFilters ? 'active' : ''}`}
              onClick={() => setShowFilters(!showFilters)}
            >
              <FiFilter />
              Filters
            </button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="stats-overview">
          <div className="stat-card">
            <div className="stat-icon">
              <FiActivity />
            </div>
            <div className="stat-content">
              <div className="stat-value">{stats.totalTransactions}</div>
              <div className="stat-label">Total Transactions</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon positive">
              <FiTrendingUp />
            </div>
            <div className="stat-content">
              <div className="stat-value">{formatCurrency(stats.totalBuyAmount)}</div>
              <div className="stat-label">Total Invested</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon negative">
              <FiTrendingDown />
            </div>
            <div className="stat-content">
              <div className="stat-value">{formatCurrency(stats.totalSellAmount)}</div>
              <div className="stat-label">Total Sold</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <FiTarget />
            </div>
            <div className="stat-content">
              <div className="stat-value">{stats.successRate.toFixed(1)}%</div>
              <div className="stat-label">Success Rate</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="history-container">
        {/* Filters Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              className="filters-panel"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="filters-content">
                <div className="filter-group">
                  <label>Search</label>
                  <div className="search-wrapper">
                    <FiSearch className="search-icon" />
                    <input
                      type="text"
                      placeholder="Search by symbol, name, or order ID..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="search-input"
                    />
                    {searchQuery && (
                      <button
                        className="clear-search"
                        onClick={() => setSearchQuery('')}
                      >
                        <FiX />
                      </button>
                    )}
                  </div>
                </div>

                <div className="filter-group">
                  <label>Transaction Type</label>
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="filter-select"
                  >
                    <option value="all">All Types</option>
                    <option value="buy">Buy Orders</option>
                    <option value="sell">Sell Orders</option>
                  </select>
                </div>

                <div className="filter-group">
                  <label>Status</label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="filter-select"
                  >
                    <option value="all">All Status</option>
                    <option value="completed">Completed</option>
                    <option value="pending">Pending</option>
                    <option value="failed">Failed</option>
                  </select>
                </div>

                <div className="filter-group">
                  <label>Date Range</label>
                  <select
                    value={dateRange}
                    onChange={(e) => setDateRange(e.target.value)}
                    className="filter-select"
                  >
                    <option value="all">All Time</option>
                    <option value="today">Today</option>
                    <option value="week">Last 7 Days</option>
                    <option value="month">Last Month</option>
                    <option value="year">Last Year</option>
                  </select>
                </div>

                <div className="filter-actions">
                  <button
                    className="clear-filters-btn"
                    onClick={() => {
                      setSearchQuery('');
                      setFilterType('all');
                      setFilterStatus('all');
                      setDateRange('all');
                    }}
                  >
                    Clear All
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Transactions Table */}
        <div className="transactions-section">
          {filteredAndSortedTransactions.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                <FiClock />
              </div>
              <h3>No transactions found</h3>
              <p>
                {searchQuery || filterType !== 'all' || filterStatus !== 'all' || dateRange !== 'all'
                  ? 'No transactions match your current filters'
                  : 'Start trading to see your transaction history here'
                }
              </p>
              {(searchQuery || filterType !== 'all' || filterStatus !== 'all' || dateRange !== 'all') && (
                <button
                  className="clear-filters-btn"
                  onClick={() => {
                    setSearchQuery('');
                    setFilterType('all');
                    setFilterStatus('all');
                    setDateRange('all');
                  }}
                >
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <div className="transactions-table">
              <div className="table-header">
                <div className="table-row header">
                  <div
                    className="col-date sortable"
                    onClick={() => handleSort('date')}
                  >
                    Date & Time
                    {sortBy === 'date' && (
                      sortOrder === 'asc' ? <FiArrowUp /> : <FiArrowDown />
                    )}
                  </div>
                  <div
                    className="col-stock sortable"
                    onClick={() => handleSort('symbol')}
                  >
                    Stock
                    {sortBy === 'symbol' && (
                      sortOrder === 'asc' ? <FiArrowUp /> : <FiArrowDown />
                    )}
                  </div>
                  <div className="col-type">Type</div>
                  <div
                    className="col-quantity sortable"
                    onClick={() => handleSort('quantity')}
                  >
                    Quantity
                    {sortBy === 'quantity' && (
                      sortOrder === 'asc' ? <FiArrowUp /> : <FiArrowDown />
                    )}
                  </div>
                  <div className="col-price">Price</div>
                  <div
                    className="col-amount sortable"
                    onClick={() => handleSort('amount')}
                  >
                    Total Amount
                    {sortBy === 'amount' && (
                      sortOrder === 'asc' ? <FiArrowUp /> : <FiArrowDown />
                    )}
                  </div>
                  <div className="col-gain-loss">Gain/Loss</div>
                  <div
                    className="col-status sortable"
                    onClick={() => handleSort('status')}
                  >
                    Status
                    {sortBy === 'status' && (
                      sortOrder === 'asc' ? <FiArrowUp /> : <FiArrowDown />
                    )}
                  </div>
                  <div className="col-actions">Actions</div>
                </div>
              </div>

              <div className="table-body">
                {filteredAndSortedTransactions.map((transaction, index) => (
                  <motion.div
                    key={transaction.id}
                    className="table-row clickable"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    onClick={() => setSelectedTransaction(transaction)}
                  >
                    <div className="col-date">
                      <div className="date-info">
                        <span className="date">{formatDate(transaction.timestamp, 'MMM DD, YYYY')}</span>
                        <span className="time">{formatDate(transaction.timestamp, 'HH:mm')}</span>
                      </div>
                    </div>
                    <div className="col-stock">
                      <div className="stock-info">
                        <span className="symbol">{transaction.symbol}</span>
                        <span className="name">{transaction.name}</span>
                        <span className="exchange">{transaction.exchange}</span>
                      </div>
                    </div>
                    <div className="col-type">
                      <div className={`type-badge ${transaction.type}`}>
                        {getTypeIcon(transaction.type)}
                        <span>{transaction.type.toUpperCase()}</span>
                      </div>
                    </div>
                    <div className="col-quantity">
                      <span className="quantity">{formatNumber(transaction.quantity)}</span>
                    </div>
                    <div className="col-price">
                      <span className="price">{formatCurrency(transaction.price)}</span>
                    </div>
                    <div className="col-amount">
                      <div className="amount-info">
                        <span className="total">{formatCurrency(transaction.totalAmount)}</span>
                        <span className="fees">Fees: {formatCurrency(transaction.fees || 0)}</span>
                      </div>
                    </div>
                    <div className="col-gain-loss">
                      {transaction.gainLoss !== undefined ? (
                        <div className={`gain-loss ${transaction.gainLoss >= 0 ? 'positive' : 'negative'}`}>
                          <span className="amount">
                            {transaction.gainLoss >= 0 ? '+' : ''}{formatCurrency(transaction.gainLoss)}
                          </span>
                          <span className="percent">
                            ({transaction.gainLoss >= 0 ? '+' : ''}{transaction.gainLossPercent?.toFixed(2)}%)
                          </span>
                        </div>
                      ) : (
                        <span className="no-data">-</span>
                      )}
                    </div>
                    <div className="col-status">
                      <div className={`status-badge ${transaction.status}`}>
                        {getStatusIcon(transaction.status)}
                        <span>{transaction.status}</span>
                      </div>
                    </div>
                    <div className="col-actions">
                      <button
                        className="action-btn-small"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTransaction(transaction);
                        }}
                        title="View Details"
                      >
                        <FiEye />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Transaction Detail Modal */}
      <AnimatePresence>
        {selectedTransaction && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedTransaction(null)}
          >
            <motion.div
              className="modal-content transaction-detail-modal"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h3>Transaction Details</h3>
                <button
                  className="modal-close"
                  onClick={() => setSelectedTransaction(null)}
                >
                  <FiX />
                </button>
              </div>
              <div className="modal-body">
                <div className="transaction-details">
                  <div className="detail-section">
                    <h4>Basic Information</h4>
                    <div className="detail-grid">
                      <div className="detail-item">
                        <label>Transaction ID</label>
                        <span>{selectedTransaction.id}</span>
                      </div>
                      <div className="detail-item">
                        <label>Order ID</label>
                        <span>{selectedTransaction.orderId}</span>
                      </div>
                      <div className="detail-item">
                        <label>Date & Time</label>
                        <span>{formatDate(selectedTransaction.timestamp, 'MMM DD, YYYY HH:mm:ss')}</span>
                      </div>
                      <div className="detail-item">
                        <label>Status</label>
                        <div className={`status-badge ${selectedTransaction.status}`}>
                          {getStatusIcon(selectedTransaction.status)}
                          <span>{selectedTransaction.status}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="detail-section">
                    <h4>Stock Information</h4>
                    <div className="detail-grid">
                      <div className="detail-item">
                        <label>Symbol</label>
                        <span>{selectedTransaction.symbol}</span>
                      </div>
                      <div className="detail-item">
                        <label>Company Name</label>
                        <span>{selectedTransaction.name}</span>
                      </div>
                      <div className="detail-item">
                        <label>Exchange</label>
                        <span>{selectedTransaction.exchange}</span>
                      </div>
                      <div className="detail-item">
                        <label>Sector</label>
                        <span>{selectedTransaction.sector}</span>
                      </div>
                    </div>
                  </div>

                  <div className="detail-section">
                    <h4>Transaction Details</h4>
                    <div className="detail-grid">
                      <div className="detail-item">
                        <label>Type</label>
                        <div className={`type-badge ${selectedTransaction.type}`}>
                          {getTypeIcon(selectedTransaction.type)}
                          <span>{selectedTransaction.type.toUpperCase()}</span>
                        </div>
                      </div>
                      <div className="detail-item">
                        <label>Quantity</label>
                        <span>{formatNumber(selectedTransaction.quantity)} shares</span>
                      </div>
                      <div className="detail-item">
                        <label>Price per Share</label>
                        <span>{formatCurrency(selectedTransaction.price)}</span>
                      </div>
                      <div className="detail-item">
                        <label>Total Amount</label>
                        <span>{formatCurrency(selectedTransaction.totalAmount)}</span>
                      </div>
                      <div className="detail-item">
                        <label>Fees & Charges</label>
                        <span>{formatCurrency(selectedTransaction.fees || 0)}</span>
                      </div>
                      <div className="detail-item">
                        <label>Net Amount</label>
                        <span className="net-amount">{formatCurrency(selectedTransaction.netAmount)}</span>
                      </div>
                    </div>
                  </div>

                  {selectedTransaction.gainLoss !== undefined && (
                    <div className="detail-section">
                      <h4>Performance</h4>
                      <div className="detail-grid">
                        <div className="detail-item">
                          <label>Gain/Loss Amount</label>
                          <span className={`gain-loss ${selectedTransaction.gainLoss >= 0 ? 'positive' : 'negative'}`}>
                            {selectedTransaction.gainLoss >= 0 ? '+' : ''}{formatCurrency(selectedTransaction.gainLoss)}
                          </span>
                        </div>
                        <div className="detail-item">
                          <label>Gain/Loss Percentage</label>
                          <span className={`gain-loss ${selectedTransaction.gainLoss >= 0 ? 'positive' : 'negative'}`}>
                            {selectedTransaction.gainLoss >= 0 ? '+' : ''}{selectedTransaction.gainLossPercent?.toFixed(2)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedTransaction.status === 'failed' && selectedTransaction.failureReason && (
                    <div className="detail-section">
                      <h4>Failure Information</h4>
                      <div className="failure-reason">
                        <FiXCircle className="failure-icon" />
                        <span>{selectedTransaction.failureReason}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <button
                  className="btn secondary"
                  onClick={() => setSelectedTransaction(null)}
                >
                  Close
                </button>
                <button
                  className="btn primary"
                  onClick={() => navigate(`/stock/${selectedTransaction.symbol}`)}
                >
                  View Stock
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default History;
