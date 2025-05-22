import { useRef, useEffect } from 'react';
import { safeEasing } from '../utils/animationHelpers';
import { createSafeAnimation, removeElementAnimation, enhancedSafeAnimate } from '../utils/initAnimations';

/**
 * Custom hook for safely applying Web Animations API animations
 *
 * @param {Object} options - Animation options
 * @param {Array} options.keyframes - Animation keyframes
 * @param {Object} options.timing - Animation timing options
 * @param {boolean} options.autoPlay - Whether to play the animation automatically
 * @param {Function} options.onFinish - Callback when animation finishes
 * @param {Function} options.onError - Callback when animation fails
 * @returns {Object} - Animation controls and ref
 */
export const useAnimation = ({
  keyframes = [],
  timing = {},
  autoPlay = false,
  onFinish = null,
  onError = null
} = {}) => {
  const elementRef = useRef(null);
  const animationRef = useRef(null);

  // Create the animation when the element is available
  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    try {
      // Create the animation but don't play it yet
      animationRef.current = createSafeAnimation(element, keyframes, {
        ...timing,
        fill: timing.fill || 'forwards',
        easing: timing.easing || safeEasing.easeInOut
      });

      // Pause the animation if autoPlay is false
      if (!autoPlay && animationRef.current) {
        animationRef.current.pause();
      }

      // Add finish event listener if provided
      if (onFinish && animationRef.current) {
        animationRef.current.onfinish = onFinish;
      }
    } catch (error) {
      console.warn('Animation creation failed:', error);
      if (onError) {
        onError(error);
      }
    }

    // Clean up the animation on unmount
    return () => {
      if (animationRef.current) {
        try {
          animationRef.current.cancel();
        } catch (e) {
          console.warn('Error canceling animation:', e);
        }
        removeElementAnimation(element);
      }
    };
  }, [keyframes, timing, autoPlay, onFinish, onError]);

  // Animation control methods with error handling
  const play = () => {
    if (animationRef.current) {
      try {
        animationRef.current.play();
      } catch (error) {
        console.warn('Error playing animation:', error);
        if (onError) onError(error);
      }
    }
  };

  const pause = () => {
    if (animationRef.current) {
      try {
        animationRef.current.pause();
      } catch (error) {
        console.warn('Error pausing animation:', error);
        if (onError) onError(error);
      }
    }
  };

  const cancel = () => {
    if (animationRef.current) {
      try {
        animationRef.current.cancel();
      } catch (error) {
        console.warn('Error canceling animation:', error);
        if (onError) onError(error);
      }
    }
  };

  const finish = () => {
    if (animationRef.current) {
      try {
        animationRef.current.finish();
      } catch (error) {
        console.warn('Error finishing animation:', error);
        if (onError) onError(error);
      }
    }
  };

  const reverse = () => {
    if (animationRef.current) {
      try {
        animationRef.current.reverse();
      } catch (error) {
        console.warn('Error reversing animation:', error);
        if (onError) onError(error);
      }
    }
  };

  return {
    elementRef,
    animation: animationRef.current,
    play,
    pause,
    cancel,
    finish,
    reverse,
    isActive: !!animationRef.current
  };
};

export default useAnimation;
