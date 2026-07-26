import { api } from "./api";
import type { LoginResponse } from "@/types";

export const authService = {
  login: (email: string, password: string) =>
    api.post<LoginResponse>("/auth/login", { email, password }),

  refresh: (refreshToken: string) =>
    api.post<{ accessToken: string; refreshToken: string; expiresIn: number }>("/auth/refresh", { refreshToken }),

  logout: () => api.post<void>("/auth/logout"),
};
