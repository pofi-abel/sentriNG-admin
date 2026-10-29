// Onboarding progress by CSO or by state: how many observers hold a working phone, how many codes are still out or ran
// out, who was cut off, and (by CSO) who has no polling unit yet. Status columns keep the chips' icon and colour
import { Link } from "@tanstack/react-router";
import { Alert02Icon, CheckmarkCircle02Icon, HourglassIcon, Location04Icon, UserBlock01Icon } from "@hugeicons/core-free-icons";
import { Icon, type IconSvgElement } from "@/components/ui/icon";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyRow, TableSkeleton } from "@/components/ui/table-skeleton";
import type { ObserverFilter, OnboardingCounts } from "@/lib/types";
import { cn, formatNumber, pct } from "@/lib/utils";

export interface OnboardingRow extends OnboardingCounts {
  key: string;
  label: React.ReactNode;
  /** Counts open the observer list with this ?q= (a CSO name; "" for every observer). Unset: the list can't show
   * this row's observers (a state, no CSO), so the counts aren't links */
  search?: string;
  unassigned?: number;
}

interface OnboardingTableProps {
  title: string;
  rows: OnboardingRow[] | undefined;
  totals?: OnboardingRow;
  isPending: boolean;
  empty: string;
}

const STATUS_COLUMNS: { key: keyof OnboardingCounts & ObserverFilter; label: string; icon: IconSvgElement; tone: string }[] = [
  { key: "pending", label: "Code issued", icon: HourglassIcon, tone: "" },
  { key: "expired", label: "Code expired", icon: Alert02Icon, tone: "text-warning" },
  { key: "revoked", label: "Revoked", icon: UserBlock01Icon, tone: "text-critical" },
];

export function OnboardingTable({ title, rows, totals, isPending, empty }: OnboardingTableProps) {
  const withUnassigned = totals?.unassigned !== undefined;
  const columns = 3 + STATUS_COLUMNS.length + (withUnassigned ? 1 : 0);
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{title}</TableHead>
          <TableHead className="text-right">Observers</TableHead>
          <TableHead className="text-right">
            <span className="inline-flex items-center gap-1">
              <Icon icon={CheckmarkCircle02Icon} size={14} />
              Enrolled
            </span>
          </TableHead>
          {STATUS_COLUMNS.map((c) => (
            <TableHead key={c.key} className="text-right">
              <span className="inline-flex items-center gap-1">
                <Icon icon={c.icon} size={14} />
                {c.label}
              </span>
            </TableHead>
          ))}
          {withUnassigned && (
            <TableHead className="text-right">
              <span className="inline-flex items-center gap-1">
                <Icon icon={Location04Icon} size={14} />
                No polling units
              </span>
            </TableHead>
          )}
        </TableRow>
      </TableHeader>
      <TableBody>
        {isPending ? (
          <TableSkeleton columns={columns} rows={4} />
        ) : !rows?.length ? (
          <EmptyRow columns={columns}>{empty}</EmptyRow>
        ) : (
          rows.map((r) => <CountsRow key={r.key} row={r} withUnassigned={withUnassigned} />)
        )}
      </TableBody>
      {totals && !isPending && !!rows?.length && (
        <TableFooter>
          <CountsRow row={totals} withUnassigned={withUnassigned} />
        </TableFooter>
      )}
    </Table>
  );
}

function CountsRow({ row: r, withUnassigned }: { row: OnboardingRow; withUnassigned: boolean }) {
  // Counts link to the observer list with the same filter, so every number can be opened
  const count = (n: number, status: ObserverFilter, tone = "") =>
    !n ? (
      <span className="text-muted-foreground">0</span>
    ) : r.search === undefined ? (
      <span className={tone}>{formatNumber(n)}</span>
    ) : (
      <Link to="/observers" search={{ q: r.search || undefined, status }} className={cn("hover:underline", tone)}>
        {formatNumber(n)}
      </Link>
    );
  return (
    <TableRow>
      <TableCell className="font-medium">{r.label}</TableCell>
      <TableCell className="text-right num">{formatNumber(r.observers)}</TableCell>
      <TableCell className="text-right num">
        {count(r.enrolled, "enrolled", "text-verified")}
        <span className="ml-2 inline-block w-10 text-muted-foreground">{pct(r.enrolled, r.observers)}</span>
      </TableCell>
      {STATUS_COLUMNS.map((c) => (
        <TableCell key={c.key} className="text-right num">
          {count(r[c.key], c.key, c.tone)}
        </TableCell>
      ))}
      {withUnassigned && <TableCell className="text-right num">{count(r.unassigned ?? 0, "unassigned", "text-warning")}</TableCell>}
    </TableRow>
  );
}
