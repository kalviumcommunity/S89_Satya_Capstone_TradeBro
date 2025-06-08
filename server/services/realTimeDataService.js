const Pusher = require('pusher');

// Initialize Pusher
const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: process.env.PUSHER_CLUSTER,
  useTLS: true
});

class RealTimeDataService {
  constructor() {
    this.isRunning = false;
    this.intervals = [];
    this.stockSymbols = [
      'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'NFLX', 'NVDA', 'JPM', 'BAC'
    ];
    this.marketIndices = [
      { symbol: '^GSPC', name: 'S&P 500', basePrice: 4500 },
      { symbol: '^DJI', name: 'Dow Jones', basePrice: 35000 },
      { symbol: '^IXIC', name: 'NASDAQ', basePrice: 14200 }
    ];
  }

  // Start real-time data simulation
  start() {
    if (this.isRunning) return;
    
    console.log('Starting real-time data service...');
    this.isRunning = true;

    // Simulate stock price updates every 5 seconds
    const stockInterval = setInterval(() => {
      this.simulateStockPriceUpdates();
    }, 5000);

    // Simulate market data updates every 10 seconds
    const marketInterval = setInterval(() => {
      this.simulateMarketDataUpdates();
    }, 10000);

    // Send test notifications every 30 seconds
    const notificationInterval = setInterval(() => {
      this.sendTestNotifications();
    }, 30000);

    this.intervals.push(stockInterval, marketInterval, notificationInterval);
  }

  // Stop real-time data simulation
  stop() {
    console.log('Stopping real-time data service...');
    this.isRunning = false;
    this.intervals.forEach(interval => clearInterval(interval));
    this.intervals = [];
  }

  // Simulate stock price updates
  simulateStockPriceUpdates() {
    const randomStock = this.stockSymbols[Math.floor(Math.random() * this.stockSymbols.length)];
    const basePrice = this.getBasePrice(randomStock);
    const changePercent = (Math.random() - 0.5) * 4; // -2% to +2%
    const newPrice = basePrice * (1 + changePercent / 100);

    const stockUpdate = {
      symbol: randomStock,
      price: parseFloat(newPrice.toFixed(2)),
      changesPercentage: parseFloat(changePercent.toFixed(2)),
      change: parseFloat((newPrice - basePrice).toFixed(2)),
      timestamp: new Date().toISOString()
    };

    // Send to all users (in a real app, you'd send to specific user channels)
    this.broadcastToAllUsers('stock-update', stockUpdate);
    
    console.log(`Stock update sent: ${randomStock} - $${stockUpdate.price} (${stockUpdate.changesPercentage}%)`);
  }

  // Simulate market data updates
  simulateMarketDataUpdates() {
    const updateType = Math.random();
    
    if (updateType < 0.33) {
      // Update indices
      const updatedIndices = this.marketIndices.map(index => ({
        ...index,
        price: index.basePrice * (1 + (Math.random() - 0.5) * 0.02),
        changesPercentage: (Math.random() - 0.5) * 2
      }));

      this.broadcastToAllUsers('market-data-update', {
        type: 'indices_update',
        data: updatedIndices
      });
    } else if (updateType < 0.66) {
      // Update top gainers
      const gainers = this.generateTopMovers(true);
      this.broadcastToAllUsers('market-data-update', {
        type: 'gainers_update',
        data: gainers
      });
    } else {
      // Update top losers
      const losers = this.generateTopMovers(false);
      this.broadcastToAllUsers('market-data-update', {
        type: 'losers_update',
        data: losers
      });
    }
  }

  // Send test notifications
  sendTestNotifications() {
    const notifications = [
      {
        id: Date.now(),
        type: 'info',
        title: 'Market Update',
        message: 'The market is showing strong performance today.',
        timestamp: new Date().toISOString(),
        read: false
      },
      {
        id: Date.now() + 1,
        type: 'success',
        title: 'Price Alert',
        message: 'AAPL has reached your target price of $180.',
        timestamp: new Date().toISOString(),
        read: false
      },
      {
        id: Date.now() + 2,
        type: 'warning',
        title: 'Volatility Alert',
        message: 'High volatility detected in tech stocks.',
        timestamp: new Date().toISOString(),
        read: false
      }
    ];

    const randomNotification = notifications[Math.floor(Math.random() * notifications.length)];
    
    // Send to all users (in a real app, you'd send to specific user channels)
    this.broadcastToAllUsers('new-notification', randomNotification);
    
    console.log(`Test notification sent: ${randomNotification.title}`);
  }

  // Send notification to specific user
  sendNotificationToUser(userId, notification) {
    try {
      pusher.trigger(`user-${userId}`, 'new-notification', notification);
      console.log(`Notification sent to user ${userId}: ${notification.title}`);
    } catch (error) {
      console.error('Error sending notification to user:', error);
    }
  }

  // Send stock update to specific user
  sendStockUpdateToUser(userId, stockData) {
    try {
      pusher.trigger(`user-${userId}`, 'stock-update', stockData);
    } catch (error) {
      console.error('Error sending stock update to user:', error);
    }
  }

  // Broadcast to all users (for demo purposes)
  broadcastToAllUsers(event, data) {
    try {
      // In a real app, you'd maintain a list of active user channels
      // For demo, we'll use a general channel
      pusher.trigger('market-data', event, data);
    } catch (error) {
      console.error('Error broadcasting data:', error);
    }
  }

  // Helper methods
  getBasePrice(symbol) {
    const basePrices = {
      'AAPL': 178,
      'MSFT': 333,
      'GOOGL': 136,
      'AMZN': 145,
      'TSLA': 246,
      'META': 311,
      'NFLX': 425,
      'NVDA': 450,
      'JPM': 155,
      'BAC': 36
    };
    return basePrices[symbol] || 100;
  }

  generateTopMovers(isGainers = true) {
    const symbols = [...this.stockSymbols].sort(() => Math.random() - 0.5).slice(0, 5);
    
    return symbols.map(symbol => {
      const basePrice = this.getBasePrice(symbol);
      const changePercent = isGainers 
        ? Math.random() * 3 + 0.5  // 0.5% to 3.5%
        : -(Math.random() * 3 + 0.5); // -0.5% to -3.5%
      
      return {
        symbol,
        name: this.getCompanyName(symbol),
        price: parseFloat((basePrice * (1 + changePercent / 100)).toFixed(2)),
        changesPercentage: parseFloat(changePercent.toFixed(2))
      };
    });
  }

  getCompanyName(symbol) {
    const names = {
      'AAPL': 'Apple Inc.',
      'MSFT': 'Microsoft Corp.',
      'GOOGL': 'Alphabet Inc.',
      'AMZN': 'Amazon.com Inc.',
      'TSLA': 'Tesla Inc.',
      'META': 'Meta Platforms Inc.',
      'NFLX': 'Netflix Inc.',
      'NVDA': 'NVIDIA Corp.',
      'JPM': 'JPMorgan Chase & Co.',
      'BAC': 'Bank of America Corp.'
    };
    return names[symbol] || `${symbol} Corp.`;
  }

  // Test Pusher connection
  async testConnection() {
    try {
      await pusher.trigger('test-channel', 'test-event', {
        message: 'Pusher connection test',
        timestamp: new Date().toISOString()
      });
      console.log('Pusher connection test successful');
      return true;
    } catch (error) {
      console.error('Pusher connection test failed:', error);
      return false;
    }
  }
}

module.exports = new RealTimeDataService();
