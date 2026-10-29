// A labelled form control with its error line. The error text comes straight from the Zod schema (docs/form-validation.md)
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export function Field({ id, label, error, className, children }: { id: string; label: string; error?: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={id}>{label}</Label>
      {children}
      <p id={`${id}-error`} className="min-h-4 text-xs text-critical">
        {error}
      </p>
    </div>
  );
}
