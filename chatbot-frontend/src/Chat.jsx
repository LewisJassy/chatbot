import { useState, useRef, useEffect } from "react";
import PropTypes from "prop-types";
import { chatAPI, authAPI, getAuthToken, clearAuthTokens } from "./utils/axios";
import Sidebar from "./Sidebar";
import ChatWindow from "./ChatWindow";
import { useNavigate } from "react-router-dom";

export default function Chat({ onLogout }) {
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 768);
  const [newChat, setNewChat] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  // Handle window resize for responsive sidebar
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setSidebarOpen(true);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const startNewChat = () => {
    setNewChat(true);
    setMessages([]);
    setTimeout(() => setNewChat(false), 0);
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const token = getAuthToken();
    if (!token) {
      onLogout();
      navigate("/login", { replace: true });
      return;
    }

    const userMessage = { text: inputMessage, isUser: true };
    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");

    try {
      const response = await chatAPI.post("/api/chat/", { 
        message: inputMessage 
      });
      
      const botMessage = { text: response.data.bot_response || response.data.response, isUser: false };
      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      if (err.response?.status === 401) {
        clearAuthTokens();
        onLogout();
        navigate("/login", { replace: true });
      } else {
        console.error("Error communicating with the backend:", err);
        const errorMessage = { 
          text: "Sorry, I'm having trouble connecting. Please try again.", 
          isUser: false 
        };
        setMessages((prev) => [...prev, errorMessage]);
      }
    }
  };
  const handleLogout = async () => {
    try {
      await authAPI.post("/auth/logout/", {
        refresh_token: localStorage.getItem('refresh_token') || sessionStorage.getItem('refresh_token')
      });
    } catch (error) {
      console.debug("Logout error:", error);
    } finally {
      clearAuthTokens();
      onLogout();
      navigate("/login", { replace: true });
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#343541]">
      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        startNewChat={startNewChat}
        onLogout={handleLogout}
      />
      <ChatWindow
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        newChat={newChat}
        messages={messages}
        setMessages={setMessages}
        inputMessage={inputMessage}
        setInputMessage={setInputMessage}
        handleSubmit={handleSubmit}
        messagesEndRef={messagesEndRef}
      />
    </div>
  );
}

Chat.propTypes = {
  onLogout: PropTypes.func.isRequired,
};