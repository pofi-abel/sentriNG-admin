// Elections, newest first, and where each is held. Every result belongs to one of these
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyRow, TableSkeleton } from "@/components/ui/table-skeleton";
import type { Election, Race, State } from "@/lib/types";
import { formatDay } from "@/lib/utils";

export const RACE_LABEL: Record<Race, string> = {
  presidential: "Presidential",
  senate: "Senate",
  reps: "House of Reps",
  governorship: "Governorship",
  state_assembly: "State Assembly",
};

interface ElectionsTableProps {
  data: Election[] | undefined;
  states: State[] | undefined;
  isPending: boolean;
  onEdit: (election: Election) => void;
}

export function ElectionsTable({ data, states, isPending, onEdit }: ElectionsTableProps) {
  const stateName = (code: string) => states?.find((s) => s.code === code)?.name ?? code;
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Election</TableHead>
          <TableHead>Race</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Held in</TableHead>
          <TableHead />
        </TableRow>
      </TableHeader>
      <TableBody>
        {isPending ? (
          <TableSkeleton columns={5} rows={3} />
        ) : !data?.length ? (
          <EmptyRow columns={5} title="No elections yet">
            Add one here, or import an elections CSV below. The desk and SentriNG Live can't show results without one.
          </EmptyRow>
        ) : (
          data.map((e) => (
            <TableRow key={e.id}>
              <TableCell className="font-medium">{e.name}</TableCell>
              <TableCell>{RACE_LABEL[e.race] ?? e.race}</TableCell>
              <TableCell className="num whitespace-nowrap">{formatDay(e.held_on)}</TableCell>
              <TableCell className="max-w-0 w-1/3">
                <span className="block truncate" title={e.state_codes.map(stateName).join(", ")}>
                  {e.state_codes.length ? e.state_codes.map(stateName).join(", ") : <span className="text-muted-foreground">Nationwide</span>}
                </span>
              </TableCell>
              <TableCell className="text-right">
                <Button variant="outline" size="xs" onClick={() => onEdit(e)} aria-label={`Edit ${e.name}`}>
                  Edit
                </Button>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
