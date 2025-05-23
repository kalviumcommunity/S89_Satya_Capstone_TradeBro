/**
 * Animation Initialization
 * Sets up animation utilities without modifying global prototypes
 */

import { validateCubicBezier, parseCubicBezier } from './animationHelpers';

// Create a WeakMap to store animation instances
const animationRegistry = new WeakMap();

/**
 * Safely create an animation without modifying Element.prototype
 * This function wraps the native Element.animate() method with validation
 *
 * @param {Element} element - The DOM element to animate
 * @param {Array} keyframes - Keyframes for the animation
 * @param {Object} options - Animation options
 * @returns {Animation} - The Animation object
 */
export const createSafeAnimation = (element, keyframes, options) => {
  if (!element || typeof element.animate !== 'function') {
    console.warn('Element.animate() not supported');
    return null;
  }

  // Clone options to avoid modifying the original
  if (options && typeof options === 'object') {
    const safeOptions = { ...options };

    // Fix easing if it's a cubic-bezier
    if (safeOptions.easing && typeof safeOptions.easing === 'string' &&
        safeOptions.easing.includes('cubic-bezier')) {
      const params = parseCubicBezier(safeOptions.easing);
      if (params) {
        const validParams = validateCubicBezier(params);
        safeOptions.easing = `cubic-bezier(${validParams.join(', ')})`;
      } else {
        // Fallback to a safe easing if parsing fails
        safeOptions.easing = 'ease';
      }
    }

    // Create the animation with safe options
    const animation = element.animate(keyframes, safeOptions);

    // Store the animation in the registry
    if (animation) {
      animationRegistry.set(element, animation);
    }

    return animation;
  }

  // Call the original method if no options or not an object
  const animation = element.animate(keyframes, options);

  // Store the animation in the registry
  if (animation) {
    animationRegistry.set(element, animation);
  }

  return animation;
};

/**
 * Get the animation associated with an element
 *
 * @param {Element} element - The DOM element
 * @returns {Animation|null} - The Animation object or null
 */
export const getElementAnimation = (element) => {
  return animationRegistry.get(element) || null;
};

/**
 * Remove an animation from the registry
 *
 * @param {Element} element - The DOM element
 */
export const removeElementAnimation = (element) => {
  if (animationRegistry.has(element)) {
    animationRegistry.delete(element);
  }
};

// We can't directly modify imported modules in ES modules
// Instead, we'll export our own version that will be used by the application
import { safeAnimate as originalSafeAnimate } from './animationHelpers';

// Export our own version of safeAnimate that uses createSafeAnimation
export const enhancedSafeAnimate = (element, keyframes, options) => {
  return createSafeAnimation(element, keyframes, options);
};

// In development, log that we're using the enhanced version
if (process.env.NODE_ENV === 'development') {
  console.log('Using enhanced animation utilities');
}

// Export a function to check if animations are supported
export const isAnimationSupported = () => {
  return typeof Element !== 'undefined' &&
         typeof Element.prototype.animate === 'function';
};

// Log animation support status in development
if (process.env.NODE_ENV === 'development') {
  console.log(`Web Animations API ${isAnimationSupported() ? 'is' : 'is not'} supported`);
}

export default {
  createSafeAnimation,
  getElementAnimation,
  removeElementAnimation,
  isAnimationSupported
};
