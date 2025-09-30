import React from 'react';

const ToggleSwitch = ({ label, description, icon: Icon, isToggled, onToggle }) => {
  return (
    <div className="toggle-item">
      <div className="toggle-info">
        {Icon && <Icon className="toggle-icon" />}
        <div>
          <div className="toggle-label">{label}</div>
          <div className="toggle-description">{description}</div>
        </div>
      </div>
      <div
        className={`toggle-switch ${isToggled ? 'on' : 'off'}`}
        onClick={onToggle}
      >
        <div className="toggle-thumb"></div>
      </div>
    </div>
  );
};

export default ToggleSwitch;