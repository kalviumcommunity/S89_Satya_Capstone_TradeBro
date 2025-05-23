import Event from '../Event';

/**
 * Fetch stock symbols event
 */
export class FetchStockSymbolsEvent extends Event {
  constructor() {
    super('FETCH_STOCK_SYMBOLS');
  }
}

/**
 * Search stocks event
 */
export class SearchStocksEvent extends Event {
  constructor(query) {
    super('SEARCH_STOCKS');
    this.query = query;
  }
}

/**
 * Fetch stock data event
 */
export class FetchStockDataEvent extends Event {
  constructor(symbol) {
    super('FETCH_STOCK_DATA');
    this.symbol = symbol;
  }
}

/**
 * Fetch chart data event
 */
export class FetchChartDataEvent extends Event {
  constructor(symbol, timeRange) {
    super('FETCH_CHART_DATA');
    this.symbol = symbol;
    this.timeRange = timeRange;
  }
}

/**
 * Add to recent searches event
 */
export class AddToRecentSearchesEvent extends Event {
  constructor(stock) {
    super('ADD_TO_RECENT_SEARCHES');
    this.stock = stock;
  }
}

/**
 * Clear recent searches event
 */
export class ClearRecentSearchesEvent extends Event {
  constructor() {
    super('CLEAR_RECENT_SEARCHES');
  }
}

/**
 * Set time range event
 */
export class SetTimeRangeEvent extends Event {
  constructor(timeRange) {
    super('SET_TIME_RANGE');
    this.timeRange = timeRange;
  }
}
