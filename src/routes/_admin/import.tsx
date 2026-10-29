// Roster import (admin plan §5.1): a CSO roster in, one-time codes out, printed as enrollment cards for the training
// session. Codes exist only on this page and only until it's left: reprinting means re-issuing
import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Alert02Icon, ArrowLeft01Icon, PrinterIcon } from "@hugeicons/core-free-icons";
import { CodesGuard } from "@/components/enrollment/CodesGuard";
import { EnrollmentCards } from "@/components/enrollment/EnrollmentCards";
import { CsvFileInput, CsvProblems } from "@/components/imports/CsvImport";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useImportRosterMutation } from "@/core/queries/observers.q";
import { readRoster, type CsvRead } from "@/lib/csv";
import type { IssuedCode, RosterRow } from "@/lib/types";
import { formatNumber } from "@/lib/utils";

export const Route = createFileRoute("/_admin/import")({
  component: ImportRosterPage,
});

const PREVIEW_ROWS = 10;

function ImportRosterPage() {
  const [file, setFile] = useState<{ name: string; read: CsvRead<RosterRow> } | null>(null);
  const [codes, setCodes] = useState<IssuedCode[] | null>(null);
  const importRoster = useImportRosterMutation();

  if (codes) return <CodeSheet codes={codes} onDone={() => setCodes(null)} />;

  const submit = () =>
    file &&
    importRoster.mutate(file.read.rows, {
      onSuccess: (issued) => {
        setFile(null);
        setCodes(issued);
      },
    });

  return (
    <div className="max-w-4xl space-y-5">
      <PageHeader
        title={
          <span className="inline-flex items-center gap-2">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/observers" aria-label="Back to observers">
                <Icon icon={ArrowLeft01Icon} />
              </Link>
            </Button>
            Import roster
          </span>
        }
      />
      <p className="max-w-2xl text-muted-foreground">
        A CSV with a <code className="font-mono text-foreground">ref</code> column and an optional{" "}
        <code className="font-mono text-foreground">cso</code> column, one observer per row. Each observer gets a one-time
        code to print on an enrollment card. A ref that already exists gets a new code, and its old code stops working.
      </p>

      <div className="flex items-center gap-3">
        <CsvFileInput
          id="roster-file"
          onRead={(name, text) => {
            importRoster.reset();
            setFile({ name, read: readRoster(text) });
          }}
        />
        {file && (
          <span className="text-muted-foreground">
            <span className="font-mono text-foreground">{file.name}</span> · {formatNumber(file.read.rows.length)} observers
          </span>
        )}
      </div>

      {file && (
        <>
          <CsvProblems read={file.read} />
          {importRoster.error && (
            <p role="alert" className="text-critical">
              {importRoster.error.message}
            </p>
          )}
          {!!file.read.rows.length && <RosterPreview rows={file.read.rows} />}
          <div className="flex items-center gap-3">
            <Button onClick={submit} disabled={!!file.read.problems.length || !file.read.rows.length || importRoster.isPending}>
              {importRoster.isPending ? "Issuing codes…" : `Issue ${formatNumber(file.read.rows.length)} codes`}
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

function RosterPreview({ rows }: { rows: RosterRow[] }) {
  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-16 text-right">Row</TableHead>
            <TableHead>Observer ref</TableHead>
            <TableHead>CSO</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.slice(0, PREVIEW_ROWS).map((r, i) => (
            <TableRow key={i}>
              <TableCell className="text-right text-muted-foreground num">{i + 1}</TableCell>
              <TableCell className="font-mono">{r.ref}</TableCell>
              <TableCell>{r.cso ?? <span className="text-muted-foreground">—</span>}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {rows.length > PREVIEW_ROWS && <p className="mt-2 text-muted-foreground">and {formatNumber(rows.length - PREVIEW_ROWS)} more</p>}
    </div>
  );
}

function CodeSheet({ codes, onDone }: { codes: IssuedCode[]; onDone: () => void }) {
  const reissued = codes.filter((c) => c.reissued).length;
  return (
    <div className="space-y-4">
      <CodesGuard active />
      <div className="space-y-3 print:hidden">
        <PageHeader title={`${formatNumber(codes.length)} enrollment codes`}>
          <Button onClick={() => window.print()}>
            <Icon icon={PrinterIcon} />
            Print cards
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              onDone();
              toast.success("Codes cleared from this screen");
            }}
          >
            Done, clear codes
          </Button>
        </PageHeader>
        <p className="rounded-md bg-accent-soft px-3 py-2">
          Print now and hand each card over in person. These codes are shown only once: if you leave this page, you'll have
          to re-issue them. Never email or message them.
        </p>
        {reissued > 0 && (
          <p className="flex items-center gap-2 rounded-md bg-warning-soft px-3 py-2 text-warning">
            <Icon icon={Alert02Icon} />
            {formatNumber(reissued)} of these observers already existed. Their earlier codes no longer work.
          </p>
        )}
      </div>
      <EnrollmentCards codes={codes} />
    </div>
  );
}
