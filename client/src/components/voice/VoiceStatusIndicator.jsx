import React from 'react';
import { useVoice } from '../../contexts/VoiceContext';
import { FiMic } from 'react-icons/fi';
import './VoiceStatusIndicator.css';

const VoiceStatusIndicator = () => {
  const { isListening, isVoiceModeActive, isSupported } = useVoice();

  if (!isSupported || isVoiceModeActive) {
    return null;
  }

  return (
    <div className={`voice-status-indicator ${isListening ? 'listening' : ''}`}>
      <div className="voice-status-icon">
        <FiMic />
      </div>
      <div className="voice-status-text">
        <span>Say "Saytrix" to activate</span>
      </div>
      {isListening && (
        <div className="voice-pulse-rings">
          <div className="pulse-ring"></div>
          <div className="pulse-ring delay-1"></div>
          <div className="pulse-ring delay-2"></div>
        </div>
      )}
    </div>
  );
};

export default VoiceStatusIndicator;
