import { useState, useRef, useEffect } from "react";
import axios from "./utils/axios";
import Sidebar from "./Sidebar";
import ChatWindow from "./ChatWindow";

export default function Chat() {
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 768);
  const [newChat, setNewChat] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const messagesEndRef = useRef(null);

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

    const token = localStorage.getItem("token");
    if (!token) {
      alert("Please log in to continue.");
      return;
    }

    const userMessage = { text: inputMessage, isUser: true };
    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");

    try {
      const response = await axios.post(
        "chat/",
        { message: inputMessage },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const botMessage = { text: response.data.bot_response, isUser: false };
      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      if (err.response?.status === 401) {
        alert("Session expired. Please log in again.");
      } else {
        console.error("Error communicating with the backend:", err);
      }
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#343541]">
      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        startNewChat={startNewChat}
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