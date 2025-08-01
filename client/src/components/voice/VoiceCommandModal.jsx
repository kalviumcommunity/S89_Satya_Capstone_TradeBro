import React from 'react';
import { useVoice } from '../../contexts/VoiceContext';
import { FiMic, FiX } from 'react-icons/fi';
import './VoiceCommandModal.css';

const VoiceCommandModal = () => {
  const { isVoiceModeActive, isListening, transcript, stopListening } = useVoice();

  if (!isVoiceModeActive) {
    return null;
  }

  return (
    <div className="voice-modal-overlay">
      <div className="voice-modal">
        <div className="voice-modal-header">
          <h3>🎤 Saytrix Voice Commands</h3>
          <button 
            className="voice-modal-close"
            onClick={stopListening}
            aria-label="Close voice commands"
          >
            <FiX />
          </button>
        </div>

        <div className="voice-modal-content">
          <div className="voice-status">
            <div className={`voice-indicator ${isListening ? 'listening' : ''}`}>
              <FiMic />
              <div className="pulse-ring"></div>
              <div className="pulse-ring delay-1"></div>
              <div className="pulse-ring delay-2"></div>
            </div>
            <p className="voice-status-text">
              {isListening ? 'Listening for commands...' : 'Voice mode active'}
            </p>
          </div>

          {transcript && (
            <div className="voice-transcript">
              <p><strong>You said:</strong> "{transcript}"</p>
            </div>
          )}

          <div className="voice-commands-list">
            <h4>Available Commands:</h4>
            <div className="commands-grid">
              <div className="command-item">
                <span className="command-text">"Dashboard"</span>
                <span className="command-desc">Go to dashboard</span>
              </div>
              <div className="command-item">
                <span className="command-text">"Charts"</span>
                <span className="command-desc">Open charts</span>
              </div>
              <div className="command-item">
                <span className="command-text">"Portfolio"</span>
                <span className="command-desc">View portfolio</span>
              </div>
              <div className="command-item">
                <span className="command-text">"Watchlist"</span>
                <span className="command-desc">Open watchlist</span>
              </div>
              <div className="command-item">
                <span className="command-text">"Orders"</span>
                <span className="command-desc">View orders</span>
              </div>
              <div className="command-item">
                <span className="command-text">"History"</span>
                <span className="command-desc">Check history</span>
              </div>
              <div className="command-item">
                <span className="command-text">"News"</span>
                <span className="command-desc">Read news</span>
              </div>
              <div className="command-item">
                <span className="command-text">"Notifications"</span>
                <span className="command-desc">View notifications</span>
              </div>
              <div className="command-item">
                <span className="command-text">"Profile"</span>
                <span className="command-desc">Open profile</span>
              </div>
              <div className="command-item">
                <span className="command-text">"Settings"</span>
                <span className="command-desc">Open settings</span>
              </div>
              <div className="command-item">
                <span className="command-text">"Stop" / "Exit"</span>
                <span className="command-desc">Close voice mode</span>
              </div>
            </div>
          </div>

          <div className="voice-tips">
            <p><strong>💡 Tip:</strong> Say "Saytrix" anytime to activate voice commands</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoiceCommandModal;
