// One observer: device state, a replacement code, revocation, and the polling units they cover (the election-morning
// swap happens here: remove one PU, add another)
import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { ArrowLeft01Icon, MapPinCheckIcon, PrinterIcon, QrCodeIcon, UserBlock01Icon } from "@hugeicons/core-free-icons";
import { CodesGuard } from "@/components/enrollment/CodesGuard";
import { EnrollmentCards } from "@/components/enrollment/EnrollmentCards";
import { ErrorBanner } from "@/components/layout/ErrorBanner";
import { PageHeader } from "@/components/layout/PageHeader";
import { AssignmentsTable } from "@/components/observers/AssignmentsTable";
import { ConfirmDialog } from "@/components/observers/ConfirmDialog";
import { ObserverStateBadge } from "@/components/status/badges";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { isApiError } from "@/core/helpers/axios.helper";
import {
  useAssignMutation,
  useObserverQuery,
  useReissueCodeMutation,
  useRevokeObserverMutation,
  useUnassignMutation,
} from "@/core/queries/observers.q";
import { hasLiveCode, observerState } from "@/lib/observers";
import type { AdminObserverDetail, IssuedCode } from "@/lib/types";
import { formatWAT } from "@/lib/utils";

export const Route = createFileRoute("/_admin/observers/$ref")({
  component: ObserverPage,
});

function ObserverPage() {
  const { ref } = Route.useParams();
  const navigate = Route.useNavigate();
  const observer = useObserverQuery(ref);
  const o = observer.data;
  const [issued, setIssued] = useState<IssuedCode | null>(null);

  const back = () => navigate({ to: "/observers" });

  return (
    <>
      <div className="print:hidden">
        <PageHeader
          title={
            <span className="inline-flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={back} aria-label="Back to observers">
                <Icon icon={ArrowLeft01Icon} />
              </Button>
              Observer <span className="font-mono">{ref}</span>
              {o && <ObserverStateBadge state={observerState(o)} />}
            </span>
          }
        >
          {o && <CredentialActions observer={o} onIssued={setIssued} />}
        </PageHeader>
        <ErrorBanner error={isApiError(observer.error, 404) ? null : observer.error} />
      </div>

      {isApiError(observer.error, 404) ? (
        <p className="text-muted-foreground">No observer has the ref {ref}. Check it, or import it with a roster.</p>
      ) : !o ? (
        <Skeleton className="h-80 w-full" />
      ) : issued ? (
        <IssuedCodePanel code={issued} onDone={() => setIssued(null)} />
      ) : (
        <div className="space-y-6">
          <ObserverFacts observer={o} />
          <Assignments observer={o} />
        </div>
      )}
    </>
  );
}

/** Re-issue (replacement phone) and revoke (lost phone). Both change what a printed card is worth, so both confirm */
function CredentialActions({ observer: o, onIssued }: { observer: AdminObserverDetail; onIssued: (code: IssuedCode) => void }) {
  const [dialog, setDialog] = useState<"reissue" | "revoke" | null>(null);
  const reissue = useReissueCodeMutation();
  const revoke = useRevokeObserverMutation();
  const revoked = !!o.revoked_at;
  const nothingToRevoke = revoked && !hasLiveCode(o);

  return (
    <>
      <Button variant="outline" onClick={() => setDialog("reissue")}>
        <Icon icon={QrCodeIcon} />
        Re-issue code
      </Button>
      <Button variant="reject" disabled={nothingToRevoke} onClick={() => setDialog("revoke")}>
        <Icon icon={UserBlock01Icon} />
        {revoked ? "Void new code" : "Revoke"}
      </Button>

      <ConfirmDialog
        open={dialog === "reissue"}
        onOpenChange={(open) => !open && setDialog(null)}
        title={`Re-issue a code for ${o.ref}?`}
        description={
          <>
            Use this for a replacement phone. Any earlier code for {o.ref} stops working.{" "}
            {o.enrolled_at && !revoked && "The current phone keeps working until the new one enrolls: revoke it as well if it was lost."}
          </>
        }
        confirmLabel="Re-issue code"
        isPending={reissue.isPending}
        error={reissue.error?.message}
        onConfirm={() =>
          reissue.mutate(o.ref, {
            onSuccess: (code) => {
              setDialog(null);
              onIssued(code);
            },
          })
        }
      />
      <ConfirmDialog
        open={dialog === "revoke"}
        onOpenChange={(open) => !open && setDialog(null)}
        title={revoked ? `Void the unused code for ${o.ref}?` : `Revoke ${o.ref}?`}
        description={
          revoked
            ? "The code that is out stops working. Issue another one when the new phone is ready."
            : "Their phone can no longer submit anything, and any unused code stops working. Re-issue a code for the new phone afterwards."
        }
        confirmLabel={revoked ? "Void code" : "Revoke"}
        destructive
        typeToConfirm={o.ref}
        isPending={revoke.isPending}
        error={revoke.error?.message}
        onConfirm={() =>
          revoke.mutate(o.ref, {
            onSuccess: () => {
              setDialog(null);
              toast.success(revoked ? `Unused code for ${o.ref} voided` : `${o.ref} revoked`);
            },
          })
        }
      />
    </>
  );
}

