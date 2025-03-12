import { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
  useLocation,
} from "react-router-dom";
import LoginRegister from "./LoginRegister";
import Chat from "./Chat";
import LoadingScreen from "./LoadingScreen";
import Cookies from "js-cookie"; // Import js-cookie

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return (
      <div>
        <LoadingScreen />
      </div>
    );
  }

  const handleLogin = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setIsAuthenticated(true);
    }, 9000); // Simulate a delay for loading animation
  };

  return (
    <Router>
      <AppRoutes
        isAuthenticated={isAuthenticated}
        isLoading={isLoading}
        handleLogin={handleLogin}
      />
    </Router>
  );
}

import PropTypes from "prop-types";

function AppRoutes({ isAuthenticated, isLoading, handleLogin }) {
  const location = useLocation();

  useEffect(() => {
    localStorage.setItem("currentPath", location.pathname);
  }, [location.pathname]);

  const currentPath = localStorage.getItem("currentPath") || "/";

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
          isLoading ? (
            <LoadingScreen />
          ) : (
            <LoginRegister onLogin={handleLogin} />
          )
        }
      />
      <Route
        path="/chat"
        element={isAuthenticated ? <Chat /> : <Navigate to="/login" replace />}
      />
    </Routes>
  );
}

AppRoutes.propTypes = {
  isAuthenticated: PropTypes.bool.isRequired,
  isLoading: PropTypes.bool.isRequired,
  handleLogin: PropTypes.func.isRequired,
};
