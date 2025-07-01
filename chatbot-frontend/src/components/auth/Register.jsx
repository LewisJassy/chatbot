import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';
import authAPI from '../../utils/axios';
import { AuthLayout, EmailInput, PasswordInput, NameInput } from './AuthLayout';

// Validation constants
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
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
  }, []);

  const validateForm = useCallback(() => {
    const { email, password, name, confirmPassword } = formData;

    if (!email.trim() || !password.trim() || !name.trim()) {
      setError('All fields are required.');
      return false;
    }

    if (!EMAIL_REGEX.test(email.trim())) {
      setError('Please enter a valid email address.');
      return false;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
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
      setError('');
      setIsLoading(true);

      if (!validateForm()) {
        setIsLoading(false);
        return;
      }

      try {
        const payload = {
          name: formData.name.trim(),
          email: formData.email.trim(),
          password: formData.password.trim(),
        };

        await authAPI.post('/auth/register/', payload);

        setIsSuccess(true);

        setTimeout(() => {
          if (isMounted.current) {
            navigate('/login');
          }
        }, 1500);
      } catch (err) {
        setError(
          err.response?.data?.error ||
            err.response?.data?.message ||
            'Failed to register. Please try again.'
        );
        console.error('Registration error:', err);
      } finally {
        setIsLoading(false);
      }
    },
    [formData, navigate, validateForm]
  );

  return (
    <AuthLayout
      title='Create Account'
      subtitle='Join us and start chatting'
      isSuccess={isSuccess}
      successMessage='Registration Successful!'
      error={error}
      isLoading={isLoading}
      submitText='Create Account'
      toggleText='Already have an account?'
      onToggle={() => navigate('/login')}
      onSubmit={handleSubmit}
    >
      <NameInput value={formData.name} onChange={handleInputChange} />
      <EmailInput value={formData.email} onChange={handleInputChange} />
      <PasswordInput
        value={formData.password}
        onChange={handleInputChange}
        showPassword={showPassword}
        setShowPassword={setShowPassword}
        autoComplete='new-password'
      />
      <PasswordInput
        id='confirmPassword'
        name='confirmPassword'
        value={formData.confirmPassword}
        onChange={handleInputChange}
        showPassword={showConfirmPassword}
        setShowPassword={setShowConfirmPassword}
        placeholder='Confirm your password'
        autoComplete='new-password'
        confirmPassword={true}
      />
    </AuthLayout>
  );
}
