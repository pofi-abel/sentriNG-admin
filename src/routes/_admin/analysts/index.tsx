// Analysts (admin plan §5.2): the desk accounts, and adding one. The new password and authenticator QR show once
import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AnalystsTable } from "@/components/analysts/AnalystsTable";
import { CredentialsPanel } from "@/components/analysts/CredentialsPanel";
import { ErrorBanner } from "@/components/layout/ErrorBanner";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { isApiError } from "@/core/helpers/axios.helper";
import { useValidator } from "@/core/helpers/useValidator.hook";
import { useAnalystsQuery, useCreateAnalystMutation } from "@/core/queries/analysts.q";
import { CreateAnalystSchema } from "@/core/schemas/analyst.schema";
import type { AnalystCredentials } from "@/lib/types";

export const Route = createFileRoute("/_admin/analysts/")({
  component: AnalystsPage,
});

function AnalystsPage() {
  const analysts = useAnalystsQuery();
  const [adding, setAdding] = useState(false);
  const [credentials, setCredentials] = useState<AnalystCredentials | null>(null);

  if (credentials) return <CredentialsPanel credentials={credentials} onDone={() => setCredentials(null)} />;

  return (
    <>
      <PageHeader title="Analysts">
        <Button onClick={() => setAdding(true)}>Add analyst</Button>
      </PageHeader>
      <p className="mb-4 max-w-3xl text-muted-foreground">
        Desk analysts verify results and incidents. Admin accounts are listed for reference: they are added and changed
        only from the command line, so a stolen admin session can't create or take over another admin.
      </p>
      <ErrorBanner error={analysts.error} />
      <AnalystsTable data={analysts.data} isPending={analysts.isPending} />
      <AddAnalystDialog
        open={adding}
        onOpenChange={setAdding}
        onCreated={(c) => {
          setAdding(false);
          setCredentials(c);
        }}
      />
    </>
  );
}

function AddAnalystDialog({ open, onOpenChange, onCreated }: { open: boolean; onOpenChange: (open: boolean) => void; onCreated: (c: AnalystCredentials) => void }) {
  const create = useCreateAnalystMutation();
  const [form, setForm] = useState({ name: "", email: "" });
  const { validate, revalidate, errors } = useValidator({ schema: CreateAnalystSchema, store: form });

  const handleChange = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    revalidate(field, value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    validate((body) =>
      create.mutate(body, {
        onSuccess: (c) => {
          setForm({ name: "", email: "" });
          onCreated(c);
        },
      }),
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) create.reset();
        onOpenChange(next);
      }}
    >
      <DialogContent>
        <form onSubmit={handleSubmit} noValidate>
          <DialogHeader>
            <DialogTitle>Add a desk analyst</DialogTitle>
            <DialogDescription>
              They get a generated password and an authenticator QR, shown once on the next screen. Hand them over in person.
            </DialogDescription>
          </DialogHeader>
          <div className="my-4 space-y-2">
            <Field id="analyst-name" label="Name" error={errors.name}>
              <Input id="analyst-name" autoFocus value={form.name} onChange={(e) => handleChange("name", e.target.value)} aria-invalid={!!errors.name} aria-describedby="analyst-name-error" />
            </Field>
            <Field id="analyst-email" label="Email" error={errors.email ?? (isApiError(create.error, 409) ? "An analyst with this email already exists" : undefined)}>
              <Input
                id="analyst-email"
                type="email"
                autoComplete="off"
                value={form.email}
                onChange={(e) => handleChange("email", e.target.value)}
                aria-invalid={!!errors.email}
                aria-describedby="analyst-email-error"
              />
            </Field>
            {create.error && !isApiError(create.error, 409) && (
              <p role="alert" className="text-critical">
                {create.error.message}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={create.isPending}>
              {create.isPending ? "Adding…" : "Add analyst"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
