// The polling units one observer covers. Results and setup logs are only accepted from assigned PUs
import { Location04Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyRow } from "@/components/ui/table-skeleton";
import type { AssignedPollingUnit } from "@/lib/types";
import { formatWAT } from "@/lib/utils";

interface AssignmentsTableProps {
  data: AssignedPollingUnit[];
  removing: string | null;
  onRemove: (puCode: string) => void;
}

export function AssignmentsTable({ data, removing, onRemove }: AssignmentsTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>PU code</TableHead>
          <TableHead>Polling unit</TableHead>
          <TableHead>Ward</TableHead>
          <TableHead>LGA</TableHead>
          <TableHead>State</TableHead>
          <TableHead>Assigned</TableHead>
          <TableHead />
        </TableRow>
      </TableHeader>
      <TableBody>
        {!data.length ? (
          <EmptyRow columns={7} icon={Location04Icon} title="No polling units">
            Until one is assigned, this observer's results and setup reports are refused.
          </EmptyRow>
        ) : (
          data.map((pu) => (
            <TableRow key={pu.code}>
              <TableCell className="font-mono">{pu.code}</TableCell>
              <TableCell>{pu.name}</TableCell>
              <TableCell>{pu.ward_name}</TableCell>
              <TableCell>{pu.lga_name}</TableCell>
              <TableCell>{pu.state_name}</TableCell>
              <TableCell className="font-mono text-xs text-muted-foreground">{formatWAT(pu.assigned_at)}</TableCell>
              <TableCell className="text-right">
                <Button variant="reject" size="xs" disabled={removing !== null} onClick={() => onRemove(pu.code)} aria-label={`Remove ${pu.code}`}>
                  {removing === pu.code ? "Removing…" : "Remove"}
                </Button>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
