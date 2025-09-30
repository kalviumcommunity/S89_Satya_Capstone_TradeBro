import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiShoppingCart,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiRefreshCw,
  FiFilter,
  FiDownload,
  FiSearch,
  FiTrendingUp,
  FiTrendingDown,
  FiMoreHorizontal,
  FiEdit,
  FiTrash2,
  FiActivity
} from 'react-icons/fi';
import PageHeader from '../components/layout/PageHeader';
import SearchInput from '../components/common/SearchInput';
import { useDispatch, useSelector } from 'react-redux';
import { fetchOrders, setFilters } from '../store/slices/ordersSlice';
import { formatCurrency, formatDateTime } from '../utils/orderUtils';
import '../styles/orders.css';

const Orders = ({ user, theme }) => {
  const dispatch = useDispatch();
  const { orders, isLoading, error, filters, summary } = useSelector((state) => state.orders);

  const [searchQuery, setSearchQuery] = useState(filters.symbol || '');
  const [refreshing, setRefreshing] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const recentSearches = useMemo(() => [], []); // This would be populated from user storage

  // Fetch orders on component mount and when filters change
  useEffect(() => {
    dispatch(fetchOrders(filters));
  }, [dispatch, filters]);

  // Handle refreshing data
  const handleRefresh = async () => {
    setRefreshing(true);
    await dispatch(fetchOrders(filters));
    setRefreshing(false);
  };

  // Helper function to get status-based icons
  const getStatusIcon = useCallback((status) => {
    switch (status) {
      case 'FILLED':
        return <FiCheckCircle className="status-icon completed" />;
      case 'PENDING':
      case 'OPEN':
        return <FiClock className="status-icon pending" />;
      case 'CANCELLED':
      case 'REJECTED':
        return <FiXCircle className="status-icon cancelled" />;
      default:
        return <FiClock className="status-icon" />;
    }
  }, []);

  // Filter orders on the frontend based on search query
  const filteredOrders = useMemo(() => {
    const queryLower = searchQuery.toLowerCase();
    const statusLower = filters.status.toLowerCase();
    const typeLower = filters.type.toLowerCase();

    return orders.filter(order => {
      const matchesSearch = (order.stockSymbol || '').toLowerCase().includes(queryLower) ||
        (order.stockName || '').toLowerCase().includes(queryLower) ||
        (order._id || '').toLowerCase().includes(queryLower);
      const matchesStatus = statusLower === 'all' || (order.status || 'PENDING').toLowerCase() === statusLower;
      const matchesType = typeLower === 'all' || (order.type || '').toLowerCase() === typeLower;
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [orders, searchQuery, filters.status, filters.type]);


  if (isLoading) {
    return <div className="loading-container">
      <div className="loading-spinner"></div>
      <p>Loading orders...</p>
    </div>;
  }

  return (
    <div className="orders-page">
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
            onClick: () => { /* Implement export logic here */ },
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
                placeholder="Search orders by symbol..."
                value={searchQuery}
                onChange={setSearchQuery}
                onClear={() => setSearchQuery('')}
                recentSearches={recentSearches}
                showHistory={showHistory}
                onHistoryClick={(item) => setSearchQuery(item.query)}
                size="md"
                showSuggestions={false}
                enableHistory={false}
                className="orders-search-input"
              />
            </div>
            <div className="filter-group">
              <select
                value={filters.status}
                onChange={(e) => dispatch(setFilters({ status: e.target.value }))}
                className="filter-select"
              >
                <option value="all">All Statuses ({summary?.totalOrders || 0})</option>
                <option value="OPEN">Open ({summary?.openOrders || 0})</option>
                <option value="FILLED">Filled ({summary?.filledOrders || 0})</option>
                <option value="CANCELLED">Cancelled ({summary?.cancelledOrders || 0})</option>
                <option value="REJECTED">Rejected ({summary?.rejectedOrders || 0})</option>
              </select>
              <select
                value={filters.type}
                onChange={(e) => dispatch(setFilters({ type: e.target.value }))}
                className="filter-select"
              >
                <option value="all">All Types</option>
                <option value="BUY">Buy</option>
                <option value="SELL">Sell</option>
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
                {filteredOrders.length === 0 ? (
                  <div className="empty-state">
                    <FiActivity size={48} />
                    <h3>No Orders Found</h3>
                    <p>There are no orders that match your current filters.</p>
                  </div>
                ) : (
                  filteredOrders.map((order, index) => {
                    const dateTime = formatDateTime(order.createdAt);
                    const isPending = order.status === 'PENDING' || order.status === 'OPEN';
                    const totalPrice = (order.executionPrice || order.price) * order.quantity + (order.fees || 0);

                    return (
                      <motion.div
                        key={order._id}
                        className="table-row"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                      >
                        <div className="col-order">
                          <div className="order-info">
                            <div className="order-id">#{order._id.slice(-6)}</div>
                            <div className="stock-symbol">{order.stockSymbol}</div>
                          </div>
                        </div>
                        <div className="col-type">
                          <div className={`order-type ${order.type?.toLowerCase()}`}>
                            {order.type === 'BUY' ? <FiTrendingUp size={14} /> : <FiTrendingDown size={14} />}
                            {order.type}
                          </div>
                          <div className="order-subtype">{order.orderType}</div>
                        </div>
                        <div className="col-quantity">{order.quantity}</div>
                        <div className="col-price">
                          <div className="price-info">
                            <div className="order-price">{formatCurrency(order.price)}</div>
                            {order.executionPrice && order.executionPrice !== order.price && (
                              <div className="executed-price">
                                Exec: {formatCurrency(order.executionPrice)}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="col-total">
                          <div className="total-amount">{formatCurrency(totalPrice)}</div>
                          {order.fees > 0 && (
                            <div className="fees">Fees: {formatCurrency(order.fees)}</div>
                          )}
                        </div>
                        <div className="col-status">
                          <div className="status-container">
                            {getStatusIcon(order.status)}
                            <span className={`status-text ${order.status?.toLowerCase()}`}>
                              {(order.status || 'PENDING').charAt(0).toUpperCase() + (order.status || 'PENDING').slice(1)}
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
                            {isPending && (
                              <button className="action-btn" title="Edit Order">
                                <FiEdit size={14} />
                              </button>
                            )}
                            {isPending && (
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
                  })
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Orders;
