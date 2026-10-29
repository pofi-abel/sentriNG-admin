// The signed-in console: auth guard, header, session countdown, idle lock
import { useEffect } from "react";
import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";
import { AppHeader } from "@/components/layout/AppHeader";
import { useLogout, useMeQuery } from "@/core/queries/auth.q";
import { useIdleLock } from "@/hooks/use-idle-lock";
import { useNow } from "@/hooks/use-now";
import { IDLE_LOCK_MS } from "@/lib/constants";
import { tokenManager } from "@/lib/token-manager";

export const Route = createFileRoute("/_admin")({
  beforeLoad: ({ location }) => {
    if (!tokenManager.get()) throw redirect({ to: "/login", search: { redirect: location.href } });
  },
  component: AdminLayout,
});

function AdminLayout() {
  const logout = useLogout();
  const { data: me } = useMeQuery();
  const now = useNow(15_000);
  const msLeft = Date.parse(tokenManager.get()?.expiresAt ?? "") - now;

  useEffect(() => {
    if (!(msLeft > 0)) logout("ended");
  }, [msLeft, logout]);

  useIdleLock(() => logout("idle"), IDLE_LOCK_MS);

  return (
    <div className="min-h-screen">
      <AppHeader admin={me} msLeft={msLeft} onLogout={() => logout()} />
      <main className="px-6 py-5 print:p-0">
        <Outlet />
      </main>
    </div>
  );
}
