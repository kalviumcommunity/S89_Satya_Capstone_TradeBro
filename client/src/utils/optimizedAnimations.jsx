/**
 * Optimized Animation System for TradeBro
 * High-performance animations with reduced CPU/GPU usage
 */

import { useEffect, useRef, useCallback, useState } from 'react';

// ===== PERFORMANCE-FIRST ANIMATION VARIANTS =====

/**
 * Optimized fade variants - uses opacity only
 */
export const optimizedFadeVariants = {
  hidden: { 
    opacity: 0,
    transition: { duration: 0.2, ease: [0.4, 0, 0.2, 1] }
  },
  visible: { 
    opacity: 1,
    transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] }
  }
};

/**
 * Optimized slide variants - uses transform only
 */
export const optimizedSlideVariants = {
  hidden: { 
    transform: 'translateY(20px)',
    opacity: 0,
    transition: { duration: 0.2, ease: [0.4, 0, 0.2, 1] }
  },
  visible: { 
    transform: 'translateY(0px)',
    opacity: 1,
    transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] }
  }
};

/**
 * Optimized scale variants - minimal transform
 */
export const optimizedScaleVariants = {
  hidden: { 
    scale: 0.95,
    opacity: 0,
    transition: { duration: 0.15, ease: [0.4, 0, 0.2, 1] }
  },
  visible: { 
    scale: 1,
    opacity: 1,
    transition: { duration: 0.2, ease: [0.4, 0, 0.2, 1] }
  }
};

/**
 * Optimized stagger container
 */
export const optimizedStaggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05, // Reduced from typical 0.1
      delayChildren: 0.1
    }
  }
};

// ===== CSS-BASED ANIMATIONS (MOST PERFORMANT) =====

/**
 * CSS animation classes for maximum performance
 */
export const cssAnimations = {
  fadeIn: 'animate-fade-in',
  slideUp: 'animate-slide-up',
  scaleIn: 'animate-scale-in',
  pulse: 'animate-pulse-optimized',
  bounce: 'animate-bounce-optimized'
};

/**
 * Inject optimized CSS animations
 */
export const injectOptimizedAnimations = () => {
  if (document.getElementById('optimized-animations')) return;

  const style = document.createElement('style');
  style.id = 'optimized-animations';
  style.textContent = `
    /* Optimized fade animation */
    .animate-fade-in {
      animation: optimized-fade-in 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards;
    }
    
    @keyframes optimized-fade-in {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    
    /* Optimized slide up animation */
    .animate-slide-up {
      animation: optimized-slide-up 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards;
    }
    
    @keyframes optimized-slide-up {
      from { 
        opacity: 0;
        transform: translateY(20px);
      }
      to { 
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    /* Optimized scale animation */
    .animate-scale-in {
      animation: optimized-scale-in 0.2s cubic-bezier(0.4, 0, 0.2, 1) forwards;
    }
    
    @keyframes optimized-scale-in {
      from { 
        opacity: 0;
        transform: scale(0.95);
      }
      to { 
        opacity: 1;
        transform: scale(1);
      }
    }
    
    /* Optimized pulse animation */
    .animate-pulse-optimized {
      animation: optimized-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    }
    
    @keyframes optimized-pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.7; }
    }
    
    /* Optimized bounce animation */
    .animate-bounce-optimized {
      animation: optimized-bounce 1s ease-in-out infinite;
    }
    
    @keyframes optimized-bounce {
      0%, 20%, 53%, 80%, 100% {
        transform: translate3d(0, 0, 0);
      }
      40%, 43% {
        transform: translate3d(0, -10px, 0);
      }
      70% {
        transform: translate3d(0, -5px, 0);
      }
      90% {
        transform: translate3d(0, -2px, 0);
      }
    }
    
    /* Performance optimizations */
    .animate-fade-in,
    .animate-slide-up,
    .animate-scale-in,
    .animate-pulse-optimized,
    .animate-bounce-optimized {
      will-change: transform, opacity;
      backface-visibility: hidden;
      perspective: 1000px;
    }
    
    /* Reduced motion support */
    @media (prefers-reduced-motion: reduce) {
      .animate-fade-in,
      .animate-slide-up,
      .animate-scale-in,
      .animate-pulse-optimized,
      .animate-bounce-optimized {
        animation: none !important;
        opacity: 1 !important;
        transform: none !important;
      }
    }
  `;
  
  document.head.appendChild(style);
};

