import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { Paperclip, Mic, Image, Send, Edit, Copy } from "lucide-react";
import OpenIcon from "./assets/osidebar.png";
import CloseIcon from "./assets/csidebar.png";

export default function ChatWindow({ sidebarOpen, setSidebarOpen, newChat, messages, setMessages, inputMessage, setInputMessage, handleSubmit, messagesEndRef }) {

  const [inputHeight, setInputHeight] = useState("auto"); // Dynamic height for input



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
    <div className={`flex-1 flex flex-col w-full h-full ${sidebarOpen ? "pl-5" : ""}`}>
      {/* Header */}
      <header className="p-4 bg-gray-800 flex justify-between items-center border-b border-gray-700 text-white">
        <div className="flex items-center space-x-3">
          {/* Sidebar Toggle Icon */}
          <img
            src={sidebarOpen ? CloseIcon : OpenIcon}
            alt={sidebarOpen ? "Close Sidebar" : "Open Sidebar"}
            className="w-7 h-7 cursor-pointer"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          />
          <h1 className="text-lg font-semibold">Deepsource AI</h1>
        </div>
      </header>

      {/* Message List */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-900 text-white">
        {messages.length === 0 ? (
          <div className="bg-gray-800 p-6 rounded-lg text-center text-sm text-gray-400">
            Start a new chat to begin the conversation!
          </div>
        ) : (
          messages.map((msg, i) => (
            <div
              key={i}


              className={`p-3 my-2 rounded-lg max-w-full transition-all duration-300 ${
                msg.isUser
                  ? "bg-gray-800 text-white self-end"
                  : "bg-gray-700 text-gray-300 self-start"

              }`}
              style={{
                boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
                width: "fit-content",
                maxWidth: "90%",
              }}
            >
              <div className="flex items-center justify-between">
                {/* Message Content */}
                <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  {msg.isUser && (
                    <Edit
                      className="w-4 h-4 text-gray-400 cursor-pointer hover:text-white"
                      onClick={() => console.log("Edit message:", i)}
                      aria-label="Edit message"
                    />
                  )}
                  {!msg.isUser && (
                    <Copy
                      className="w-4 h-4 text-gray-400 cursor-pointer hover:text-white"
                      onClick={() => navigator.clipboard.writeText(msg.text)}
                      aria-label="Copy message"
                    />
                  )}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <form
        onSubmit={handleSubmit}
        className="p-4 bg-gray-900"
      >
        <div className="flex items-end space-x-3">
          <div className="flex items-center space-x-2">
            <Paperclip className="w-5 h-5 text-gray-400 cursor-pointer hover:text-white" />
            <Mic className="w-5 h-5 text-gray-400 cursor-pointer hover:text-white" />
            <Image className="w-5 h-5 text-gray-400 cursor-pointer hover:text-white" />
          </div>
          <textarea
            value={inputMessage}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            className="flex-grow p-2 bg-gray-700 rounded-lg border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 resize-none overflow-hidden"
            style={{
              height: inputHeight,
              maxHeight: "200px",
            }}
            rows={1}
          />
          <button
            type="submit"
            className="p-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Send className="w-5 h-5 text-white" />
          </button>
        </div>
      </form>


      {/* Footer */}
      <footer className="p-2 bg-gray-900 text-xs text-gray-400 text-center">

        Deepsource can make mistakes. Verify the information.
      </footer>
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