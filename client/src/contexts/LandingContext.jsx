import React, { createContext, useContext, useState, useEffect } from 'react';

const LandingContext = createContext();

export const useLanding = () => useContext(LandingContext);

export const LandingProvider = ({ children }) => {
  const [hasVisitedLanding, setHasVisitedLanding] = useState(false);

  useEffect(() => {
    const visited = localStorage.getItem('hasVisitedLanding');
    if (visited === 'true') {
      setHasVisitedLanding(true);
    }
  }, []);

  const markLandingVisited = () => {
    localStorage.setItem('hasVisitedLanding', 'true');
    setHasVisitedLanding(true);
  };

  return (
    <LandingContext.Provider value={{ hasVisitedLanding, markLandingVisited }}>
      {children}
    </LandingContext.Provider>
  );
};