// ===== OPTIMIZED HOOKS =====

/**
 * Optimized intersection observer for animations
 */
export const useOptimizedInView = (options = {}) => {
  const [isInView, setIsInView] = useState(false);
  const ref = useRef();

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isInView) {
          setIsInView(true);
          if (options.once) {
            observer.unobserve(entry.target);
          }
        } else if (!entry.isIntersecting && !options.once) {
          setIsInView(false);
        }
      },
      {
        threshold: options.threshold || 0.1,
        rootMargin: options.rootMargin || '0px'
      }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [isInView, options.once, options.threshold, options.rootMargin]);

  return [ref, isInView];
};

/**
 * Optimized scroll-triggered animations
 */
export const useScrollAnimation = (callback, deps = []) => {
  const ticking = useRef(false);

  const handleScroll = useCallback(() => {
    if (!ticking.current) {
      requestAnimationFrame(() => {
        callback(window.scrollY);
        ticking.current = false;
      });
      ticking.current = true;
    }
  }, deps);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);
};

/**
 * Optimized hover animations
 */
export const useOptimizedHover = () => {
  const [isHovered, setIsHovered] = useState(false);
  const ref = useRef();

  const handleMouseEnter = useCallback(() => setIsHovered(true), []);
  const handleMouseLeave = useCallback(() => setIsHovered(false), []);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    element.addEventListener('mouseenter', handleMouseEnter, { passive: true });
    element.addEventListener('mouseleave', handleMouseLeave, { passive: true });

    return () => {
      element.removeEventListener('mouseenter', handleMouseEnter);
      element.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [handleMouseEnter, handleMouseLeave]);

  return [ref, isHovered];
};

// ===== PERFORMANCE MONITORING =====

/**
 * Animation performance monitor
 */
export const useAnimationPerformance = (animationName) => {
  const frameCount = useRef(0);
  const startTime = useRef(performance.now());

  useEffect(() => {
    const checkPerformance = () => {
      frameCount.current++;
      const currentTime = performance.now();
      const elapsed = currentTime - startTime.current;

      if (elapsed >= 1000) { // Check every second
        const fps = (frameCount.current / elapsed) * 1000;

        if (fps < 30) {
          console.warn(`Animation "${animationName}" running at ${fps.toFixed(1)} FPS`);
        }

        frameCount.current = 0;
        startTime.current = currentTime;
      }

      requestAnimationFrame(checkPerformance);
    };

    const rafId = requestAnimationFrame(checkPerformance);
    return () => cancelAnimationFrame(rafId);
  }, [animationName]);
};

// ===== OPTIMIZED COMPONENTS =====

/**
 * Optimized animated container
 */
export const OptimizedAnimatedContainer = ({
  children,
  animation = 'fadeIn',
  delay = 0,
  className = '',
  ...props
}) => {
  const [ref, isInView] = useOptimizedInView({ once: true });
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    if (isInView && !hasAnimated) {
      setTimeout(() => {
        if (ref.current) {
          ref.current.classList.add(cssAnimations[animation]);
          setHasAnimated(true);
        }
      }, delay);
    }
  }, [isInView, hasAnimated, animation, delay]);

  return (
    <div
      ref={ref}
      className={`${className} ${hasAnimated ? '' : 'opacity-0'}`}
      {...props}
    >
      {children}
    </div>
  );
};

// ===== INITIALIZATION =====

/**
 * Initialize optimized animation system
 */
export const initOptimizedAnimations = () => {
  // Inject CSS animations
  injectOptimizedAnimations();

  // Set up performance monitoring
  if (process.env.NODE_ENV === 'development') {
    console.log('🚀 Optimized animation system initialized');
  }

  // Disable animations for users who prefer reduced motion
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.documentElement.style.setProperty('--animation-duration', '0.001s');
  }
};

// ===== EXPORT ALL =====

export const OptimizedAnimations = {
  variants: {
    fade: optimizedFadeVariants,
    slide: optimizedSlideVariants,
    scale: optimizedScaleVariants,
    stagger: optimizedStaggerContainer
  },
  css: cssAnimations,
  hooks: {
    useOptimizedInView,
    useScrollAnimation,
    useOptimizedHover,
    useAnimationPerformance
  },
  components: {
    OptimizedAnimatedContainer
  },
  init: initOptimizedAnimations
};
