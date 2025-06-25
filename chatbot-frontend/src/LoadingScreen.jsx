import { useEffect, useState, useMemo } from "react";
import robotImage from "./assets/robot.png"; // Use the image you generated earlier
import { motion, AnimatePresence } from "framer-motion";

export default function LoadingScreen({ onComplete }) {
  const [progress, setProgress] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState("Firing engine up...");
  const [showFinalMessage, setShowFinalMessage] = useState(false);

  const messages = useMemo(() => [
    "Waking up the sleepy robot...",
    "Connecting to devOS...",
    "Configuring core modules...",
    "Loading the universe...",
    "Optimizing space-time continuum...",
    "Powering up systems...",
  ], []);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev < 100) {
          if (prev % 20 === 0 && prev !== 0) {
            setLoadingMessage(messages[Math.floor(prev / 20) - 1]);
          }
          return prev + 2;
        } else {
          clearInterval(interval);
          setShowFinalMessage(true); // Show "Powered by devOS"
          setTimeout(() => {
            if (typeof onComplete === "function") onComplete(); // Transition after delay
          }, 2000); // 2-second delay for the final message
          return prev;
        }
      });
    }, 100);

    return () => clearInterval(interval);
  }, [messages, onComplete]);

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white">
      <motion.div
        className="rounded-full bg-gray-800 p-10 mb-6 flex items-center justify-center"
        style={{ width: 200, height: 200 }}
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
      >
        <motion.img
          src={robotImage}
          alt="Robot spinning"
          className="w-full h-full object-cover rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        />
      </motion.div>
      {!showFinalMessage ? (
        <>
          <p className="text-xl font-bold mb-3">{loadingMessage}</p>
          <div className="w-3/4 bg-gray-700 rounded-full overflow-hidden">
            <motion.div
              className="bg-blue-500 h-3"
              style={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <p className="mt-2 text-sm">{progress}%</p>
        </>
      ) : (
        <AnimatePresence>
          <motion.p
            className="text-2xl font-bold mt-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 1 }}
          >
            Powered by devOS
          </motion.p>
        </AnimatePresence>
      )}
    </div>
  );
}
