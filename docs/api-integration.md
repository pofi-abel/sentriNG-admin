# Frontend API Integration Guidelines

This project utilizes a strictly layered architecture for data fetching and state management. When adding new features, you must follow these three layers to ensure the codebase remains scalable, maintainable, and predictable.

## Layer 1: The Service Layer (Network Requests)
**Location:** `src/core/services/*.service.ts`

The service layer is solely responsible for HTTP communication. It does not know about React, component lifecycles, or global state.

- **Pattern:** Export pure asynchronous functions that call endpoints using our configured Axios instance (`axios.helper.ts`).
- **Cancellation:** Every service function must accept an `AbortSignal` to support request cancellation.
- **Example:**
  ```typescript
  import { axiosInstance } from "../helpers/axios.helper";

  export const listCmsTransfersService = async ({ params, signal }) => {
    return axiosInstance.get('/admin/transfers', { params, signal });
  };
  ```

## Layer 2: The Query Layer (Caching & Server State)
**Location:** `src/core/queries/*.q.ts`

This layer bridges the Service Layer with React using **TanStack Query** (React Query). It acts as the single source of truth for server state.

- **Queries (`useQuery`):** Wrap service functions to handle caching, background refetching, and loading states. Always define strict, predictable `queryKey` arrays. Pass the `abortController.signal` to the service.
- **Mutations (`useMutation`):** Wrap `POST`/`PUT`/`DELETE` requests. The mutation hook **owns cache invalidation**: it must call `queryClient.invalidateQueries` in its own hook-level `onSuccess`, so the UI updates automatically and invalidation can never be skipped by a caller. Mutation hooks must not take invalidation behavior as a parameter.
- **UI feedback is not the hook's job:** Toasts, closing modals/panels, and navigation are context-specific and belong to the Presentation layer. Callers attach them through the per-call options of `mutate` / `mutateAsync` (`mutate(payload, { onSuccess, onError })`).
- **Escape hatch:** Callbacks passed to `mutate(vars, { onSuccess })` do not fire if the component unmounts before the request resolves (for example, a modal that closes while the request is in flight). If a side effect must run regardless, the hook may accept an optional `onSuccessCallback` that is invoked from the hook-level `onSuccess`. Use this sparingly and only for effects that must survive unmounting.
- **Query examples:**
  ```typescript
  import { useQuery } from "@tanstack/react-query";
  import { abortController } from "../helpers/axios.helper";
  import { listCmsTransfersService } from "../services/cms.service";

  export const useCmsTransfersQuery = (params?: CmsTransferFilters) =>
    useQuery({
      queryKey: ["cmsTransfers", params],
      queryFn: () => listCmsTransfersService({ params, signal: abortController.signal }),
    });
  ```
- **Mutation example (hook owns invalidation):**
  ```typescript
  import { useMutation, useQueryClient } from "@tanstack/react-query";
  import { createCmsTransferService } from "../services/cms.service";

  export const useCreateCmsTransferMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: createCmsTransferService,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["cmsTransfers"] });
      },
    });
  };
  ```
- **Mutation example with the optional escape hatch:**
  ```typescript
  export const useCreateCmsTransferMutation = (options?: { onSuccessCallback?: () => void }) => {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: createCmsTransferService,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["cmsTransfers"] });
        options?.onSuccessCallback?.();
      },
    });
  };
  ```

## Layer 3: The Presentation Layer (UI & URL State)
**Location:** `src/routes/dashboard/*.tsx` and `src/components/*`

The UI layer orchestrates the data but never fetches it directly.

- **URL as State (`nuqs`):** We strictly use URL search parameters (via `useQueryStates` from `nuqs`) to store active filters, pagination limits, and selected entity IDs. This ensures users can bookmark, refresh, or share links to specific data views safely without losing their place.
- **Smart Routes, Dumb Components:** 
  - **Routes (`src/routes/dashboard/*.tsx`):** These act as the "smart" orchestrators. They read the URL state, pass it to the Query Hooks, and extract `{ data, isPending }`. They also trigger mutations and attach UI feedback (toasts, closing panels) via `mutate` options.
  - **Components (`src/components/*`):** These act as the "dumb" presentational layers (e.g., Tables, Side Panels). They only accept `data` and `isPending` via React props. They never make API calls themselves.
  - **Skeleton Loaders:** Components must check the `isPending` prop and return Skeleton UI components to prevent layout shift and provide a premium, smooth user experience while data fetches.
- **Example:**
  ```tsx
  // 1. Read URL State via nuqs
  const [filters, setFilters] = useQueryStates(filterParsers);
  
  // 2. Fetch Data reactively based on the URL state
  const { data, isPending } = useCmsTransfersQuery(filters);

  // 3. Pass data and loading state strictly via props
  return <TransfersTable data={data} isPending={isPending} />
  ```
- **Mutation example (UI feedback at the call site):**
  ```tsx
  const { mutate, isPending: isCreating } = useCreateCmsTransferMutation();

  const handleSubmit = (payload: CreateTransferPayload) => {
    mutate(payload, {
      onSuccess: () => {
        toast.success("Transfer created");
        closePanel();
      },
      onError: () => toast.error("Could not create transfer"),
    });
  };
  ```

---

### Why this architecture pattern is highly effective:
1. **Zero Prop Drilling for Global State:** Server data is cached globally by TanStack Query; UI state is cached in the URL. You rarely need complex React Contexts.
2. **Race-Condition Safe:** The `AbortSignal` ensures that if a user clicks through filters rapidly, old and pending network requests are aborted, preventing the UI from rendering stale data.
3. **Optimistic & Reactive:** Because mutation hooks always invalidate their query keys, tables and lists update automatically the exact moment a user creates, updates, or deletes a record, with no reliance on callers remembering to do it.
4. **Clear Separation of Concerns:** Server-state concerns (invalidation) live in the Query layer; UI reactions (toasts, navigation) live in the Presentation layer, so mutation hooks stay reusable across screens.

---

## How the admin console applies this

- **Signal:** queries pass TanStack Query's per-request signal, `queryFn: ({ signal }) => service(..., signal)`, not a
  shared `abortController`. One module-level controller would cancel every in-flight request at once and stay aborted.
- **Services** take positional arguments plus `signal` (`getObserver(ref, signal)`) and return the response body. The
  API has no `{ data }` envelope. Failures reject with `ApiError { status, message }` from `axios.helper.ts`.
- **URL state:** TanStack Router `validateSearch` with a zod schema per route (`Route.useSearch()`), not nuqs.
- **Routes** live in `src/routes/_admin/**` (file-based routing), not `src/routes/dashboard/`.
- **Codes are never cached:** the import and re-issue mutations set `gcTime: 0`, and the page that asked keeps the
  only copy in component state.
