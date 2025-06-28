import {
  CheckCircle,
  ThumbsUp,
  Loader2,
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
} from "lucide-react";

const MAX_INPUT_LENGTH = 100;

export function AuthLayout({
  title,
  subtitle,
  children,
  isSuccess,
  successMessage,
  error,
  isLoading,
  submitText,
  toggleText,
  onToggle,
  onSubmit,
  isPasswordReset,
  passworedResetText,
  onPasswordReset,
}) {
  return (
    <div className="min-h-screen flex justify-center items-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="max-w-md w-full p-8 bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">{title}</h2>
          <p className="text-gray-300">{subtitle}</p>
        </div>

        {isSuccess && (
          <div className="flex items-center justify-center mb-6 p-4 bg-green-500/20 rounded-xl border border-green-500/30">
            <CheckCircle className="mr-3 text-green-400" size={20} />
            <span className="text-green-300 font-medium">{successMessage}</span>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-500/20 rounded-xl border border-red-500/30">
            <div className="text-red-300 text-center font-medium">{error}</div>
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-6">
          {children}

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-xl font-semibold text-lg shadow-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 flex items-center justify-center gap-2 ${
              isLoading
                ? "opacity-70 cursor-not-allowed"
                : "hover:scale-[1.02] active:scale-[0.98]"
            }`}
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                Processing...
              </>
            ) : (
              <>
                {submitText}
                <ThumbsUp size={18} />
              </>
            )}
          </button>
        </form>
        {!isSuccess && (
          <div className="text-center mt-8">
            <p className="text-gray-300 text-sm">
              {toggleText}{" "}
              <button
                onClick={onToggle}
                className="text-purple-400 hover:text-purple-300 font-semibold transition-colors focus:outline-none hover:underline"
              >
                {submitText === "Sign In" ? "Sign Up" : "Sign In"}
              </button>
            </p>
          </div>
        )}

        {isPasswordReset && (
          <div className="text-center mt-2 ">
            <p className="text-gray-300 text-sm">
              {passworedResetText}{" "}
              <button
                onClick={onPasswordReset}
                className="text-purple-400 hover:text-purple-300 font-semibold transition-colors focus:outline-none hover:underline"
              >
                Reset Password
              </button>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export function EmailInput({ value, onChange }) {
  return (
    <div className="space-y-2">
      <label htmlFor="email" className="block text-white font-medium text-sm">
        Email Address
      </label>
      <div className="relative">
        <Mail
          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
          size={18}
        />
        <input
          type="email"
          id="email"
          name="email"
          placeholder="Enter your email"
          value={value}
          onChange={onChange}
          className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all backdrop-blur-sm"
          autoComplete="email"
          maxLength={MAX_INPUT_LENGTH}
          required
        />
      </div>
    </div>
  );
}

export function PasswordInput({
  value,
  onChange,
  showPassword,
  setShowPassword,
  id = "password",
  name = "password",
  placeholder = "Enter your password",
  autoComplete = "current-password",
  confirmPassword,
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-white font-medium text-sm">
        {confirmPassword ? "Confirm Password" : "Password"}
      </label>
      <div className="relative">
        <Lock
          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
          size={18}
        />
        <input
          type={showPassword ? "text" : "password"}
          id={id}
          name={name}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className="w-full pl-10 pr-12 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all backdrop-blur-sm"
          autoComplete={autoComplete}
          required
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
  );
}

export function NameInput({ value, onChange }) {
  return (
    <div className="space-y-2">
      <label htmlFor="name" className="block text-white font-medium text-sm">
        Full Name
      </label>
      <div className="relative">
        <User
          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
          size={18}
        />
        <input
          type="text"
          id="name"
          name="name"
          placeholder="Enter your full name"
          value={value}
          onChange={onChange}
          className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all backdrop-blur-sm"
          autoComplete="name"
          maxLength={MAX_INPUT_LENGTH}
          required
        />
      </div>
    </div>
  );
}

export function RememberMeCheckbox({ rememberMe, setRememberMe }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center">
        <input
          type="checkbox"
          id="rememberMe"
          checked={rememberMe}
          onChange={(e) => setRememberMe(e.target.checked)}
          className="w-4 h-4 text-purple-600 bg-white/10 border-white/20 rounded focus:ring-purple-500 focus:ring-2"
        />
        <label
          htmlFor="rememberMe"
          className="ml-2 text-sm text-gray-300 select-none cursor-pointer"
        >
          Remember me
        </label>
      </div>
    </div>
  );
}
