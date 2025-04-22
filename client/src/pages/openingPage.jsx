import React from "react";
import "./openingPage.css";
import { useNavigate } from "react-router-dom";
import Squares from "../UI/squares";

const OpeningPage = () => {
  const navigate = useNavigate();

  return (
    <div className="opening-page">
      <Squares 
        speed={0.5}
        squareSize={40}
        direction="diagonal"
        borderColor="#fff"
        hoverFillColor="#222"
        className="animated-bg"
      />
      <div className="intro-text">
        <h1 className="title">Welcome to TradeBro</h1>
        <p className="subtitle">Your personal AI-powered trading companion</p>
        <button onClick={() => navigate("/signup")}>Get Started</button>
      </div>
    </div>
  );
};

export default OpeningPage;
