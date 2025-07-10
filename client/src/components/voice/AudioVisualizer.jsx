import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

const AudioVisualizer = ({ 
  isActive = false, 
  type = 'waveform',
  color = '#00ffff',
  size = 'medium', // 'small', 'medium', 'large'
  sensitivity = 1.0,
  className = ''
}) => {
  const [audioData, setAudioData] = useState(new Array(32).fill(0));
  const [isInitialized, setIsInitialized] = useState(false);
  const [averageVolume, setAverageVolume] = useState(0);
  
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const microphoneRef = useRef(null);
  const animationFrameRef = useRef(null);
  const streamRef = useRef(null);

  // Initialize audio context and microphone
  useEffect(() => {
    if (isActive && !isInitialized) {
      initializeAudio();
    } else if (!isActive && isInitialized) {
      cleanup();
    }

    return () => cleanup();
  }, [isActive, isInitialized]);

  const initializeAudio = async () => {
    try {
      // Get microphone stream
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      streamRef.current = stream;

      // Create audio context
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      microphoneRef.current = audioContextRef.current.createMediaStreamSource(stream);

      // Configure analyser
      analyserRef.current.fftSize = 256;
      analyserRef.current.smoothingTimeConstant = 0.8;
      microphoneRef.current.connect(analyserRef.current);

      setIsInitialized(true);
      updateAudioData();
      
      console.log('🎵 Audio visualizer initialized');
    } catch (error) {
      console.error('Error initializing audio visualizer:', error);
    }
  };

  const updateAudioData = () => {
    if (!analyserRef.current) return;

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    analyserRef.current.getByteFrequencyData(dataArray);

    // Process audio data
    const processedData = [];
    const step = Math.floor(bufferLength / 32);
    
    for (let i = 0; i < 32; i++) {
      const start = i * step;
      const end = start + step;
      const slice = dataArray.slice(start, end);
      const average = slice.reduce((sum, value) => sum + value, 0) / slice.length;
      processedData.push((average / 255) * sensitivity);
    }

    // Calculate average volume
    const avgVol = processedData.reduce((sum, value) => sum + value, 0) / processedData.length;
    
    setAudioData(processedData);
    setAverageVolume(avgVol);

    animationFrameRef.current = requestAnimationFrame(updateAudioData);
  };

  const cleanup = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }

    setIsInitialized(false);
    setAudioData(new Array(32).fill(0));
    setAverageVolume(0);
    
    console.log('🔇 Audio visualizer cleaned up');
  };

  const getSizeClass = () => {
    switch (size) {
      case 'small': return 'visualizer-small';
      case 'large': return 'visualizer-large';
      default: return 'visualizer-medium';
    }
  };

  const renderWaveform = () => (
    <div className={`audio-waveform ${getSizeClass()}`}>
      {audioData.map((value, index) => (
        <motion.div
          key={index}
          className="wave-bar"
          style={{
            backgroundColor: color,
            boxShadow: `0 0 10px ${color}40`
          }}
          animate={{
            scaleY: Math.max(0.1, value * 2),
            opacity: 0.7 + (value * 0.3)
          }}
          transition={{
            duration: 0.1,
            ease: "easeOut"
          }}
        />
      ))}
    </div>
  );

  const renderCircular = () => (
    <div className={`audio-circular ${getSizeClass()}`}>
      <motion.div
        className="circular-visualizer"
        animate={{
          scale: 1 + (averageVolume * 0.5),
          opacity: 0.6 + (averageVolume * 0.4)
        }}
        transition={{
          duration: 0.1,
          ease: "easeOut"
        }}
      >
        {audioData.map((value, index) => {
          const angle = (index / audioData.length) * 360;
          const height = Math.max(10, value * 100);
          
          return (
            <motion.div
              key={index}
              className="circular-bar"
              style={{
                transform: `rotate(${angle}deg) translateY(-50px)`,
                height: `${height}px`,
                backgroundColor: color,
                boxShadow: `0 0 5px ${color}60`
              }}
              animate={{
                height: `${height}px`,
                opacity: 0.7 + (value * 0.3)
              }}
              transition={{
                duration: 0.1,
                ease: "easeOut"
              }}
            />
          );
        })}
      </motion.div>
    </div>
  );

  const renderBars = () => (
    <div className={`audio-bars ${getSizeClass()}`}>
      {audioData.slice(0, 16).map((value, index) => (
        <motion.div
          key={index}
          className="frequency-bar"
          style={{
            backgroundColor: color,
            boxShadow: `0 0 8px ${color}50`
          }}
          animate={{
            height: `${Math.max(4, value * 80)}px`,
            opacity: 0.6 + (value * 0.4)
          }}
          transition={{
            duration: 0.1,
            ease: "easeOut"
          }}
        />
      ))}
    </div>
  );

  if (!isActive) {
    return null;
  }

  return (
    <div className={`audio-visualizer ${className}`}>
      {type === 'waveform' && renderWaveform()}
      {type === 'circular' && renderCircular()}
      {type === 'bars' && renderBars()}
      
      <style jsx>{`
        .audio-visualizer {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .audio-waveform {
          display: flex;
          align-items: center;
          gap: 2px;
          height: 60px;
        }

        .audio-waveform.visualizer-small {
          height: 40px;
        }

        .audio-waveform.visualizer-large {
          height: 100px;
        }

        .wave-bar {
          width: 3px;
          min-height: 4px;
          border-radius: 2px;
          transform-origin: bottom;
        }

        .audio-circular {
          position: relative;
          width: 120px;
          height: 120px;
        }

        .audio-circular.visualizer-small {
          width: 80px;
          height: 80px;
        }

        .audio-circular.visualizer-large {
          width: 180px;
          height: 180px;
        }

        .circular-visualizer {
          position: relative;
          width: 100%;
          height: 100%;
          border-radius: 50%;
        }

        .circular-bar {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 2px;
          transform-origin: bottom center;
          border-radius: 1px;
        }

        .audio-bars {
          display: flex;
          align-items: end;
          gap: 3px;
          height: 50px;
        }

        .audio-bars.visualizer-small {
          height: 30px;
        }

        .audio-bars.visualizer-large {
          height: 80px;
        }

        .frequency-bar {
          width: 4px;
          min-height: 4px;
          border-radius: 2px;
        }

        @media (max-width: 768px) {
          .audio-waveform {
            height: 40px;
          }
          
          .audio-circular {
            width: 80px;
            height: 80px;
          }
          
          .audio-bars {
            height: 35px;
          }
        }
      `}</style>
    </div>
  );
};

export default AudioVisualizer;
