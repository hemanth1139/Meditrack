"use client";

import { useCallback, useMemo } from "react";
import toast from "react-hot-toast";
import * as auth from "@/lib/auth";

export default function useAuth() {
  const user = useMemo(() => auth.getUser(), []);
  const role = useMemo(() => auth.getRole(), []);
  const isAuthed = useMemo(() => auth.isAuthenticated(), []);

  const login = useCallback(async (email, password) => {
    try {
      const data = await auth.login(email, password);
      return data;
    } catch (e) {
      const msg = e?.response?.data?.message || "Sign in failed.";
      toast.error(msg);
      throw e;
    }
  }, []);

  const logout = useCallback(() => auth.logout(), []);

  return {
    user,
    role,
    isAuthenticated: isAuthed,
    login,
    logout,
  };
}

