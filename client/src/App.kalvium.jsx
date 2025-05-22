// App.kalvium.jsx - Kalvium-inspired implementation
import React, { useEffect } from "react";
import { BrowserRouter as Router } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { Provider } from "react-redux";
import { PusherProvider } from "./context/PusherContext.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { ToastProvider } from "./context/ToastContext.jsx";
import { VirtualMoneyProvider } from "./context/VirtualMoneyContext.jsx";
import { SidebarProvider } from "./context/SidebarContext.jsx";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import { OfflineProvider } from "./context/OfflineContext.jsx";
import { NotificationProvider } from "./context/NotificationContext.jsx";
import ErrorBoundary from "./components/ErrorBoundary";
import AppRoutes from "./approutes.kalvium";
import store from "./redux/store";
import { initializeTheme } from "./redux/reducers/themeReducer";
import { checkAuth } from "./redux/reducers/authReducer";

/* All styles are now imported through index.css */
import "./styles/components/ErrorBoundary.css";
import ToastContainer from "./components/ToastContainer";

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

const AppContent = () => {
  useEffect(() => {
    // Initialize theme
    store.dispatch(initializeTheme());

    // Check authentication status
    store.dispatch(checkAuth());
  }, []);

  return (
    <Router>
      <div className="app-wrapper">
        <AppRoutes />
        {/* ToastContainer is now handled by ToastProvider */}
      </div>
    </Router>
  );
};

const App = () => {
  return (
    <ErrorBoundary showDetails={process.env.NODE_ENV === 'development'}>
      <Provider store={store}>
        <ToastProvider>
          <AuthProvider>
            <ThemeProvider>
              <OfflineProvider>
                <NotificationProvider>
                  <GoogleOAuthProvider clientId={clientId}>
                    <PusherProvider>
                      <VirtualMoneyProvider>
                        <SidebarProvider>
                          <AppContent />
                        </SidebarProvider>
                      </VirtualMoneyProvider>
                    </PusherProvider>
                  </GoogleOAuthProvider>
                </NotificationProvider>
              </OfflineProvider>
            </ThemeProvider>
          </AuthProvider>
        </ToastProvider>
      </Provider>
    </ErrorBoundary>
  );
};

export default App;
