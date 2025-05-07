import { useState, useEffect, useCallback, useRef } from "react";
import PropTypes from "prop-types";
import { CheckCircle, ThumbsUp, Loader2 } from "lucide-react";
import axios from "./utils/axios";
import { useNavigate } from "react-router-dom";

// Validation constants
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;
const MAX_INPUT_LENGTH = 100;

export default function LoginRegister({ onLogin }) {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const isMounted = useRef(true);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const checkAuthStatus = useCallback(async () => {
    try {
      const response = await axios.get("/status/", {
        withCredentials: true
      });
      if (response.data?.authenticated) {
        navigate("/chat");
      }
    } catch {
      console.debug("Not authenticated");
    }
  }, [navigate]);

  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  const toggleMode = useCallback(() => {
    setIsLoginMode(prev => !prev);
    setError("");
    setIsSuccess(false);
  }, []);

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }, []);

  const validateForm = useCallback(() => {
    const { email, password, name, confirmPassword } = formData;

    if (!email.trim() || !password.trim() || (!isLoginMode && !name.trim())) {
      setError("All fields are required.");
      return false;
    }

    if (!EMAIL_REGEX.test(email.trim())) {
      setError("Please enter a valid email address.");
      return false;
    }

    if (!isLoginMode && password !== confirmPassword) {
      setError("Passwords do not match.");
      return false;
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return false;
    }

    return true;
  }, [formData, isLoginMode]);

  const handleAuthRequest = useCallback(async () => {
    const endpoint = isLoginMode ? "/login/" : "/register/";
    const payload = isLoginMode
      ? {
          email: formData.email.trim(),
          password: formData.password.trim(),
          rememberMe
        }
      : {
          name: formData.name.trim(),
          email: formData.email.trim(),
          password: formData.password.trim()
        };

    const response = await axios.post(endpoint, payload, {
      withCredentials: true,
      headers: { "Content-Type": "application/json" }
    });

    return response.data;
  }, [formData, isLoginMode, rememberMe]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    if (!validateForm()) {
      setIsLoading(false);
      return;
    }

    try {
      const data = await handleAuthRequest();
      
      setIsSuccess(true);
      setTimeout(() => {
        if (isMounted.current) {
          if (isLoginMode) {
            onLogin({ email: formData.email.trim(), name: data.name || "User" });
            navigate("/chat");
          } else {
            setFormData({
              name: "",
              email: "",
              password: "",
              confirmPassword: ""
            });
            toggleMode();
          }
        }
      }, 1000);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        (isLoginMode 
          ? "Failed to login. Please try again." 
          : "Failed to register. Please try again.")
      );
      console.error("Authentication error:", err);
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  }, [formData, isLoginMode, validateForm, handleAuthRequest, navigate, onLogin, toggleMode]);

  return (
    <div className="min-h-screen flex justify-center items-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700">
      <div className="max-w-md w-full p-8 bg-gray-900 rounded-2xl shadow-2xl border border-gray-800">
        <h2 className="text-2xl font-bold text-white text-center mb-6">
          {isLoginMode ? "Welcome Back!" : "Create Account"}
        </h2>

        {isSuccess && (
          <div className="flex items-center justify-center mb-4 text-green-500">
            <CheckCircle className="mr-2" />
            <span>
              {isLoginMode ? "Login Successful!" : "Registration Successful!"}
            </span>
          </div>
        )}

        {error && (
          <div className="text-red-500 mb-4 text-center font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {!isLoginMode && (
            <div>
              <label htmlFor="name" className="block text-white font-semibold mb-2 text-lg">
                Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                placeholder="Enter your full name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full p-3 rounded-xl bg-gray-800 text-white focus:ring-2 focus:ring-green-500 outline-none transition shadow-sm"
                autoComplete="name"
                maxLength={MAX_INPUT_LENGTH}
              />
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-white font-semibold mb-2 text-lg">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleInputChange}
              className="w-full p-3 rounded-xl bg-gray-800 text-white focus:ring-2 focus:ring-green-500 outline-none transition shadow-sm"
              autoComplete="email"
              maxLength={MAX_INPUT_LENGTH}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-white font-semibold mb-2 text-lg">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleInputChange}
              className="w-full p-3 rounded-xl bg-gray-800 text-white focus:ring-2 focus:ring-green-500 outline-none transition shadow-sm"
              autoComplete={isLoginMode ? "current-password" : "new-password"}
              minLength={MIN_PASSWORD_LENGTH}
              maxLength={MAX_INPUT_LENGTH}
            />
          </div>

          {!isLoginMode && (
            <div>
              <label htmlFor="confirmPassword" className="block text-white font-semibold mb-2 text-lg">
                Confirm Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className="w-full p-3 rounded-xl bg-gray-800 text-white focus:ring-2 focus:ring-green-500 outline-none transition shadow-sm"
                autoComplete="new-password"
                minLength={MIN_PASSWORD_LENGTH}
                maxLength={MAX_INPUT_LENGTH}
              />
            </div>
          )}

          {isLoginMode && (
            <div className="flex items-center">
              <input
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="mr-2 accent-green-600 w-5 h-5 rounded focus:ring-green-500"
              />
              <label htmlFor="rememberMe" className="text-white font-medium select-none cursor-pointer">
                Remember Me
              </label>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full bg-gradient-to-r from-green-500 to-green-700 text-white py-3 rounded-xl font-bold text-lg shadow-lg hover:scale-105 transition-all flex items-center justify-center gap-2 ${
              isLoading ? "opacity-70 cursor-not-allowed" : "hover:from-green-600 hover:to-green-800"
            }`}
            aria-label={isLoginMode ? "Login" : "Register"}
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin mr-2" />
                Processing...
              </>
            ) : (
              <>
                {isLoginMode ? "Login" : "Register"}
                <ThumbsUp className="ml-2" />
              </>
            )}
          </button>

          <div className="flex items-center my-4">
            <div className="flex-grow h-px bg-gray-700" />
            <span className="mx-3 text-gray-400 font-medium">or</span>
            <div className="flex-grow h-px bg-gray-700" />
          </div>
          
          <button
            type="button"
            className="w-full bg-white text-gray-900 py-2 rounded-xl font-semibold shadow hover:bg-gray-100 transition mb-2 opacity-70 cursor-not-allowed"
            disabled
            aria-label="Social login coming soon"
          >
            Social Login (Coming Soon)
          </button>
        </form>

        {!isSuccess && (
          <div className="text-center mt-6">
            <p className="text-gray-400 text-base">
              {isLoginMode
                ? "Don't have an account?"
                : "Already have an account?"}{" "}
              <button
                onClick={toggleMode}
                className="text-green-400 hover:underline font-semibold transition focus:outline-none"
                aria-label={isLoginMode ? "Switch to registration" : "Switch to login"}
              >
                {isLoginMode ? "Register" : "Login"}
              </button>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

LoginRegister.propTypes = {
  onLogin: PropTypes.func.isRequired,
};