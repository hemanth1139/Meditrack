import axios from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

// Since the cookies are HttpOnly, we don't need a Request Interceptor 
// to manually attach 'Authorization: Bearer <token>' anymore. Browser does it!

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url.includes("/auth/token/refresh") && !originalRequest.url.includes("/auth/login") && !originalRequest.url.includes("/auth/logout")) {
      originalRequest._retry = true;
      try {
        await api.post("/auth/token/refresh/");
        return api(originalRequest);
      } catch (refreshError) {
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default api;

