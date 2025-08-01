import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FiShoppingCart,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiRefreshCw,
  FiFilter,
  FiDownload,
  FiSearch,
  FiCalendar,
  FiTrendingUp,
  FiTrendingDown,
  FiMoreHorizontal,
  FiEdit,
  FiTrash2,
  FiActivity
} from 'react-icons/fi';
import StockPrice from '../components/StockPrice';
import PageHeader from '../components/layout/PageHeader';
import { usePortfolio } from '../contexts/PortfolioContext';
import { useOrderSearch } from '../hooks/useSearch';
import SearchInput from '../components/common/SearchInput';
import '../styles/orders.css';

const Orders = ({ user, theme }) => {
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const { portfolioData } = usePortfolio();

  // Order search functionality
  const {
    query: searchQuery,
    setQuery: setSearchQuery,
    results: searchResults,
    recentSearches,
    showHistory,
    handleHistoryClick,
    loading: searchLoading,
    clearSearch,
    hasResults
  } = useOrderSearch({
    enableSuggestions: false,
    enableHistory: true,
    limit: 50,
    debounceMs: 300,
    filters: {
      status: statusFilter !== 'all' ? statusFilter : null,
      type: typeFilter !== 'all' ? typeFilter : null
    }
  });

  // Use real transaction data
  const orders = portfolioData.transactions || [];

  // Order status options
  const statusOptions = [
    { id: 'all', name: 'All Orders', count: 25 },
    { id: 'pending', name: 'Pending', count: 3 },
    { id: 'completed', name: 'Completed', count: 18 },
    { id: 'cancelled', name: 'Cancelled', count: 4 }
  ];

  // Order type options
  const typeOptions = [
    { id: 'all', name: 'All Types' },
    { id: 'buy', name: 'Buy Orders' },
    { id: 'sell', name: 'Sell Orders' }
  ];

  // Orders data is now coming from portfolioData.transactions

  const handleRefresh = async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setRefreshing(false);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <FiCheckCircle className="status-icon completed" />;
      case 'pending':
        return <FiClock className="status-icon pending" />;
      case 'cancelled':
        return <FiXCircle className="status-icon cancelled" />;
      default:
        return <FiClock className="status-icon" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return '#10B981';
      case 'pending':
        return '#F59E0B';
      case 'cancelled':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-IN'),
      time: date.toLocaleTimeString('en-IN', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    };
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         order.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         order.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const matchesType = typeFilter === 'all' || order.type.toLowerCase() === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  return (
    <div className="orders-page">
      {/* Page Header */}
      <PageHeader
        icon={FiShoppingCart}
        title="Orders"
        subtitle="Track and manage your trading orders"
        borderColor="warning"
        actions={[
          {
            label: "Refresh",
            icon: FiRefreshCw,
            onClick: handleRefresh,
            variant: "secondary",
            disabled: refreshing
          },
          {
            label: "Export",
            icon: FiDownload,
            onClick: () => {},
            variant: "outline"
          }
        ]}
      />

      <div className="orders-container">

        {/* Orders Controls */}
        <motion.div
          className="orders-controls"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <div className="controls-left">
            <div className="search-container">
              <SearchInput
                placeholder="Search orders by stock symbol..."
                value={searchQuery}
                onChange={setSearchQuery}
                onClear={clearSearch}
                recentSearches={recentSearches}
                onHistoryClick={handleHistoryClick}
                showHistory={showHistory}
                loading={searchLoading}
                size="md"
                showSuggestions={false}
                enableHistory={true}
                className="orders-search-input"
              />
            </div>
            <div className="filter-group">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="filter-select"
              >
                {statusOptions.map(option => (
                  <option key={option.id} value={option.id}>
                    {option.name} ({option.count})
                  </option>
                ))}
              </select>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="filter-select"
              >
                {typeOptions.map(option => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="controls-right">
            <button className="btn-premium btn-ghost">
              <FiFilter size={16} />
              More Filters
            </button>
          </div>
        </motion.div>

        {/* Orders Table */}
        <motion.div
          className="orders-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="card-header">
            <h3 className="card-title">
              <FiShoppingCart className="card-icon" />
              Order History ({filteredOrders.length})
            </h3>
          </div>
          <div className="card-content">
            <div className="orders-table">
              <div className="table-header">
                <div className="col-order">Order Details</div>
                <div className="col-type">Type</div>
                <div className="col-quantity">Quantity</div>
                <div className="col-price">Price</div>
                <div className="col-total">Total</div>
                <div className="col-status">Status</div>
                <div className="col-time">Time</div>
                <div className="col-actions">Actions</div>
              </div>
              <div className="table-body">
                {filteredOrders.map((order, index) => {
                  const dateTime = formatDateTime(order.timestamp);
                  return (
                    <motion.div
                      key={order.id}
                      className="table-row"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                    >
                      <div className="col-order">
                        <div className="order-info">
                          <div className="order-id">#{order.id}</div>
                          <div className="stock-symbol">{order.symbol}</div>
                          <div className="stock-name">{order.name}</div>
                        </div>
                      </div>
                      <div className="col-type">
                        <div className={`order-type ${order.type.toLowerCase()}`}>
                          {order.type === 'BUY' ? <FiTrendingUp size={14} /> : <FiTrendingDown size={14} />}
                          {order.type}
                        </div>
                        <div className="order-subtype">{order.orderType}</div>
                      </div>
                      <div className="col-quantity">{order.quantity}</div>
                      <div className="col-price">
                        <div className="price-info">
                          <div className="order-price">{formatCurrency(order.price)}</div>
                          {order.executedPrice && order.executedPrice !== order.price && (
                            <div className="executed-price">
                              Exec: {formatCurrency(order.executedPrice)}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="col-total">
                        <div className="total-amount">{formatCurrency(order.total)}</div>
                        {order.fees > 0 && (
                          <div className="fees">Fees: {formatCurrency(order.fees)}</div>
                        )}
                      </div>
                      <div className="col-status">
                        <div className="status-container">
                          {getStatusIcon(order.status)}
                          <span 
                            className={`status-text ${order.status}`}
                            style={{ color: getStatusColor(order.status) }}
                          >
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </span>
                        </div>
                      </div>
                      <div className="col-time">
                        <div className="time-info">
                          <div className="order-date">{dateTime.date}</div>
                          <div className="order-time">{dateTime.time}</div>
                        </div>
                      </div>
                      <div className="col-actions">
                        <div className="action-buttons">
                          {order.status === 'pending' && (
                            <button className="action-btn" title="Edit Order">
                              <FiEdit size={14} />
                            </button>
                          )}
                          {order.status === 'pending' && (
                            <button className="action-btn cancel" title="Cancel Order">
                              <FiXCircle size={14} />
                            </button>
                          )}
                          <button className="action-btn" title="More Options">
                            <FiMoreHorizontal size={14} />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Orders;
