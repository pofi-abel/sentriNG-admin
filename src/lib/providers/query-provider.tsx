// src/lib/providers/query-provider.tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { isApiError } from "@/core/helpers/axios.helper";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Retry only what can heal: no response or a 5xx. A 4xx is an answer (404, 409…), retrying won't change it
      retry: (failures, error) => failures < 3 && (!isApiError(error) || error.status === 0 || error.status >= 500),
      refetchOnWindowFocus: true,
    },
  },
});

export function QueryProvider({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
