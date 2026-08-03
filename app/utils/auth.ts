import axios from "axios";

export const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";

export const getToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("perp_token");
};

export const getUserId = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("perp_userId");
};

export const setAuthData = (token: string, userId?: string) => {
  if (typeof window === "undefined") return;
  localStorage.setItem("perp_token", token);
  if (userId) {
    localStorage.setItem("perp_userId", userId);
  }
};

export const removeAuthData = () => {
  if (typeof window === "undefined") return;
  localStorage.removeItem("perp_token");
  localStorage.removeItem("perp_userId");
};

export const isLoggedIn = (): boolean => {
  return !!getToken();
};

export const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);
