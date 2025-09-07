/**
 * Notification Service
 * Centralized service for creating and managing notifications
 */

const { createSystemNotification } = require('../routes/notificationRoutes');

class NotificationService {
  /**
   * Send a trading notification
   */
  static async sendTradeNotification(userId, userEmail, tradeData) {
    const { type, symbol, quantity, price, status } = tradeData;
    
    let notificationType, title, message;
    
    if (status === 'FILLED') {
      notificationType = 'success';
      title = `${type} Order Executed`;
      message = `Your ${type.toLowerCase()} order for ${quantity} shares of ${symbol} has been executed at ₹${price}`;
    } else if (status === 'CANCELLED') {
      notificationType = 'warning';
      title = `${type} Order Cancelled`;
      message = `Your ${type.toLowerCase()} order for ${quantity} shares of ${symbol} has been cancelled`;
    } else {
      notificationType = 'info';
      title = `${type} Order Placed`;
      message = `Your ${type.toLowerCase()} order for ${quantity} shares of ${symbol} has been placed`;
    }

    return await createSystemNotification(
      userId,
      userEmail,
      notificationType,
      title,
      message,
      '/portfolio',
      tradeData
    );
  }

  /**
   * Send a price alert notification
   */
  static async sendPriceAlert(userId, userEmail, alertData) {
    const { symbol, targetPrice, currentPrice, direction } = alertData;
    
    const title = 'Price Alert Triggered';
    const message = `${symbol} has ${direction === 'above' ? 'risen above' : 'fallen below'} your target price of ₹${targetPrice}. Current price: ₹${currentPrice}`;
    
    return await createSystemNotification(
      userId,
      userEmail,
      'alert',
      title,
      message,
      `/stock/${symbol}`,
      alertData
    );
  }

  /**
   * Send a balance warning notification
   */
  static async sendBalanceWarning(userId, userEmail, balanceData) {
    const { currentBalance, threshold } = balanceData;
    
    const title = 'Low Balance Warning';
    const message = `Your virtual money balance is running low. Current balance: ₹${currentBalance.toLocaleString()}`;
    
    return await createSystemNotification(
      userId,
      userEmail,
      'warning',
      title,
      message,
      '/virtual-money',
      balanceData
    );
  }

  /**
   * Send a portfolio update notification
   */
  static async sendPortfolioUpdate(userId, userEmail, portfolioData) {
    const { totalValue, change, changePercent } = portfolioData;
    
    const isPositive = change >= 0;
    const title = `Portfolio ${isPositive ? 'Gain' : 'Loss'}`;
    const message = `Your portfolio is ${isPositive ? 'up' : 'down'} ₹${Math.abs(change).toLocaleString()} (${Math.abs(changePercent).toFixed(2)}%) today. Total value: ₹${totalValue.toLocaleString()}`;
    
    return await createSystemNotification(
      userId,
      userEmail,
      isPositive ? 'success' : 'warning',
      title,
      message,
      '/portfolio',
      portfolioData
    );
  }

  /**
   * Send a market news notification
   */
  static async sendMarketNews(userId, userEmail, newsData) {
    const { headline, summary, category } = newsData;
    
    const title = `Market News: ${category}`;
    const message = headline;
    
    return await createSystemNotification(
      userId,
      userEmail,
      'info',
      title,
      message,
      '/news',
      newsData
    );
  }

  /**
   * Send a system maintenance notification
   */
  static async sendMaintenanceNotification(userId, userEmail, maintenanceData) {
    const { startTime, endTime, description } = maintenanceData;
    
    const title = 'Scheduled Maintenance';
    const message = `TradeBro will undergo maintenance from ${startTime} to ${endTime}. ${description}`;
    
    return await createSystemNotification(
      userId,
      userEmail,
      'warning',
      title,
      message,
      null,
      maintenanceData
    );
  }

  /**
   * Send a welcome notification for new users
   */
  static async sendWelcomeNotification(userId, userEmail, userData) {
    const { username } = userData;
    
    const title = 'Welcome to TradeBro!';
    const message = `Hi ${username}! Welcome to TradeBro. Start your trading journey with ₹1,00,000 virtual money. Happy trading!`;
    
    return await createSystemNotification(
      userId,
      userEmail,
      'success',
      title,
      message,
      '/dashboard',
      userData
    );
  }

  /**
   * Send a security alert notification
   */
  static async sendSecurityAlert(userId, userEmail, securityData) {
    const { action, location, timestamp } = securityData;
    
    const title = 'Security Alert';
    const message = `${action} detected from ${location} at ${timestamp}. If this wasn't you, please secure your account immediately.`;
    
    return await createSystemNotification(
      userId,
      userEmail,
      'error',
      title,
      message,
      '/settings/security',
      securityData
    );
  }

  /**
   * Send a custom notification
   */
  static async sendCustomNotification(userId, userEmail, type, title, message, link = null, data = {}) {
    return await createSystemNotification(userId, userEmail, type, title, message, link, data);
  }
}

module.exports = NotificationService;