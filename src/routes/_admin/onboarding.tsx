// Onboarding progress (admin plan §5.4): enrolled against issued, by CSO and by state, and who has no polling unit yet
import { createFileRoute } from "@tanstack/react-router";
import { ErrorBanner } from "@/components/layout/ErrorBanner";
import { PageHeader } from "@/components/layout/PageHeader";
import { OnboardingTable, type OnboardingRow } from "@/components/oversight/OnboardingTable";
import { useOnboardingQuery } from "@/core/queries/oversight.q";
import { formatWAT } from "@/lib/utils";

export const Route = createFileRoute("/_admin/onboarding")({
  component: OnboardingPage,
});

function OnboardingPage() {
  const summary = useOnboardingQuery();
  const s = summary.data;

  const byCSO: OnboardingRow[] | undefined = s?.by_cso.map((r) => ({
    ...r,
    key: r.cso ?? "",
    label: r.cso ?? <span className="text-muted-foreground">No CSO</span>,
    search: r.cso ?? undefined,
  }));
  const byState: OnboardingRow[] | undefined = s?.by_state.map((r) => ({ ...r, key: r.state_code, label: r.state_name }));

  return (
    <div className="space-y-8">
      <div>
        <PageHeader title="Onboarding">
          {summary.dataUpdatedAt > 0 && (
            <span className="font-mono text-xs text-muted-foreground">as of {formatWAT(new Date(summary.dataUpdatedAt).toISOString())}</span>
          )}
        </PageHeader>
        <ErrorBanner error={summary.error} />
        <OnboardingTable
          title="CSO"
          rows={byCSO}
          totals={s && { ...s.totals, key: "total", label: "All observers", search: "" }}
          isPending={summary.isPending}
          empty="No observers yet. Import a CSO roster to start."
        />
      </div>
      <section>
        <h2 className="mb-1 text-lg font-semibold">By state</h2>
        <p className="mb-3 text-muted-foreground">
          Observers with at least one polling unit in the state. Someone covering two states counts in both.
        </p>
        <OnboardingTable title="State" rows={byState} isPending={summary.isPending} empty="No observer has a polling unit yet. Assign them from Assignments." />
      </section>
    </div>
  );
}
