import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiMail, FiSend } from "react-icons/fi";
import Squares from "../UI/squares";
import '../styles/pages/AuthPages.css';

const ForgetPassword = () => {
  const [email, setEmail] = useState('');
  const navigate = useNavigate();
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Requesting OTP for:", email);

    try {
      // Simulate sending OTP (replace with actual API call)
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/auth/forgotpassword`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        await setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
        }, 2000);
        setTimeout(() => {
          navigate('/resetpassword');
        }, 1000);
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Failed to send OTP. Please try again.');
      }
    } catch (error) {
      console.error('Error sending OTP:', error);
      alert('An error occurred. Please try again.');
    }
  };

  return (
    <div className="auth-full-bg">
      {/* Squares Background */}
      <Squares
        speed={0.5}
        squareSize={40}
        direction="diagonal"
        borderColor="#cccccc"
        hoverFillColor="#ffffff"
        backgroundColor="#f0f8ff"
      />

      <div className="auth-box">
        <h2 className="auth-title">Forgot Password</h2>
        <p className="auth-desc">Enter your email to receive an OTP for password reset.</p>
        <form onSubmit={handleSubmit} className="auth-form">
          <input
            type="email"
            className="auth-input"
            placeholder="Your email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button type="submit" className="auth-btn">Send OTP</button>
        </form>
        <p className="auth-forgot">
          Remembered your password? <a href="/login">Log In</a>
        </p>
      </div>
      {success &&
        <div className="success-message">OTP Sent successfully!</div>
      }
    </div>
  );
};

export default ForgetPassword;
