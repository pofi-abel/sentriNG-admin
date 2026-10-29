// src/core/queries/reference.q.ts - Elections, states, and reference imports
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as service from "../services/reference.service";
import { observerKeys } from "./observers.q";
import { oversightKeys } from "./oversight.q";

export const referenceKeys = {
  elections: ["elections"] as const,
  states: ["states"] as const,
};

export const useElectionsQuery = () => useQuery({ queryKey: referenceKeys.elections, queryFn: ({ signal }) => service.listElections(signal) });

export const useStatesQuery = () => useQuery({ queryKey: referenceKeys.states, queryFn: ({ signal }) => service.listStates(signal), staleTime: 5 * 60_000 });

/** An applied import can touch any reference data, and polling-unit names show on observers and onboarding: refresh it
 * all. A dry run changes nothing, so it refreshes nothing */
export const useImportReferenceMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: service.importReference,
    onSuccess: (result) =>
      result.applied &&
      Promise.all(
        [referenceKeys.elections, referenceKeys.states, observerKeys.all, oversightKeys.onboarding, oversightKeys.audit].map((queryKey) =>
          queryClient.invalidateQueries({ queryKey }),
        ),
      ),
  });
};

const useElectionMutation = <V, R>(mutationFn: (vars: V) => Promise<R>) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => Promise.all([referenceKeys.elections, oversightKeys.audit].map((queryKey) => queryClient.invalidateQueries({ queryKey }))),
  });
};

export const useCreateElectionMutation = () => useElectionMutation(service.createElection);
export const useUpdateElectionMutation = () => useElectionMutation(service.updateElection);
