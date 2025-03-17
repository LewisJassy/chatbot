import { useState } from "react";
import {
  Plus,
  LogOut,
  Search,
  User,
  Bell,
  Settings,
  HelpCircle,
  X,
  ChevronDown,
  Edit,
} from "lucide-react";
import PropTypes from 'prop-types';

export default function Sidebar({
  sidebarOpen,
  setSidebarOpen,
  startNewChat,
  model,
  setModel,
}) {
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const modelOptions = [
    { name: "free", label: "Free" },
    { name: "sourceplus", label: "Source Plus" },
  ];
  const chatHistory = [
    "Chat 1",
    // Add more chat history items here
  ];

  const handleLogout = (label) => {
    if (label === "Logout") {
      localStorage.clear();
    }
    
  };

  Sidebar.propTypes = {
    sidebarOpen: PropTypes.bool.isRequired,
    setSidebarOpen: PropTypes.func.isRequired,
    startNewChat: PropTypes.func.isRequired,
    model: PropTypes.string.isRequired,
    setModel: PropTypes.func.isRequired,
  };

  return (
    <div
      className={`fixed top-0 left-0 h-full w-[280px] bg-[#202123] text-gray-300 shadow-lg transform transition-all duration-300 ease-in-out z-50 ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      } md:translate-x-0 md:${sidebarOpen ? "w-[280px]" : "w-0"}`}
    >
      {/* Header Section */}
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
        {/* New Chat Button */}
        <button
          onClick={startNewChat}
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
                <span className="truncate">{chat}</span>
                <div className="hidden group-hover:flex items-center gap-2">
                  <Edit className="w-4 h-4 text-gray-400 hover:text-white" />
                  <X className="w-4 h-4 text-gray-400 hover:text-white" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Menu */}
        <div className="border-t border-gray-700/50 pt-2 mt-2 space-y-2">
          {[
            { icon: <User className="w-5 h-5" />, label: "Profile" },
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