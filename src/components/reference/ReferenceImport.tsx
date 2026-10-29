// A reference CSV, checked by the API with a dry run first: what it would add or change, with examples. Apply only
// after reading that. Imports add and update; nothing is ever deleted
import { useState } from "react";
import { toast } from "sonner";
import { CheckmarkCircle02Icon, InformationCircleIcon } from "@hugeicons/core-free-icons";
import { CsvFileInput } from "@/components/imports/CsvImport";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useImportReferenceMutation } from "@/core/queries/reference.q";
import { REFERENCE_KINDS, type ReferenceImportResult, type ReferenceKind } from "@/lib/types";
import { formatNumber } from "@/lib/utils";

const KIND: Record<ReferenceKind, { label: string; columns: string }> = {
  "polling-units": {
    label: "Polling units",
    columns: "state_code, state_name, lga_code, lga_name, ward_code, ward_name, pu_code, pu_name, and optionally latitude, longitude, registered_voters, collected_pvc",
  },
  parties: { label: "Parties", columns: "code, name, and optionally logo_ref" },
  elections: { label: "Elections", columns: "name, race, held_on (YYYY-MM-DD), and optionally states (INEC codes joined by |; empty = nationwide)" },
};

// The API takes at most 1 MiB under /v1/admin/: about one state's polling units
const MAX_BYTES = 1 << 20;

export function ReferenceImport() {
  const [kind, setKind] = useState<ReferenceKind>("polling-units");
  const [file, setFile] = useState<{ name: string; csv: string } | null>(null);
  const [tooBig, setTooBig] = useState(false);
  const check = useImportReferenceMutation();
  const apply = useImportReferenceMutation();

  const choose = (name: string, csv: string) => {
    apply.reset();
    const big = new Blob([csv]).size > MAX_BYTES;
    setTooBig(big);
    setFile(big ? null : { name, csv });
    if (!big) check.mutate({ kind, csv, dryRun: true });
  };

  const pickKind = (k: ReferenceKind) => {
    setKind(k);
    setFile(null);
    check.reset();
    apply.reset();
  };

  return (
    <div className="max-w-4xl space-y-4">
      <div className="flex items-center gap-3">
        <Select value={kind} onValueChange={(v) => pickKind(v as ReferenceKind)}>
          <SelectTrigger className="w-44" aria-label="What to import">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {REFERENCE_KINDS.map((k) => (
              <SelectItem key={k} value={k}>
                {KIND[k].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <CsvFileInput id="reference-file" onRead={choose} />
        {file && <span className="font-mono text-muted-foreground">{file.name}</span>}
      </div>
      <p className="text-muted-foreground">
        Columns: <span className="font-mono text-xs text-foreground">{KIND[kind].columns}</span>. Load polling units before
        elections that name states.
      </p>

      {tooBig && (
        <p role="alert" className="text-critical">
          This file is over 1 MB, more than one import takes. Split polling units by state, or load the national file with
          the API's <code className="font-mono">cmd/seed</code>.
        </p>
      )}

      {apply.data ? (
        <Diff result={apply.data} />
      ) : (
        file && (
          <>
            {check.isPending && <p className="text-muted-foreground">Checking the file…</p>}
            {check.error && (
              <p role="alert" className="text-critical">
                {check.error.message}
              </p>
            )}
            {check.data && <Diff result={check.data} />}
            {apply.error && (
              <p role="alert" className="text-critical">
                {apply.error.message}
              </p>
            )}
            {check.data && check.data.changes.length > 0 && (
              <div className="flex gap-3">
                <Button
                  disabled={apply.isPending}
                  onClick={() =>
                    apply.mutate(
                      { kind, csv: file.csv, dryRun: false },
                      { onSuccess: (r) => (setFile(null), check.reset(), toast.success(`${KIND[r.kind].label} imported`)) },
                    )
                  }
                >
                  {apply.isPending ? "Applying…" : "Apply these changes"}
                </Button>
                <Button variant="ghost" onClick={() => (setFile(null), check.reset())}>
                  Cancel
                </Button>
              </div>
            )}
          </>
        )
      )}
    </div>
  );
}

function Diff({ result }: { result: ReferenceImportResult }) {
  const what = `${formatNumber(result.rows)} ${result.rows === 1 ? "row" : "rows"}`;
  if (!result.changes.length) {
    return (
      <p role="status" className="flex items-center gap-2 rounded-md bg-surface-raised px-3 py-2">
        <Icon icon={InformationCircleIcon} />
        {what}, nothing to change: the data already matches this file.
      </p>
    );
  }
  return (
    <div role="status" className="space-y-3 rounded-lg border border-border bg-card p-4">
      <p className={result.applied ? "flex items-center gap-2 font-medium text-verified" : "font-medium"}>
        {result.applied && <Icon icon={CheckmarkCircle02Icon} />}
        {result.applied ? `Imported ${what}. This changed:` : `${what}. Applying this file will change:`}
      </p>
      <ul className="space-y-2">
        {result.changes.map((c) => (
          <li key={`${c.noun}-${c.change}`}>
            <span className="font-medium num">{c.text}</span>
            <ul className="mt-0.5 pl-4 font-mono text-xs text-muted-foreground">
              {c.examples.map((e) => (
                <li key={e}>{e}</li>
              ))}
              {c.count > c.examples.length && <li>and {formatNumber(c.count - c.examples.length)} more</li>}
            </ul>
          </li>
        ))}
      </ul>
      {!result.applied && <p className="text-muted-foreground">Nothing is deleted. Rows missing from the file stay as they are.</p>}
    </div>
  );
}
