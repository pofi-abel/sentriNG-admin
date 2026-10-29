// Status chips. Brand §3: red / amber / green mean status and nothing else, and status always shows icon + label + colour
import { Alert02Icon, CheckmarkCircle02Icon, HourglassIcon, UserBlock01Icon } from "@hugeicons/core-free-icons";
import type { AdminAnalyst } from "@/lib/types";
import { Icon, type IconSvgElement } from "@/components/ui/icon";
import type { ObserverState } from "@/lib/observers";
import { cn } from "@/lib/utils";

interface Look {
  label: string;
  icon?: IconSvgElement;
  className: string;
}

function Chip({ look, className }: { look: Look; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 text-xs font-medium whitespace-nowrap", look.className, className)}>
      {look.icon && <Icon icon={look.icon} size={14} />}
      {look.label}
    </span>
  );
}

const OBSERVER_STATE: Record<ObserverState, Look> = {
  pending: { label: "Code issued", icon: HourglassIcon, className: "text-pending bg-surface-raised" },
  enrolled: { label: "Enrolled", icon: CheckmarkCircle02Icon, className: "text-verified bg-verified-soft" },
  revoked: { label: "Revoked", icon: UserBlock01Icon, className: "text-critical bg-critical-soft" },
  expired: { label: "Code expired", icon: Alert02Icon, className: "text-warning bg-warning-soft" },
};

export const ObserverStateBadge = ({ state }: { state: ObserverState }) => <Chip look={OBSERVER_STATE[state]} />;

/** Disabled wins: a disabled account can't log in whatever else is set */
const analystLook = (a: AdminAnalyst): Look =>
  a.disabled
    ? { label: "Disabled", icon: UserBlock01Icon, className: "text-critical bg-critical-soft" }
    : !a.mfa_enrolled
      ? { label: "Can't log in", icon: Alert02Icon, className: "text-warning bg-warning-soft" }
      : { label: "Active", icon: CheckmarkCircle02Icon, className: "text-verified bg-verified-soft" };

export const AnalystStateBadge = ({ analyst }: { analyst: AdminAnalyst }) => <Chip look={analystLook(analyst)} />;

/** A role, not a status: neutral, no icon */
export const AdminRoleBadge = () => <Chip look={{ label: "Admin", className: "text-foreground bg-surface-raised" }} />;
