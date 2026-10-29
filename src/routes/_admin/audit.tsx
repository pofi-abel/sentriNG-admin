// Audit log (admin plan §5.4): every desk decision and every admin change, newest first, filtered by who, what and when
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { ErrorBanner } from "@/components/layout/ErrorBanner";
import { PageHeader } from "@/components/layout/PageHeader";
import { AuditTable, ENTITY_LABEL } from "@/components/oversight/AuditTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAnalystsQuery } from "@/core/queries/analysts.q";
import { useAuditQuery } from "@/core/queries/oversight.q";
import { PAGE_SIZE } from "@/lib/constants";
import { AUDIT_ENTITIES, type AuditEntity } from "@/lib/types";
import { watDayRange } from "@/lib/utils";

const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const Route = createFileRoute("/_admin/audit")({
  validateSearch: z.object({
    entity: z.enum(AUDIT_ENTITIES).optional().catch(undefined),
    actor: z.number().int().positive().optional().catch(undefined),
    from: day.optional().catch(undefined),
    to: day.optional().catch(undefined),
    page: z.number().int().min(1).optional().catch(undefined),
  }),
  component: AuditPage,
});

const ANY = "any";

function AuditPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const page = search.page ?? 1;
  const { data: analysts } = useAnalystsQuery();
  // One extra row says whether there is a next page
  const audit = useAuditQuery({
    entity_type: search.entity,
    actor: search.actor,
    ...watDayRange(search.from, search.to),
    limit: PAGE_SIZE + 1,
    offset: (page - 1) * PAGE_SIZE,
  });
  const rows = audit.data?.slice(0, PAGE_SIZE);
  const hasNext = (audit.data?.length ?? 0) > PAGE_SIZE;
  const setFilter = (patch: Partial<typeof search>) => navigate({ search: (prev) => ({ ...prev, page: undefined, ...patch }), replace: true });

  return (
    <>
      <PageHeader title="Audit log">
        <Select value={search.entity ?? ANY} onValueChange={(v) => setFilter({ entity: v === ANY ? undefined : (v as AuditEntity) })}>
          <SelectTrigger className="w-40" aria-label="What changed">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ANY}>Everything</SelectItem>
            {AUDIT_ENTITIES.map((e) => (
              <SelectItem key={e} value={e}>
                {ENTITY_LABEL[e]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={search.actor ? String(search.actor) : ANY} onValueChange={(v) => setFilter({ actor: v === ANY ? undefined : Number(v) })}>
          <SelectTrigger className="w-48" aria-label="Who">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ANY}>Anyone</SelectItem>
            {analysts?.map((a) => (
              <SelectItem key={a.id} value={String(a.id)}>
                {a.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <label className="inline-flex items-center gap-2 text-muted-foreground">
          From
          <Input type="date" className="w-40" value={search.from ?? ""} max={search.to} onChange={(e) => setFilter({ from: e.target.value || undefined })} />
        </label>
        <label className="inline-flex items-center gap-2 text-muted-foreground">
          To
          <Input type="date" className="w-40" value={search.to ?? ""} min={search.from} onChange={(e) => setFilter({ to: e.target.value || undefined })} />
        </label>
      </PageHeader>
      <ErrorBanner error={audit.error} />
      <AuditTable data={rows} isPending={audit.isPending} filtered={!!(search.entity || search.actor || search.from || search.to)} />
      {(page > 1 || hasNext) && (
        <nav aria-label="Pages" className="mt-4 flex items-center justify-end gap-3">
          <span className="text-muted-foreground num">Page {page}</span>
          <Button variant="outline" size="sm" disabled={page === 1} onClick={() => navigate({ search: (prev) => ({ ...prev, page: page - 1 }) })}>
            Previous
          </Button>
          <Button variant="outline" size="sm" disabled={!hasNext} onClick={() => navigate({ search: (prev) => ({ ...prev, page: page + 1 }) })}>
            Next
          </Button>
        </nav>
      )}
    </>
  );
}
