import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import authAPI from "../../utils/axios";
import { AuthLayout, PasswordInput } from "./AuthLayout";
import { useParams } from "react-router-dom";

// Validation constants

export default function ConfirmPassword() {
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();
  const isMounted = useRef(true);

  const MIN_PASSWORD_LENGTH = 8;
  const { uid, token } = useParams();

  // if (!uid && token) {
  //   navigate("/login");
  // }

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const validateForm = useCallback(() => {
    const { password, confirmPassword } = formData;

    if (!confirmPassword.trim() || !password.trim()) {
      setError("All fields are required.");
      return false;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
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
          uid: uid,
          token: token,
          new_password: formData.password.trim(),
        };


        await authAPI.post(
          "/password-reset-confirm/",
          payload,
        );

        setIsSuccess(true);
        setTimeout(() => {
          if (isMounted.current) {
            navigate("/login");
          }
        }, 1500);
      } catch (err) {
        console.error("Password Reset Error:", err);

        let errorMessage =
          "Error while resetting the password. Please try again.";

        if (err.response?.data) {
          const errorData = err.response.data;

          if (errorData.uid) {
            errorMessage = Array.isArray(errorData.uid)
              ? errorData.uid[0]
              : errorData.uid;
          } else if (errorData.token) {
            errorMessage = Array.isArray(errorData.token)
              ? errorData.token[0]
              : errorData.token;
          } else if (errorData.password) {
            errorMessage = Array.isArray(errorData.password)
              ? errorData.password[0]
              : errorData.password;
          } else if (errorData.non_field_errors) {
            errorMessage = Array.isArray(errorData.non_field_errors)
              ? errorData.non_field_errors[0]
              : errorData.non_field_errors;
          } else if (errorData.error) {
            errorMessage = errorData.error;
          } else if (errorData.message) {
            errorMessage = errorData.message;
          } else if (errorData.detail) {
            errorMessage = errorData.detail;
          }
        }

        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    [formData, navigate, validateForm, uid, token],
  );

  return (
    <AuthLayout
      title="Set New Password"
      subtitle="One step away!"
      isSuccess={isSuccess}
      successMessage="Password Resetted Successfully!"
      error={error}
      isLoading={isLoading}
      submitText="Reset"
      toggleText="Got The Password?"
      onToggle={() => navigate("/login")}
      onSubmit={handleSubmit}
    >
      <PasswordInput
        value={formData.password}
        onChange={handleInputChange}
        showPassword={showPassword}
        setShowPassword={setShowPassword}
        autoComplete="password"
        confirmPassword={false}
      />
      <PasswordInput
        id="confirmPassword"
        name="confirmPassword"
        value={formData.confirmPassword}
        onChange={handleInputChange}
        showPassword={showConfirmPassword}
        setShowPassword={setShowConfirmPassword}
        placeholder="Confirm your password"
        autoComplete="new-password"
        confirmPassword={true}
      />
    </AuthLayout>
  );
}
