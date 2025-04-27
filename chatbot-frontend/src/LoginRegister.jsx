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
    <div className="min-h-screen flex justify-center items-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700">
      <div className="max-w-md w-full p-8 bg-gray-900 rounded-2xl shadow-2xl border border-gray-800">
        {isSuccess && (
          <div className="flex items-center justify-center mb-4 text-green-500">
            <CheckCircle className="mr-2" />
            <span>
              {isLoginMode ? "Login Successful!" : "Registration Successful!"}
            </span>
          </div>
        )}

        {error && <div className="text-red-500 mb-4 text-center font-semibold">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-7">
          {!isLoginMode && (
            <div>
              <label className="block text-white font-semibold mb-2 text-lg">Name</label>
              <input
                type="text"
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-3 rounded-xl bg-gray-800 text-white focus:ring-2 focus:ring-green-500 outline-none transition shadow-sm"
              />
            </div>
          )}

          <div>
            <label className="block text-white font-semibold mb-2 text-lg">Email</label>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 rounded-xl bg-gray-800 text-white focus:ring-2 focus:ring-green-500 outline-none transition shadow-sm"
            />
          </div>

          <div>
            <label className="block text-white font-semibold mb-2 text-lg">Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 rounded-xl bg-gray-800 text-white focus:ring-2 focus:ring-green-500 outline-none transition shadow-sm"
            />
          </div>

          {!isLoginMode && (
            <div>
              <label className="block text-white font-semibold mb-2 text-lg">Confirm Password</label>
              <input
                type="password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full p-3 rounded-xl bg-gray-800 text-white focus:ring-2 focus:ring-green-500 outline-none transition shadow-sm"
              />
            </div>
          )}

          {isLoginMode && (
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="mr-2 accent-green-600 w-5 h-5 rounded focus:ring-green-500"
              />
              <label className="text-white font-medium select-none">Remember Me</label>
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-green-500 to-green-700 text-white py-3 rounded-xl font-bold text-lg shadow-lg hover:scale-105 hover:from-green-600 hover:to-green-800 transition-all flex items-center justify-center gap-2"
          >
            {isLoginMode ? "Login" : "Register"}
            <ThumbsUp className="ml-2" />
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
          >
            Social Login (Coming Soon)
          </button>
        </form>

        {!isSuccess && (
          <div className="text-center mt-8">
            <p className="text-gray-400 text-base">
              {isLoginMode
                ? "Don't have an account?"
                : "Already have an account?"}{" "}
              <button
                onClick={toggleMode}
                className="text-green-400 hover:underline font-semibold transition"
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