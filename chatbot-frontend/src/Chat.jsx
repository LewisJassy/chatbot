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
      // Stream response via fetch for real-time chunks
      const res = await fetch(`${chatAPI.defaults.baseURL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: inputMessage, stream: true }),
      });
      if (!res.ok) throw res;
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let botText = '';
      // initialize empty bot message
      setMessages(prev => [...prev, { text: '', isUser: false }]);
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        // parse SSE format "data: {...}\n\n"
        const lines = chunk.split("\n\n");
        lines.forEach(part => {
          if (part.startsWith('data: ')) {
            const dataStr = part.replace(/^data: /, '');
            if (dataStr === '[DONE]') return;
            try {
              const data = JSON.parse(dataStr);
              if (data.chunk) {
                botText += data.chunk;
                // update last bot message
                setMessages(prev => {
                  const msgs = [...prev];
                  msgs[msgs.length - 1].text = botText;
                  return msgs;
                });
              }
            } catch (e) {
              console.error('Failed to parse SSE chunk', e);
            }
          }
        });
      }
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