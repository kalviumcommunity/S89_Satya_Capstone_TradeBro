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
      const apiUrl = import.meta.env.VITE_API_URL || 'https://s89-satya-capstone-tradebro.onrender.com';
      const response = await fetch(`${apiUrl}/api/auth/verify-2fa`, {
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
    <div className="auth-page">
      <div className="auth-card two-factor-card">
        <div className="auth-header">
          <div className="auth-logo">
            <div className="auth-logo-icon">🔐</div>
            <h1 className="auth-logo-text">TradeBro</h1>
          </div>
          <div>
            <h2 className="auth-title">Two-Factor Authentication</h2>
            <p className="auth-subtitle">Enter the 6-digit code sent to {email}</p>
            {/* <div className="demo-code-notice">
              <p style={{color: 'var(--info)', fontSize: '0.85rem', marginTop: '0.5rem'}}>
                📧 Check your email for the code, or use <strong>123456</strong> for demo
              </p>
            </div> */}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label className="form-label">
              <FiShield size={16} />
              Verification Code
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="Enter 6-digit code"
              className="form-input code-input"
              maxLength={6}
              autoFocus
              style={{
                textAlign: 'center',
                fontSize: '1.5rem',
                letterSpacing: '0.5rem',
                fontWeight: '600'
              }}
            />
          </div>

          {error && (
            <div className="error-message">
              <FiX size={16} />
              <span>{error}</span>
            </div>
          )}

          <div className="form-actions">
            <button
              type="button"
              onClick={onCancel}
              className="btn btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || code.length !== 6}
            >
              {loading ? 'Verifying...' : (
                <>
                  <FiCheck size={16} />
                  Verify Code
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