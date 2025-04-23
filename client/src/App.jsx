// App.jsx
import React from "react";
import { BrowserRouter as Router } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import AppRoutes from "./approutes";

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

const App = () => {
  return (
    <GoogleOAuthProvider clientId={clientId}>
      <Router>
        <AppRoutes />
      </Router>
    </GoogleOAuthProvider>
  );
};

export default App;
