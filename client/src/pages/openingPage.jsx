import React from "react";
import "./OpeningPage.css";

const OpeningPage = () => {
  return (
    <div className="opening-page">
      <div className="overlay" />
      <div className="card">
        <img src="/Trade_Bro_Logo.jpg" alt="Logo" className="logo" />
        <p className="description">
           Unlock your potential and become a savvy investor with <strong>TradeBro</strong>'s stock insights and smart portfolio tools. 
        </p>
        <button className="google-button" onClick={() => window.location.href = "http://localhost:5000/api/auth/auth/google"}>
          <img
            src="/Google.jpg"
            alt="Google logo"
          />
          Continue with Google
        </button>
        <a href="/about" className="about-link">
           Know More About TradeBro
        </a>
      </div>
    </div>
  );
};

export default OpeningPage;
