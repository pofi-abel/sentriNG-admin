// Observers: search by ref or CSO, filter by status, page through thousands
import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Csv01Icon, MapPinCheckIcon } from "@hugeicons/core-free-icons";
import { z } from "zod";
import { ErrorBanner } from "@/components/layout/ErrorBanner";
import { PageHeader } from "@/components/layout/PageHeader";
import { ObserversTable } from "@/components/observers/ObserversTable";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useObserversQuery } from "@/core/queries/observers.q";
import { PAGE_SIZE } from "@/lib/constants";
import { OBSERVER_FILTERS, type ObserverFilter } from "@/lib/types";

export const Route = createFileRoute("/_admin/observers/")({
  validateSearch: z.object({
    q: z.string().trim().min(1).optional().catch(undefined),
    status: z.enum(OBSERVER_FILTERS).optional().catch(undefined),
    page: z.number().int().min(1).optional().catch(undefined),
  }),
  component: ObserversPage,
});

const ANY = "any";
const FILTER_LABEL: Record<ObserverFilter, string> = {
  pending: "Code issued",
  enrolled: "Enrolled",
  revoked: "Revoked",
  expired: "Code expired",
  unassigned: "No polling units",
};

function ObserversPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const page = search.page ?? 1;
  // One extra row says whether there is a next page
  const list = useObserversQuery({ q: search.q, status: search.status, limit: PAGE_SIZE + 1, offset: (page - 1) * PAGE_SIZE });
  const rows = list.data?.slice(0, PAGE_SIZE);
  const hasNext = (list.data?.length ?? 0) > PAGE_SIZE;

  const [q, setQ] = useState(search.q ?? "");
  useEffect(() => setQ(search.q ?? ""), [search.q]);
  const setFilter = (patch: Partial<typeof search>) => navigate({ search: (prev) => ({ ...prev, page: undefined, ...patch }), replace: true });

  return (
    <>
      <PageHeader title="Observers">
        <Button variant="outline" asChild>
          <Link to="/import">
            <Icon icon={Csv01Icon} />
            Import roster
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to="/assignments">
            <Icon icon={MapPinCheckIcon} />
            Assignments
          </Link>
        </Button>
        <form
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            setFilter({ q: q.trim() || undefined });
          }}
        >
          <Input type="search" aria-label="Search by ref or CSO" placeholder="Search ref or CSO" className="w-64" value={q} onChange={(e) => setQ(e.target.value)} />
        </form>
        <Select value={search.status ?? ANY} onValueChange={(v) => setFilter({ status: v === ANY ? undefined : (v as ObserverFilter) })}>
          <SelectTrigger className="w-44" aria-label="Status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ANY}>All observers</SelectItem>
            {OBSERVER_FILTERS.map((s) => (
              <SelectItem key={s} value={s}>
                {FILTER_LABEL[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </PageHeader>
      <ErrorBanner error={list.error} />
      <ObserversTable data={rows} isPending={list.isPending} filtered={!!(search.q || search.status)} />
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
