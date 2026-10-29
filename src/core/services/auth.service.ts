// src/core/services/auth.service.ts - Admin login (password + TOTP → a 1 h admin-scoped token) and the caller
import type { Analyst, LoginResponse } from "@/lib/types";
import { http } from "../helpers/axios.helper";

/** A non-admin account gets the same 401 as a wrong password: the API never says who is an admin */
export const login = (body: { email: string; password: string; totp_code: string }) =>
  http.post<LoginResponse>("/admin/auth/login", body).then((r) => r.data);

export const getMe = (signal?: AbortSignal) => http.get<Analyst>("/admin/me", { signal }).then((r) => r.data);
