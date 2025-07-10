// App.jsx
import React, { useEffect, useState } from "react";
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
import { GlobalVoiceProvider } from "./context/GlobalVoiceContext.jsx";
import ErrorBoundary from "./components/ErrorBoundary";
import AppRoutes from "./approutes";
import SpeakingIndicator from "./components/SpeakingIndicator";

import VoiceStatusIndicator from "./components/VoiceStatusIndicator";
import VoiceCommandOverlay from "./components/voice/VoiceCommandOverlay";
import VoiceFloatingButton from "./components/voice/VoiceFloatingButton";
import SpeechPermissionHandler from "./components/voice/SpeechPermissionHandler";
// import SaytrixUI from "./components/voice/SaytrixUI";
// import SimpleSaytrix from "./components/voice/SimpleSaytrix";
import SaytrixAssistant from "./components/voice/SaytrixAssistant";
// import SaytrixTest from "./components/voice/SaytrixTest";

import store from "./redux/store";
import { initializeTheme } from "./redux/reducers/themeReducer";
// import useVoiceAssistant from "./hooks/useVoiceAssistant";
import "./styles/themes/theme.css";
import "./styles/DarkMode.css";
import "./styles/App.css";
import "./styles/components/ErrorBoundary.css";
import "./styles/el-classico-theme.css";
import "./styles/color-override.css"; // Must be last to override all other styles
import ToastContainer from "./components/ToastContainer";
import ThemeToggleEnhanced from "./components/ThemeToggleEnhanced";

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

const AppContent = () => {
  useEffect(() => {
    // Initialize theme
    store.dispatch(initializeTheme());
  }, []);

  return (
    <Router>
      <GlobalVoiceProvider>
        <div className="app-wrapper">
          <AppRoutes />

          {/* Voice Components */}
          <SpeakingIndicator />
          <VoiceStatusIndicator position="bottom-left" />
          <VoiceCommandOverlay />
          <VoiceFloatingButton />
          <SpeechPermissionHandler />

          {/* SAYTRIX Voice Assistant - Always Active */}
          <SaytrixAssistant />

          {/* Enhanced Theme Toggle */}
          <ThemeToggleEnhanced position="top-right" showLabel={true} />

          {/* Development Test Panel - Temporarily disabled */}
          {/* {process.env.NODE_ENV === 'development' && <SaytrixTest />} */}

          {/* ToastContainer is now handled by ToastProvider */}
        </div>
      </GlobalVoiceProvider>
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
