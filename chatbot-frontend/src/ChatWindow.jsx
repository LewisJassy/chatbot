import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { Paperclip, Mic, Image, Send, Edit, Copy } from "lucide-react";
import OpenIcon from "./assets/osidebar.png";
import CloseIcon from "./assets/csidebar.png";

export default function ChatWindow({
  sidebarOpen,
  setSidebarOpen,
  newChat,
  messages,
  setMessages,
  inputMessage,
  setInputMessage,
  handleSubmit,
  messagesEndRef,
}) {
  const [inputHeight, setInputHeight] = useState("auto");

  const handleInputChange = (e) => {
    setInputMessage(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = `${e.target.scrollHeight}px`;
    setInputHeight(`${e.target.scrollHeight}px`);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault(); // Prevent new line on Enter key
      handleSubmit(e); // Send message
    }
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (inputMessage.trim()) {
      setMessages([...messages, { text: inputMessage, isUser: true }]);
      setInputMessage("");
      setInputHeight("auto");
    }
  };

  useEffect(() => {
    if (newChat) setMessages([]);
  }, [newChat, setMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, messagesEndRef]);

  return (
    <div className={`flex flex-col w-full h-screen bg-[#343541] ${
      sidebarOpen ? "md:ml-[280px]" : ""
    } transition-all duration-300`}>
      {/* Header */}
      <header className="sticky top-0 z-10 bg-[#343541]/80 backdrop-blur-sm border-b border-gray-700/50 p-2">
        <div className="flex items-center justify-between max-w-3xl mx-auto px-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-gray-700/50 rounded-md transition-colors md:hidden"
          >
            <img
              src={sidebarOpen ? "/src/assets/csidebar.png" : "/src/assets/osidebar.png"}
              alt="Toggle Sidebar"
              className="w-6 h-6"
            />
          </button>
          <h1 className="text-lg font-medium text-gray-200">DeepSource AI</h1>
          <div className="w-10" /> {/* Spacer for alignment */}
        </div>
      </header>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-6">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center space-y-3">
                <h2 className="text-2xl font-medium text-gray-300">Welcome to DeepSource AI</h2>
                <p className="text-gray-400">Start a new chat to begin the conversation!</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.isUser ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`group relative max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed
                      ${
                        msg.isUser
                          ? "bg-[#1a7f64] text-white"
                          : "bg-[#444654] text-gray-200"
                      }`}
                  >
                    <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                    <div className="absolute right-0 top-0 hidden -mr-4 mt-2 group-hover:flex items-center gap-1">
                      {msg.isUser ? (
                        <Edit className="w-4 h-4 text-gray-400 hover:text-white cursor-pointer" />
                      ) : (
                        <Copy className="w-4 h-4 text-gray-400 hover:text-white cursor-pointer" 
                              onClick={() => navigator.clipboard.writeText(msg.text)} />
                      )}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Floating Input Bar */}
      <div className="sticky bottom-0 bg-[#343541]/80 backdrop-blur-sm px-4 py-4">
        <form
          onSubmit={handleSubmit}
          className="relative max-w-3xl mx-auto"
        >
          <div className="relative flex items-end rounded-xl border border-gray-700/50 bg-[#40414f] shadow-lg">
            <div className="absolute left-3 bottom-3 flex items-center gap-2">
              <Paperclip className="w-5 h-5 text-gray-400 hover:text-white cursor-pointer transition-colors" />
              <Mic className="w-5 h-5 text-gray-400 hover:text-white cursor-pointer transition-colors" />
              <Image className="w-5 h-5 text-gray-400 hover:text-white cursor-pointer transition-colors" />
            </div>
            <textarea
              value={inputMessage}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Message DeepSource AI..."
              className="w-full pl-24 pr-14 py-3 bg-transparent text-white placeholder-gray-400 focus:outline-none resize-none overflow-hidden"
              style={{
                height: inputHeight,
                maxHeight: "200px",
                minHeight: "46px"
              }}
              rows={1}
            />
            <button
              type="submit"
              disabled={!inputMessage.trim()}
              className="absolute right-2 bottom-2 p-1.5 rounded-lg bg-[#1a7f64] text-white opacity-90 hover:opacity-100 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </form>
        <div className="max-w-3xl mx-auto mt-2">
          <p className="text-xs text-center text-gray-400">
            DeepSource can make mistakes. Verify the information.
          </p>
        </div>
      </div>
    </div>
  );
}

ChatWindow.propTypes = {
  sidebarOpen: PropTypes.bool.isRequired,
  setSidebarOpen: PropTypes.func.isRequired,
  newChat: PropTypes.bool.isRequired,
  messages: PropTypes.arrayOf(
    PropTypes.shape({
      text: PropTypes.string.isRequired,
      isUser: PropTypes.bool.isRequired,
    })
  ).isRequired,
  setMessages: PropTypes.func.isRequired,
  inputMessage: PropTypes.string.isRequired,
  setInputMessage: PropTypes.func.isRequired,
  handleSubmit: PropTypes.func.isRequired,
  messagesEndRef: PropTypes.shape({ current: PropTypes.instanceOf(Element) }),
};