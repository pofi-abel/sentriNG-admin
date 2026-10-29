// Confirms an action that changes credentials. With `typeToConfirm`, the operator types it first (revoking a phone,
// disabling an account)
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: React.ReactNode;
  confirmLabel: string;
  destructive?: boolean;
  typeToConfirm?: string;
  isPending: boolean;
  error?: string;
  onConfirm: () => void;
}

export function ConfirmDialog({ open, onOpenChange, title, description, confirmLabel, destructive, typeToConfirm, isPending, error, onConfirm }: ConfirmDialogProps) {
  const [typed, setTyped] = useState("");
  useEffect(() => {
    if (open) setTyped("");
  }, [open]);
  const ready = !typeToConfirm || typed.trim() === typeToConfirm;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (ready) onConfirm();
          }}
          noValidate
        >
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          {typeToConfirm ? (
            <Field id="confirm-text" label={`Type ${typeToConfirm} to confirm`} error={error} className="my-4">
              <Input id="confirm-text" autoFocus autoComplete="off" className="font-mono" value={typed} onChange={(e) => setTyped(e.target.value)} aria-describedby="confirm-text-error" />
            </Field>
          ) : (
            error && (
              <p role="alert" className="my-4 text-critical">
                {error}
              </p>
            )
          )}
          <DialogFooter className="mt-4">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" variant={destructive ? "destructive" : "default"} disabled={!ready || isPending}>
              {isPending ? "Saving…" : confirmLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
