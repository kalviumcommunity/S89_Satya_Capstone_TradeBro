import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import { motion } from "framer-motion";
import { FiMail, FiLock, FiLogIn } from "react-icons/fi";
import { login } from "../redux/reducers/authReducer";
import { showErrorToast, showSuccessToast } from "../redux/reducers/toastReducer";
import API_ENDPOINTS from "../config/apiConfig";
import Loading from "../components/common/Loading";
import "../styles/pages/AuthPages.css";
import Squares from "../UI/squares";

const Login = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { loading, error } = useSelector(state => state.auth);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [localLoading, setLocalLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const validateForm = () => {
    const newErrors = {};

    if (!email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Email is invalid";
    }

    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "email") setEmail(value);
    else if (name === "password") setPassword(value);

    // Clear error when user types
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: null
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLocalLoading(true);
    try {
      const response = await axios.post(API_ENDPOINTS.AUTH.LOGIN, {
        email,
        password,
      });
      console.log("Login successful:", response.data);

      // Store the token and user data using Redux
      if (response.data.token) {
        // Dispatch login action
        dispatch(login(response.data.token, response.data.user));
        dispatch(showSuccessToast("Login successful!"));
      }

      setSuccess(true);

      // Clear form
      setEmail("");
      setPassword("");

      // Redirect after a short delay
      setTimeout(() => setSuccess(false), 1000);
      setTimeout(() => {
        console.log("Redirecting to dashboard page after login");
        // Check if token is in localStorage before redirecting
        const storedToken = localStorage.getItem('authToken');
        if (storedToken) {
          console.log("Token found in localStorage, redirecting to dashboard");
          navigate("/dashboard", { replace: true });
        } else {
          console.warn("Token not found in localStorage, delaying redirect");
          // Try again after a short delay
          setTimeout(() => {
            console.log("Attempting redirect again");
            navigate("/dashboard", { replace: true });
          }, 1000);
        }
      }, 2000);
    } catch (error) {
      console.error("Login error:", error.response?.data || error.message);
      dispatch(showErrorToast(error.response?.data?.message || "Login failed. Please try again."));

      // Add shake animation to form
      const form = document.querySelector('.auth-form');
      form.classList.add('shake');
      setTimeout(() => form.classList.remove('shake'), 500);
    } finally {
      setLocalLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = API_ENDPOINTS.AUTH.GOOGLE;
  };

  // Handle Google login redirect
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    const token = urlParams.get('token');
    const google = urlParams.get('google');

    if (success === 'true' && token && google === 'true') {
      console.log('Google login successful, processing token');

      // Clear URL parameters
      window.history.replaceState({}, document.title, '/login');

      // Process the token using Redux
      dispatch(login(token));
      dispatch(showSuccessToast("Google login successful!"));

      // Show success message
      setSuccess(true);

      // Redirect to portfolio
      setTimeout(() => setSuccess(false), 1000);
      setTimeout(() => {
        console.log("Redirecting to dashboard page after Google login");
        // Check if token is in localStorage before redirecting
        const storedToken = localStorage.getItem('authToken');
        if (storedToken) {
          console.log("Token found in localStorage, redirecting to dashboard");
          navigate("/dashboard", { replace: true });
        } else {
          console.warn("Token not found in localStorage, delaying redirect");
          // Try again after a short delay
          setTimeout(() => {
            console.log("Attempting redirect again");
            navigate("/dashboard", { replace: true });
          }, 1000);
        }
      }, 2000);
    }
  }, [dispatch, navigate]);

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
        <h2 className="auth-title">Log In</h2>
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="input-group">
            <div className="input-icon">
              <FiMail />
            </div>
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={email}
              onChange={handleChange}
              className={`auth-input ${errors.email ? 'error' : ''}`}
              autoComplete="email"
            />
          </div>
          {errors.email && <div className="error-message">{errors.email}</div>}

          <div className="input-group">
            <div className="input-icon">
              <FiLock />
            </div>
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={password}
              onChange={handleChange}
              className={`auth-input ${errors.password ? 'error' : ''}`}
              autoComplete="current-password"
            />
          </div>
          {errors.password && <div className="error-message">{errors.password}</div>}

          <button
            type="submit"
            className="auth-btn"
            disabled={loading || localLoading}
          >
            {loading || localLoading ? (
              <Loading size="small" text="" />
            ) : (
              <>
                <FiLogIn style={{ marginRight: '8px' }} /> Log In
              </>
            )}
          </button>
        </form>

        <p className="auth-option">
          Don't have an account? <Link to="/signup">Sign Up</Link>
        </p>

        <p className="auth-forgot">
          <Link to="/forgotpassword">Forgot Password?</Link>
        </p>

        <div className="google-signup">
          <p>Or</p>
          <button
            className="google-button"
            onClick={handleGoogleLogin}
          >
            <img
              src="/Google.png"
              alt="Google logo"
              style={{
                width: "20px",
                height: "20px",
                marginRight: "10px",
                verticalAlign: "middle",
              }}
            />
            Log In with Google
          </button>
        </div>
      </div>
      {success &&
        <div className="success-message">Login successful!</div>
      }
    </div>
  );
};

export default Login;
