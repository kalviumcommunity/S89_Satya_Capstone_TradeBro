import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { FiMail, FiLock, FiLogIn } from "react-icons/fi";
import { useBloc } from "../bloc/BlocProvider";
import BlocBuilder from "../bloc/BlocBuilder";
import { LoginEvent } from "../bloc/events/AuthEvents";
import { AuthAuthenticated, AuthError, AuthLoading } from "../bloc/states/AuthStates";
import Loading from "../components/Loading";
import "../styles/pages/AuthPages.css";
import Squares from "../UI/squares";

const Login = () => {
  const navigate = useNavigate();
  const authBloc = useBloc('auth');

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate form
    const validationErrors = {};
    if (!email) validationErrors.email = "Email is required";
    if (!password) validationErrors.password = "Password is required";
    
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    // Clear errors
    setErrors({});
    
    // Dispatch login event to bloc
    authBloc.add(new LoginEvent(email, password));
  };

  return (
    <div className="auth-page">
      <Squares />
      
      <div className="auth-container">
        <motion.div
          className="auth-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="auth-header">
            <h1>Welcome Back</h1>
            <p>Sign in to continue to TradeBro</p>
          </div>
          
          <BlocBuilder
            bloc={authBloc}
            builder={(state) => {
              // Redirect if authenticated
              if (state instanceof AuthAuthenticated) {
                // Use effect to navigate after render
                useEffect(() => {
                  setSuccess(true);
                  const timer = setTimeout(() => {
                    navigate('/dashboard');
                  }, 1000);
                  return () => clearTimeout(timer);
                }, []);
                
                return (
                  <div className="auth-success">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.5 }}
                      className="success-icon"
                    >
                      <FiLogIn size={40} />
                    </motion.div>
                    <h2>Login Successful!</h2>
                    <p>Redirecting to dashboard...</p>
                  </div>
                );
              }
              
              // Show loading state
              if (state instanceof AuthLoading) {
                return <Loading text="Logging in..." />;
              }
              
              // Show error state
              const errorMessage = state instanceof AuthError ? state.error : null;
              
              // Show login form
              return (
                <form onSubmit={handleSubmit} className="auth-form">
                  {errorMessage && (
                    <div className="error-message">
                      {errorMessage}
                    </div>
                  )}
                  
                  <div className="form-group">
                    <label htmlFor="email">
                      <FiMail /> Email
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      className={errors.email ? "error" : ""}
                    />
                    {errors.email && <div className="error-text">{errors.email}</div>}
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="password">
                      <FiLock /> Password
                    </label>
                    <input
                      type="password"
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className={errors.password ? "error" : ""}
                    />
                    {errors.password && <div className="error-text">{errors.password}</div>}
                  </div>
                  
                  <div className="form-actions">
                    <Link to="/forgotpassword" className="forgot-password">
                      Forgot Password?
                    </Link>
                    
                    <button type="submit" className="auth-button">
                      <FiLogIn /> Login
                    </button>
                  </div>
                  
                  <div className="auth-footer">
                    <p>
                      Don't have an account? <Link to="/signup">Sign up</Link>
                    </p>
                  </div>
                </form>
              );
            }}
          />
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
