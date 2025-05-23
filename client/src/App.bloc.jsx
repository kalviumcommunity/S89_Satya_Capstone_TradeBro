// App.bloc.jsx - Bloc pattern implementation
import React, { useEffect } from "react";
import { BrowserRouter as Router } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { Provider } from "react-redux";
import { PusherProvider } from "./context/PusherContext.jsx";
import { ToastProvider } from "./context/ToastContext.jsx";
import { OfflineProvider } from "./context/OfflineContext.jsx";
import ErrorBoundary from "./components/ErrorBoundary";
import AppRoutes from "./approutes";
import store from "./redux/store";
import "./styles/theme.css";
import "./styles/DarkMode.css";
import "./styles/textures.css";
import "./styles/text-readability.css"; /* New file for improved text readability */
import "./styles/remove-focus-effects.css"; /* Remove focus/active state effects around icons */
import "./App.css";
import "./styles/components/ErrorBoundary.css";
import ToastContainer from "./components/ToastContainer";

// Import bloc components
import { BlocProvider } from "./bloc/BlocProvider";
import AuthBloc from "./bloc/blocs/AuthBloc";
import StockBloc from "./bloc/blocs/StockBloc";
import { CheckAuthEvent } from "./bloc/events/AuthEvents";

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

// Create bloc instances
const authBloc = new AuthBloc();
const stockBloc = new StockBloc();

// Create a blocs object to provide to BlocProvider
const blocs = {
  auth: authBloc,
  stock: stockBloc,
};

const AppContent = () => {
  useEffect(() => {
    // Check authentication status using bloc
    authBloc.add(new CheckAuthEvent());

    // Initialize stock data
    // This would be done in specific components when needed
  }, []);

  return (
    <Router>
      <div className="app-wrapper">
        <AppRoutes />
      </div>
    </Router>
  );
};

const App = () => {
  return (
    <ErrorBoundary showDetails={process.env.NODE_ENV === 'development'}>
      {/* We still use Redux Provider for backward compatibility during transition */}
      <Provider store={store}>
        {/* Provide blocs to the component tree */}
        <BlocProvider blocs={blocs}>
          <ToastProvider>
            <OfflineProvider>
              <GoogleOAuthProvider clientId={clientId}>
                <PusherProvider>
                  <AppContent />
                </PusherProvider>
              </GoogleOAuthProvider>
            </OfflineProvider>
          </ToastProvider>
        </BlocProvider>
      </Provider>
    </ErrorBoundary>
  );
};

export default App;
