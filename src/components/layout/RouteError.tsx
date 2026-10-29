// What a route shows when it crashes or doesn't exist. The router catches per route, so inside the console the header
// and nav stay usable
import { Link, useRouter, type ErrorComponentProps } from "@tanstack/react-router";
import { AlertDiamondIcon, InformationCircleIcon, RefreshIcon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";

export function RouteError({ error, reset }: ErrorComponentProps) {
  const router = useRouter();
  return (
    <div role="alert" className="mx-auto mt-16 max-w-lg space-y-4 rounded-lg border border-critical/40 bg-card p-6">
      <h1 className="flex items-center gap-2 text-lg font-semibold text-critical">
        <Icon icon={AlertDiamondIcon} size={20} />
        This screen stopped working
      </h1>
      <p className="text-muted-foreground">
        Nothing is changed until the server confirms it. Try again, or go back to the observer list. If you were printing
        codes and they are gone, re-issue them: codes are only ever shown once.
      </p>
      {/* Dev only: in production the details stay out of the way (and out of screenshots) */}
      {import.meta.env.DEV && <pre className="max-h-40 overflow-auto rounded-md bg-surface-raised p-3 font-mono text-xs">{error instanceof Error ? error.message : String(error)}</pre>}
      <div className="flex gap-2">
        <Button
          onClick={() => {
            reset();
            router.invalidate();
          }}
        >
          <Icon icon={RefreshIcon} />
          Try again
        </Button>
        <Button variant="outline" asChild>
          <Link to="/observers">Back to observers</Link>
        </Button>
      </div>
    </div>
  );
}

export function RouteNotFound() {
  return (
    <div className="mx-auto mt-16 max-w-lg space-y-4 rounded-lg border border-border bg-card p-6">
      <h1 className="flex items-center gap-2 text-lg font-semibold">
        <Icon icon={InformationCircleIcon} size={20} />
        Page not found
      </h1>
      <p className="text-muted-foreground">This link doesn't lead to an admin screen. It may be mistyped or out of date.</p>
      <Button variant="outline" asChild>
        <Link to="/observers">Back to observers</Link>
      </Button>
    </div>
  );
}
