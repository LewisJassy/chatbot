import { useState, useEffect } from "react";
import {
  Plus,
  LogOut,
  User,
  Settings,
  X,
  Edit,
} from "lucide-react";
import PropTypes from 'prop-types';
import { saveChatHistory, loadChatHistory } from './utils/axios';
import { useNavigate } from "react-router-dom";

export default function Sidebar({
  sidebarOpen,
  setSidebarOpen,
  startNewChat,
}) {
  const [chatHistory, setChatHistory] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    let history = loadChatHistory();
    if (!Array.isArray(history)) history = [];
    setChatHistory(history);
  }, []);

  const handleLogout = (label) => {
    if (label === "Logout") {
      localStorage.clear();
      navigate("/login");
    }
  };

  const handleNewChat = () => {
    startNewChat();
    const newChat = `Chat ${chatHistory.length + 1}`;
    const updatedHistory = [...chatHistory, newChat];
    setChatHistory(updatedHistory);
    saveChatHistory(updatedHistory);
  };

  Sidebar.propTypes = {
    sidebarOpen: PropTypes.bool.isRequired,
    setSidebarOpen: PropTypes.func.isRequired,
    startNewChat: PropTypes.func.isRequired,
  };

  return (
    <div
      className={`fixed top-0 left-0 h-full w-[280px] bg-[#202123] text-gray-300 shadow-lg transform transition-all duration-300 ease-in-out z-50 ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      } md:translate-x-0 md:${sidebarOpen ? "w-[280px]" : "w-0"}`}
    >
      <div className="flex items-center justify-between p-4 border-b border-gray-700/50">
        <span className="text-xl font-medium">DeepSource AI</span>
        <button
          onClick={() => setSidebarOpen(false)}
          className="text-gray-400 hover:text-white focus:outline-none transition-colors md:hidden"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex flex-col h-[calc(100%-64px)] p-2">
        <button
          onClick={handleNewChat}
          className="flex items-center gap-3 w-full p-3 mb-3 rounded-lg hover:bg-gray-700/50 text-white border border-gray-700/50 transition-colors duration-200"
        >
          <Plus className="w-5 h-5" />
          <span>New chat</span>
        </button>

        {/* Chat History */}
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          <div className="space-y-2 pr-1">
            {chatHistory.map((chat, index) => (
              <div
                key={index}
                className="group p-3 rounded-lg cursor-pointer hover:bg-gray-700/50 transition-colors duration-200 flex items-center justify-between"
              >
                <span className="truncate">{typeof chat === "string" ? chat : "Untitled Chat"}</span>
                <div className="hidden group-hover:flex items-center gap-2">
                  <Edit className="w-4 h-4 text-gray-400 hover:text-white" />
                  <X className="w-4 h-4 text-gray-400 hover:text-white" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-gray-700/50 pt-2 mt-2 space-y-2">
          {[{ icon: <User className="w-5 h-5" />, label: "Profile" },
            { icon: <Settings className="w-5 h-5" />, label: "Settings" },
            { icon: <LogOut className="w-5 h-5" />, label: "Logout" },
          ].map((item, index) => (
            <div
              key={index}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-700/50 cursor-pointer transition-colors duration-200"
              onClick={() => handleLogout(item.label)}
            >
              {item.icon}
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}