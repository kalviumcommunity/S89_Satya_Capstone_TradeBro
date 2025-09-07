import React from 'react';

/**
 * Utility functions for highlighting search terms in text
 * Note: Using React.createElement instead of JSX to avoid .jsx extension requirement
 */

/**
 * Escape special regex characters in a string
 * @param {string} string - String to escape
 * @returns {string} Escaped string
 */
const escapeRegExp = (string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

/**
 * Highlight matching terms in text
 * @param {string} text - Text to highlight
 * @param {string} searchTerm - Term to highlight
 * @param {Object} options - Highlighting options
 * @returns {React.Element} JSX with highlighted terms
 */
export const highlightText = (text, searchTerm, options = {}) => {
  const {
    className = 'search-highlight',
    caseSensitive = false,
    wholeWord = false,
    maxLength = null
  } = options;

  if (!text || !searchTerm) {
    return maxLength && text.length > maxLength 
      ? `${text.substring(0, maxLength)}...` 
      : text;
  }

  // Truncate text if maxLength is specified
  let displayText = text;
  let wasTruncated = false;
  
  if (maxLength && text.length > maxLength) {
    // Try to truncate around the search term
    const searchIndex = text.toLowerCase().indexOf(searchTerm.toLowerCase());
    if (searchIndex !== -1) {
      const start = Math.max(0, searchIndex - Math.floor(maxLength / 2));
      const end = Math.min(text.length, start + maxLength);
      displayText = text.substring(start, end);
      wasTruncated = true;
    } else {
      displayText = text.substring(0, maxLength);
      wasTruncated = true;
    }
  }

  // Create regex for matching
  const flags = caseSensitive ? 'g' : 'gi';
  const pattern = wholeWord 
    ? `\\b${escapeRegExp(searchTerm)}\\b`
    : escapeRegExp(searchTerm);
  
  const regex = new RegExp(pattern, flags);
  
  // Split text and highlight matches
  const parts = displayText.split(regex);
  const matches = displayText.match(regex) || [];

  if (matches.length === 0) {
    return wasTruncated ? `${displayText}...` : displayText;
  }

  return React.createElement(React.Fragment, null,
    parts.map((part, index) =>
      React.createElement(React.Fragment, { key: index },
        part,
        index < matches.length &&
          React.createElement('mark', { className }, matches[index])
      )
    ),
    wasTruncated && '...'
  );
};

/**
 * Highlight multiple terms in text
 * @param {string} text - Text to highlight
 * @param {Array} searchTerms - Array of terms to highlight
 * @param {Object} options - Highlighting options
 * @returns {React.Element} JSX with highlighted terms
 */
export const highlightMultipleTerms = (text, searchTerms, options = {}) => {
  if (!text || !searchTerms || searchTerms.length === 0) {
    return text;
  }

  const {
    className = 'search-highlight',
    caseSensitive = false,
    wholeWord = false,
    maxLength = null
  } = options;

  // Truncate text if needed
  let displayText = text;
  let wasTruncated = false;
  
  if (maxLength && text.length > maxLength) {
    displayText = text.substring(0, maxLength);
    wasTruncated = true;
  }

  // Create combined regex for all terms
  const flags = caseSensitive ? 'g' : 'gi';
  const patterns = searchTerms.map(term => {
    return wholeWord 
      ? `\\b${escapeRegExp(term)}\\b`
      : escapeRegExp(term);
  });
  
  const combinedPattern = `(${patterns.join('|')})`;
  const regex = new RegExp(combinedPattern, flags);
  
  // Split and highlight
  const parts = displayText.split(regex);
  
  return React.createElement(React.Fragment, null,
    parts.map((part, index) => {
      const isMatch = searchTerms.some(term =>
        caseSensitive
          ? part === term
          : part.toLowerCase() === term.toLowerCase()
      );

      return isMatch ?
        React.createElement('mark', { key: index, className }, part) :
        React.createElement(React.Fragment, { key: index }, part);
    }),
    wasTruncated && '...'
  );
};

/**
 * Get highlighted snippet around search term
 * @param {string} text - Full text
 * @param {string} searchTerm - Search term
 * @param {Object} options - Options
 * @returns {React.Element} Highlighted snippet
 */
export const getHighlightedSnippet = (text, searchTerm, options = {}) => {
  const {
    snippetLength = 150,
    className = 'search-highlight',
    caseSensitive = false
  } = options;

  if (!text || !searchTerm) {
    return text?.substring(0, snippetLength) + (text?.length > snippetLength ? '...' : '');
  }

  const searchIndex = caseSensitive 
    ? text.indexOf(searchTerm)
    : text.toLowerCase().indexOf(searchTerm.toLowerCase());

  if (searchIndex === -1) {
    return text.substring(0, snippetLength) + (text.length > snippetLength ? '...' : '');
  }

  // Calculate snippet boundaries
  const termLength = searchTerm.length;
  const beforeLength = Math.floor((snippetLength - termLength) / 2);
  const afterLength = snippetLength - termLength - beforeLength;

  const start = Math.max(0, searchIndex - beforeLength);
  const end = Math.min(text.length, searchIndex + termLength + afterLength);

  const snippet = text.substring(start, end);
  const prefix = start > 0 ? '...' : '';
  const suffix = end < text.length ? '...' : '';

  return React.createElement(React.Fragment, null,
    prefix,
    highlightText(snippet, searchTerm, { className, caseSensitive }),
    suffix
  );
};

/**
 * Check if text contains search term
 * @param {string} text - Text to search in
 * @param {string} searchTerm - Term to search for
 * @param {Object} options - Search options
 * @returns {boolean} Whether text contains term
 */
export const containsSearchTerm = (text, searchTerm, options = {}) => {
  const { caseSensitive = false, wholeWord = false } = options;

  if (!text || !searchTerm) return false;

  if (wholeWord) {
    const pattern = `\\b${escapeRegExp(searchTerm)}\\b`;
    const regex = new RegExp(pattern, caseSensitive ? '' : 'i');
    return regex.test(text);
  }

  return caseSensitive 
    ? text.includes(searchTerm)
    : text.toLowerCase().includes(searchTerm.toLowerCase());
};

/**
 * Get match positions in text
 * @param {string} text - Text to search in
 * @param {string} searchTerm - Term to search for
 * @param {Object} options - Search options
 * @returns {Array} Array of match positions
 */
export const getMatchPositions = (text, searchTerm, options = {}) => {
  const { caseSensitive = false, wholeWord = false } = options;
  const positions = [];

  if (!text || !searchTerm) return positions;

  const pattern = wholeWord 
    ? `\\b${escapeRegExp(searchTerm)}\\b`
    : escapeRegExp(searchTerm);
  
  const regex = new RegExp(pattern, caseSensitive ? 'g' : 'gi');
  let match;

  while ((match = regex.exec(text)) !== null) {
    positions.push({
      start: match.index,
      end: match.index + match[0].length,
      match: match[0]
    });
  }

  return positions;
};

export default {
  highlightText,
  highlightMultipleTerms,
  getHighlightedSnippet,
  containsSearchTerm,
  getMatchPositions
};
