import { useState, useEffect } from "react";
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from "react-router-dom";
import PropTypes from "prop-types";
import LoginRegister from "./LoginRegister";
import Chat from "./Chat";
import LandingPage from "./LandingPage";
import { getAuthToken, authAPI, clearAuthTokens } from "./utils/axios";

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);  useEffect(() => {
    const checkAuth = async () => {
      const token = getAuthToken();
      if (token) {
        try {
          // Use a shorter timeout for faster auth check
          const response = await authAPI.get("/auth/status/", { timeout: 3000 });
          if (response.data?.authenticated) {
            setIsAuthenticated(true);
          } else {
            clearAuthTokens();
            setIsAuthenticated(false);
          }
        } catch (error) {
          console.debug("Token validation failed:", error);
          clearAuthTokens();
          setIsAuthenticated(false);
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);const handleLogin = (userData) => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    clearAuthTokens();
    setIsAuthenticated(false);
  };
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="text-white text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-200 border-t-purple-600 mx-auto mb-4"></div>
            <div className="absolute inset-0 rounded-full h-16 w-16 border-4 border-transparent border-r-blue-400 animate-pulse mx-auto"></div>
          </div>
          <p className="text-lg font-medium bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            Loading your experience...
          </p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <AppRoutes
        isAuthenticated={isAuthenticated}
        handleLogin={handleLogin}
        handleLogout={handleLogout}
      />
    </Router>  );
}

function AppRoutes({ isAuthenticated, handleLogin, handleLogout }) {
  const location = useLocation();

  useEffect(() => {
    localStorage.setItem('currentPath', location.pathname);
  }, [location.pathname]);


  return (
    <Routes>
      <Route
        path="/"
        element={<LandingPage />}
      />      <Route
        path="/login"
        element={
          isAuthenticated ? (
            <Navigate to="/chat" replace />
          ) : (
            <LoginRegister onLogin={handleLogin} />
          )
        }
      />
      <Route
        path="/chat"
        element={
          isAuthenticated ? (
            <Chat onLogout={handleLogout} />
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
  handleLogout: PropTypes.func.isRequired,
};
