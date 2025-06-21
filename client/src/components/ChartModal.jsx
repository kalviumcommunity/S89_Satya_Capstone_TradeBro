import React, { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiMaximize2, FiMinimize2 } from 'react-icons/fi';
import SimpleStockChart from './SimpleStockChart';
import '../styles/components/ChartModal.css';

const ChartModal = ({
  isOpen,
  onClose,
  symbol,
  stockName,
  isFullscreen = false,
  onToggleFullscreen,
  className = ''
}) => {
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleBackdropClick = useCallback((e) => {
    if (e.target === e.currentTarget) {
      e.preventDefault();
      e.stopPropagation();
      onClose();
    }
  }, [onClose]);

  const handleCloseClick = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    onClose();
  }, [onClose]);

  useEffect(() => {
    const handleKeyDownWrapper = (e) => {
      if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };

    if (isOpen) {
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = '0px'; // Prevent layout shift

      // Add event listener
      document.addEventListener('keydown', handleKeyDownWrapper, true);

      // Focus management
      const modalElement = document.querySelector('.chart-modal-content');
      if (modalElement) {
        modalElement.focus();
      }
    }

    return () => {
      // Always cleanup on unmount or when isOpen changes
      document.removeEventListener('keydown', handleKeyDownWrapper, true);

      // Only restore body scroll if this modal was the one that disabled it
      if (isOpen) {
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
      }
    };
  }, [isOpen, onClose]);

  if (!isOpen || !symbol) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className={`chart-modal-overlay ${isFullscreen ? 'fullscreen' : ''} ${className}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onClick={handleBackdropClick}
        >
          <motion.div
            className={`chart-modal-content ${isFullscreen ? 'fullscreen-content' : ''}`}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{
              duration: 0.3,
              ease: [0.23, 1, 0.32, 1], // Professional cubic-bezier
              type: "tween"
            }}
            onClick={(e) => e.stopPropagation()}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-labelledby="chart-modal-title"
          >
            {/* Modal Header */}
            <div className="chart-modal-header">
              <div className="modal-title">
                <h3 id="chart-modal-title">{symbol}</h3>
                {stockName && <span className="stock-name">{stockName}</span>}
              </div>
              
              <div className="modal-actions">
                {onToggleFullscreen && (
                  <button
                    className="modal-action-btn"
                    onClick={onToggleFullscreen}
                    title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                  >
                    {isFullscreen ? <FiMinimize2 /> : <FiMaximize2 />}
                  </button>
                )}
                <button
                  className="modal-action-btn close-btn"
                  onClick={handleCloseClick}
                  title="Close chart"
                >
                  <FiX />
                </button>
              </div>
            </div>

            {/* Chart Content */}
            <div className="chart-modal-body">
              <SimpleStockChart
                symbol={symbol}
                onClose={onClose}
                height={isFullscreen ? 600 : 400}
                showControls={true}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ChartModal;
