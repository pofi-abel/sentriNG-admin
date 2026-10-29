// Reference data (admin plan §5.3): elections and where they're held, and CSV imports of polling units, parties and
// elections, each checked with a dry run before it's applied
import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { ErrorBanner } from "@/components/layout/ErrorBanner";
import { PageHeader } from "@/components/layout/PageHeader";
import { ElectionDialog } from "@/components/reference/ElectionDialog";
import { ElectionsTable } from "@/components/reference/ElectionsTable";
import { ReferenceImport } from "@/components/reference/ReferenceImport";
import { Button } from "@/components/ui/button";
import { useElectionsQuery, useStatesQuery } from "@/core/queries/reference.q";
import type { Election } from "@/lib/types";

export const Route = createFileRoute("/_admin/reference")({
  component: ReferencePage,
});

function ReferencePage() {
  const elections = useElectionsQuery();
  const { data: states } = useStatesQuery();
  const [editing, setEditing] = useState<Election | "new" | null>(null);

  return (
    <div className="space-y-10">
      <section>
        <PageHeader title="Elections">
          <Button onClick={() => setEditing("new")}>Add election</Button>
        </PageHeader>
        <ErrorBanner error={elections.error} />
        <ElectionsTable data={elections.data} states={states} isPending={elections.isPending} onEdit={setEditing} />
      </section>

      <section>
        <h2 className="mb-1 text-lg font-semibold">Import CSV</h2>
        <p className="mb-4 max-w-3xl text-muted-foreground">
          The same files as the API's seed tool. Each file is checked first: you see what it would add or change before
          anything is saved.
        </p>
        <ReferenceImport />
      </section>

      <ElectionDialog
        election={editing}
        states={states}
        onClose={(saved) => {
          setEditing(null);
          if (saved) toast.success(saved);
        }}
      />
    </div>
  );
}
