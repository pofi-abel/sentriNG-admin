// src/core/services/oversight.service.ts - Read-only oversight: the audit log, onboarding progress, analyst names
import type { Analyst, AuditLogRow, AuditParams, OnboardingSummary } from "@/lib/types";
import { http } from "../helpers/axios.helper";

/** Newest first */
export const listAudit = (params: AuditParams, signal?: AbortSignal) => http.get<AuditLogRow[]>("/admin/audit", { params, signal }).then((r) => r.data);

export const getOnboardingSummary = (signal?: AbortSignal) => http.get<OnboardingSummary>("/admin/onboarding/summary", { signal }).then((r) => r.data);

/** Active analysts (and admins), for the audit log's actor filter */
export const listAnalysts = (signal?: AbortSignal) => http.get<Analyst[]>("/admin/analysts", { signal }).then((r) => r.data);
