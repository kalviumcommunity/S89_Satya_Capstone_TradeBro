import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiShield, FiCopy, FiCheck } from 'react-icons/fi';
import { toast } from 'react-toastify';
import settingsService from '../../services/settingsService';
import './TwoFASetupModal.css';

const TwoFASetupModal = ({ isOpen, onClose, qrCodeUrl, onVerifySuccess }) => {
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [secretKey, setSecretKey] = useState('');
  const [copied, setCopied] = useState(false);

  const handleCopySecret = () => {
    navigator.clipboard.writeText(secretKey);
    setCopied(true);
    toast.success('Secret key copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleVerify = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast.error('Please enter a valid 6-digit code');
      return;
    }

    setIsVerifying(true);
    try {
      const response = await settingsService.verify2FA(verificationCode);
      if (response.success) {
        onVerifySuccess();
        setVerificationCode('');
      } else {
        toast.error(response.message || 'Invalid verification code');
      }
    } catch (error) {
      console.error('Error verifying 2FA:', error);
      toast.error('Failed to verify code');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleClose = () => {
    setVerificationCode('');
    setCopied(false);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
        >
          <motion.div
            className="modal-content two-fa-modal"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div className="modal-title">
                <FiShield className="modal-icon" />
                <h2>Setup Two-Factor Authentication</h2>
              </div>
              <button className="modal-close" onClick={handleClose}>
                <FiX />
              </button>
            </div>

            <div className="modal-body">
              <div className="two-fa-steps">
                <div className="step">
                  <h3>Step 1: Install an Authenticator App</h3>
                  <p>Download and install an authenticator app like Google Authenticator, Authy, or Microsoft Authenticator on your mobile device.</p>
                </div>

                <div className="step">
                  <h3>Step 2: Scan QR Code</h3>
                  <div className="qr-code-container">
                    {qrCodeUrl ? (
                      <img src={qrCodeUrl} alt="2FA QR Code" className="qr-code" />
                    ) : (
                      <div className="qr-placeholder">QR Code will appear here</div>
                    )}
                  </div>
                  <p>Scan this QR code with your authenticator app, or manually enter the secret key:</p>
                  {secretKey && (
                    <div className="secret-key">
                      <code>{secretKey}</code>
                      <button className="copy-button" onClick={handleCopySecret}>
                        {copied ? <FiCheck /> : <FiCopy />}
                      </button>
                    </div>
                  )}
                </div>

                <div className="step">
                  <h3>Step 3: Enter Verification Code</h3>
                  <p>Enter the 6-digit code from your authenticator app:</p>
                  <div className="verification-input">
                    <input
                      type="text"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="000000"
                      className="code-input"
                      maxLength="6"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={handleClose}>
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleVerify}
                disabled={isVerifying || verificationCode.length !== 6}
              >
                {isVerifying ? 'Verifying...' : 'Verify & Enable'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default TwoFASetupModal;