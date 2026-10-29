// src/core/services/analysts.service.ts - Desk analyst accounts: create, disable / enable, log out everywhere, resets
import type { AdminAnalyst, AnalystCredentials } from "@/lib/types";
import { http } from "../helpers/axios.helper";

/** Every account by name, admins and disabled ones included */
export const listAnalysts = (signal?: AbortSignal) => http.get<AdminAnalyst[]>("/admin/analysts", { signal }).then((r) => r.data);

export const getAnalyst = (id: number, signal?: AbortSignal) => http.get<AdminAnalyst>(`/admin/analysts/${id}`, { signal }).then((r) => r.data);

/** A desk analyst, never an admin. Returns a generated password and the authenticator QR, once. 409: email taken */
export const createAnalyst = (body: { name: string; email: string }) =>
  http.post<AnalystCredentials>("/admin/analysts", body).then((r) => r.data);

/** The changes below refuse admin accounts with 403: those change only through the API's CLI */
export const setAnalystDisabled = (id: number, disabled: boolean) =>
  http.post<void>(`/admin/analysts/${id}/${disabled ? "disable" : "enable"}`).then(() => undefined);

/** Ends every session the analyst has */
export const revokeAnalystTokens = (id: number) => http.post<void>(`/admin/analysts/${id}/revoke-tokens`).then(() => undefined);

/** A new generated password, once. Ends their sessions */
export const resetAnalystPassword = (id: number) => http.post<AnalystCredentials>(`/admin/analysts/${id}/reset-password`).then((r) => r.data);

/** A new authenticator QR, once (lost phone). The old entry stops working; ends their sessions */
export const resetAnalystTOTP = (id: number) => http.post<AnalystCredentials>(`/admin/analysts/${id}/reset-totp`).then((r) => r.data);
