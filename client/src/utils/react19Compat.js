/**
 * React 19 Compatibility Layer
 * Handles compatibility issues with React 19 and third-party libraries
 */

import React from 'react';

// Flag to track if we're running React 19
const isReact19 = React.version && React.version.startsWith('19');

/**
 * Wrapper for motion components to handle React 19 compatibility
 */
export const createMotionWrapper = (MotionComponent) => {
  return React.forwardRef((props, ref) => {
    // In React 19, we need to be more careful with prop spreading
    const safeProps = React.useMemo(() => {
      const { children, ...restProps } = props;
      
      // Ensure all props are properly serializable for React 19
      const cleanProps = {};
      Object.keys(restProps).forEach(key => {
        const value = restProps[key];
        // Skip functions that might cause static flag issues
        if (typeof value !== 'function' || key.startsWith('on')) {
          cleanProps[key] = value;
        }
      });
      
      return { ...cleanProps, ref };
    }, [props, ref]);

    return React.createElement(MotionComponent, safeProps, props.children);
  });
};

/**
 * Safe useEffect wrapper for React 19
 */
export const useSafeEffect = (effect, deps) => {
  const stableEffect = React.useCallback(effect, deps);
  
  React.useEffect(() => {
    try {
      return stableEffect();
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('Effect error caught by React 19 compatibility layer:', error);
      }
      return undefined;
    }
  }, [stableEffect]);
};

/**
 * Safe useState wrapper for React 19
 */
export const useSafeState = (initialState) => {
  const [state, setState] = React.useState(initialState);
  
  const safeSetState = React.useCallback((newState) => {
    try {
      setState(newState);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('setState error caught by React 19 compatibility layer:', error);
      }
    }
  }, []);
  
  return [state, safeSetState];
};

/**
 * Safe useCallback wrapper for React 19
 */
export const useSafeCallback = (callback, deps) => {
  return React.useCallback((...args) => {
    try {
      return callback(...args);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('Callback error caught by React 19 compatibility layer:', error);
      }
      return undefined;
    }
  }, deps);
};

/**
 * Safe useMemo wrapper for React 19
 */
export const useSafeMemo = (factory, deps) => {
  return React.useMemo(() => {
    try {
      return factory();
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('Memo error caught by React 19 compatibility layer:', error);
      }
      return undefined;
    }
  }, deps);
};

/**
 * Error boundary for React 19 compatibility
 */
export class React19ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('React 19 Error Boundary caught error:', error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || React.createElement('div', {
        style: { padding: '20px', textAlign: 'center', color: '#666' }
      }, 'Something went wrong. Please refresh the page.');
    }

    return this.props.children;
  }
}

/**
 * HOC to wrap components with React 19 compatibility
 */
export const withReact19Compat = (Component) => {
  return React.forwardRef((props, ref) => {
    return React.createElement(React19ErrorBoundary, null,
      React.createElement(Component, { ...props, ref })
    );
  });
};

/**
 * Utility to check if we're running React 19
 */
export const getReactVersion = () => {
  return React.version || 'unknown';
};

export const isReact19Plus = () => {
  return isReact19;
};

// Export React 19 compatible versions of common hooks
export {
  useSafeEffect as useEffect,
  useSafeState as useState,
  useSafeCallback as useCallback,
  useSafeMemo as useMemo
};

export default {
  createMotionWrapper,
  useSafeEffect,
  useSafeState,
  useSafeCallback,
  useSafeMemo,
  React19ErrorBoundary,
  withReact19Compat,
  getReactVersion,
  isReact19Plus
};
