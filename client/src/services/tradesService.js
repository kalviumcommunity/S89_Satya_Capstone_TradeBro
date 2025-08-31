const API_URL = import.meta.env.VITE_API_URL || 'https://s89-satya-capstone-tradebro.onrender.com';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

export const tradesService = {
  // Get all user's trades
  async getTrades() {
    const response = await fetch(`${API_URL}/api/trades`, {
      headers: getAuthHeaders()
    });
    return response.json();
  },

  // Create new trade
  async createTrade(tradeData) {
    const response = await fetch(`${API_URL}/api/trades`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(tradeData)
    });
    return response.json();
  },

  // Get single trade
  async getTrade(id) {
    const response = await fetch(`${API_URL}/api/trades/${id}`, {
      headers: getAuthHeaders()
    });
    return response.json();
  },

  // Update trade
  async updateTrade(id, tradeData) {
    const response = await fetch(`${API_URL}/api/trades/${id}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(tradeData)
    });
    return response.json();
  },

  // Delete trade
  async deleteTrade(id) {
    const response = await fetch(`${API_URL}/api/trades/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return response.json();
  }
};