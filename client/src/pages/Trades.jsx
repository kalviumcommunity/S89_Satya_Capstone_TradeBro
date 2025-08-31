import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiPlus, FiEdit, FiTrash2, FiTrendingUp } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { tradesService } from '../services/tradesService';
import PageHeader from '../components/layout/PageHeader';
import '../styles/trades.css';

const Trades = ({ user }) => {
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTrade, setEditingTrade] = useState(null);
  const [formData, setFormData] = useState({
    ticker: '',
    quantity: '',
    price: '',
    type: 'BUY'
  });

  useEffect(() => {
    fetchTrades();
  }, []);

  const fetchTrades = async () => {
    try {
      const response = await tradesService.getTrades();
      if (response.success) {
        setTrades(response.trades);
      }
    } catch (error) {
      toast.error('Failed to fetch trades');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingTrade) {
        const response = await tradesService.updateTrade(editingTrade._id, formData);
        if (response.success) {
          toast.success('Trade updated successfully');
          fetchTrades();
        }
      } else {
        const response = await tradesService.createTrade(formData);
        if (response.success) {
          toast.success('Trade created successfully');
          fetchTrades();
        }
      }
      resetForm();
    } catch (error) {
      toast.error('Failed to save trade');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this trade?')) {
      try {
        const response = await tradesService.deleteTrade(id);
        if (response.success) {
          toast.success('Trade deleted successfully');
          fetchTrades();
        }
      } catch (error) {
        toast.error('Failed to delete trade');
      }
    }
  };

  const resetForm = () => {
    setFormData({ ticker: '', quantity: '', price: '', type: 'BUY' });
    setEditingTrade(null);
    setShowModal(false);
  };

  const openEditModal = (trade) => {
    setFormData({
      ticker: trade.ticker,
      quantity: trade.quantity,
      price: trade.price,
      type: trade.type
    });
    setEditingTrade(trade);
    setShowModal(true);
  };

  if (loading) {
    return <div className="loading-container"><div className="loading-spinner lg"></div></div>;
  }

  return (
    <div className="trades-page">
      <PageHeader
        icon={FiTrendingUp}
        title="My Trades"
        subtitle={`Personal trading history for ${user?.fullName || 'User'}`}
        borderColor="primary"
        actions={[
          {
            label: "Add Trade",
            icon: FiPlus,
            onClick: () => setShowModal(true),
            variant: "primary"
          }
        ]}
      />

      <div className="trades-container">
        <div className="trades-grid">
          {trades.map((trade) => (
            <motion.div
              key={trade._id}
              className="trade-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="trade-header">
                <h3>{trade.ticker}</h3>
                <span className={`trade-type ${trade.type.toLowerCase()}`}>
                  {trade.type}
                </span>
              </div>
              <div className="trade-details">
                <p>Quantity: {trade.quantity}</p>
                <p>Price: ${trade.price}</p>
                <p>Total: ${(trade.quantity * trade.price).toFixed(2)}</p>
              </div>
              <div className="trade-actions">
                <button onClick={() => openEditModal(trade)} className="btn-edit">
                  <FiEdit size={16} />
                </button>
                <button onClick={() => handleDelete(trade._id)} className="btn-delete">
                  <FiTrash2 size={16} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {trades.length === 0 && (
          <div className="empty-state">
            <p>No trades found. Create your first trade!</p>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={resetForm}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>{editingTrade ? 'Edit Trade' : 'Add New Trade'}</h2>
            <form onSubmit={handleSubmit}>
              <input
                type="text"
                placeholder="Ticker (e.g., AAPL)"
                value={formData.ticker}
                onChange={(e) => setFormData({...formData, ticker: e.target.value})}
                required
              />
              <input
                type="number"
                placeholder="Quantity"
                value={formData.quantity}
                onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                required
              />
              <input
                type="number"
                step="0.01"
                placeholder="Price"
                value={formData.price}
                onChange={(e) => setFormData({...formData, price: e.target.value})}
                required
              />
              <select
                value={formData.type}
                onChange={(e) => setFormData({...formData, type: e.target.value})}
              >
                <option value="BUY">BUY</option>
                <option value="SELL">SELL</option>
              </select>
              <div className="modal-actions">
                <button type="button" onClick={resetForm}>Cancel</button>
                <button type="submit">{editingTrade ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Trades;