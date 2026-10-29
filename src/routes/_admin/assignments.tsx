// Assignments import (admin plan §5.1): observer_ref,pu_code rows, all or nothing. Assigning twice is harmless, so a
// corrected file can simply be imported again. Single changes are on each observer's page
import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckmarkCircle02Icon } from "@hugeicons/core-free-icons";
import { CsvFileInput, CsvProblems } from "@/components/imports/CsvImport";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useImportAssignmentsMutation } from "@/core/queries/observers.q";
import { readAssignments, type CsvRead } from "@/lib/csv";
import type { AssignmentRow } from "@/lib/types";
import { formatNumber } from "@/lib/utils";

export const Route = createFileRoute("/_admin/assignments")({
  component: AssignmentsPage,
});

const PREVIEW_ROWS = 10;

function AssignmentsPage() {
  const [file, setFile] = useState<{ name: string; read: CsvRead<AssignmentRow> } | null>(null);
  const importAssignments = useImportAssignmentsMutation();
  const result = importAssignments.data;

  return (
    <div className="max-w-4xl space-y-5">
      <PageHeader title="Assignments" />
      <p className="max-w-2xl text-muted-foreground">
        A CSV with <code className="font-mono text-foreground">observer_ref</code> and{" "}
        <code className="font-mono text-foreground">pu_code</code> columns, one assignment per row. It only adds: to take a
        polling unit away from someone, open their page in{" "}
        <Link to="/observers" className="text-primary hover:underline">
          Observers
        </Link>
        .
      </p>

      <div className="flex items-center gap-3">
        <CsvFileInput
          id="assignments-file"
          onRead={(name, text) => {
            importAssignments.reset();
            setFile({ name, read: readAssignments(text) });
          }}
        />
        {file && (
          <span className="text-muted-foreground">
            <span className="font-mono text-foreground">{file.name}</span> · {formatNumber(file.read.rows.length)} rows
          </span>
        )}
      </div>

      {result && (
        <p role="status" className="flex items-center gap-2 rounded-md bg-verified-soft px-3 py-2 text-verified">
          <Icon icon={CheckmarkCircle02Icon} />
          {formatNumber(result.added)} assignments added
          {result.skipped > 0 && `, ${formatNumber(result.skipped)} ${result.skipped === 1 ? "was" : "were"} already in place`}.
        </p>
      )}

      {file && (
        <>
          <CsvProblems read={file.read} />
          {importAssignments.error && (
            <p role="alert" className="text-critical">
              {importAssignments.error.message}
            </p>
          )}
          {!!file.read.rows.length && <AssignmentsPreview rows={file.read.rows} />}
          <div className="flex items-center gap-3">
            <Button
              onClick={() => importAssignments.mutate(file.read.rows, { onSuccess: () => setFile(null) })}
              disabled={!!file.read.problems.length || !file.read.rows.length || importAssignments.isPending}
            >
              {importAssignments.isPending ? "Assigning…" : `Apply ${formatNumber(file.read.rows.length)} assignments`}
            </Button>
            <Button variant="ghost" onClick={() => setFile(null)}>
              Cancel
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

function AssignmentsPreview({ rows }: { rows: AssignmentRow[] }) {
  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-16 text-right">Row</TableHead>
            <TableHead>Observer ref</TableHead>
            <TableHead>PU code</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.slice(0, PREVIEW_ROWS).map((r, i) => (
            <TableRow key={i}>
              <TableCell className="text-right text-muted-foreground num">{i + 1}</TableCell>
              <TableCell className="font-mono">{r.observer_ref}</TableCell>
              <TableCell className="font-mono">{r.pu_code}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {rows.length > PREVIEW_ROWS && <p className="mt-2 text-muted-foreground">and {formatNumber(rows.length - PREVIEW_ROWS)} more</p>}
    </div>
  );
}
