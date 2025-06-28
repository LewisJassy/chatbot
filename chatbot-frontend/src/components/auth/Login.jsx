import { useState, useEffect, useCallback, useRef } from "react";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import { authAPI, setAuthTokens } from "../../utils/axios";

import {
  AuthLayout,
  EmailInput,
  PasswordInput,
  RememberMeCheckbox,
} from "./AuthLayout";

// Validation constants
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

export default function Login({ onLogin }) {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const isMounted = useRef(true);

  // Removed unused pathname from useLocation()

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const checkAuthStatus = useCallback(async () => {
    const token =
      localStorage.getItem("access_token") ||
      sessionStorage.getItem("access_token");
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

  const validateForm = useCallback(() => {
    const { email, password } = formData;

    if (!email.trim() || !password.trim()) {
      setError("All fields are required.");
      return false;
    }

    if (!EMAIL_REGEX.test(email.trim())) {
      setError("Please enter a valid email address.");
      return false;
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return false;
    }

    return true;
  }, [formData]);

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      setError("");
      setIsLoading(true);

      if (!validateForm()) {
        setIsLoading(false);
        return;
      }

      try {
        const payload = {
          email: formData.email.trim().toLowerCase(), // Ensure lowercase
          password: formData.password.trim(),
          remember_me: rememberMe,
        };


        const response = await authAPI.post("/auth/login/", payload);

        const data = response.data;

        // Store tokens for login
        setAuthTokens(data.access_token, data.refresh_token, rememberMe);

        // Update auth state immediately
        onLogin({
          email: data.email || formData.email.trim(),
          name: data.name || "User",
          id: data.user_id,
        });

        setIsSuccess(true);

        // Quick redirect with just enough time to show success message
        setTimeout(() => {
          if (isMounted.current) {
            navigate("/chat", { replace: true });
          }
        }, 300);
      } catch (err) {
        console.error("Login error details:", {
          message: err.message,
          status: err.response?.status,
          statusText: err.response?.statusText,
          data: err.response?.data,
          config: {
            url: err.config?.url,
            baseURL: err.config?.baseURL,
            method: err.config?.method,
            data: err.config?.data ? JSON.parse(err.config.data) : null,
          },
        });

        // Enhanced error handling
        if (err.response?.status === 401) {
          setError(
            "Invalid email or password. Please check your credentials and try again.",
          );
        } else if (err.response?.status === 400) {
          setError(
            err.response?.data?.error ||
            err.response?.data?.message ||
            "Invalid request. Please check your input.",
          );
        } else if (err.code === "ECONNABORTED") {
          setError(
            "Request timed out. Please check your connection and try again.",
          );
        } else {
          setError(
            err.response?.data?.error ||
            err.response?.data?.message ||
            "Login failed. Please try again later.",
          );
        }
      } finally {
        setIsLoading(false);
      }
    },
    [formData, navigate, onLogin, rememberMe, validateForm],
  );

  return (
    <AuthLayout
      title="Welcome Back!"
      subtitle="Sign in to continue your conversation"
      isSuccess={isSuccess}
      successMessage="Login Successful! Redirecting..."
      error={error}
      isLoading={isLoading}
      submitText="Sign In"
      toggleText="Don't have an account?"
      onToggle={() => navigate("/register")}
      onSubmit={handleSubmit}
      isPasswordReset={true}
      passworedResetText="Forgot Password? "
      onPasswordReset={() => navigate("/forgot-password")}
    >
      <EmailInput value={formData.email} onChange={handleInputChange} />
      <PasswordInput
        value={formData.password}
        onChange={handleInputChange}
        showPassword={showPassword}
        setShowPassword={setShowPassword}
      />
      <RememberMeCheckbox
        rememberMe={rememberMe}
        setRememberMe={setRememberMe}
      />
    </AuthLayout>
  );
}

Login.propTypes = {
  onLogin: PropTypes.func.isRequired,
};
