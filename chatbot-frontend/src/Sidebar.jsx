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
      className={`fixed top-0 left-0 h-full w-72 bg-gray-800 text-white transition-transform duration-300 ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      {/* Header Section */}
      <div className="flex items-center justify-between p-4">
        <span className="text-xl font-bold">Sidebar</span>
        <button
          onClick={() => setSidebarOpen(false)}
          className="text-white hover:text-gray-400 focus:outline-none"
        >
          <X />
        </button>
      </div>

      <div className="p-4">
        {/* New Chat Button */}
        <div
          className="flex items-center p-3 bg-gray-700 rounded-lg mb-4 cursor-pointer"
          onClick={startNewChat}
        >
          <Plus className="mr-2" />
          <span>New Chat</span>
        </div>

        {/* Search Bar */}
        <div className="flex items-center mb-4">
          <Search className="w-5 h-5 mr-2" />
          <input
            type="text"
            placeholder="Search"
            className="flex-1 p-2 rounded-md text-black"
          />
        </div>

        {/* Chat History */}
        <div className="space-y-2">
          {chatHistory.map((chat, index) => (
            <div
              key={index}
              className="p-2 bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-600"
            >
              {chat}
            </div>
          ))}
        </div>

        {/* Model Dropdown */}
        <div className="mt-4">
          <div
            className="flex items-center justify-between p-2 bg-gray-700 rounded-lg cursor-pointer"
            onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
          >
            <span>
              Select Model <ChevronDown className="inline w-4 h-4" />
            </span>
          </div>
          {isModelDropdownOpen && (
            <div className="mt-2 bg-gray-700 rounded-lg max-h-40 overflow-y-auto scrollbar-dark">
              {modelOptions.map((option) => (
                <div
                  key={option.name}
                  onClick={() => setModel(option.name)}
                  className={`p-2 cursor-pointer hover:bg-gray-600 ${
                    model === option.name ? "bg-gray-600" : ""
                  }`}
                >
                  {option.label}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Menu at the Bottom */}
        <div className="mt-8 space-y-2">
          {[
            { icon: <User className="w-5 h-5 mr-2" />, label: "Profile" },
            { icon: <Bell className="w-5 h-5 mr-2" />, label: "Notifications" },
            { icon: <Settings className="w-5 h-5 mr-2" />, label: "Settings" },
            { icon: <HelpCircle className="w-5 h-5 mr-2" />, label: "Help" },
            { icon: <LogOut className="w-5 h-5 mr-2" />, label: "Logout" },
          ].map((item, index) => (
            <div
              key={index}
              className="flex items-center p-3 hover:bg-gray-700 rounded-lg cursor-pointer"
              onClick={() => handleLogout(item.label)}
            >
              {item.icon}
              {item.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}