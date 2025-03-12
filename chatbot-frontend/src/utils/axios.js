import axios from "axios";

const apiUrl = "http://localhost:8000/api/";

const instance = axios.create({
  baseURL: apiUrl,
  withCredentials: true, // Enable sending cookies & credentials
  headers: {
    "Content-Type": "application/json",
  },
});

export default instance;
