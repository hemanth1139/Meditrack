import Cookies from "js-cookie";
import api from "./api";

export const login = async (email, password) => {
  const res = await api.post("/auth/login/", { email, password });
  if (!res.data?.success) throw new Error(res.data?.message || "Login failed");
  // Backend automatically attaches HttpOnly 'access_token' and 'refresh_token' cookies.
  Cookies.set("user_role", res.data.data.role, { expires: 7 });
  Cookies.set("user_data", JSON.stringify(res.data.data.user), { expires: 1 });
  return res.data.data;
};

export const logout = async () => {
  try {
    // Notify the backend to blacklist the token and delete the HttpOnly cookies
    await api.post("/auth/logout/");
  } catch (e) {
    console.error("Logout API failed", e);
  } finally {
    Cookies.remove("user_role");
    Cookies.remove("user_data");
    window.location.href = "/login";
  }
};

export const getRole = () => Cookies.get("user_role");
export const getUser = () => JSON.parse(Cookies.get("user_data") || "{}");
export const isAuthenticated = () => !!Cookies.get("user_role");

