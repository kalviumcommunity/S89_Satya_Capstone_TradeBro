// src/contexts/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
// import { useNavigate } from 'react-router-dom'; // Only needed if you want to redirect *from* context on logout

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false); // No loading animation needed

  // const navigate = useNavigate(); // Uncomment if you need to redirect directly from context

  // Function to set user and authentication status
  const login = useCallback((userData, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    setIsAuthenticated(true);
    console.log("AuthContext: User logged in:", userData.email);
  }, []);

  // Function to get stored token
  const getToken = useCallback(() => {
    return localStorage.getItem('token');
  }, []);

  // Function to update user profile
  const updateProfile = useCallback(async (updatedUserData) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'https://s89-satya-capstone-tradebro.onrender.com'}/api/user/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify(updatedUserData)
      });
      
      if (response.ok) {
        const result = await response.json();
        const newUserData = result.user || updatedUserData;
        localStorage.setItem('user', JSON.stringify(newUserData));
        setUser(newUserData);
        return { success: true };
      } else {
        throw new Error('Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      return { success: false, error: error.message };
    }
  }, [getToken]);

  // Function to clear user and authentication status
  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setIsAuthenticated(false);
    console.log("AuthContext: User logged out.");
    // Optionally redirect to login page after logout if navigate is uncommented
    // navigate('/login'); 
  }, []); // Add navigate to dependencies if used

  // Initial check for stored token/user on app load
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setIsAuthenticated(true);
        console.log("AuthContext: Found stored user, auto-logging in:", parsedUser.email);
      } catch (error) {
        console.error("AuthContext: Failed to parse stored user data:", error);
        logout(); // Clear invalid data
      }
    }
    // setLoading(false); // Not needed
  }, [logout]); // logout is a dependency

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    logout,
    getToken,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
