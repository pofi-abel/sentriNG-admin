// src/core/queries/observers.q.ts - Observer list and detail, and every onboarding change
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AssignmentRow, ObserverListParams, RosterRow } from "@/lib/types";
import * as service from "../services/observers.service";
import { oversightKeys } from "./oversight.q";

export const observerKeys = {
  all: ["observers"] as const,
  list: (params: ObserverListParams) => [...observerKeys.all, "list", params] as const,
  detail: (ref: string) => [...observerKeys.all, "detail", ref] as const,
};

export const useObserversQuery = (params: ObserverListParams) =>
  useQuery({ queryKey: observerKeys.list(params), queryFn: ({ signal }) => service.listObservers(params, signal), placeholderData: (prev) => prev });

export const useObserverQuery = (ref: string) =>
  useQuery({ queryKey: observerKeys.detail(ref), queryFn: ({ signal }) => service.getObserver(ref, signal) });

/** Every change can move an observer between list filters and adds an audit row, so each one refreshes observers,
 * onboarding progress and the audit log */
const useObserverMutation = <V, R>(mutationFn: (vars: V) => Promise<R>, options?: { gcTime?: number }) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () =>
      Promise.all(
        [observerKeys.all, oversightKeys.onboarding, oversightKeys.audit].map((queryKey) => queryClient.invalidateQueries({ queryKey })),
      ),
    ...options,
  });
};

// Codes are credentials shown once: gcTime 0 drops the response from the mutation cache as soon as the page that
// asked for it lets go, so the only copy lives in that page's state
export const useImportRosterMutation = () => useObserverMutation((rows: RosterRow[]) => service.importRoster(rows), { gcTime: 0 });
export const useReissueCodeMutation = () => useObserverMutation((ref: string) => service.reissueCode(ref), { gcTime: 0 });

export const useRevokeObserverMutation = () => useObserverMutation((ref: string) => service.revokeObserver(ref));
export const useAssignMutation = () => useObserverMutation(({ ref, puCode }: { ref: string; puCode: string }) => service.assignPollingUnit(ref, puCode));
export const useUnassignMutation = () =>
  useObserverMutation(({ ref, puCode }: { ref: string; puCode: string }) => service.unassignPollingUnit(ref, puCode));
export const useImportAssignmentsMutation = () => useObserverMutation((rows: AssignmentRow[]) => service.importAssignments(rows));
