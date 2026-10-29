// src/lib/constants.ts - Application constants

// VITE_API_URL is the API's origin (https://api.example.org); a trailing slash or /v1 is accepted and dropped
export const API_ORIGIN = (import.meta.env.VITE_API_URL || "http://localhost:8080").replace(/\/+$/, "").replace(/\/v1$/, "");
// Development uses the relative path so requests go through Vite's proxy
export const API_BASE_URL = import.meta.env.PROD ? `${API_ORIGIN}/v1` : "/v1";

export const IDLE_LOCK_MS = 10 * 60_000; // this console issues credentials: lock sooner than the desk
export const SESSION_WARNING_MS = 10 * 60_000; // admin sessions last 1 h (admin plan §8): warn for the last 10 min
export const PAGE_SIZE = 50;
export const IMPORT_MAX_ROWS = 5000; // the API's cap per roster or assignments import
