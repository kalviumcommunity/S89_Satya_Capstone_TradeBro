import React from "react";
import "./TradingAssistant.css";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

const TradingAssistant = () => {
  return (
    <div className="trading-assistant-container">
      <div className="sidebar-container">
        <Sidebar />
      </div>
      <div className="navbar-container">
        <Navbar />  
      </div>
      <div className="assistant-content">
        <h1>Welcome to your Trading Assistant 🤖</h1>
        <p>Ask anything about stocks, strategies, or your portfolio!</p>
      </div>
    </div>
  );
};

export default TradingAssistant;
