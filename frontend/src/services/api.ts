import type { ApiResponse } from "@/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/v1";

async function request<T>(
  endpoint: string,
  options?: RequestInit,
): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(error.message || `Request failed: ${res.status}`);
  }

  const json: ApiResponse<T> = await res.json();
  return json.data;
}

export const api = {
  get: <T>(endpoint: string, init?: RequestInit) =>
    request<T>(endpoint, { method: "GET", ...init }),

  post: <T>(endpoint: string, body?: unknown, init?: RequestInit) =>
    request<T>(endpoint, { method: "POST", body: JSON.stringify(body), ...init }),

  patch: <T>(endpoint: string, body?: unknown, init?: RequestInit) =>
    request<T>(endpoint, { method: "PATCH", body: JSON.stringify(body), ...init }),

  delete: <T>(endpoint: string, init?: RequestInit) =>
    request<T>(endpoint, { method: "DELETE", ...init }),
};
