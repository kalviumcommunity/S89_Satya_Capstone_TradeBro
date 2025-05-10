import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import PropTypes from 'prop-types';

/**
 * ParallaxSection component that creates a parallax scrolling effect
 */
const ParallaxSection = ({
  children,
  speed = 0.2,
  direction = 'up',
  className = '',
  ...props
}) => {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start']
  });

  // Calculate transform based on direction and speed
  const getTransform = () => {
    switch (direction) {
      case 'up':
        return useTransform(scrollYProgress, [0, 1], ['0%', `${-100 * speed}%`]);
      case 'down':
        return useTransform(scrollYProgress, [0, 1], ['0%', `${100 * speed}%`]);
      case 'left':
        return useTransform(scrollYProgress, [0, 1], ['0%', `${-100 * speed}%`]);
      case 'right':
        return useTransform(scrollYProgress, [0, 1], ['0%', `${100 * speed}%`]);
      default:
        return useTransform(scrollYProgress, [0, 1], ['0%', `${-100 * speed}%`]);
    }
  };

  const transform = getTransform();
  const isHorizontal = direction === 'left' || direction === 'right';

  return (
    <div ref={ref} className={`relative overflow-hidden ${className}`} {...props}>
      <motion.div
        style={{
          [isHorizontal ? 'x' : 'y']: transform,
          width: '100%',
          height: '100%'
        }}
      >
        {children}
      </motion.div>
    </div>
  );
};

ParallaxSection.propTypes = {
  children: PropTypes.node.isRequired,
  speed: PropTypes.number,
  direction: PropTypes.oneOf(['up', 'down', 'left', 'right']),
  className: PropTypes.string
};

export default ParallaxSection;
