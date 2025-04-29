import { useNavigate } from "react-router-dom";

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-br from-green-900 via-gray-900 to-black">
      <h1 className="text-5xl font-extrabold text-white mb-6 drop-shadow-lg">Welcome to Chatbot!</h1>
      <p className="text-xl text-gray-200 mb-10 max-w-xl text-center">
        Your AI-powered assistant for smarter conversations. Sign up or log in to get started!
      </p>
      <div className="flex gap-4">
        <button
          onClick={() => navigate("/login")}
          className="px-8 py-3 bg-green-600 text-white rounded-xl font-bold text-lg shadow-lg hover:bg-green-700 transition"
        >
          Login
        </button>
        <button
          onClick={() => navigate("/login")}
          className="px-8 py-3 bg-white text-green-700 rounded-xl font-bold text-lg shadow-lg hover:bg-gray-100 transition"
        >
          Register
        </button>
      </div>
    </div>
  );
}