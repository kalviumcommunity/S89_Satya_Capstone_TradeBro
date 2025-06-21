/**
 * Optimized Components for TradeBro
 * High-performance, lag-free component implementations
 */

import React, { memo, useMemo, useCallback, useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  debounce, 
  throttle, 
  VirtualizedList,
  useOptimizedScroll,
  withPerformance 
} from '../../utils/performanceOptimizations';
import { 
  optimizedFadeVariants, 
  optimizedSlideVariants,
  OptimizedAnimatedContainer 
} from '../../utils/optimizedAnimations';

// ===== OPTIMIZED LOADING COMPONENT =====

export const OptimizedLoading = memo(({ 
  size = 'medium', 
  color = '#667eea',
  text = 'Loading...',
  minimal = false 
}) => {
  const sizeMap = {
    small: '20px',
    medium: '40px',
    large: '60px'
  };

  if (minimal) {
    return (
      <div className="flex items-center justify-center p-4">
        <div 
          className="animate-spin rounded-full border-2 border-gray-300 border-t-current"
          style={{ 
            width: sizeMap[size], 
            height: sizeMap[size],
            borderTopColor: color 
          }}
        />
      </div>
    );
  }

  return (
    <OptimizedAnimatedContainer animation="fadeIn" className="flex flex-col items-center justify-center p-8">
      <div 
        className="animate-spin rounded-full border-4 border-gray-200 border-t-current mb-4"
        style={{ 
          width: sizeMap[size], 
          height: sizeMap[size],
          borderTopColor: color 
        }}
      />
      <p className="text-gray-600 font-medium">{text}</p>
    </OptimizedAnimatedContainer>
  );
});

// ===== OPTIMIZED BUTTON COMPONENT =====

export const OptimizedButton = memo(({ 
  children, 
  onClick, 
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  className = '',
  ...props 
}) => {
  const [isPressed, setIsPressed] = useState(false);

  const handleClick = useCallback((e) => {
    if (disabled || loading) return;
    onClick?.(e);
  }, [onClick, disabled, loading]);

  const handleMouseDown = useCallback(() => setIsPressed(true), []);
  const handleMouseUp = useCallback(() => setIsPressed(false), []);
  const handleMouseLeave = useCallback(() => setIsPressed(false), []);

  const baseClasses = useMemo(() => {
    const variants = {
      primary: 'bg-blue-600 hover:bg-blue-700 text-white',
      secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-800',
      outline: 'border-2 border-blue-600 text-blue-600 hover:bg-blue-50'
    };

    const sizes = {
      small: 'px-3 py-1.5 text-sm',
      medium: 'px-4 py-2 text-base',
      large: 'px-6 py-3 text-lg'
    };

    return `
      inline-flex items-center justify-center font-medium rounded-lg
      transition-all duration-200 ease-in-out
      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
      ${variants[variant]} ${sizes[size]}
      ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      ${isPressed ? 'transform scale-95' : ''}
      ${className}
    `;
  }, [variant, size, disabled, isPressed, className]);

  return (
    <button
      className={baseClasses}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <OptimizedLoading size="small" minimal />
      ) : (
        children
      )}
    </button>
  );
});

// ===== OPTIMIZED CARD COMPONENT =====

