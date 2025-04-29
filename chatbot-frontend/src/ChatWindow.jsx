import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { Paperclip, Mic, Image, Send, Edit, Copy, User } from "lucide-react";
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
  const [editingIndex, setEditingIndex] = useState(null);

  const handleInputChange = (e) => {
    setInputMessage(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = `${e.target.scrollHeight}px`;
    setInputHeight(`${e.target.scrollHeight}px`);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e, editingIndex);
      setEditingIndex(null);
    }
  };

  useEffect(() => {
    if (newChat) {
      setMessages([]);
      setEditingIndex(null);
      setInputMessage("");
    }
  }, [newChat, setMessages, setInputMessage]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, messagesEndRef]);

  const handleEdit = (index) => {
    setEditingIndex(index);
    setInputMessage(messages[index].text);
  };

  const onSubmit = (e) => {
    e.preventDefault();
    handleSubmit(e, editingIndex);
    setEditingIndex(null);
  };

  return (
    <div className={`flex flex-col w-full h-screen bg-gray-100 text-gray-800 ${sidebarOpen ? "md:ml-[280px]" : ""} transition-all duration-300`}>
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b border-gray-200 p-4 shadow-sm flex items-center justify-between">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 hover:bg-gray-100 rounded-md transition-colors md:hidden"
        >
          <img src={sidebarOpen ? CloseIcon : OpenIcon} alt="Toggle Sidebar" className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-semibold">ChatGPT Clone</h1>
        <div className="w-6" />
      </header>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto bg-white">
        <div className="max-w-2xl mx-auto px-6 py-8">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 mt-20">
              <h2 className="text-2xl font-medium mb-2">Welcome to ChatGPT</h2>
              <p>Ask me anything!</p>
            </div>
          ) : (
            <div className="space-y-6">
              {messages.map((msg, i) => (
                <div key={i} className={`flex items-start ${msg.isUser ? "justify-end" : "justify-start"}`}> 
                  <div className="flex-shrink-0 mr-3">
                    {msg.isUser ? (
                      <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center">
                        <User className="w-4 h-4" />
                      </div>
                    ) : (
                      <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center">
                        <User className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                  <div className={`group relative max-w-[75%] rounded-2xl px-5 py-4 text-sm leading-relaxed
                    ${msg.isUser ? "bg-green-500 text-white" : "bg-gray-100 text-gray-900"}`}
                  >
                    <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 flex gap-1">
                      {msg.isUser ? (
                        <Edit onClick={() => handleEdit(i)} className="w-4 h-4 text-gray-600 hover:text-gray-800 cursor-pointer" />
                      ) : (
                        <Copy onClick={() => navigator.clipboard.writeText(msg.text)} className="w-4 h-4 text-gray-600 hover:text-gray-800 cursor-pointer" />
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

      {/* Input Bar */}
      <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4">
        <form onSubmit={onSubmit} className="max-w-2xl mx-auto flex items-end space-x-3">
          <div className="relative flex-1">
            <textarea
              value={inputMessage}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              className="w-full pr-12 pl-4 py-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-300"
              style={{ height: inputHeight, maxHeight: "150px", minHeight: "40px" }}
              rows={1}
            />
            <div className="absolute top-1/2 right-4 -translate-y-1/2 flex items-center gap-2">
              <Paperclip className="w-5 h-5 text-gray-400 hover:text-gray-600 cursor-pointer" />
              <Image className="w-5 h-5 text-gray-400 hover:text-gray-600 cursor-pointer" />
              <Mic className="w-5 h-5 text-gray-400 hover:text-gray-600 cursor-pointer" />
            </div>
          </div>
          <button
            type="submit"
            disabled={!inputMessage.trim()}
            className="p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
        {editingIndex !== null && (
          <p className="mt-2 text-sm text-yellow-600 text-center">Editing message #{editingIndex + 1}</p>
        )}
      </div>
    </div>
  );
}

ChatWindow.propTypes = {
  sidebarOpen: PropTypes.bool.isRequired,
  setSidebarOpen: PropTypes.func.isRequired,
  newChat: PropTypes.bool.isRequired,
  messages: PropTypes.arrayOf(
    PropTypes.shape({ text: PropTypes.string.isRequired, isUser: PropTypes.bool.isRequired })
  ).isRequired,
  setMessages: PropTypes.func.isRequired,
  inputMessage: PropTypes.string.isRequired,
  setInputMessage: PropTypes.func.isRequired,
  handleSubmit: PropTypes.func.isRequired,
  messagesEndRef: PropTypes.shape({ current: PropTypes.instanceOf(Element) }),
};
