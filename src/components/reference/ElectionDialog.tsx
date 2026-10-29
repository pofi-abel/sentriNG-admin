// Add an election, or rename one and change where it's held. Race and date can't change once it exists: results belong
// to it by them. No states ticked means nationwide
import { useEffect, useState } from "react";
import { RACE_LABEL } from "@/components/reference/ElectionsTable";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { isApiError } from "@/core/helpers/axios.helper";
import { useValidator } from "@/core/helpers/useValidator.hook";
import { useCreateElectionMutation, useUpdateElectionMutation } from "@/core/queries/reference.q";
import { ElectionSchema } from "@/core/schemas/election.schema";
import { RACES, type Election, type State } from "@/lib/types";
import { formatDay } from "@/lib/utils";

interface ElectionDialogProps {
  /** null: closed; "new": add; an election: edit it */
  election: Election | "new" | null;
  states: State[] | undefined;
  onClose: (saved?: string) => void;
}

const EMPTY = { name: "", race: "", held_on: "", state_codes: [] as string[] };

export function ElectionDialog({ election, states, onClose }: ElectionDialogProps) {
  const editing = election !== "new" && election !== null ? election : null;
  const create = useCreateElectionMutation();
  const update = useUpdateElectionMutation();
  const saving = editing ? update : create;
  const [form, setForm] = useState(EMPTY);
  const { validate, revalidate, errors } = useValidator({ schema: ElectionSchema, store: form });

  useEffect(() => {
    if (!election) return;
    create.reset();
    update.reset();
    setForm(editing ? { name: editing.name, race: editing.race, held_on: editing.held_on.slice(0, 10), state_codes: editing.state_codes } : EMPTY);
    // Only when the dialog opens (or opens on another election): typing must not reset the form
  }, [election]);

  const set = <K extends keyof typeof form>(field: K, value: (typeof form)[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    revalidate(field, value);
  };
  const toggleState = (code: string) =>
    set("state_codes", form.state_codes.includes(code) ? form.state_codes.filter((c) => c !== code) : [...form.state_codes, code].sort());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    validate((body) => {
      const done = { onSuccess: () => onClose(editing ? `${body.name} saved` : `${body.name} added`) };
      if (editing) update.mutate({ id: editing.id, name: body.name, state_codes: body.state_codes }, done);
      else create.mutate(body, done);
    });
  };

  const serverError = isApiError(saving.error, 409) ? "There's already an election for this race on this date." : saving.error?.message;

  return (
    <Dialog open={!!election} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <form onSubmit={handleSubmit} noValidate>
          <DialogHeader>
            <DialogTitle>{editing ? `Edit ${editing.name}` : "Add an election"}</DialogTitle>
            <DialogDescription>
              {editing
                ? `${RACE_LABEL[editing.race]} on ${formatDay(editing.held_on)}. Race and date can't change: results belong to the election by them.`
                : "One race on one date. A general-election day has one election per race."}
            </DialogDescription>
          </DialogHeader>

          <div className="my-4 space-y-2">
            <Field id="election-name" label="Name" error={errors.name}>
              <Input id="election-name" autoFocus value={form.name} onChange={(e) => set("name", e.target.value)} aria-invalid={!!errors.name} aria-describedby="election-name-error" />
            </Field>
            {!editing && (
              <div className="grid grid-cols-2 gap-4">
                <Field id="election-race" label="Race" error={errors.race}>
                  <Select value={form.race} onValueChange={(v) => set("race", v)}>
                    <SelectTrigger id="election-race" aria-invalid={!!errors.race} aria-describedby="election-race-error">
                      <SelectValue placeholder="Choose the race" />
                    </SelectTrigger>
                    <SelectContent>
                      {RACES.map((r) => (
                        <SelectItem key={r} value={r}>
                          {RACE_LABEL[r]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field id="election-date" label="Date" error={errors.held_on}>
                  <Input id="election-date" type="date" value={form.held_on} onChange={(e) => set("held_on", e.target.value)} aria-invalid={!!errors.held_on} aria-describedby="election-date-error" />
                </Field>
              </div>
            )}

            <fieldset className="space-y-2">
              <legend className="text-sm font-medium">Held in</legend>
              <p className="text-muted-foreground">
                {form.state_codes.length ? `${form.state_codes.length} states ticked.` : "Nationwide: no states ticked."} Tick states only for an
                election held in some of them, like an off-cycle governorship.
              </p>
              {states?.length === 0 && <p className="text-warning">No states are loaded yet. Import polling units first.</p>}
              <div className="grid max-h-56 grid-cols-3 gap-x-4 gap-y-1 overflow-y-auto rounded-md border border-border p-3">
                {states?.map((s) => (
                  <label key={s.code} className="flex items-center gap-2">
                    <input type="checkbox" className="size-4 accent-[var(--sn-accent)]" checked={form.state_codes.includes(s.code)} onChange={() => toggleState(s.code)} />
                    {s.name}
                    <span className="font-mono text-xs text-muted-foreground">{s.code}</span>
                  </label>
                ))}
              </div>
              {editing && form.state_codes.join() !== editing.state_codes.join() && (
                <p className="text-warning">Results already sent from a state you take out stay. New ones from there will be refused.</p>
              )}
            </fieldset>

            {serverError && (
              <p role="alert" className="text-critical">
                {serverError}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onClose()}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving.isPending}>
              {saving.isPending ? "Saving…" : editing ? "Save" : "Add election"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
