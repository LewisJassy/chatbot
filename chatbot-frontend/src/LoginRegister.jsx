import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { CheckCircle, ThumbsUp } from "lucide-react";
import axios from "./utils/axios";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";

export default function LoginRegister({ onLogin }) {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = Cookies.get("token");
    console.log("Token from cookies:", token);
  }, []);

  const toggleMode = () => {
    setIsLoginMode(!isLoginMode);
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!isLoginMode && password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!email.trim() || !password.trim() || (!isLoginMode && !name.trim())) {
      setError("All fields are required.");
      return;
    }

    try {
      const headers = {
        "Content-Type": "application/json",
      };

      if (isLoginMode) {
        // Login
        const response = await axios.post(
          "login/",
          {
            email,
            password,
            remember_me: rememberMe,
          },
          {
            headers,
            withCredentials: true,
          }
        );
        if (response.data) {
          // console.log("Response data:", response.data);
          localStorage.setItem("token", response.data.access_token);
          console.log("Token stored:", localStorage.getItem("token"));
          setIsSuccess(true);
          setTimeout(() => {
            onLogin({ name: response.data.name, email });
            navigate("/chat");
          }, 1500);
        }
      } else {
        // Register
        const response = await axios.post(
          "register/",
          {
            name,
            email,
            password,
          },
          {
            headers,
            withCredentials: true,
          }
        );
        if (response.status === 201) {
          setIsSuccess(true);
          setTimeout(() => {
            setIsLoginMode(true);
            setError("");
          }, 1500);
        }
      }
    } catch (err) {
      console.error(err);
      setError(
        isLoginMode
          ? "Failed to login. Please try again."
          : "Failed to register. Please try again."
      );
    }
  };

  return (
    <div className="min-h-screen flex justify-center items-center">
      <div className="max-w-md w-full p-6 bg-gray-800 rounded-lg shadow-md">
        {isSuccess && (
          <div className="flex items-center justify-center mb-4 text-green-500">
            <CheckCircle className="mr-2" />
            <span>
              {isLoginMode ? "Login Successful!" : "Registration Successful!"}
            </span>
          </div>
        )}

        {error && <div className="text-red-500 mb-4 text-center">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-6">
          {!isLoginMode && (
            <div>
              <label className="block text-white font-medium mb-1">
                Name
              </label>
              <input
                type="text"
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2 rounded-md"
              />
            </div>
          )}

          <div>
            <label className="block text-white font-medium mb-1">
              Email
            </label>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2 rounded-md"
            />
          </div>

          <div>
            <label className="block text-white font-medium mb-1">
              Password
            </label>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 rounded-md"
            />
          </div>

          {!isLoginMode && (
            <div>
              <label className="block text-white font-medium mb-1">
                Confirm Password
              </label>
              <input
                type="password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full p-2 rounded-md"
              />
            </div>
          )}

          {isLoginMode && (
            <div>
              <label className="block text-white font-medium mb-1">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="mr-2"
                />
                Remember Me
              </label>
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-green-600 text-white py-3 rounded-md hover:bg-green-700 transition flex items-center justify-center"
          >
            {isLoginMode ? "Login" : "Register"}
            <ThumbsUp className="ml-2" />
          </button>
        </form>

        {!isSuccess && (
          <div className="text-center mt-6">
            <p className="text-gray-400">
              {isLoginMode
                ? "Don't have an account?"
                : "Already have an account?"}{" "}
              <button
                onClick={toggleMode}
                className="text-green-500 hover:underline font-medium"
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