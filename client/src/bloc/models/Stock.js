/**
 * Stock model
 */
class Stock {
  constructor(data = {}) {
    this.symbol = data.symbol || '';
    this.name = data.name || '';
    this.price = data.price || 0;
    this.change = data.change || 0;
    this.changesPercentage = data.changesPercentage || 0;
    this.dayLow = data.dayLow || 0;
    this.dayHigh = data.dayHigh || 0;
    this.yearLow = data.yearLow || 0;
    this.yearHigh = data.yearHigh || 0;
    this.marketCap = data.marketCap || 0;
    this.volume = data.volume || 0;
    this.avgVolume = data.avgVolume || 0;
    this.exchange = data.exchange || '';
    this.open = data.open || 0;
    this.previousClose = data.previousClose || 0;
    this.eps = data.eps || 0;
    this.pe = data.pe || 0;
    this.earningsAnnouncement = data.earningsAnnouncement || null;
    this.sharesOutstanding = data.sharesOutstanding || 0;
    this.timestamp = data.timestamp || Date.now();
  }

  /**
   * Create a Stock instance from API data
   * @param {Object} data - API data
   * @returns {Stock} Stock instance
   */
  static fromJson(data) {
    return new Stock(data);
  }

  /**
   * Convert Stock instance to JSON
   * @returns {Object} JSON representation of Stock
   */
  toJson() {
    return {
      symbol: this.symbol,
      name: this.name,
      price: this.price,
      change: this.change,
      changesPercentage: this.changesPercentage,
      dayLow: this.dayLow,
      dayHigh: this.dayHigh,
      yearLow: this.yearLow,
      yearHigh: this.yearHigh,
      marketCap: this.marketCap,
      volume: this.volume,
      avgVolume: this.avgVolume,
      exchange: this.exchange,
      open: this.open,
      previousClose: this.previousClose,
      eps: this.eps,
      pe: this.pe,
      earningsAnnouncement: this.earningsAnnouncement,
      sharesOutstanding: this.sharesOutstanding,
      timestamp: this.timestamp
    };
  }

  /**
   * Check if stock is up
   * @returns {boolean} True if stock is up
   */
  isUp() {
    return this.change > 0;
  }

  /**
   * Get formatted price
   * @returns {string} Formatted price
   */
  getFormattedPrice() {
    return `₹${this.price.toFixed(2)}`;
  }

  /**
   * Get formatted change
   * @returns {string} Formatted change
   */
  getFormattedChange() {
    const sign = this.change > 0 ? '+' : '';
    return `${sign}${this.change.toFixed(2)} (${sign}${this.changesPercentage.toFixed(2)}%)`;
  }
}

export default Stock;
