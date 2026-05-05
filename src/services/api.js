import axios from "axios";

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000/api",
  timeout: Number(import.meta.env.VITE_API_TIMEOUT) || 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

let isRedirectingToLogin = false;

const isAuthLoginRequest = (config) => {
  const url = config?.url || "";
  return /\/auth\/login\/?$/i.test(url);
};

const shouldAutoLogout = (error) => {
  const status = error?.response?.status;
  if ([401, 419, 440].includes(status)) return true;

  const message = String(
    error?.response?.data?.message ||
      error?.response?.data?.error ||
      error?.message ||
      ""
  ).toLowerCase();

  const expiredPatterns = [
    "token expired",
    "jwt expired",
    "session expired",
    "unauthenticated",
    "unauthorized",
    "invalid token",
  ];

  return expiredPatterns.some((pattern) => message.includes(pattern));
};

const forceLogout = () => {
  if (isRedirectingToLogin) return;
  isRedirectingToLogin = true;
  localStorage.clear();
  window.location.replace("/login");
};

// Request interceptor — inject token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle 401
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const isLoginCall = isAuthLoginRequest(error?.config);
    if (!isLoginCall && shouldAutoLogout(error)) {
      forceLogout();
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;