import React, { useEffect, useRef } from 'react';
import { motion, useAnimation } from 'framer-motion';
import './OrbBackground.css';

const OrbBackground = ({
  isActive = false,
  isListening = false,
  isProcessing = false,
  intensity = 1,
  className = '',
  showBackground = false
}) => {
  const orbRef = useRef(null);
  const controls = useAnimation();

  useEffect(() => {
    if (isActive) {
      if (isListening) {
        // Pulsing animation when listening
        controls.start({
          scale: [1, 1.2, 1],
          opacity: [0.6, 0.9, 0.6],
          transition: {
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }
        });
      } else if (isProcessing) {
        // Spinning animation when processing
        controls.start({
          rotate: 360,
          scale: [1, 1.1, 1],
          transition: {
            rotate: {
              duration: 3,
              repeat: Infinity,
              ease: "linear"
            },
            scale: {
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut"
            }
          }
        });
      } else {
        // Gentle floating animation when active but idle
        controls.start({
          y: [-10, 10, -10],
          scale: [1, 1.05, 1],
          opacity: [0.7, 0.8, 0.7],
          transition: {
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }
        });
      }
    } else {
      // Fade out when inactive
      controls.start({
        scale: 0.8,
        opacity: 0,
        transition: {
          duration: 0.5,
          ease: "easeOut"
        }
      });
    }
  }, [isActive, isListening, isProcessing, controls]);

  const orbVariants = {
    hidden: { 
      scale: 0,
      opacity: 0,
      filter: "blur(20px)"
    },
    visible: { 
      scale: 1,
      opacity: 0.8,
      filter: "blur(0px)",
      transition: {
        duration: 1,
        ease: "easeOut"
      }
    }
  };

  const getOrbColor = () => {
    if (isProcessing) return 'processing';
    if (isListening) return 'listening';
    if (isActive) return 'active';
    return 'inactive';
  };

  return (
    <div
      className={`orb-background ${className} ${showBackground || isActive ? 'show-background' : 'hide-background'}`}
      style={{
        background: showBackground || isActive ? 'rgba(0, 0, 0, 0.95)' : 'transparent',
        backdropFilter: showBackground || isActive ? 'blur(10px)' : 'none'
      }}
    >
      {/* Main Orb */}
      <motion.div
        ref={orbRef}
        className={`orb orb-${getOrbColor()}`}
        variants={orbVariants}
        initial="hidden"
        animate={isActive ? controls : "hidden"}
        style={{
          '--intensity': intensity
        }}
      >
        {/* Inner glow layers */}
        <div className="orb-inner orb-layer-1" />
        <div className="orb-inner orb-layer-2" />
        <div className="orb-inner orb-layer-3" />
        
        {/* Particle effects removed for cleaner design */}
      </motion.div>

      {/* Background gradient overlay */}
      <div className={`orb-gradient orb-gradient-${getOrbColor()}`} />
      
      {/* Ripple effects removed for cleaner design */}
    </div>
  );
};

export default OrbBackground;
