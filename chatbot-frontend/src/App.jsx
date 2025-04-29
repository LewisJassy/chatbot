import { useState, useEffect } from "react";
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from "react-router-dom";
import LoginRegister from "./LoginRegister";
import Chat from "./Chat";

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
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

  const currentPath = isAuthenticated
    ? (localStorage.getItem('currentPath') || '/')
    : '/login';

  return (
    <Routes>
      <Route
        path="/"
        element={
          isAuthenticated ? (
            <Navigate to={currentPath} replace />
          ) : (
            <Navigate to="/login" replace />
          )
        }
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
    </Routes>
  );
}

AppRoutes.propTypes = {
  isAuthenticated: PropTypes.bool.isRequired,
  handleLogin: PropTypes.func.isRequired,
};