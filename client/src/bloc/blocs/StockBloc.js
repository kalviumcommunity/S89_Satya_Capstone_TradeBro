import Bloc from '../Bloc';
import StockRepository from '../repositories/StockRepository';
import {
  FetchStockSymbolsEvent,
  SearchStocksEvent,
  FetchStockDataEvent,
  FetchChartDataEvent,
  AddToRecentSearchesEvent,
  ClearRecentSearchesEvent,
  SetTimeRangeEvent
} from '../events/StockEvents';
import {
  StockInitial,
  StockLoading,
  StockSymbolsLoaded,
  SearchResultsLoaded,
  StockDataLoaded,
  ChartDataLoaded,
  RecentSearchesUpdated,
  TimeRangeUpdated,
  StockError
} from '../states/StockStates';

/**
 * StockBloc handles stock-related events and emits stock states
 */
class StockBloc extends Bloc {
  constructor() {
    super(new StockInitial());
    this.repository = StockRepository;
    
    // Initialize recent searches
    this.initializeRecentSearches();
  }

  /**
   * Initialize recent searches
   */
  async initializeRecentSearches() {
    const recentSearches = this.repository.getRecentSearches();
    this.emit(new RecentSearchesUpdated(this.state, recentSearches));
  }

  /**
   * Map events to states
   * @param {Event} event - The event to handle
   */
  async mapEventToState(event) {
    try {
      if (event instanceof FetchStockSymbolsEvent) {
        await this.handleFetchStockSymbols();
      } else if (event instanceof SearchStocksEvent) {
        await this.handleSearchStocks(event);
      } else if (event instanceof FetchStockDataEvent) {
        await this.handleFetchStockData(event);
      } else if (event instanceof FetchChartDataEvent) {
        await this.handleFetchChartData(event);
      } else if (event instanceof AddToRecentSearchesEvent) {
        await this.handleAddToRecentSearches(event);
      } else if (event instanceof ClearRecentSearchesEvent) {
        await this.handleClearRecentSearches();
      } else if (event instanceof SetTimeRangeEvent) {
        await this.handleSetTimeRange(event);
      }
    } catch (error) {
      console.error('StockBloc error:', error);
      this.emit(new StockError(this.state, error.toString()));
    }
  }

  /**
   * Handle fetch stock symbols event
   */
  async handleFetchStockSymbols() {
    this.emit(new StockLoading(this.state));
    try {
      const stockSymbols = await this.repository.fetchStockSymbols();
      this.emit(new StockSymbolsLoaded(this.state, stockSymbols));
    } catch (error) {
      this.emit(new StockError(this.state, error.toString()));
    }
  }

  /**
   * Handle search stocks event
   * @param {SearchStocksEvent} event - Search stocks event
   */
  async handleSearchStocks(event) {
    this.emit(new StockLoading(this.state));
    try {
      const searchResults = await this.repository.searchStocks(event.query);
      this.emit(new SearchResultsLoaded(this.state, searchResults));
    } catch (error) {
      this.emit(new StockError(this.state, error.toString()));
    }
  }

  /**
   * Handle fetch stock data event
   * @param {FetchStockDataEvent} event - Fetch stock data event
   */
  async handleFetchStockData(event) {
    this.emit(new StockLoading(this.state));
    try {
      const stockData = await this.repository.fetchStockData(event.symbol);
      this.emit(new StockDataLoaded(this.state, stockData));
    } catch (error) {
      this.emit(new StockError(this.state, error.toString()));
    }
  }

  /**
   * Handle fetch chart data event
   * @param {FetchChartDataEvent} event - Fetch chart data event
   */
  async handleFetchChartData(event) {
    this.emit(new StockLoading(this.state));
    try {
      const chartData = await this.repository.fetchChartData(event.symbol, event.timeRange);
      this.emit(new ChartDataLoaded(this.state, chartData));
    } catch (error) {
      this.emit(new StockError(this.state, error.toString()));
    }
  }

  /**
   * Handle add to recent searches event
   * @param {AddToRecentSearchesEvent} event - Add to recent searches event
   */
  async handleAddToRecentSearches(event) {
    try {
      const recentSearches = this.repository.addToRecentSearches(event.stock);
      this.emit(new RecentSearchesUpdated(this.state, recentSearches));
    } catch (error) {
      this.emit(new StockError(this.state, error.toString()));
    }
  }

  /**
   * Handle clear recent searches event
   */
  async handleClearRecentSearches() {
    try {
      const recentSearches = this.repository.clearRecentSearches();
      this.emit(new RecentSearchesUpdated(this.state, recentSearches));
    } catch (error) {
      this.emit(new StockError(this.state, error.toString()));
    }
  }

  /**
   * Handle set time range event
   * @param {SetTimeRangeEvent} event - Set time range event
   */
  async handleSetTimeRange(event) {
    try {
      this.emit(new TimeRangeUpdated(this.state, event.timeRange));
    } catch (error) {
      this.emit(new StockError(this.state, error.toString()));
    }
  }
}

export default StockBloc;
