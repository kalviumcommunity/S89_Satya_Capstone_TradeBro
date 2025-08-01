import React from 'react';
import { FiMic, FiMicOff } from 'react-icons/fi';
import { useVoice } from '../../contexts/VoiceContext';

const SaytrixTriggerButton = ({
  position = "navbar",
  size = "small",
  showLabel = false,
  className = ""
}) => {
  const { isVoiceModeActive, isListening, isSupported, triggerVoiceMode } = useVoice();

  const handleClick = () => {
    triggerVoiceMode();
  };

  if (!isSupported) {
    return null; // Don't show button if voice is not supported
  }

  return (
    <button
      className={`saytrix-trigger-btn ${position} ${size} ${className} ${isVoiceModeActive ? 'active' : ''} ${isListening ? 'listening' : ''}`}
      onClick={handleClick}
      title={isVoiceModeActive ? "Deactivate Saytrix AI" : "Activate Saytrix AI"}
      aria-label={isVoiceModeActive ? "Deactivate Saytrix AI voice assistant" : "Activate Saytrix AI voice assistant"}
    >
      {isVoiceModeActive ? <FiMicOff /> : <FiMic />}
      {showLabel && <span>Saytrix</span>}
      {isListening && <div className="pulse-indicator" />}
    </button>
  );
};

export default SaytrixTriggerButton;
