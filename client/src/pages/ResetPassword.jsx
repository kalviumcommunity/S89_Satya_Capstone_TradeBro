import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './AuthPages.css';

const ResetPassword = () => {
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Resetting with OTP:", otp, "New password:", newPassword);

    try {
      const response = await fetch('http://localhost:5000/api/auth/resetpassword', {
        method: 'PUT', // Use PUT method
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ otp, newPassword }),
      });

      if (response.ok) {
        const data = await response.json();
        alert(data.message || 'Password reset successfully!');
        navigate('/login'); // Redirect to login page
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
    </div>
  );
};

export default ResetPassword;