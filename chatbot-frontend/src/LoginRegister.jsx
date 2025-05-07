import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "react-query";
import axios from "./utils/axios";
import { loginSchema, registerSchema } from "./validation/schemas";
import toast from "react-hot-toast";
import LoadingSpinner from "./components/LoadingSpinner";


function AuthForm({ onLogin }) {
  const navigate = useNavigate();
  const isLoginMode = window.location.pathname.includes("/login");
  const schema = isLoginMode ? loginSchema : registerSchema;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset
  } = useForm({
    resolver: zodResolver(schema),
    mode: "onBlur",
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      rememberMe: false
    }
  });

  const authMutation = useMutation(
    (data) => axios.post(isLoginMode ? "/login" : "/register", data, { 
      withCredentials: true 
    }),
    {
      onSuccess: (response) => {
        if (isLoginMode && response.data?.access_token) {
          onLogin({ 
            name: response.data.name || "User",
            email: response.data.email 
          });
          toast.success("Login successful!");
          navigate("/chat");
        } else if (!isLoginMode && response.status === 201) {
          toast.success("Registration successful! Please login.");
          reset();
          navigate("/login");
        }
      },
      onError: (error) => {
        const errorMessage = error.response?.data?.error || 
          (isLoginMode 
            ? "Failed to login. Please try again." 
            : "Failed to register. Please try again.");
        toast.error(errorMessage);
      }
    }
  );

  const onSubmit = handleSubmit((data) => authMutation.mutate(data));

const [isChecking, setIsChecking] = useState(true);
useEffect(() => {
  const checkAuthStatus = async () => {
    try {
      const response = await axios.get("/status", { 
        withCredentials: true 
      });
      if (response.data.authenticated) {
        navigate("/chat");
      }
    } catch (error) {
      console.error("Auth check failed:", error.message);
    } finally {
      setIsChecking(false);
    }
  };

  checkAuthStatus();
}, [navigate]);
if (isChecking) {
  return <LoadingSpinner />;
}
 
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-700">
      <form onSubmit={onSubmit} className="w-full max-w-md p-8 bg-gray-800 rounded-2xl shadow-lg space-y-4">
        <h2 className="text-2xl font-bold text-center text-white mb-6">
          {isLoginMode ? "Welcome Back!" : "Create Account"}
        </h2>

        {!isLoginMode && (
          <div>
            <label className="block mb-2 text-sm font-medium text-white">
              Name
            </label>
            <input
              {...register("name")}
              className="w-full p-3 rounded-lg bg-gray-700 text-white focus:ring-2 focus:ring-green-500"
              aria-invalid={errors.name ? "true" : "false"}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-400">{errors.name.message}</p>
            )}
          </div>
        )}

        <div>
          <label className="block mb-2 text-sm font-medium text-white">
            Email
          </label>
          <input
            type="email"
            {...register("email")}
            className="w-full p-3 rounded-lg bg-gray-700 text-white focus:ring-2 focus:ring-green-500"
            aria-invalid={errors.email ? "true" : "false"}
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-400">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label className="block mb-2 text-sm font-medium text-white">
            Password
          </label>
          <input
            type="password"
            {...register("password")}
            className="w-full p-3 rounded-lg bg-gray-700 text-white focus:ring-2 focus:ring-green-500"
            aria-invalid={errors.password ? "true" : "false"}
          />
          {errors.password && (
            <p className="mt-1 text-sm text-red-400">{errors.password.message}</p>
          )}
        </div>

        {!isLoginMode && (
          <div>
            <label className="block mb-2 text-sm font-medium text-white">
              Confirm Password
            </label>
            <input
              type="password"
              {...register("confirmPassword")}
              className="w-full p-3 rounded-lg bg-gray-700 text-white focus:ring-2 focus:ring-green-500"
              aria-invalid={errors.confirmPassword ? "true" : "false"}
            />
            {errors.confirmPassword && (
              <p className="mt-1 text-sm text-red-400">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>
        )}

        {isLoginMode && (
          <div className="flex items-center">
            <input
              type="checkbox"
              id="rememberMe"
              {...register("rememberMe")}
              className="w-4 h-4 rounded bg-gray-700 border-gray-600 focus:ring-green-500"
            />
            <label htmlFor="rememberMe" className="ml-2 text-sm font-medium text-white">
              Remember me
            </label>
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 px-4 font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 focus:ring-4 focus:outline-none focus:ring-green-300 disabled:opacity-75 flex justify-center items-center"
        >
          {isSubmitting ? (
            <>
              <LoadingSpinner className="mr-2" />
              Processing...
            </>
          ) : isLoginMode ? (
            "Sign in"
          ) : (
            "Sign up"
          )}
        </button>

        <div className="flex items-center my-4">
          <div className="flex-1 border-t border-gray-600"></div>
          <span className="mx-4 text-gray-400">or</span>
          <div className="flex-1 border-t border-gray-600"></div>
        </div>

        <button
          type="button"
          disabled
          className="w-full py-2.5 px-4 font-medium rounded-lg text-gray-900 bg-white hover:bg-gray-100 focus:ring-4 focus:outline-none focus:ring-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Social Login (Coming Soon)
        </button>

        <p className="text-sm font-light text-gray-400 text-center mt-6">
          {isLoginMode ? "Don't have an account?" : "Already have an account?"}{" "}
          <button
            type="button"
            onClick={() => navigate(isLoginMode ? "/register" : "/login")}
            className="font-medium text-green-500 hover:underline focus:outline-none"
          >
            {isLoginMode ? "Sign up" : "Sign in"}
          </button>
        </p>
      </form>
    </div>
  );
}

AuthForm.propTypes = {
  onLogin: PropTypes.func.isRequired,
};

export default React.memo(AuthForm);