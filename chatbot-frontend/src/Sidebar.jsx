import React, { useState } from "react";
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
import { useNavigate } from "react-router-dom";

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
  const navigate = useNavigate();

  const chatHistory = [
    "Chat 1",
    "Chat 2",
    "Chat 3",
    // Add more chat history items here
  ];

  const handleLogout = (label) => {
    if (label == "Logout") {
      console.log("logging out");
      localStorage.clear();
      navigate("/login");
    } else {
      console.log("ohh !");
    }
  };

  return (
    <div
      className={`fixed top-0 left-0 h-full w-72 bg-gray-800 text-white transition-transform duration-300 ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      } border-r border-gray-700`}
      style={{
        scrollbarWidth: "thin", // For Firefox
        scrollbarColor: "#4b5563 #374151", // For Firefox (thumb and track)
      }}
    >
      {/* Scrollbar styling for Webkit browsers (Chrome, Safari) */}
      <style>
        {`
          .scrollbar-dark::-webkit-scrollbar {
            width: 8px;
          }
          .scrollbar-dark::-webkit-scrollbar-track {
            background: #374151; /* Gray-700 */
            border-radius: 4px;
          }
          .scrollbar-dark::-webkit-scrollbar-thumb {
            background: #4b5563; /* Gray-600 */
            border-radius: 4px;
          }
          .scrollbar-dark::-webkit-scrollbar-thumb:hover {
            background: #6b7280; /* Gray-500 */
          }
        `}
      </style>

      <div className="p-4 flex justify-between items-center border-b border-gray-600">
        <h1 className="text-lg font-semibold">Deepsource</h1>
        <X
          className="w-6 h-6 cursor-pointer hover:text-red-500"
          onClick={() => setSidebarOpen(false)}
        />
      </div>

      <div className="p-4 overflow-y-auto h-[calc(100%-128px)] scrollbar-dark">
        {/* Model Selection Dropdown */}
        <div className="mb-4">
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
                  className={`p-2 hover:bg-gray-600 rounded-lg transition-colors ${
                    model === option.name ? "bg-indigo-600" : ""
                  }`}
                  onClick={() => {
                    setModel(option.name);
                    setIsModelDropdownOpen(false);
                  }}
                >
                  {option.label}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* New Chat Button */}
        <button
          className="flex items-center p-3 w-full bg-gray-700 hover:bg-gray-600 rounded-lg mb-4 transition-all"
          onClick={startNewChat}
        >
          <Plus className="w-5 h-5 mr-2" />
          New Chat
        </button>

        {/* Search Bar */}
        <div className="relative mb-4">
          <input
            type="text"
            placeholder="Search chats..."
            className="w-full p-2 pl-10 bg-gray-700 rounded-lg text-sm placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
          <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
        </div>

        {/* Chat History List */}
        <div className="mb-6">
          <h3 className="text-sm text-gray-400 mb-2">Chat History</h3>
          <div className="space-y-2">
            {chatHistory.map((chat, index) => (
              <div
                key={index}
                className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg cursor-pointer"
              >
                {chat}
              </div>
            ))}
          </div>
        </div>

        {/* Additional Options */}
        <div>
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

      <div className="p-4 border-t border-gray-600 text-center text-xs">
        Deepsource 2025 &copy; Copyright
        <br />
        <span className="font-semibold">Powered by devOS</span>
      </div>
    </div>
  );
}

