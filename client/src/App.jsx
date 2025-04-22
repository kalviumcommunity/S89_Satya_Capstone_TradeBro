// App.jsx
import React from "react";
import { BrowserRouter as Router } from "react-router-dom";
import AppRoutes from "./approutes";


const App = () => {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
};

export default App;
