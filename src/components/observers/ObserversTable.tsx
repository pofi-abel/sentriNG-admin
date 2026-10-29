// The observer list: who has a code out, who is enrolled, who was cut off, and how many polling units each covers
import { Link } from "@tanstack/react-router";
import { QrCodeIcon } from "@hugeicons/core-free-icons";
import { ObserverStateBadge } from "@/components/status/badges";
import { Icon } from "@/components/ui/icon";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyRow, TableSkeleton } from "@/components/ui/table-skeleton";
import { hasLiveCode, observerState } from "@/lib/observers";
import type { AdminObserver } from "@/lib/types";
import { cn, formatWAT } from "@/lib/utils";

const COLUMNS = 5;

export function ObserversTable({ data, isPending, filtered }: { data: AdminObserver[] | undefined; isPending: boolean; filtered: boolean }) {
  const now = Date.now();
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Observer ref</TableHead>
          <TableHead>CSO</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Enrolled</TableHead>
          <TableHead className="text-right">Polling units</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {isPending ? (
          <TableSkeleton columns={COLUMNS} />
        ) : !data?.length ? (
          <EmptyRow columns={COLUMNS} icon={QrCodeIcon} title={filtered ? "No observers match" : "No observers yet"}>
            {filtered ? "Change the search or the status filter." : "Import a CSO roster to create observers and print their enrollment codes."}
          </EmptyRow>
        ) : (
          data.map((o) => {
            const state = observerState(o, now);
            return (
              <TableRow key={o.ref}>
                <TableCell>
                  <Link to="/observers/$ref" params={{ ref: o.ref }} className="font-mono hover:underline">
                    {o.ref}
                  </Link>
                </TableCell>
                <TableCell>{o.cso ?? <span className="text-muted-foreground">—</span>}</TableCell>
                <TableCell>
                  <span className="inline-flex items-center gap-2">
                    <ObserverStateBadge state={state} />
                    {state !== "pending" && hasLiveCode(o, now) && (
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <Icon icon={QrCodeIcon} size={14} />
                        New code out
                      </span>
                    )}
                  </span>
                </TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">{formatWAT(o.enrolled_at)}</TableCell>
                <TableCell className={cn("text-right num", !o.assigned_pu_count && "text-warning")}>{o.assigned_pu_count || "None"}</TableCell>
              </TableRow>
            );
          })
        )}
      </TableBody>
    </Table>
  );
}
