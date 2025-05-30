import { useState, useEffect, useCallback, useRef } from "react";
import PropTypes from "prop-types";
import { CheckCircle, ThumbsUp, Loader2, Eye, EyeOff, Mail, Lock, User } from "lucide-react";
import { authAPI, setAuthTokens } from "./utils/axios";
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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();
  const isMounted = useRef(true);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);  const checkAuthStatus = useCallback(async () => {
    // Only check auth status if we have a token to avoid unnecessary API calls
    const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
    if (!token) return;
    
    try {
      const response = await authAPI.get("/auth/status/");
      if (response.data?.authenticated) {
        navigate("/chat", { replace: true });
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
    const endpoint = isLoginMode ? "/auth/login/" : "/auth/register/";
    const payload = isLoginMode
      ? {
          email: formData.email.trim(),
          password: formData.password.trim(),
          remember_me: rememberMe
        }
      : {
          name: formData.name.trim(),
          email: formData.email.trim(),
          password: formData.password.trim()
        };

    const response = await authAPI.post(endpoint, payload);
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
      if (isLoginMode) {
        // Store tokens for login
        setAuthTokens(data.access_token, data.refresh_token, rememberMe);

        // Update auth state immediately
        onLogin({
          email: data.email || formData.email.trim(),
          name: data.name || "User",
          id: data.user_id
        });

        setIsSuccess(true);

        // Quick redirect with just enough time to show success message
        setTimeout(() => {
          if (isMounted.current) {
            navigate("/chat", { replace: true });
          }
        }, 300);
      } else {
        // Registration successful
        setIsSuccess(true);
        setTimeout(() => {
          if (isMounted.current) {
            setFormData({
              name: "",
              email: "",
              password: "",
              confirmPassword: ""
            });
            toggleMode();
          }
        }, 1500);
      }
    } catch (err) {
      setError(
        err.response?.data?.error ||
        err.response?.data?.message ||
        (isLoginMode
          ? "Failed to login. Please check your credentials."
          : "Failed to register. Please try again.")
      );
      console.error("Authentication error:", err);
    } finally {
      setIsLoading(false); // Reset loading state unconditionally
    }
  }, [formData, isLoginMode, validateForm, handleAuthRequest, navigate, onLogin, toggleMode, rememberMe]);
  return (
    <div className="min-h-screen flex justify-center items-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="max-w-md w-full p-8 bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">
            {isLoginMode ? "Welcome Back!" : "Create Account"}
          </h2>
          <p className="text-gray-300">
            {isLoginMode ? "Sign in to continue your conversation" : "Join us and start chatting"}
          </p>
        </div>

        {isSuccess && (
          <div className="flex items-center justify-center mb-6 p-4 bg-green-500/20 rounded-xl border border-green-500/30">
            <CheckCircle className="mr-3 text-green-400" size={20} />
            <span className="text-green-300 font-medium">
              {isLoginMode ? "Login Successful! Redirecting..." : "Registration Successful!"}
            </span>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-500/20 rounded-xl border border-red-500/30">
            <div className="text-red-300 text-center font-medium">
              {error}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {!isLoginMode && (
            <div className="space-y-2">
              <label htmlFor="name" className="block text-white font-medium text-sm">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  id="name"
                  name="name"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all backdrop-blur-sm"
                  autoComplete="name"
                  maxLength={MAX_INPUT_LENGTH}
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="email" className="block text-white font-medium text-sm">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="email"
                id="email"
                name="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all backdrop-blur-sm"
                autoComplete="email"
                maxLength={MAX_INPUT_LENGTH}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="block text-white font-medium text-sm">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleInputChange}
                className="w-full pl-10 pr-12 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all backdrop-blur-sm"
                autoComplete={isLoginMode ? "current-password" : "new-password"}
                minLength={MIN_PASSWORD_LENGTH}
                maxLength={MAX_INPUT_LENGTH}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {!isLoginMode && (
            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="block text-white font-medium text-sm">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirmPassword"
                  name="confirmPassword"
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-12 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all backdrop-blur-sm"
                  autoComplete="new-password"
                  minLength={MIN_PASSWORD_LENGTH}
                  maxLength={MAX_INPUT_LENGTH}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          )}

          {isLoginMode && (
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="rememberMe"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-purple-600 bg-white/10 border-white/20 rounded focus:ring-purple-500 focus:ring-2"
                />
                <label htmlFor="rememberMe" className="ml-2 text-sm text-gray-300 select-none cursor-pointer">
                  Remember me
                </label>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-xl font-semibold text-lg shadow-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 flex items-center justify-center gap-2 ${
              isLoading ? "opacity-70 cursor-not-allowed" : "hover:scale-[1.02] active:scale-[0.98]"
            }`}
            aria-label={isLoginMode ? "Login" : "Register"}
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                Processing...
              </>
            ) : (
              <>
                {isLoginMode ? "Sign In" : "Create Account"}
                <ThumbsUp size={18} />
              </>
            )}
          </button>
        </form>

        {!isSuccess && (
          <div className="text-center mt-8">
            <p className="text-gray-300 text-sm">
              {isLoginMode
                ? "Don't have an account?"
                : "Already have an account?"}{" "}
              <button
                onClick={toggleMode}
                className="text-purple-400 hover:text-purple-300 font-semibold transition-colors focus:outline-none hover:underline"
                aria-label={isLoginMode ? "Switch to registration" : "Switch to login"}
              >
                {isLoginMode ? "Sign Up" : "Sign In"}
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