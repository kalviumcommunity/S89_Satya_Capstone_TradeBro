import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/pages/AuthPages.css';
import Squares from "../UI/squares";

const ResetPassword = () => {
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const navigate = useNavigate();
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch('http://localhost:5000/api/auth/resetpassword', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ otp, newPassword }),
      });

      if (response.ok) {
        const data = await response.json();
        await setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
      }, 2000);
      setTimeout(() => {
        navigate('/login');
      }, 1000);
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Failed to reset password. Please try again.');
      }
    } catch (error) {
      console.error('Error resetting password:', error);
      alert('An error occurred. Please try again.');
    }
  };

  return (
    <div className="auth-full-bg">
      <Squares
        speed={0.5}
        squareSize={40}
        direction="diagonal"
        borderColor="#cccccc"
        hoverFillColor="#ffffff"
        backgroundColor="#f0f8ff"
      />
      <div className="auth-box">
        <h2 className="auth-title">Reset Password</h2>
        <p className="auth-desc">Enter the OTP sent to your email and set a new password.</p>
        <form onSubmit={handleSubmit} className="auth-form">
          <input
            type="text"
            className="auth-input"
            placeholder="Enter OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            required
          />
          <input
            type="password"
            className="auth-input"
            placeholder="New Password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
          <button type="submit" className="auth-btn">Reset Password</button>
        </form>
      </div>
      {success &&
          <div className="success-message">Reset Password successful!</div>
          }
    </div>
  );
};

export default ResetPassword;