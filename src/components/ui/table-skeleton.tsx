// Placeholder rows while a table loads, so the layout doesn't jump
import { Icon, type IconSvgElement } from "@/components/ui/icon";
import { Skeleton } from "@/components/ui/skeleton";
import { TableCell, TableRow } from "@/components/ui/table";

export function TableSkeleton({ columns, rows = 8 }: { columns: number; rows?: number }) {
  return Array.from({ length: rows }, (_, r) => (
    <TableRow key={r}>
      {Array.from({ length: columns }, (_, c) => (
        <TableCell key={c}>
          <Skeleton className="h-4 w-full max-w-32" />
        </TableCell>
      ))}
    </TableRow>
  ));
}

/** An empty queue says so plainly, and what will fill it */
export function EmptyRow({ columns, icon, title, children }: { columns: number; icon?: IconSvgElement; title?: string; children: React.ReactNode }) {
  return (
    <TableRow className="hover:bg-transparent">
      <TableCell colSpan={columns} className="py-14">
        <div className="flex flex-col items-center gap-2 text-center whitespace-normal">
          {icon && <Icon icon={icon} size={28} className="text-muted-foreground" />}
          {title && <p className="text-base font-medium">{title}</p>}
          <p className="max-w-sm text-muted-foreground">{children}</p>
        </div>
      </TableCell>
    </TableRow>
  );
}