export const OptimizedCard = memo(({ 
  children, 
  hover = true,
  className = '',
  onClick,
  ...props 
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseEnter = useCallback(() => {
    if (hover) setIsHovered(true);
  }, [hover]);

  const handleMouseLeave = useCallback(() => {
    if (hover) setIsHovered(false);
  }, [hover]);

  const cardClasses = useMemo(() => `
    bg-white rounded-lg shadow-sm border border-gray-200
    transition-all duration-200 ease-in-out
    ${hover ? 'hover:shadow-md hover:-translate-y-1' : ''}
    ${onClick ? 'cursor-pointer' : ''}
    ${isHovered ? 'shadow-md transform -translate-y-1' : ''}
    ${className}
  `, [hover, onClick, isHovered, className]);

  return (
    <div
      className={cardClasses}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  );
});

// ===== OPTIMIZED MODAL COMPONENT =====

export const OptimizedModal = memo(({ 
  isOpen, 
  onClose, 
  children, 
  title,
  size = 'medium' 
}) => {
  const modalRef = useRef();

  const sizeClasses = {
    small: 'max-w-md',
    medium: 'max-w-lg',
    large: 'max-w-2xl',
    full: 'max-w-4xl'
  };

  const handleBackdropClick = useCallback((e) => {
    if (e.target === modalRef.current) {
      onClose();
    }
  }, [onClose]);

  const handleEscapeKey = useCallback((e) => {
    if (e.key === 'Escape') {
      onClose();
    }
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleEscapeKey);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, handleEscapeKey]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        ref={modalRef}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
        variants={optimizedFadeVariants}
        initial="hidden"
        animate="visible"
        exit="hidden"
        onClick={handleBackdropClick}
      >
        <motion.div
          className={`bg-white rounded-lg shadow-xl w-full ${sizeClasses[size]}`}
          variants={optimizedSlideVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {title && (
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
            </div>
          )}
          <div className="p-6">
            {children}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
});

// ===== OPTIMIZED SEARCH COMPONENT =====

export const OptimizedSearch = memo(({ 
  onSearch, 
  placeholder = 'Search...', 
  debounceMs = 300,
  className = '' 
}) => {
  const [query, setQuery] = useState('');
  const debouncedSearch = useMemo(
    () => debounce(onSearch, debounceMs),
    [onSearch, debounceMs]
  );

  const handleChange = useCallback((e) => {
    const value = e.target.value;
    setQuery(value);
    debouncedSearch(value);
  }, [debouncedSearch]);

  const handleClear = useCallback(() => {
    setQuery('');
    onSearch('');
  }, [onSearch]);

  return (
    <div className={`relative ${className}`}>
      <input
        type="text"
        value={query}
        onChange={handleChange}
        placeholder={placeholder}
        className="w-full px-4 py-2 pl-10 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
      {query && (
        <button
          onClick={handleClear}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
});

// ===== OPTIMIZED LIST COMPONENT =====

export const OptimizedList = memo(({ 
  items, 
  renderItem, 
  virtualized = false,
  itemHeight = 60,
  containerHeight = 400,
  className = '',
  emptyMessage = 'No items found'
}) => {
  if (!items || items.length === 0) {
    return (
      <div className={`flex items-center justify-center p-8 text-gray-500 ${className}`}>
        {emptyMessage}
      </div>
    );
  }

  if (virtualized && items.length > 50) {
    return (
      <VirtualizedList
        items={items}
        renderItem={renderItem}
        itemHeight={itemHeight}
        containerHeight={containerHeight}
      />
    );
  }

  return (
    <div className={className}>
      {items.map((item, index) => (
        <div key={item.id || index}>
          {renderItem(item, index)}
        </div>
      ))}
    </div>
  );
});

// ===== OPTIMIZED SCROLL TO TOP =====

export const OptimizedScrollToTop = memo(({ 
  showAfter = 300,
  position = 'bottom-right' 
}) => {
  const [isVisible, setIsVisible] = useState(false);

  const toggleVisibility = useCallback(
    throttle(() => {
      setIsVisible(window.pageYOffset > showAfter);
    }, 100),
    [showAfter]
  );

  const scrollToTop = useCallback(() => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }, []);

  useOptimizedScroll(toggleVisibility);

  const positionClasses = {
    'bottom-right': 'bottom-8 right-8',
    'bottom-left': 'bottom-8 left-8',
    'bottom-center': 'bottom-8 left-1/2 transform -translate-x-1/2'
  };

  if (!isVisible) return null;

  return (
    <motion.button
      className={`fixed ${positionClasses[position]} z-50 p-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors duration-200`}
      onClick={scrollToTop}
      variants={optimizedFadeVariants}
      initial="hidden"
      animate="visible"
      exit="hidden"
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
    >
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
      </svg>
    </motion.button>
  );
});

// ===== EXPORT OPTIMIZED COMPONENTS =====

export const OptimizedComponents = {
  Loading: OptimizedLoading,
  Button: OptimizedButton,
  Card: OptimizedCard,
  Modal: OptimizedModal,
  Search: OptimizedSearch,
  List: OptimizedList,
  ScrollToTop: OptimizedScrollToTop
};

// Apply performance optimizations to all components
Object.keys(OptimizedComponents).forEach(key => {
  OptimizedComponents[key] = withPerformance(OptimizedComponents[key]);
});
