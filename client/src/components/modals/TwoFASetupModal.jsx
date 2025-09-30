import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiShield, FiMail, FiCheck, FiRefreshCw } from 'react-icons/fi';
import { toast } from 'react-toastify';
import settingsService from '../../services/settingsService';
import './TwoFASetupModal.css';

const TwoFASetupModal = ({ isOpen, onClose, userEmail, onVerifySuccess }) => {
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [step, setStep] = useState(1);
  const [codeSent, setCodeSent] = useState(false);

  const sendVerificationCode = async () => {
    setIsSendingCode(true);
    try {
      const response = await settingsService.send2FACode(userEmail);
      if (response.success) {
        setCodeSent(true);
        setStep(2);
        toast.success('Verification code sent to your email!');
      } else {
        toast.error(response.message || 'Failed to send verification code');
      }
    } catch (error) {
      console.error('Error sending 2FA code:', error);
      toast.error('Failed to send verification code');
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleVerify = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast.error('Please enter a valid 6-digit code');
      return;
    }

    setIsVerifying(true);
    try {
      const response = await settingsService.verify2FACode(verificationCode);
      if (response.success) {
        onVerifySuccess();
        handleClose();
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
    setStep(1);
    setCodeSent(false);
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
              {step === 1 && (
                <div className="setup-step">
                  <h3>Email-Based Two-Factor Authentication</h3>
                  <p>We'll send a verification code to your email address each time you log in.</p>
                  
                  <div className="email-info">
                    <div className="email-display">
                      <FiMail className="email-icon" />
                      <span>{userEmail}</span>
                    </div>
                  </div>

                  <div className="info-box">
                    <h4>How it works:</h4>
                    <ul>
                      <li>Each time you log in, we'll send a 6-digit code to your email</li>
                      <li>Enter the code to complete your login</li>
                      <li>This adds an extra layer of security to your account</li>
                    </ul>
                  </div>

                  <button 
                    className="btn btn-primary"
                    onClick={sendVerificationCode}
                    disabled={isSendingCode}
                  >
                    {isSendingCode ? (
                      <><FiRefreshCw className="spinning" /> Sending Code...</>
                    ) : (
                      <><FiMail /> Send Verification Code</>
                    )}
                  </button>
                </div>
              )}

              {step === 2 && (
                <div className="setup-step">
                  <h3>Enter Verification Code</h3>
                  <p>We've sent a 6-digit code to <strong>{userEmail}</strong></p>
                  
                  <div className="verification-input">
                    <input
                      type="text"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="000000"
                      className="code-input"
                      maxLength="6"
                      autoFocus
                    />
                  </div>

                  <div className="resend-section">
                    <p>Didn't receive the code?</p>
                    <button 
                      className="btn-link"
                      onClick={sendVerificationCode}
                      disabled={isSendingCode}
                    >
                      {isSendingCode ? 'Sending...' : 'Resend Code'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={handleClose}>
                Cancel
              </button>
              {step === 2 && (
                <>
                  <button 
                    className="btn btn-secondary"
                    onClick={() => setStep(1)}
                  >
                    Back
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={handleVerify}
                    disabled={isVerifying || verificationCode.length !== 6}
                  >
                    {isVerifying ? (
                      <><FiRefreshCw className="spinning" /> Verifying...</>
                    ) : (
                      <><FiCheck /> Enable 2FA</>
                    )}
                  </button>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default TwoFASetupModal;