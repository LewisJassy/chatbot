import { useCallback, useState } from "react";
import { AuthLayout, EmailInput } from "./AuthLayout";
import { useNavigate } from "react-router-dom";
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const PasswordReset = () => {
  const [formData, setFormData] = useState({ email: "" });

  const [error, setError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const validateForm = useCallback(() => {
    const { email } = formData;

    if (!email.trim()) {
      setError("Email field required");
      return False;
    }
    if (!EMAIL_REGEX.test(email.trim())) {
      setError("Please enter a valid email address.");
      return False;
    }
    return true;
  }, [formData]);

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  });

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
          email: formData.email.trim(),
        };

        const response = await authAPI.post("/password-reset/", payload);
        const data = response.data;

        // Store tokens for login

        // Update auth state immediately

        setIsSuccess(true);

        // Quick redirect with just enough time to show success message
        setTimeout(() => {
          if (isMounted.current) {
            navigate("/login", { replace: true });
          }
        }, 300);
      } catch (err) {
        setError(
          err.response?.data?.error ||
            err.response?.data?.message ||
            "Failed to send link. Please check your credentials.",
        );
        console.error("reset-password error:", err);
      } finally {
        setIsLoading(false);
      }
    },
    [formData, navigate, validateForm],
  );

  return (
    <AuthLayout
      title="One Step Away!"
      subtitle="Enter you email address to get the password reset link"
      isSuccess={isSuccess}
      successMessage="Check your mail inbox!"
      error={error}
      isLoading={isLoading}
      submitText="Submit"
      toggleText="Don't have an account?"
      onToggle={() => navigate("/register")}
      onSubmit={handleSubmit}
      otherLink="Register"
    >
      <EmailInput value={formData.email} onChange={handleInputChange} />
    </AuthLayout>
  );
};

export default PasswordReset;
