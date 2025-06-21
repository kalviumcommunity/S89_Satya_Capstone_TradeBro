import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import { motion } from "framer-motion";
import { FiMail, FiLock, FiLogIn } from "react-icons/fi";
import { login } from "../redux/reducers/authReducer";
import { showErrorToast, showSuccessToast } from "../redux/reducers/toastReducer";
import { useAuth } from "../context/AuthContext";
import API_ENDPOINTS from "../config/apiConfig";
import Loading from "../components/common/Loading";
import "../styles/pages/AuthPages.css";
import Squares from "../UI/squares";

const Login = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { loading, error, isAuthenticated } = useSelector(state => state.auth);
  const { login: authLogin } = useAuth();

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
        // Store token in localStorage first to ensure it's available
        localStorage.setItem('authToken', response.data.token);

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
      // Wait for authentication state to be set before redirecting
      const checkAuthAndRedirect = () => {
        const storedToken = localStorage.getItem('authToken');
        if (storedToken && isAuthenticated) {
          console.log("Authentication confirmed, redirecting to dashboard");
          navigate("/dashboard", { replace: true });
        } else if (storedToken) {
          console.log("Token found but auth state not updated yet, waiting...");
          // Force authentication state update
          login(storedToken, response.data.user, true);
          setTimeout(checkAuthAndRedirect, 500);
        } else {
          console.warn("No token found, forcing redirect anyway");
          navigate("/dashboard", { replace: true });
        }
      };

      // Start checking sooner
      setTimeout(checkAuthAndRedirect, 500);
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

  const handleDemoLogin = async () => {
    setLocalLoading(true);
    try {
      // Demo credentials
      const demoEmail = "demo@tradebro.com";
      const demoPassword = "demo123";

      const response = await axios.post(API_ENDPOINTS.AUTH.LOGIN, {
        email: demoEmail,
        password: demoPassword,
      });
      console.log("Demo login successful:", response.data);

      // Store the token and user data
      if (response.data.token) {
        localStorage.setItem('authToken', response.data.token);
        dispatch(login(response.data.token, response.data.user));
        dispatch(showSuccessToast("Demo login successful!"));
      }

      setSuccess(true);

      // Redirect to dashboard
      const checkAuthAndRedirect = () => {
        const storedToken = localStorage.getItem('authToken');
        if (storedToken && isAuthenticated) {
          console.log("Demo authentication confirmed, redirecting to dashboard");
          navigate("/dashboard", { replace: true });
        } else if (storedToken) {
          console.log("Demo token found but auth state not updated yet, waiting...");
          authLogin(storedToken, null, true);
          setTimeout(checkAuthAndRedirect, 500);
        }
      };

      setTimeout(checkAuthAndRedirect, 500);
    } catch (error) {
      console.error("Demo login error:", error.response?.data || error.message);
      dispatch(showErrorToast("Demo login failed. Creating demo account..."));

      // If demo login fails, try to create demo account
      try {
        const signupResponse = await axios.post(API_ENDPOINTS.AUTH.SIGNUP, {
          email: "demo@tradebro.com",
          password: "demo123",
          username: "demo",
          fullName: "Demo User"
        });

        if (signupResponse.data.token) {
          localStorage.setItem('authToken', signupResponse.data.token);
          dispatch(login(signupResponse.data.token, signupResponse.data.user));
          dispatch(showSuccessToast("Demo account created and logged in!"));
          setSuccess(true);
          setTimeout(() => navigate("/dashboard", { replace: true }), 1000);
        }
      } catch (signupError) {
        console.error("Demo signup error:", signupError);
        dispatch(showErrorToast("Demo setup failed. Please try manual login."));
      }
    } finally {
      setLocalLoading(false);
    }
  };

  // Handle Google login redirect
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    const token = urlParams.get('token');
    const google = urlParams.get('google');
    const newUser = urlParams.get('newUser');

    if (success === 'true' && token && google === 'true') {
      console.log('Google login successful, processing token', newUser === 'true' ? '(New User)' : '(Existing User)');

      // Clear URL parameters
      window.history.replaceState({}, document.title, '/login');

      // Store token in localStorage first to ensure it's available
      localStorage.setItem('authToken', token);

      // Process the token using Redux
      dispatch(login(token));

      if (newUser === 'true') {
        // New user - show welcome message and stay on login page briefly before redirecting
        dispatch(showSuccessToast("Welcome to TradeBro! Your Google account has been successfully registered."));
        setSuccess(true);

        // Show success message for new users
        setTimeout(() => {
          setSuccess(false);
          console.log("New user registration complete, redirecting to dashboard");
          navigate("/dashboard", { replace: true });
        }, 2500); // Longer delay for new users to see welcome message
      } else {
        // Existing user - quick redirect
        dispatch(showSuccessToast("Google login successful!"));
        setSuccess(true);

        // Wait for authentication state to be set before redirecting
        const checkAuthAndRedirect = () => {
          const storedToken = localStorage.getItem('authToken');
          if (storedToken && isAuthenticated) {
            console.log("Google authentication confirmed, redirecting to dashboard");
            navigate("/dashboard", { replace: true });
          } else if (storedToken) {
            console.log("Google token found but auth state not updated yet, waiting...");
            // Force authentication state update
            login(storedToken, null, true);
            setTimeout(checkAuthAndRedirect, 500);
          } else {
            console.warn("No Google token found, forcing redirect anyway");
            navigate("/dashboard", { replace: true });
          }
        };

        // Start checking sooner for existing users
        setTimeout(() => {
          setSuccess(false);
          checkAuthAndRedirect();
        }, 1000);
      }
    }
  }, [dispatch, navigate, isAuthenticated]);

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

          <motion.button
            type="submit"
            className="auth-btn"
            disabled={loading || localLoading}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            animate={success ? {
              scale: [1, 1.1, 1],
              backgroundColor: ["#55828b", "#4CAF50", "#55828b"],
              transition: { duration: 0.6 }
            } : {}}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            {loading || localLoading ? (
              <Loading size="small" text="" />
            ) : success ? (
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                ✓ Success!
              </motion.div>
            ) : (
              <>
                <FiLogIn style={{ marginRight: '8px' }} /> Log In
              </>
            )}
          </motion.button>
        </form>

        <p className="auth-option">
          Don't have an account? <Link to="/signup">Sign Up</Link>
        </p>

        <p className="auth-forgot">
          <Link to="/forgotpassword">Forgot Password?</Link>
        </p>

        <div className="google-signup">
          <p>Or</p>
          <motion.button
            className="google-button"
            onClick={handleGoogleLogin}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
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
          </motion.button>

          <motion.button
            className="demo-button"
            onClick={handleDemoLogin}
            disabled={loading || localLoading}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
            style={{
              marginTop: "10px",
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              color: "white",
              border: "none",
              padding: "12px 24px",
              borderRadius: "8px",
              fontSize: "16px",
              fontWeight: "500",
              cursor: "pointer",
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px"
            }}
          >
            🚀 Try Demo Login
          </motion.button>
        </div>
      </div>
      {success &&
        <div className="success-message">
          {new URLSearchParams(window.location.search).get('newUser') === 'true'
            ? 'Welcome to TradeBro! Registration successful!'
            : 'Login successful!'}
        </div>
      }
    </div>
  );
};

export default Login;
