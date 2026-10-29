// src/core/queries/auth.q.ts - The signed-in admin, login and logout
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { tokenManager } from "@/lib/token-manager";
import * as service from "../services/auth.service";

export const authKeys = {
  me: ["me"] as const,
};

export const useMeQuery = () => useQuery({ queryKey: authKeys.me, queryFn: ({ signal }) => service.getMe(signal), staleTime: Infinity });

/** Stores the session; the page decides where to go next */
export const useLoginMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: service.login,
    onSuccess: (session) => {
      queryClient.clear(); // nothing cached from a previous admin on this machine
      tokenManager.set({ token: session.token, expiresAt: session.expires_at, analystId: session.analyst_id });
    },
  });
};

/** The API has no session to end: drop the token and every cached answer */
export const useLogout = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  return (reason?: "idle" | "ended") => {
    tokenManager.clear();
    queryClient.clear();
    navigate({ to: "/login", search: { reason }, replace: true });
  };
};
