import State from '../State';

/**
 * Initial stock state
 */
export class StockInitial extends State {
  constructor() {
    super('STOCK_INITIAL');
    this.stockSymbols = [];
    this.searchResults = [];
    this.selectedStock = null;
    this.stockData = null;
    this.chartData = [];
    this.recentSearches = [];
    this.timeRange = '1day';
    this.loading = false;
    this.error = null;
  }
}

/**
 * Stock loading state
 */
export class StockLoading extends State {
  constructor(previousState) {
    super('STOCK_LOADING');
    Object.assign(this, previousState);
    this.loading = true;
    this.error = null;
  }
}

/**
 * Stock symbols loaded state
 */
export class StockSymbolsLoaded extends State {
  constructor(previousState, stockSymbols) {
    super('STOCK_SYMBOLS_LOADED');
    Object.assign(this, previousState);
    this.stockSymbols = stockSymbols;
    this.loading = false;
    this.error = null;
  }
}

/**
 * Search results loaded state
 */
export class SearchResultsLoaded extends State {
  constructor(previousState, searchResults) {
    super('SEARCH_RESULTS_LOADED');
    Object.assign(this, previousState);
    this.searchResults = searchResults;
    this.loading = false;
    this.error = null;
  }
}

/**
 * Stock data loaded state
 */
export class StockDataLoaded extends State {
  constructor(previousState, stockData) {
    super('STOCK_DATA_LOADED');
    Object.assign(this, previousState);
    this.stockData = stockData;
    this.selectedStock = stockData.symbol;
    this.loading = false;
    this.error = null;
  }
}

/**
 * Chart data loaded state
 */
export class ChartDataLoaded extends State {
  constructor(previousState, chartData) {
    super('CHART_DATA_LOADED');
    Object.assign(this, previousState);
    this.chartData = chartData;
    this.loading = false;
    this.error = null;
  }
}

/**
 * Recent searches updated state
 */
export class RecentSearchesUpdated extends State {
  constructor(previousState, recentSearches) {
    super('RECENT_SEARCHES_UPDATED');
    Object.assign(this, previousState);
    this.recentSearches = recentSearches;
    this.loading = false;
    this.error = null;
  }
}

/**
 * Time range updated state
 */
export class TimeRangeUpdated extends State {
  constructor(previousState, timeRange) {
    super('TIME_RANGE_UPDATED');
    Object.assign(this, previousState);
    this.timeRange = timeRange;
    this.loading = false;
    this.error = null;
  }
}

/**
 * Stock error state
 */
export class StockError extends State {
  constructor(previousState, error) {
    super('STOCK_ERROR');
    Object.assign(this, previousState);
    this.error = error;
    this.loading = false;
  }
}
