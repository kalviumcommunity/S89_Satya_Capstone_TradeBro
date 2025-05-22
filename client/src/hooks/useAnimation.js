import { useRef, useEffect } from 'react';
import { safeAnimate, safeEasing } from '../utils/animationHelpers';

/**
 * Custom hook for safely applying Web Animations API animations
 * 
 * @param {Object} options - Animation options
 * @param {Array} options.keyframes - Animation keyframes
 * @param {Object} options.timing - Animation timing options
 * @param {boolean} options.autoPlay - Whether to play the animation automatically
 * @param {Function} options.onFinish - Callback when animation finishes
 * @returns {Object} - Animation controls and ref
 */
export const useAnimation = ({
  keyframes = [],
  timing = {},
  autoPlay = false,
  onFinish = null
} = {}) => {
  const elementRef = useRef(null);
  const animationRef = useRef(null);
  
  // Create the animation when the element is available
  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;
    
    // Create the animation but don't play it yet
    animationRef.current = safeAnimate(element, keyframes, {
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
    
    // Clean up the animation on unmount
    return () => {
      if (animationRef.current) {
        animationRef.current.cancel();
      }
    };
  }, [keyframes, timing, autoPlay, onFinish]);
  
  // Animation control methods
  const play = () => {
    if (animationRef.current) {
      animationRef.current.play();
    }
  };
  
  const pause = () => {
    if (animationRef.current) {
      animationRef.current.pause();
    }
  };
  
  const cancel = () => {
    if (animationRef.current) {
      animationRef.current.cancel();
    }
  };
  
  const finish = () => {
    if (animationRef.current) {
      animationRef.current.finish();
    }
  };
  
  const reverse = () => {
    if (animationRef.current) {
      animationRef.current.reverse();
    }
  };
  
  return {
    elementRef,
    animation: animationRef.current,
    play,
    pause,
    cancel,
    finish,
    reverse
  };
};

export default useAnimation;
