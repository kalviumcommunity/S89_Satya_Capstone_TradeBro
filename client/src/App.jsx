// App.jsx
import React from "react";
import { BrowserRouter as Router } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { ThemeProvider } from "./context/ThemeContext";
import { ToastProvider } from "./context/ToastContext";
import { SidebarProvider } from "./context/SidebarContext";
import { AuthProvider } from "./context/AuthContext";
import { PusherProvider } from "./context/PusherContext";
import AppRoutes from "./approutes";
import "./styles/theme.css";
import "./styles/DarkMode.css";
import "./App.css";

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

const App = () => {
  return (
    <GoogleOAuthProvider clientId={clientId}>
      <ThemeProvider>
        <ToastProvider>
          <SidebarProvider>
            <AuthProvider>
              <PusherProvider>
                <Router>
                  <div className="app-wrapper">
                    <AppRoutes />
                  </div>
                </Router>
              </PusherProvider>
            </AuthProvider>
          </SidebarProvider>
        </ToastProvider>
      </ThemeProvider>
    </GoogleOAuthProvider>
  );
};

export default App;
