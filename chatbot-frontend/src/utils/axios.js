import axios from 'axios';

// API Endpoints configuration
const AUTH_API_URL = import.meta.env.VITE_AUTHENTICATION_URL || '';
const CHAT_API_URL = import.meta.env.VITE_CHATBOT_URL || '';

if (!import.meta.env.VITE_CHATBOT_URL) {
  throw new Error('CHATBOT_URL is not defined in environment variables. Using fallback value.');
}

if (!import.meta.env.VITE_AUTHENTICATION_URL) {
  throw new Error(
    'AUTHENTICATION_URL is not defined in environment variables. Using fallback value.'
  );
}

// Create separate instances for auth and chat
export const authAPI = axios.create({
  baseURL: AUTH_API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 second timeout
});

export const chatAPI = axios.create({
  baseURL: CHAT_API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 second timeout for chat responses
});

// Request interceptors to add auth token
const addAuthInterceptor = (instance) => {
  instance.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );
};

// Response interceptors for token refresh
const addResponseInterceptor = (instance) => {
  instance.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;
        try {
          const refreshToken =
            localStorage.getItem('refresh_token') || sessionStorage.getItem('refresh_token');
          if (refreshToken) {
            const response = await authAPI.post('/auth/token/refresh/', {
              refresh: refreshToken,
            });
            const newToken = response.data.access;
            localStorage.setItem('access_token', newToken);
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return instance(originalRequest);
          }
        } catch (refreshError) {
          // Refresh failed, redirect to login
          localStorage.clear();
          sessionStorage.clear();
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      }
      return Promise.reject(error);
    }
  );
};

// Apply interceptors
addAuthInterceptor(authAPI);
addAuthInterceptor(chatAPI);
addResponseInterceptor(authAPI);
addResponseInterceptor(chatAPI);

// Chat history utilities
export const saveChatHistory = (history) => {
  try {
    localStorage.setItem('chatHistory', JSON.stringify(history));
  } catch (error) {
    console.warn('Failed to save chat history:', error);
  }
};

export const loadChatHistory = () => {
  try {
    const history = localStorage.getItem('chatHistory');
    return history ? JSON.parse(history) : [];
  } catch (error) {
    console.warn('Failed to load chat history:', error);
    return [];
  }
};

export const clearChatHistory = () => {
  try {
    localStorage.removeItem('chatHistory');
  } catch (error) {
    console.warn('Failed to clear chat history:', error);
  }
};

// Auth utilities
export const getAuthToken = () => {
  return localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
};

export const setAuthTokens = (accessToken, refreshToken, rememberMe = false) => {
  const storage = rememberMe ? localStorage : sessionStorage;
  storage.setItem('access_token', accessToken);
  storage.setItem('refresh_token', refreshToken);
};

export const clearAuthTokens = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  sessionStorage.removeItem('access_token');
  sessionStorage.removeItem('refresh_token');
};

// Default export for backwards compatibility
export default authAPI;
