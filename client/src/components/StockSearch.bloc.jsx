import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSearch, FiX, FiTrendingUp, FiTrendingDown, FiClock, FiTrash2 } from 'react-icons/fi';
import { useBloc } from '../bloc/BlocProvider';
import BlocBuilder from '../bloc/BlocBuilder';
import { SearchStocksEvent, AddToRecentSearchesEvent, ClearRecentSearchesEvent } from '../bloc/events/StockEvents';
import { StockLoading, SearchResultsLoaded, StockError } from '../bloc/states/StockStates';
import Loading from './Loading';
import '../styles/components/StockSearch.bloc.css';

/**
 * StockSearch component using the bloc pattern
 *
 * This component allows users to search for stocks and displays search results.
 */
const StockSearch = ({ onSelectStock }) => {
  const stockBloc = useBloc('stock');
  const [query, setQuery] = useState('');

  // Handle search input change
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setQuery(value);

    // Only search if query is not empty
    if (value.trim()) {
      stockBloc.add(new SearchStocksEvent(value));
    }
  };

  // Handle stock selection
  const handleSelectStock = (stock) => {
    // Add to recent searches
    stockBloc.add(new AddToRecentSearchesEvent(stock));

    // Call the parent component's onSelectStock function
    if (onSelectStock) {
      onSelectStock(stock.symbol);
    }

    // Clear the search query
    setQuery('');
  };

  // Handle clear recent searches
  const handleClearRecentSearches = () => {
    stockBloc.add(new ClearRecentSearchesEvent());
  };

  return (
    <div className="stock-search-container">
      <div className="search-input-container">
        <FiSearch className="search-icon" />
        <input
          type="text"
          value={query}
          onChange={handleSearchChange}
          placeholder="Search for stocks..."
          className="search-input"
        />
        {query && (
          <button className="clear-search-btn" onClick={() => setQuery('')}>
            <FiX />
          </button>
        )}
      </div>

      <BlocBuilder
        bloc={stockBloc}
        builder={(state) => (
          <AnimatePresence>
            {/* Show loading indicator */}
            {state instanceof StockLoading && query && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="search-loading"
              >
                <Loading size="small" text="Searching..." />
              </motion.div>
            )}

            {/* Show search results */}
            {state instanceof SearchResultsLoaded && query && state.searchResults.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="search-results"
              >
                <h3>Search Results</h3>
                <ul>
                  {state.searchResults.map((stock) => (
                    <motion.li
                      key={stock.symbol}
                      whileHover={{ backgroundColor: 'var(--hover-color)' }}
                      onClick={() => handleSelectStock(stock)}
                    >
                      <div className="stock-info">
                        <span className="stock-symbol">{stock.symbol}</span>
                        <span className="stock-name">{stock.name}</span>
                      </div>
                      <div className="stock-price">
                        <span className="price">{stock.getFormattedPrice()}</span>
                        <span className={`change ${stock.isUp() ? 'up' : 'down'}`}>
                          {stock.isUp() ? <FiTrendingUp /> : <FiTrendingDown />}
                          {stock.getFormattedChange()}
                        </span>
                      </div>
                    </motion.li>
                  ))}
                </ul>
              </motion.div>
            )}

            {/* Show no results message */}
            {state instanceof SearchResultsLoaded && query && state.searchResults.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="no-results"
              >
                <p>No results found for "{query}"</p>
              </motion.div>
            )}

            {/* Show error message */}
            {state instanceof StockError && query && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="search-error"
              >
                <p>Error: {state.error}</p>
              </motion.div>
            )}

            {/* Show recent searches when not searching */}
            {!query && state.recentSearches && state.recentSearches.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="recent-searches"
              >
                <div className="recent-header">
                  <h3><FiClock /> Recent Searches</h3>
                  <button className="clear-recent-btn" onClick={handleClearRecentSearches}>
                    <FiTrash2 /> Clear
                  </button>
                </div>
                <ul>
                  {state.recentSearches.map((stock) => (
                    <motion.li
                      key={stock.symbol}
                      whileHover={{ backgroundColor: 'var(--hover-color)' }}
                      onClick={() => handleSelectStock(stock)}
                    >
                      <div className="stock-info">
                        <span className="stock-symbol">{stock.symbol}</span>
                        <span className="stock-name">{stock.name}</span>
                      </div>
                      <div className="stock-price">
                        <span className="price">{stock.getFormattedPrice()}</span>
                        <span className={`change ${stock.isUp() ? 'up' : 'down'}`}>
                          {stock.isUp() ? <FiTrendingUp /> : <FiTrendingDown />}
                          {stock.getFormattedChange()}
                        </span>
                      </div>
                    </motion.li>
                  ))}
                </ul>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      />
    </div>
  );
};

export default StockSearch;
