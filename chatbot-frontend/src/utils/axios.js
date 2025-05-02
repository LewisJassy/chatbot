import axios from "axios";

const apiUrl = "https://chatbot-mohw.onrender.com";

const instance = axios.create({
  baseURL: apiUrl,
  withCredentials: true, // Enable sending cookies & credentials
  headers: {
    "Content-Type": "application/json",
  },
});

export const saveChatHistory = (history) => {
  localStorage.setItem('chatHistory', JSON.stringify(history));
};

export const loadChatHistory = () => {
  const history = localStorage.getItem('chatHistory');
  return history ? JSON.parse(history) : [];
};

export default instance;