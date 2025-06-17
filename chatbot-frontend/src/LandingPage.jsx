import { useNavigate } from "react-router-dom";
import { useEffect, useRef } from "react";

export default function LandingPage() {
  const navigate = useNavigate();
  const headingRef = useRef(null);
  const subtitleRef = useRef(null);
  const buttonRef = useRef(null);

  useEffect(() => {
    // Animate heading bounce
    if (headingRef.current) {
      headingRef.current.classList.add("animate-bounce-in");
    }
    // Animate subtitle fade-in
    if (subtitleRef.current) {
      setTimeout(() => {
        subtitleRef.current.classList.add("animate-fade-in");
      }, 600);
    }
    // Animate buttons slide-up
    if (buttonRef.current) {
      setTimeout(() => {
        buttonRef.current.classList.add("animate-slide-up");
      }, 1200);
    }
  }, []);

  return (
    <div
      className="min-h-screen flex flex-col justify-center items-center relative overflow-hidden"
      style={{
        background:
          "linear-gradient(120deg, #0f2027, #2c5364 40%, #11998e 80%, #38ef7d 100%)",
        animation: "gradientBG 10s ease-in-out infinite alternate",
      }}
    >
      {/* Animated floating particles */}
      <div className="pointer-events-none absolute inset-0 z-0">
        {[...Array(18)].map((_, i) => (
          <span
            key={i}
            className="absolute rounded-full opacity-30 blur-2xl animate-float"
            style={{
              width: `${30 + Math.random() * 60}px`,
              height: `${30 + Math.random() * 60}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              background: `linear-gradient(135deg, #38ef7d, #11998e, #2c5364)`,
              animationDelay: `${Math.random() * 8}s`,
              filter: `blur(${2 + Math.random() * 4}px)`,
            }}
          />
        ))}
      </div>
      <h1
        ref={headingRef}
        className="text-5xl text-center font-extrabold text-white mb-6 drop-shadow-lg z-10 opacity-0"
      >
        Welcome to Chatbot!
      </h1>
      <p
        ref={subtitleRef}
        className="text-xl text-gray-200 mb-10 max-w-xl text-center z-10 opacity-0"
      >
        Your AI-powered assistant for smarter conversations. Sign up or log in
        to get started!
      </p>
      <div ref={buttonRef} className="flex gap-4 z-10 opacity-0">
        <button
          onClick={() => navigate("/login")}
          className="px-8 py-3 bg-green-600 text-white rounded-xl font-bold text-lg shadow-lg hover:bg-green-700 transition transform hover:scale-110 focus:scale-105 focus:outline-none animate-pulse"
          style={{ boxShadow: "0 0 32px 0 #38ef7d55" }}
        >
          Login
        </button>
        <button
          onClick={() => navigate("/register")}
          className="px-8 py-3 bg-white text-green-700 rounded-xl font-bold text-lg shadow-lg hover:bg-gray-100 transition transform hover:scale-110 focus:scale-105 focus:outline-none animate-pulse"
          style={{ boxShadow: "0 0 32px 0 #38ef7d33" }}
        >
          Register
        </button>
      </div>
      {/* Keyframes and custom animations */}
      <style>{`
        @keyframes gradientBG {
          0% { background-position: 0% 50%; }
          100% { background-position: 100% 50%; }
        }
        @keyframes bounceIn {
          0% { opacity: 0; transform: scale(0.7) translateY(-80px); }
          60% { opacity: 1; transform: scale(1.1) translateY(20px); }
          80% { transform: scale(0.95) translateY(-8px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        .animate-bounce-in {
          animation: bounceIn 1s cubic-bezier(.68,-0.55,.27,1.55) forwards;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 1.2s cubic-bezier(.4,0,.2,1) forwards;
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(60px) scale(0.9); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-slide-up {
          animation: slideUp 1.2s cubic-bezier(.4,0,.2,1) forwards;
        }
        @keyframes float {
          0% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-40px) scale(1.1); }
          100% { transform: translateY(0) scale(1); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

