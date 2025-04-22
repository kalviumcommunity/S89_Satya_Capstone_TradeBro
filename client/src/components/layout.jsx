// components/Layout.jsx
import React from "react";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import "./Layout.css";

const Layout = ({ children }) => {
  return (
    <div className="layout">
      <Sidebar />
      <div className="main-content">
        <Navbar />
        {children}
      </div>
    </div>
  );
};

export default Layout;
