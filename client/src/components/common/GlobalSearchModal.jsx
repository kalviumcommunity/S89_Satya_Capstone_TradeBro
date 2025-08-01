import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiSearch, 
  FiTrendingUp, 
  FiGlobe, 
  FiShoppingCart, 
  FiCommand,
  FiCornerDownLeft,
  FiArrowUp,
  FiArrowDown
} from 'react-icons/fi';
import { useStockSearch, useNewsSearch } from '../../hooks/useSearch';
import SearchInput from './SearchInput';
import './GlobalSearchModal.css';

/**
 * Global Search Modal Component
 * Triggered by Ctrl+K shortcut, provides unified search across all data types
 */
const GlobalSearchModal = ({ 
  isOpen, 
  onClose, 
  onSearch 
}) => {
  const [searchType, setSearchType] = useState('stocks');
  const [query, setQuery] = useState('');
  const modalRef = useRef(null);

  // Different search hooks based on type
  const stockSearch = useStockSearch({
    enableSuggestions: true,
    enableHistory: true,
    limit: 8
  });

  const newsSearch = useNewsSearch({
    enableSuggestions: false,
    enableHistory: true,
    limit: 6
  });

  // Get current search hook based on type
  const getCurrentSearch = () => {
    switch (searchType) {
      case 'stocks':
        return stockSearch;
      case 'news':
        return newsSearch;
      default:
        return stockSearch;
    }
  };

  const currentSearch = getCurrentSearch();

  // Handle search type change
  const handleTypeChange = (type) => {
    setSearchType(type);
    setQuery('');
    currentSearch.clearSearch();
  };

  // Handle search submission
  const handleSearch = (searchQuery) => {
    if (searchQuery.trim()) {
      onSearch(searchQuery.trim(), searchType);
    }
  };

  // Handle suggestion/history click
  const handleItemClick = (item) => {
    const searchQuery = item.query || item.symbol || item.title || item;
    handleSearch(searchQuery);
  };

  // Close modal on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, onClose]);

  // Focus search input when modal opens
  useEffect(() => {
    if (isOpen) {
      // Small delay to ensure modal is rendered
      setTimeout(() => {
        const searchInput = modalRef.current?.querySelector('.search-input');
        searchInput?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Search types configuration
  const searchTypes = [
    {
      id: 'stocks',
      label: 'Stocks',
      icon: FiTrendingUp,
      placeholder: 'Search stocks, symbols...',
      shortcut: 'S'
    },
    {
      id: 'news',
      label: 'News',
      icon: FiGlobe,
      placeholder: 'Search news articles...',
      shortcut: 'N'
    },
    {
      id: 'orders',
      label: 'Orders',
      icon: FiShoppingCart,
      placeholder: 'Search orders by symbol...',
      shortcut: 'O'
    }
  ];

  const currentType = searchTypes.find(type => type.id === searchType);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="global-search-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            ref={modalRef}
            className="global-search-modal"
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            {/* Header */}
            <div className="global-search-header">
              <div className="search-type-tabs">
                {searchTypes.map((type) => {
                  const Icon = type.icon;
                  return (
                    <button
                      key={type.id}
                      className={`search-type-tab ${searchType === type.id ? 'active' : ''}`}
                      onClick={() => handleTypeChange(type.id)}
                    >
                      <Icon className="tab-icon" />
                      <span className="tab-label">{type.label}</span>
                      <kbd className="tab-shortcut">{type.shortcut}</kbd>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Search Input */}
            <div className="global-search-input-container">
              <SearchInput
                placeholder={currentType?.placeholder || 'Search...'}
                value={currentSearch.query}
                onChange={currentSearch.setQuery}
                onSearch={handleSearch}
                onClear={currentSearch.clearSearch}
                suggestions={currentSearch.suggestions}
                recentSearches={currentSearch.recentSearches}
                onSuggestionClick={handleItemClick}
                onHistoryClick={handleItemClick}
                showHistory={currentSearch.showHistory}
                loading={currentSearch.loading}
                size="lg"
                showSuggestions={true}
                enableHistory={true}
                className="global-search-input"
                autoFocus={true}
              />
            </div>

            {/* Footer */}
            <div className="global-search-footer">
              <div className="search-shortcuts">
                <div className="shortcut-item">
                  <kbd><FiArrowUp /></kbd>
                  <kbd><FiArrowDown /></kbd>
                  <span>Navigate</span>
                </div>
                <div className="shortcut-item">
                  <kbd><FiCornerDownLeft /></kbd>
                  <span>Select</span>
                </div>
                <div className="shortcut-item">
                  <kbd>Esc</kbd>
                  <span>Close</span>
                </div>
              </div>
              
              <div className="search-branding">
                <span>Global Search</span>
                <div className="shortcut-badge">
                  <FiCommand className="command-icon" />
                  <span>K</span>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default GlobalSearchModal;
