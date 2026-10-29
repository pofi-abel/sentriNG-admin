// Choose a CSV, see what it holds and what's wrong with it, then apply. Nothing is sent until the operator confirms
import { AlertDiamondIcon, Csv01Icon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/ui/icon";
import type { CsvRead } from "@/lib/csv";
import { formatNumber } from "@/lib/utils";

/** The native file picker, styled as a button. Reads the file as text in the browser */
export function CsvFileInput({ id, onRead }: { id: string; onRead: (name: string, text: string) => void }) {
  return (
    <label
      htmlFor={id}
      className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-md border border-border bg-background px-3 font-medium hover:bg-accent focus-within:outline-2 focus-within:outline-ring"
    >
      <Icon icon={Csv01Icon} />
      Choose CSV file
      <input
        id={id}
        type="file"
        accept=".csv,text/csv"
        className="sr-only"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          e.target.value = ""; // choosing the same file again still triggers a read
          if (file) onRead(file.name, await file.text());
        }}
      />
    </label>
  );
}

/** Problems block the import: fix the file and choose it again */
export function CsvProblems({ read }: { read: CsvRead<unknown> }) {
  if (!read.problems.length) return null;
  const shown = read.problems.slice(0, 20);
  return (
    <div role="alert" className="space-y-1 rounded-md border border-critical/40 bg-critical-soft px-3 py-2 text-critical">
      <p className="flex items-center gap-2 font-medium">
        <Icon icon={AlertDiamondIcon} />
        Fix {read.problems.length === 1 ? "this problem" : `these ${formatNumber(read.problems.length)} problems`} in the file, then choose it again
      </p>
      <ul className="list-disc pl-8">
        {shown.map((p) => (
          <li key={p}>{p}</li>
        ))}
        {read.problems.length > shown.length && <li>and {formatNumber(read.problems.length - shown.length)} more</li>}
      </ul>
    </div>
  );
}
