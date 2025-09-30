import React, { useState, useRef, useEffect } from 'react';
import { FiSearch, FiX, FiLoader, FiClock } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
// import { highlightText } from '../../utils/searchHighlight';
import './SearchInput.css';

/**
 * Reusable SearchInput component with suggestions dropdown
 * @param {Object} props - Component props
 * @param {string} props.placeholder - Input placeholder text
 * @param {string} props.value - Current search value
 * @param {Function} props.onChange - Value change handler
 * @param {Function} props.onSearch - Search trigger handler
 * @param {Function} props.onClear - Clear handler
 * @param {Array} props.suggestions - Array of suggestions
 * @param {Function} props.onSuggestionClick - Suggestion click handler
 * @param {boolean} props.loading - Loading state
 * @param {boolean} props.disabled - Disabled state
 * @param {string} props.size - Size variant ('sm', 'md', 'lg')
 * @param {boolean} props.showSuggestions - Whether to show suggestions dropdown
 * @param {Function} props.renderSuggestion - Custom suggestion renderer
 * @param {string} props.className - Additional CSS classes
 */
const SearchInput = ({
  placeholder = 'Search...',
  value = '',
  onChange,
  onSearch,
  onClear,
  suggestions = [],
  onSuggestionClick,
  recentSearches = [],
  onHistoryClick,
  showHistory = false,
  loading = false,
  disabled = false,
  size = 'md',
  showSuggestions = true,
  enableHistory = true,
  renderSuggestion,
  renderHistoryItem,
  className = '',
  autoFocus = false,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  // Handle input focus
  const handleFocus = () => {
    setIsFocused(true);
    if (showSuggestions && suggestions.length > 0) {
      setShowDropdown(true);
    }
  };

  // Handle input blur
  const handleBlur = (e) => {
    // Delay blur to allow suggestion clicks
    setTimeout(() => {
      if (!dropdownRef.current?.contains(document.activeElement)) {
        setIsFocused(false);
        setShowDropdown(false);
      }
    }, 150);
  };

  // Handle input change
  const handleChange = (e) => {
    const newValue = e.target.value;
    onChange?.(newValue);
    
    if (showSuggestions && newValue.length > 0 && suggestions.length > 0) {
      setShowDropdown(true);
    } else {
      setShowDropdown(false);
    }
  };

  // Handle clear button click
  const handleClear = () => {
    onChange?.('');
    onClear?.();
    setShowDropdown(false);
    inputRef.current?.focus();
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion) => {
    onSuggestionClick?.(suggestion);
    setShowDropdown(false);
    inputRef.current?.blur();
  };

  // Get all selectable items (history + suggestions)
  const getAllSelectableItems = () => {
    const items = [];
    if (shouldShowHistory) {
      items.push(...recentSearches.map(item => ({ type: 'history', data: item })));
    }
    if (shouldShowSuggestions) {
      items.push(...suggestions.map(item => ({ type: 'suggestion', data: item })));
    }
    return items;
  };

  // Handle key press with navigation
  const handleKeyPress = (e) => {
    const selectableItems = getAllSelectableItems();

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (selectableItems.length > 0) {
        setSelectedIndex(prev =>
          prev < selectableItems.length - 1 ? prev + 1 : 0
        );
        if (!showDropdown) setShowDropdown(true);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (selectableItems.length > 0) {
        setSelectedIndex(prev =>
          prev > 0 ? prev - 1 : selectableItems.length - 1
        );
        if (!showDropdown) setShowDropdown(true);
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && selectableItems[selectedIndex]) {
        const selectedItem = selectableItems[selectedIndex];
        if (selectedItem.type === 'history') {
          onHistoryClick?.(selectedItem.data);
        } else {
          handleSuggestionClick(selectedItem.data);
        }
      } else {
        onSearch?.(value);
      }
      setShowDropdown(false);
      setSelectedIndex(-1);
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
      setSelectedIndex(-1);
      inputRef.current?.blur();
    } else {
      // Reset selection when typing
      setSelectedIndex(-1);
    }
  };

  // Auto focus effect
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  // Update dropdown visibility when suggestions change
  useEffect(() => {
    if (showSuggestions && isFocused && suggestions.length > 0 && value.length > 0) {
      setShowDropdown(true);
    } else {
      setShowDropdown(false);
    }
  }, [suggestions, showSuggestions, isFocused, value]);

  // Default suggestion renderer
  const defaultRenderSuggestion = (suggestion, index) => {
    const displayText = suggestion.symbol || suggestion.title || suggestion;

    return (
      <div key={index} className="search-suggestion-item">
        <div className="suggestion-content">
          <span className="suggestion-text">{displayText}</span>
          {suggestion.name && (
            <span className="suggestion-subtitle">{suggestion.name}</span>
          )}
        </div>
      </div>
    );
  };

  // Default history item renderer
  const defaultRenderHistoryItem = (historyItem, index) => {
    return (
      <div key={index} className="search-history-item">
        <div className="history-content">
          <FiClock className="history-icon" />
          <span className="history-text">{historyItem.query}</span>
          <span className="history-time">
            {new Date(historyItem.timestamp).toLocaleDateString()}
          </span>
        </div>
      </div>
    );
  };

  const suggestionRenderer = renderSuggestion || defaultRenderSuggestion;
  const historyRenderer = renderHistoryItem || defaultRenderHistoryItem;

  // Determine what to show in dropdown
  const shouldShowHistory = enableHistory && showHistory && recentSearches.length > 0 && !value;
  const shouldShowSuggestions = showSuggestions && suggestions.length > 0 && value;

  return (
    <div className={`search-input-container ${className} size-${size}`}>
      <div className={`search-input-wrapper ${isFocused ? 'focused' : ''} ${disabled ? 'disabled' : ''}`}>
        <FiSearch className="search-icon" />
        
        <input
          ref={inputRef}
          type="text"
          className="search-input"
          placeholder={placeholder}
          value={value}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyPress}
          disabled={disabled}
          {...props}
        />

        <div className="search-actions">
          {loading && (
            <FiLoader className="search-loading animate-spin" />
          )}
          
          {value && !loading && (
            <button
              type="button"
              className="search-clear"
              onClick={handleClear}
              disabled={disabled}
            >
              <FiX />
            </button>
          )}
        </div>
      </div>

      {/* History & Suggestions Dropdown */}
      <AnimatePresence>
        {showDropdown && (shouldShowHistory || shouldShowSuggestions) && (
          <motion.div
            ref={dropdownRef}
            className="search-suggestions-dropdown"
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
          >
            {/* Recent Searches */}
            {shouldShowHistory && (
              <div className="history-section">
                <div className="section-header">
                  <span className="section-title">Recent Searches</span>
                </div>
                <div className="history-list">
                  {recentSearches.map((historyItem, index) => {
                    const isSelected = selectedIndex === index;
                    return (
                      <motion.div
                        key={`history-${index}`}
                        className={`history-item-wrapper ${isSelected ? 'selected' : ''}`}
                        onClick={() => onHistoryClick?.(historyItem)}
                        whileHover={{ backgroundColor: 'var(--hover-bg)' }}
                        transition={{ duration: 0.1 }}
                      >
                        {historyRenderer(historyItem, index)}
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Suggestions */}
            {shouldShowSuggestions && (
              <div className="suggestions-section">
                {shouldShowHistory && (
                  <div className="section-header">
                    <span className="section-title">Suggestions</span>
                  </div>
                )}
                <div className="suggestions-list">
                  {suggestions.map((suggestion, index) => {
                    const adjustedIndex = shouldShowHistory ? recentSearches.length + index : index;
                    const isSelected = selectedIndex === adjustedIndex;
                    return (
                      <motion.div
                        key={`suggestion-${index}`}
                        className={`suggestion-item-wrapper ${isSelected ? 'selected' : ''}`}
                        onClick={() => handleSuggestionClick(suggestion)}
                        whileHover={{ backgroundColor: 'var(--hover-bg)' }}
                        transition={{ duration: 0.1 }}
                      >
                        {suggestionRenderer(suggestion, index)}
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SearchInput;
