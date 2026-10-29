import { createRouter } from "@tanstack/react-router";
import { RouteError, RouteNotFound } from "./components/layout/RouteError";
import { routeTree } from "./routeTree.gen";

export const getRouter = () =>
  createRouter({
    routeTree,
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
    // Every route gets an error boundary: a crash in one screen keeps the header and nav working
    defaultErrorComponent: RouteError,
    defaultNotFoundComponent: RouteNotFound,
  });

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
