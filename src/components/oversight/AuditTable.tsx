// The audit log: who changed what, from which state to which, and why. Observer rows link to the observer
import { Link } from "@tanstack/react-router";
import { ArrowRight01Icon, DocumentValidationIcon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/ui/icon";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyRow, TableSkeleton } from "@/components/ui/table-skeleton";
import type { AuditLogRow } from "@/lib/types";
import { formatWAT, humanize } from "@/lib/utils";

const COLUMNS = 5;

export function AuditTable({ data, isPending, filtered }: { data: AuditLogRow[] | undefined; isPending: boolean; filtered: boolean }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>When</TableHead>
          <TableHead>Who</TableHead>
          <TableHead>What</TableHead>
          <TableHead>Change</TableHead>
          <TableHead>Detail</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {isPending ? (
          <TableSkeleton columns={COLUMNS} />
        ) : !data?.length ? (
          <EmptyRow columns={COLUMNS} icon={DocumentValidationIcon} title={filtered ? "Nothing matches" : "Nothing recorded yet"}>
            {filtered
              ? "Change the filters or the dates."
              : "Every decision on the desk and every change made here is recorded, with who made it."}
          </EmptyRow>
        ) : (
          data.map((row) => (
            <TableRow key={row.id}>
              <TableCell className="font-mono text-xs whitespace-nowrap text-muted-foreground">{formatWAT(row.created_at)}</TableCell>
              <TableCell>{row.actor_name ?? <span className="text-muted-foreground">System</span>}</TableCell>
              <TableCell>
                <span className="text-muted-foreground">{humanize(row.entity_type)}</span> <EntityLabel row={row} />
              </TableCell>
              <TableCell>
                <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                  {row.from_status && (
                    <>
                      <span className="text-muted-foreground">{humanize(row.from_status)}</span>
                      <Icon icon={ArrowRight01Icon} size={14} className="text-muted-foreground" />
                    </>
                  )}
                  {humanize(row.to_status)}
                </span>
              </TableCell>
              <TableCell className="max-w-0 w-1/3">
                <span className="block truncate" title={row.reason ?? undefined}>
                  {row.reason ?? <span className="text-muted-foreground">—</span>}
                </span>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}

function EntityLabel({ row }: { row: AuditLogRow }) {
  const label = row.entity_label ?? `#${row.entity_id}`;
  if (row.entity_type === "observer" && row.entity_label) {
    return (
      <Link to="/observers/$ref" params={{ ref: row.entity_label }} className="font-mono hover:underline">
        {label}
      </Link>
    );
  }
  return <span className="font-mono text-xs">{label}</span>;
}
