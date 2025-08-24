import React, { useState } from 'react';
import { FiShield, FiCheck, FiX } from 'react-icons/fi';

const TwoFactorAuth = ({ onVerify, onCancel, email }) => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (code.length !== 6) {
      setError('Please enter a 6-digit code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/verify-2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code })
      });

      const data = await response.json();
      
      if (data.success) {
        onVerify(data.token, data.user);
      } else {
        setError(data.message || 'Invalid code');
      }
    } catch (err) {
      setError('Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="two-factor-modal">
      <div className="two-factor-content">
        <div className="two-factor-header">
          <FiShield size={32} />
          <h2>Two-Factor Authentication</h2>
          <p>Enter the 6-digit code sent to {email}</p>
        </div>

        <form onSubmit={handleSubmit} className="two-factor-form">
          <div className="code-input-group">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              className="code-input"
              maxLength={6}
              autoFocus
            />
          </div>

          {error && (
            <div className="error-message">
              <FiX size={16} />
              {error}
            </div>
          )}

          <div className="two-factor-actions">
            <button
              type="button"
              onClick={onCancel}
              className="cancel-btn"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="verify-btn"
              disabled={loading || code.length !== 6}
            >
              {loading ? 'Verifying...' : (
                <>
                  <FiCheck size={16} />
                  Verify
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TwoFactorAuth;