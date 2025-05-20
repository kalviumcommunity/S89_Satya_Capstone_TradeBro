import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';
import '../styles/components/Tooltip.css';

/**
 * Tooltip component
 * 
 * Displays a tooltip when hovering over or focusing on children
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - The element to attach the tooltip to
 * @param {string} props.content - Tooltip content
 * @param {string} props.position - Tooltip position (top, right, bottom, left)
 * @param {string} props.type - Tooltip type (default, info, success, warning, error)
 * @param {number} props.delay - Delay before showing tooltip in milliseconds
 * @param {boolean} props.arrow - Whether to show an arrow
 * @param {boolean} props.showOnClick - Whether to show tooltip on click
 * @param {boolean} props.showOnFocus - Whether to show tooltip on focus
 */
const Tooltip = ({
  children,
  content,
  position = 'top',
  type = 'default',
  delay = 300,
  arrow = true,
  showOnClick = false,
  showOnFocus = true
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const targetRef = useRef(null);
  const tooltipRef = useRef(null);
  const timeoutRef = useRef(null);

  // Calculate tooltip position
  const calculatePosition = () => {
    if (!targetRef.current || !tooltipRef.current) return;

    const targetRect = targetRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    
    let x = 0;
    let y = 0;

    switch (position) {
      case 'top':
        x = targetRect.left + (targetRect.width / 2) - (tooltipRect.width / 2);
        y = targetRect.top - tooltipRect.height - 8;
        break;
      case 'right':
        x = targetRect.right + 8;
        y = targetRect.top + (targetRect.height / 2) - (tooltipRect.height / 2);
        break;
      case 'bottom':
        x = targetRect.left + (targetRect.width / 2) - (tooltipRect.width / 2);
        y = targetRect.bottom + 8;
        break;
      case 'left':
        x = targetRect.left - tooltipRect.width - 8;
        y = targetRect.top + (targetRect.height / 2) - (tooltipRect.height / 2);
        break;
      default:
        x = targetRect.left + (targetRect.width / 2) - (tooltipRect.width / 2);
        y = targetRect.top - tooltipRect.height - 8;
    }

    // Adjust if tooltip is outside viewport
    const padding = 10;
    
    // Adjust horizontal position
    if (x < padding) {
      x = padding;
    } else if (x + tooltipRect.width > window.innerWidth - padding) {
      x = window.innerWidth - tooltipRect.width - padding;
    }
    
    // Adjust vertical position
    if (y < padding) {
      y = padding;
    } else if (y + tooltipRect.height > window.innerHeight - padding) {
      y = window.innerHeight - tooltipRect.height - padding;
    }

    setCoords({ x, y });
  };

  // Show tooltip
  const showTooltip = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
      // Calculate position after tooltip is visible
      setTimeout(calculatePosition, 0);
    }, delay);
  };

  // Hide tooltip
  const hideTooltip = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsVisible(false);
  };

  // Handle click
  const handleClick = (e) => {
    if (showOnClick) {
      e.stopPropagation();
      setIsVisible(!isVisible);
      
      if (!isVisible) {
        // Calculate position after tooltip is visible
        setTimeout(calculatePosition, 0);
      }
    }
  };

  // Add event listeners to document
  useEffect(() => {
    if (isVisible && showOnClick) {
      const handleOutsideClick = (e) => {
        if (
          tooltipRef.current && 
          !tooltipRef.current.contains(e.target) &&
          targetRef.current && 
          !targetRef.current.contains(e.target)
        ) {
          setIsVisible(false);
        }
      };
      
      document.addEventListener('click', handleOutsideClick);
      
      return () => {
        document.removeEventListener('click', handleOutsideClick);
      };
    }
  }, [isVisible, showOnClick]);

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  // Update position when window is resized
  useEffect(() => {
    if (isVisible) {
      const handleResize = () => {
        calculatePosition();
      };
      
      window.addEventListener('resize', handleResize);
      window.addEventListener('scroll', handleResize);
      
      return () => {
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('scroll', handleResize);
      };
    }
  }, [isVisible]);

  return (
    <>
      {React.cloneElement(children, {
        ref: targetRef,
        onMouseEnter: !showOnClick ? showTooltip : undefined,
        onMouseLeave: !showOnClick ? hideTooltip : undefined,
        onFocus: showOnFocus ? showTooltip : undefined,
        onBlur: showOnFocus ? hideTooltip : undefined,
        onClick: handleClick,
        className: `${children.props.className || ''} tooltip-target`,
      })}
      
      <AnimatePresence>
        {isVisible && (
          <motion.div
            ref={tooltipRef}
            className={`tooltip tooltip-${type} tooltip-${position}`}
            style={{
              position: 'fixed',
              left: coords.x,
              top: coords.y,
              zIndex: 9999,
            }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
          >
            {content}
            {arrow && <div className={`tooltip-arrow tooltip-arrow-${position}`} />}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

Tooltip.propTypes = {
  children: PropTypes.element.isRequired,
  content: PropTypes.node.isRequired,
  position: PropTypes.oneOf(['top', 'right', 'bottom', 'left']),
  type: PropTypes.oneOf(['default', 'info', 'success', 'warning', 'error']),
  delay: PropTypes.number,
  arrow: PropTypes.bool,
  showOnClick: PropTypes.bool,
  showOnFocus: PropTypes.bool
};

export default Tooltip;
