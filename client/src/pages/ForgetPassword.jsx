import { useState } from 'react';
import './AuthPages.css';

const ForgetPassword = () => {
  const [email, setEmail] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    // Trigger OTP request logic here
    console.log("Requesting OTP for:", email);
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2>Forgot Password</h2>
        <p>Enter your email to receive an OTP for password reset.</p>
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Your email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button type="submit">Send OTP</button>
        </form>
      </div>
    </div>
  );
};

export default ForgetPassword;
