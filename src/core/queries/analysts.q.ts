// src/core/queries/analysts.q.ts - Analyst accounts and every change to them
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as service from "../services/analysts.service";
import { oversightKeys } from "./oversight.q";

export const analystKeys = {
  all: ["analysts"] as const,
  detail: (id: number) => [...analystKeys.all, id] as const,
};

/** Also names the actors in the audit log's filter */
export const useAnalystsQuery = () => useQuery({ queryKey: analystKeys.all, queryFn: ({ signal }) => service.listAnalysts(signal) });

export const useAnalystQuery = (id: number) => useQuery({ queryKey: analystKeys.detail(id), queryFn: ({ signal }) => service.getAnalyst(id, signal) });

/** Every change adds an audit row, so it refreshes the analysts and the audit log */
const useAnalystMutation = <V, R>(mutationFn: (vars: V) => Promise<R>, options?: { gcTime?: number }) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => Promise.all([analystKeys.all, oversightKeys.audit].map((queryKey) => queryClient.invalidateQueries({ queryKey }))),
    ...options,
  });
};

// Credentials are shown once: gcTime 0 keeps the only copy in the page that asked for them (as with enrollment codes)
export const useCreateAnalystMutation = () => useAnalystMutation(service.createAnalyst, { gcTime: 0 });
export const useResetPasswordMutation = () => useAnalystMutation(service.resetAnalystPassword, { gcTime: 0 });
export const useResetTOTPMutation = () => useAnalystMutation(service.resetAnalystTOTP, { gcTime: 0 });

export const useSetDisabledMutation = () =>
  useAnalystMutation(({ id, disabled }: { id: number; disabled: boolean }) => service.setAnalystDisabled(id, disabled));
export const useRevokeTokensMutation = () => useAnalystMutation(service.revokeAnalystTokens);
