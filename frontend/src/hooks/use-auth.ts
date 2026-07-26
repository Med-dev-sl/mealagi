"use client";

import { useAuthStore } from "@/store/auth";
import { authService } from "@/services/auth";

export function useAuth() {
  const { user, accessToken, isAuthenticated, setAuth, clearAuth } = useAuthStore();

  const login = async (email: string, password: string) => {
    const res = await authService.login(email, password);
    setAuth(res.user, res.accessToken, res.refreshToken);
    return res;
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch {
      // ignore
    }
    clearAuth();
  };

  return { user, accessToken, isAuthenticated, login, logout };
}
