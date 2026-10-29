// src/core/services/oversight.service.ts - Read-only oversight: the audit log and onboarding progress
import type { AuditLogRow, AuditParams, OnboardingSummary } from "@/lib/types";
import { http } from "../helpers/axios.helper";

/** Newest first */
export const listAudit = (params: AuditParams, signal?: AbortSignal) => http.get<AuditLogRow[]>("/admin/audit", { params, signal }).then((r) => r.data);

export const getOnboardingSummary = (signal?: AbortSignal) => http.get<OnboardingSummary>("/admin/onboarding/summary", { signal }).then((r) => r.data);
