// App.jsx
import React from "react";
import { BrowserRouter as Router } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { ThemeProvider } from "./context/ThemeContext";
import { ToastProvider } from "./context/ToastContext";
import AppRoutes from "./approutes";
import ThemeToggle from "./components/ThemeToggle";
import "./styles/theme.css";
import "./App.css";

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

const App = () => {
  return (
    <GoogleOAuthProvider clientId={clientId}>
      <ThemeProvider>
        <ToastProvider>
          <Router>
            <div className="app-wrapper">
              <AppRoutes />
              <ThemeToggle />
            </div>
          </Router>
        </ToastProvider>
      </ThemeProvider>
    </GoogleOAuthProvider>
  );
};

export default App;
