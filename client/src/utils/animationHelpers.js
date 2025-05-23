/**
 * Animation Helper Utilities
 * Provides helper functions for animations and easing
 */

/**
 * Validates and fixes cubic-bezier parameters for Web Animations API
 * The Web Animations API requires x values (first and third parameters) to be between 0 and 1
 *
 * @param {Array} params - The four cubic-bezier parameters [x1, y1, x2, y2]
 * @returns {Array} - Fixed cubic-bezier parameters
 */
export const validateCubicBezier = (params) => {
  // Clone the array to avoid modifying the original
  const fixedParams = [...params];

  // Fix x1 (first parameter) - must be between 0 and 1
  fixedParams[0] = Math.max(0, Math.min(1, fixedParams[0]));

  // Fix x2 (third parameter) - must be between 0 and 1
  fixedParams[2] = Math.max(0, Math.min(1, fixedParams[2]));

  return fixedParams;
};

/**
 * Converts a cubic-bezier string to an array of parameters
 *
 * @param {String} cubicBezierStr - The cubic-bezier string (e.g., "cubic-bezier(0.6, 0.05, -0.01, 0.9)")
 * @returns {Array|null} - Array of parameters or null if invalid
 */
export const parseCubicBezier = (cubicBezierStr) => {
  if (!cubicBezierStr || typeof cubicBezierStr !== 'string') return null;

  // Extract parameters from the cubic-bezier string
  const match = cubicBezierStr.match(/cubic-bezier\s*\(\s*([-\d.]+)\s*,\s*([-\d.]+)\s*,\s*([-\d.]+)\s*,\s*([-\d.]+)\s*\)/);

  if (!match) return null;

  // Convert string parameters to numbers
  return [
    parseFloat(match[1]),
    parseFloat(match[2]),
    parseFloat(match[3]),
    parseFloat(match[4])
  ];
};

/**
 * Creates a valid cubic-bezier string for Web Animations API
 *
 * @param {String|Array} cubicBezier - Either a cubic-bezier string or array of parameters
 * @returns {String} - Valid cubic-bezier string
 */
export const createValidCubicBezier = (cubicBezier) => {
  let params;

  if (Array.isArray(cubicBezier)) {
    params = cubicBezier;
  } else {
    params = parseCubicBezier(cubicBezier);
    if (!params) {
      // Return a safe default if parsing fails
      return 'ease';
    }
  }

  const validParams = validateCubicBezier(params);
  return `cubic-bezier(${validParams.join(', ')})`;
};

/**
 * Safe animation function that ensures valid easing functions
 * This is a placeholder that will be overridden by initAnimations.js
 *
 * @param {Element} element - The DOM element to animate
 * @param {Array} keyframes - Keyframes for the animation
 * @param {Object} options - Animation options
 * @returns {Animation} - The Animation object
 */
export let safeAnimate = (element, keyframes, options) => {
  if (!element || typeof element.animate !== 'function') {
    console.warn('Element.animate() not supported');
    return null;
  }

  // Clone options to avoid modifying the original
  const safeOptions = { ...options };

  // Fix easing if it's a cubic-bezier
  if (safeOptions.easing && typeof safeOptions.easing === 'string' &&
      safeOptions.easing.includes('cubic-bezier')) {
    safeOptions.easing = createValidCubicBezier(safeOptions.easing);
  }

  try {
    // Apply the animation with safe options
    return element.animate(keyframes, safeOptions);
  } catch (error) {
    console.warn('Animation failed:', error);
    return null;
  }
};

/**
 * Predefined safe easing functions for Web Animations API
 */
export const safeEasing = {
  linear: 'linear',
  ease: 'ease',
  easeIn: 'ease-in',
  easeOut: 'ease-out',
  easeInOut: 'ease-in-out',
  // Safe cubic-bezier functions with valid parameters
  easeInOutQuad: 'cubic-bezier(0.455, 0.03, 0.515, 0.955)',
  easeInOutCubic: 'cubic-bezier(0.645, 0.045, 0.355, 1)',
  easeInOutQuart: 'cubic-bezier(0.77, 0, 0.175, 1)',
  easeInOutQuint: 'cubic-bezier(0.86, 0, 0.07, 1)',
  easeInOutExpo: 'cubic-bezier(1, 0, 0, 1)',
  easeOutBack: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  easeInOutBack: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)' // Note: This will be fixed when used with safeAnimate
};
