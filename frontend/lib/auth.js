import Cookies from "js-cookie";
import api from "./api";

export const login = async (email, password) => {
  const res = await api.post("/auth/login/", { username: email, password });
  if (!res.data?.success) throw new Error(res.data?.message || "Login failed");
  // Backend automatically attaches HttpOnly 'access_token' and 'refresh_token' cookies.
  Cookies.set("user_role", res.data.data.role, { expires: 7 });
  Cookies.set("user_data", JSON.stringify(res.data.data), { expires: 1 });
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
export const getUser = () => {
  try {
    const data = Cookies.get("user_data");
    return data && data !== "undefined" ? JSON.parse(data) : {};
  } catch (e) {
    return {};
  }
};
export const isAuthenticated = () => !!Cookies.get("user_role");

