// src/core/helpers/axios.helper.ts - The one Axios instance for the SentriNG API /v1 (see sentriNG-api/README.md)
import axios from "axios";
import { API_BASE_URL } from "@/lib/constants";
import { tokenManager } from "@/lib/token-manager";

/** Every API failure: the HTTP status (0 = no response) and the server's `{ error }` text */
export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export const isApiError = (error: unknown, status?: number): error is ApiError =>
  error instanceof ApiError && (status === undefined || error.status === status);

export const http = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30_000,
  headers: { "Content-Type": "application/json" },
});

http.interceptors.request.use((config) => {
  const token = tokenManager.getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

http.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!axios.isAxiosError(error)) return Promise.reject(error);
    if (axios.isCancel(error)) return Promise.reject(error);
    const status = error.response?.status ?? 0;
    // Expired (1 h), revoked, disabled or no longer an admin: there is no refresh token, so back to login. Login's own
    // 401 means bad credentials
    if (status === 401 && !window.location.pathname.startsWith("/login")) {
      tokenManager.clear();
      const here = window.location.pathname + window.location.search;
      window.location.assign(`/login?reason=ended&redirect=${encodeURIComponent(here)}`);
    }
    const message = (error.response?.data as { error?: string } | undefined)?.error || error.message || "Request failed";
    return Promise.reject(new ApiError(message, status));
  },
);
