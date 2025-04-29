import { useState, useEffect } from "react";
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from "react-router-dom";
import LoginRegister from "./LoginRegister";
import Chat from "./Chat";
import LandingPage from "./LandingPage";

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  return (
    <Router>
      <AppRoutes
        isAuthenticated={isAuthenticated}
        handleLogin={handleLogin}
      />
    </Router>
  );
}

import PropTypes from 'prop-types';

function AppRoutes({ isAuthenticated, handleLogin }) {
  const location = useLocation();

  useEffect(() => {
    localStorage.setItem('currentPath', location.pathname);
  }, [location.pathname]);


  return (
    <Routes>
      <Route
        path="/"
        element={<LandingPage />}
      />
      <Route
        path="/login"
        element={
          <LoginRegister onLogin={handleLogin} />
        }
      />
      <Route
        path="/chat"
        element={
          isAuthenticated ? (
            <Chat />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      {/* Optionally, redirect authenticated users from "/" to "/chat" */}
      {/* <Route
        path="/"
        element={
          isAuthenticated ? (
            <Navigate to="/chat" replace />
          ) : (
            <LandingPage />
          )
        }
      /> */}
    </Routes>
  );
}

AppRoutes.propTypes = {
  isAuthenticated: PropTypes.bool.isRequired,
  handleLogin: PropTypes.func.isRequired,
};