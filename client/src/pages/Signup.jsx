import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { FiUser, FiMail, FiLock, FiUserPlus } from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import API_ENDPOINTS from "../config/apiConfig";
import "../styles/pages/AuthPages.css";
import Squares from "../UI/squares";

const Signup = () => {
  const navigate = useNavigate();
  const { register, isAuthenticated } = useAuth();
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (form.password !== form.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(
        API_ENDPOINTS.AUTH.SIGNUP,
        {
          username: form.username,
          email: form.email,
          password: form.password,
        },
        { withCredentials: true }
      );

      // Store the token and user data in AuthContext and localStorage
      if (res.data.token) {
        // Store token in localStorage first to ensure it's available
        localStorage.setItem('authToken', res.data.token);

        // Pass both token and user data to the register function
        register(res.data.token, res.data.user);
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 1000);
      // Wait for authentication state to be set before redirecting
      const checkAuthAndRedirect = () => {
        const storedToken = localStorage.getItem('authToken');
        if (storedToken && isAuthenticated) {
          console.log("Signup authentication confirmed, redirecting to dashboard");
          navigate("/dashboard", { replace: true });
        } else if (storedToken) {
          console.log("Signup token found but auth state not updated yet, waiting...");
          setTimeout(checkAuthAndRedirect, 500);
        } else {
          console.warn("No signup token found, forcing redirect anyway");
          navigate("/dashboard", { replace: true });
        }
      };

      setTimeout(checkAuthAndRedirect, 1500);
    } catch (err) {
      console.error("Signup error:", err.response?.data || err.message);
      alert("Signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = () => {
    window.location.href = API_ENDPOINTS.AUTH.GOOGLE;
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
        <h2 className="auth-title">Sign Up</h2>
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="input-group">
            <div className="input-icon">
              <FiUser />
            </div>
            <input
              type="text"
              name="username"
              placeholder="Username"
              value={form.username}
              onChange={handleChange}
              className="auth-input"
              required
            />
          </div>
          <div className="input-group">
            <div className="input-icon">
              <FiMail />
            </div>
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={form.email}
              onChange={handleChange}
              className="auth-input"
              required
            />
          </div>
          <div className="input-group">
            <div className="input-icon">
              <FiLock />
            </div>
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
              className="auth-input"
              required
            />
          </div>
          <div className="input-group">
            <div className="input-icon">
              <FiLock />
            </div>
            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirm Password"
              value={form.confirmPassword}
              onChange={handleChange}
              className="auth-input"
              required
            />
          </div>
          <motion.button
            type="submit"
            className="auth-btn"
            disabled={loading}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            animate={success ? {
              scale: [1, 1.1, 1],
              backgroundColor: ["#55828b", "#4CAF50", "#55828b"],
              transition: { duration: 0.6 }
            } : {}}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            {loading ? (
              "Processing..."
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
                <FiUserPlus style={{ marginRight: '8px' }} /> Sign Up
              </>
            )}
          </motion.button>
        </form>
        <p className="auth-option">
          Already have an account? <Link to="/login">Log In</Link>
        </p>
        <div className="google-signup">
          <p>Or</p>
          <motion.button
            className="google-button"
            onClick={handleGoogleSignup}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <img
              src="/Google.png"
              style={{
                width: "20px",
                height: "20px",
                borderRadius: "50%",
                marginRight: "10px",
                verticalAlign: "middle",
              }}
            />
            Sign Up with Google
          </motion.button>
        </div>
      </div>
      {success &&
        <div className="success-message">Signup successful!</div>
      }
    </div>
  );
};

export default Signup;
