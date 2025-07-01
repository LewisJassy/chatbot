import React, { useState, useEffect } from "react";
import { Home, ArrowLeft, Search, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";

const NotFoundPage = () => {
  const navigate = useNavigate();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [glitchActive, setGlitchActive] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener("mousemove", handleMouseMove);

    // Random glitch effect
    const glitchInterval = setInterval(() => {
      setGlitchActive(true);
      setTimeout(() => setGlitchActive(false), 200);
    }, 4000);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      clearInterval(glitchInterval);
    };
  }, []);

  const handleGoHome = () => {
    // Replace with your routing logic
    navigate("/");
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden flex items-center justify-center">
      {/* Animated background elements */}
      <div className="absolute inset-0">
        {/* Floating orbs */}
        <div className="absolute top-20 left-20 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
        <div className="absolute top-40 right-20 w-96 h-96 bg-cyan-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse animation-delay-2000"></div>
        <div className="absolute -bottom-32 left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse animation-delay-4000"></div>

        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `radial-gradient(circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(139, 92, 246, 0.3) 0%, transparent 50%)`,
            transition: "background-image 0.3s ease",
          }}
        ></div>
      </div>

      {/* Main content */}
      <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
        {/* 404 Text with glitch effect */}
        <div className="relative mb-8">
          <h1
            className={`text-9xl md:text-[12rem] font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 select-none transition-all duration-200 ${
              glitchActive ? "animate-pulse transform scale-105" : ""
            }`}
            style={{
              filter: glitchActive
                ? "hue-rotate(180deg) brightness(1.2)"
                : "none",
              textShadow: glitchActive
                ? "2px 2px 0px #ff0080, -2px -2px 0px #00ff80"
                : "none",
            }}
          >
            404
          </h1>

          {/* Glitch overlay */}
          {glitchActive && (
            <h1 className="absolute inset-0 text-9xl md:text-[12rem] font-black text-cyan-400 opacity-50 transform translate-x-1 -translate-y-1 select-none">
              404
            </h1>
          )}
        </div>

        {/* Error message */}
        <div className="mb-12 space-y-4">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Oops! Page Not Found
          </h2>
          <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
            The page you're looking for seems to have vanished into the digital
            void. Don't worry though – even the best explorers sometimes take a
            wrong turn.
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
          <button
            onClick={handleGoHome}
            className="group relative px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full text-white font-semibold text-lg transition-all duration-300 hover:from-purple-500 hover:to-pink-500 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/25 flex items-center gap-3"
          >
            <Home className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" />
            Take Me Home
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
          </button>

          <button
            onClick={handleGoBack}
            className="group px-8 py-4 border-2 border-cyan-400 rounded-full text-cyan-400 font-semibold text-lg transition-all duration-300 hover:bg-cyan-400 hover:text-slate-900 hover:scale-105 hover:shadow-2xl hover:shadow-cyan-400/25 flex items-center gap-3"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-300" />
            Go Back
          </button>
        </div>

        {/* Additional help section */}
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 max-w-2xl mx-auto">
          <div className="flex items-center justify-center mb-4">
            <Zap className="w-6 h-6 text-yellow-400 mr-2" />
            <span className="text-white font-semibold text-lg">Quick Help</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-300">
            <div className="flex items-center">
              <Search className="w-4 h-4 mr-2 text-purple-400" />
              Check your URL spelling
            </div>
            <div className="flex items-center">
              <Home className="w-4 h-4 mr-2 text-cyan-400" />
              Visit our homepage
            </div>
          </div>
        </div>

        {/* Floating particles */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full opacity-60 animate-ping"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 2}s`,
              }}
            ></div>
          ))}
        </div>
      </div>

      {/* Bottom decoration */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500"></div>
    </div>
  );
};

export default NotFoundPage;
