import { useState, useRef, useEffect } from "react";
import Sidebar from "./Sidebar";
import ChatWindow from "./ChatWindow";
import axios from "./utils/axios";

export default function Chat() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [newChat, setNewChat] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const messagesEndRef = useRef(null);

  const startNewChat = () => {
    setNewChat(true);
    setTimeout(() => setNewChat(false), 0); // Reset `newChat` to ensure ChatWindow updates
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;
    const userMessage = { text: inputMessage, isUser: true };
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setInputMessage("");
    try {
      const token = localStorage.getItem("token"); // Retrieve token from localStorage
      const response = await axios.post(
        "chat/",
        {
          message: inputMessage,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      const botMessage = { text: response.data.bot_response, isUser: false };
      setMessages((prevMessages) => [...prevMessages, botMessage]);
    } catch (err) {
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
