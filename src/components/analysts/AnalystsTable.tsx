// Every account: desk analysts the console manages, and admins it only lists
import { Link } from "@tanstack/react-router";
import { AdminRoleBadge, AnalystStateBadge } from "@/components/status/badges";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyRow, TableSkeleton } from "@/components/ui/table-skeleton";
import type { AdminAnalyst } from "@/lib/types";
import { formatWAT } from "@/lib/utils";

const COLUMNS = 4;

export function AnalystsTable({ data, isPending }: { data: AdminAnalyst[] | undefined; isPending: boolean }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Added</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {isPending ? (
          <TableSkeleton columns={COLUMNS} rows={5} />
        ) : !data?.length ? (
          <EmptyRow columns={COLUMNS} title="No analysts yet">
            Add the desk analysts who verify results. Each one gets a password and an authenticator QR to set up.
          </EmptyRow>
        ) : (
          data.map((a) => (
            <TableRow key={a.id}>
              <TableCell>
                <Link to="/analysts/$id" params={{ id: a.id }} className="font-medium hover:underline">
                  {a.name}
                </Link>
              </TableCell>
              <TableCell className="text-muted-foreground">{a.email}</TableCell>
              <TableCell>
                <span className="inline-flex items-center gap-2">
                  <AnalystStateBadge analyst={a} />
                  {a.is_admin && <AdminRoleBadge />}
                </span>
              </TableCell>
              <TableCell className="font-mono text-xs text-muted-foreground">{formatWAT(a.created_at)}</TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
