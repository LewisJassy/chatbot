import { useState, useRef, useEffect } from "react";
import axios from "./utils/axios";
import Sidebar from "./Sidebar";
import ChatWindow from "./ChatWindow";

export default function Chat() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [newChat, setNewChat] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const messagesEndRef = useRef(null);

  const startNewChat = () => {
    setNewChat(true);
    setTimeout(() => setNewChat(false), 0);
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
      alert("Please log in to obtain a token.");
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
      if (err.response && err.response.status === 401) {
        alert("Unauthorized. Please log in again.");
      }
      console.error("Error communicating with the backend", err);
    }
  };

  const chatAreaStyle = {
    flexGrow: 1,
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    marginLeft: sidebarOpen ? "260px" : "0",
    transition: "margin-left 0.3s ease",
    overflow: "hidden",
  };

  return (
    <div className="flex h-screen">
      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        startNewChat={startNewChat}
      />
      <div style={chatAreaStyle}>
        <ChatWindow
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          newChat={newChat}
          messages={messages}
          inputMessage={inputMessage}
          setInputMessage={setInputMessage}
          handleSubmit={handleSubmit}
          messagesEndRef={messagesEndRef}
        />
      </div>
    </div>
  );
}