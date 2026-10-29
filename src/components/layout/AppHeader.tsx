// The console header: lockup and Restricted mark over a 2 px cyan rule (brand §3), sections, session time left, log out
import { Link } from "@tanstack/react-router";
import { Logout01Icon, Timer02Icon } from "@hugeicons/core-free-icons";
import { Logo } from "@/components/brand/Logo";
import { RestrictedMark } from "@/components/brand/RestrictedMark";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Skeleton } from "@/components/ui/skeleton";
import { SESSION_WARNING_MS } from "@/lib/constants";
import type { Analyst } from "@/lib/types";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/observers", label: "Observers" },
  { to: "/import", label: "Import roster" },
  { to: "/assignments", label: "Assignments" },
  { to: "/onboarding", label: "Onboarding" },
  { to: "/audit", label: "Audit log" },
] as const;

interface AppHeaderProps {
  admin: Analyst | undefined;
  msLeft: number;
  onLogout: () => void;
}

export function AppHeader({ admin, msLeft, onLogout }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b-2 border-primary bg-background print:hidden">
      <div className="flex h-14 items-center gap-6 px-6">
        <Link to="/observers" aria-label="SentriNG Admin home" className="flex items-center gap-3">
          <Logo />
          <RestrictedMark />
        </Link>

        <nav aria-label="Admin sections" className="flex items-center gap-1">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="inline-flex items-center gap-2 rounded-md px-3 py-1.5 font-medium text-muted-foreground hover:bg-surface-raised hover:text-foreground"
              activeProps={{ className: "bg-surface-raised text-foreground", "aria-current": "page" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-4">
          {msLeft <= SESSION_WARNING_MS && <SessionCountdown msLeft={msLeft} />}

          {admin ? (
            <span className="inline-flex items-center gap-2">
              <span aria-hidden className="grid size-7 place-items-center rounded-full bg-surface-raised text-xs font-semibold text-foreground">
                {initials(admin.name)}
              </span>
              <span className="text-muted-foreground">{admin.name}</span>
            </span>
          ) : (
            <Skeleton className="h-7 w-28" />
          )}

          <Button variant="outline" size="sm" onClick={onLogout}>
            <Icon icon={Logout01Icon} />
            Log out
          </Button>
        </div>
      </div>
    </header>
  );
}

/** No refresh token: warn ahead of the 1 h expiry so nobody loses an import half way */
function SessionCountdown({ msLeft }: { msLeft: number }) {
  const minutes = Math.max(0, Math.ceil(msLeft / 60_000));
  return (
    <span className={cn("inline-flex items-center gap-1 num", minutes <= 3 ? "text-critical" : "text-warning")} role="timer" aria-live="polite">
      <Icon icon={Timer02Icon} />
      Session ends in {minutes} min
    </span>
  );
}

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join("");
