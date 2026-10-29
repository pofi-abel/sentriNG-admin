// src/core/queries/oversight.q.ts - Audit log, onboarding progress and analyst names
import { useQuery } from "@tanstack/react-query";
import type { AuditParams } from "@/lib/types";
import * as service from "../services/oversight.service";

export const oversightKeys = {
  audit: ["audit"] as const,
  auditList: (params: AuditParams) => [...oversightKeys.audit, params] as const,
  onboarding: ["onboarding"] as const,
  analysts: ["analysts"] as const,
};

export const useAuditQuery = (params: AuditParams) =>
  useQuery({ queryKey: oversightKeys.auditList(params), queryFn: ({ signal }) => service.listAudit(params, signal), placeholderData: (prev) => prev });

// During a training session the numbers move while the page is open: refresh every minute
export const useOnboardingQuery = () =>
  useQuery({ queryKey: oversightKeys.onboarding, queryFn: ({ signal }) => service.getOnboardingSummary(signal), refetchInterval: 60_000 });

export const useAnalystsQuery = () =>
  useQuery({ queryKey: oversightKeys.analysts, queryFn: ({ signal }) => service.listAnalysts(signal), staleTime: 5 * 60_000 });
