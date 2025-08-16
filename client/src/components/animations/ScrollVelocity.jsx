import React, { useRef, useEffect } from 'react';
import { motion, useScroll, useTransform, useSpring, useMotionValue } from 'framer-motion';
import './ScrollVelocity.css';

const ScrollVelocity = ({ 
  children, 
  baseVelocity = 3, 
  direction = 'left',
  className = '',
  repeat = 3
}) => {
  const baseX = useMotionValue(0);
  const { scrollY } = useScroll();
  const scrollVelocity = useMotionValue(0);
  const smoothVelocity = useSpring(scrollVelocity, {
    damping: 50,
    stiffness: 400
  });
  
  const velocityFactor = useTransform(smoothVelocity, [0, 1000], [0, 5], {
    clamp: false
  });
  
  const directionFactor = direction === 'right' ? -1 : 1;
  
  const containerRef = useRef(null);
  const contentRef = useRef(null);
  
  /**
   * This is a workaround to make the content repeat seamlessly.
   * We duplicate the content multiple times to create a continuous stream.
   */
  const contentArray = Array(repeat).fill(children);
  
  useEffect(() => {
    let prevScrollY = scrollY.get();
    let lastTimestamp = performance.now();
    
    const updateScrollVelocity = () => {
      const currentScrollY = scrollY.get();
      const currentTimestamp = performance.now();
      const timeDelta = currentTimestamp - lastTimestamp;
      
      if (timeDelta > 0) {
        const scrollDelta = currentScrollY - prevScrollY;
        const calculatedVelocity = scrollDelta / timeDelta;
        
        scrollVelocity.set(calculatedVelocity * 1000); // Scale for better control
      }
      
      prevScrollY = currentScrollY;
      lastTimestamp = currentTimestamp;
      
      requestAnimationFrame(updateScrollVelocity);
    };
    
    const animateX = () => {
      if (!containerRef.current || !contentRef.current) return;
      
      const contentWidth = contentRef.current.offsetWidth;
      const containerWidth = containerRef.current.offsetWidth;
      
      const xFactor = baseVelocity * directionFactor;
      const scrollFactor = velocityFactor.get();
      
      let x = baseX.get();
      
      // When content scrolls out of view, reset position for seamless loop
      if (direction === 'left') {
        x -= xFactor + scrollFactor;
        if (x < -contentWidth) {
          x = 0;
        }
      } else {
        x += xFactor + scrollFactor;
        if (x > 0) {
          x = -contentWidth + containerWidth;
        }
      }
      
      baseX.set(x);
      contentRef.current.style.transform = `translateX(${x}px)`;
      
      requestAnimationFrame(animateX);
    };
    
    const scrollVelocityFrame = requestAnimationFrame(updateScrollVelocity);
    const animateFrame = requestAnimationFrame(animateX);
    
    return () => {
      cancelAnimationFrame(scrollVelocityFrame);
      cancelAnimationFrame(animateFrame);
    };
  }, [baseVelocity, baseX, directionFactor, scrollVelocity, scrollY, velocityFactor, direction]);
  
  return (
    <div className={`scroll-velocity-container ${className}`} ref={containerRef}>
      <div className="scroll-velocity-content" ref={contentRef}>
        {contentArray.map((content, index) => (
          <div key={index} className="scroll-velocity-item">
            {content}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ScrollVelocity;