function IssuedCodePanel({ code, onDone }: { code: IssuedCode; onDone: () => void }) {
  return (
    <div className="space-y-4">
      <CodesGuard active />
      <div className="flex items-center gap-3 rounded-md bg-accent-soft px-3 py-2 print:hidden">
        <Icon icon={QrCodeIcon} className="text-in-review" />
        <p>Print this card now and hand it over in person. The code is shown only once and works for one phone.</p>
        <div className="ml-auto flex gap-2">
          <Button onClick={() => window.print()}>
            <Icon icon={PrinterIcon} />
            Print
          </Button>
          <Button variant="outline" onClick={onDone}>
            Done, clear code
          </Button>
        </div>
      </div>
      <div className="max-w-160 print:max-w-none">
        <EnrollmentCards codes={[code]} />
      </div>
    </div>
  );
}

function ObserverFacts({ observer: o }: { observer: AdminObserverDetail }) {
  const live = hasLiveCode(o);
  const facts: [string, React.ReactNode][] = [
    ["CSO", o.cso ?? "—"],
    ["Created", <span className="font-mono text-xs">{formatWAT(o.created_at)}</span>],
    ["Enrolled", <span className="font-mono text-xs">{formatWAT(o.enrolled_at)}</span>],
    ["Revoked", <span className="font-mono text-xs">{formatWAT(o.revoked_at)}</span>],
    ["Unused code", live ? <span className="font-mono text-xs">valid until {formatWAT(o.code_expires_at)}</span> : "None"],
  ];
  return (
    <dl className="grid grid-cols-5 gap-4 rounded-lg border border-border bg-card p-4">
      {facts.map(([label, value]) => (
        <div key={label}>
          <dt className="text-xs text-muted-foreground">{label}</dt>
          <dd className="mt-1">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function Assignments({ observer: o }: { observer: AdminObserverDetail }) {
  const assign = useAssignMutation();
  const unassign = useUnassignMutation();
  const [puCode, setPuCode] = useState("");
  const [error, setError] = useState<string>();

  const handleAssign = (e: React.FormEvent) => {
    e.preventDefault();
    const code = puCode.trim();
    if (!code) return setError("Enter a PU code, e.g. 24-01-01-001");
    assign.mutate(
      { ref: o.ref, puCode: code },
      {
        onSuccess: () => {
          setPuCode("");
          setError(undefined);
          toast.success(`${code} assigned to ${o.ref}`);
        },
        onError: (err) => setError(isApiError(err, 404) ? `No polling unit has the code ${code}` : err.message),
      },
    );
  };

  return (
    <section className="space-y-3">
      <div className="flex items-end gap-4">
        <h2 className="text-lg font-semibold">Polling units</h2>
        <form onSubmit={handleAssign} noValidate className="ml-auto flex items-start gap-2">
          <Field id="pu-code" label="Assign a polling unit" error={error} className="w-80">
            <Input
              id="pu-code"
              placeholder="PU code"
              className="font-mono"
              value={puCode}
              onChange={(e) => {
                setPuCode(e.target.value);
                setError(undefined);
              }}
              aria-invalid={!!error}
              aria-describedby="pu-code-error"
            />
          </Field>
          <Button type="submit" className="mt-6" disabled={assign.isPending}>
            <Icon icon={MapPinCheckIcon} />
            {assign.isPending ? "Assigning…" : "Assign"}
          </Button>
        </form>
      </div>
      <AssignmentsTable
        data={o.polling_units}
        removing={unassign.isPending ? (unassign.variables?.puCode ?? null) : null}
        onRemove={(code) =>
          unassign.mutate(
            { ref: o.ref, puCode: code },
            { onSuccess: () => toast.success(`${code} removed from ${o.ref}`), onError: (err) => toast.error(err.message) },
          )
        }
      />
    </section>
  );
}
