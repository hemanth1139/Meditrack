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
    // If 401 Unauthorized, attempt a silent token refresh using the HttpOnly refresh cookie
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        await axios.post(`${BASE_URL}/accounts/token/refresh/`, {}, { withCredentials: true });
        // The backend set a new HttpOnly access cookie automatically.
        // Retry the original request implicitly!
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed (token expired natively), force strict logout
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default api;

