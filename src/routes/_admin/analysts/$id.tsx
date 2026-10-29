// One analyst account: lock it, end its sessions, or replace a lost password or authenticator. Admin accounts are
// read-only here (they change only through the API's CLI)
import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { ArrowLeft01Icon, DocumentValidationIcon, InformationCircleIcon, Logout01Icon, QrCodeIcon, ResetPasswordIcon, UserBlock01Icon } from "@hugeicons/core-free-icons";
import { CredentialsPanel } from "@/components/analysts/CredentialsPanel";
import { ErrorBanner } from "@/components/layout/ErrorBanner";
import { PageHeader } from "@/components/layout/PageHeader";
import { AdminRoleBadge, AnalystStateBadge } from "@/components/status/badges";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Icon } from "@/components/ui/icon";
import { Skeleton } from "@/components/ui/skeleton";
import { isApiError } from "@/core/helpers/axios.helper";
import { useAnalystQuery, useResetPasswordMutation, useResetTOTPMutation, useRevokeTokensMutation, useSetDisabledMutation } from "@/core/queries/analysts.q";
import type { AdminAnalyst, AnalystCredentials } from "@/lib/types";
import { formatWAT } from "@/lib/utils";

export const Route = createFileRoute("/_admin/analysts/$id")({
  params: {
    parse: ({ id }) => ({ id: Number(id) }),
    stringify: ({ id }) => ({ id: String(id) }),
  },
  component: AnalystPage,
});

function AnalystPage() {
  const { id } = Route.useParams();
  const navigate = Route.useNavigate();
  const analyst = useAnalystQuery(id);
  const a = analyst.data;
  const [credentials, setCredentials] = useState<AnalystCredentials | null>(null);

  return (
    <>
      <div className="print:hidden">
        <PageHeader
          title={
            <span className="inline-flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => navigate({ to: "/analysts" })} aria-label="Back to analysts">
                <Icon icon={ArrowLeft01Icon} />
              </Button>
              {a?.name ?? "Analyst"}
              {a && <AnalystStateBadge analyst={a} />}
              {a?.is_admin && <AdminRoleBadge />}
            </span>
          }
        >
          {a && !a.is_admin && !credentials && <AccountActions analyst={a} onCredentials={setCredentials} />}
        </PageHeader>
        <ErrorBanner error={isApiError(analyst.error, 404) ? null : analyst.error} />
      </div>

      {isApiError(analyst.error, 404) ? (
        <p className="text-muted-foreground">There is no analyst with this id.</p>
      ) : !a ? (
        <Skeleton className="h-40 w-full" />
      ) : credentials ? (
        <CredentialsPanel credentials={credentials} onDone={() => setCredentials(null)} />
      ) : (
        <div className="space-y-4">
          <dl className="grid grid-cols-4 gap-4 rounded-lg border border-border bg-card p-4">
            <Fact label="Email">{a.email}</Fact>
            <Fact label="Added">
              <span className="font-mono text-xs">{formatWAT(a.created_at)}</span>
            </Fact>
            <Fact label="Sign-in">{a.mfa_enrolled ? "Password and authenticator set" : "Not set up: reset the password and authenticator"}</Fact>
            <Fact label="Role">{a.is_admin ? "Admin" : "Desk analyst"}</Fact>
          </dl>
          {a.is_admin && (
            <p className="flex items-center gap-2 text-muted-foreground">
              <Icon icon={InformationCircleIcon} />
              Admin accounts change only from the command line (<code className="font-mono text-foreground">cmd/admin</code>), so a stolen
              admin session can't take one over.
            </p>
          )}
          <Link to="/audit" search={{ actor: a.id }} className="inline-flex items-center gap-2 text-primary hover:underline">
            <Icon icon={DocumentValidationIcon} />
            What {a.name} has done, in the audit log
          </Link>
        </div>
      )}
    </>
  );
}

const Fact = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <dt className="text-xs text-muted-foreground">{label}</dt>
    <dd className="mt-1">{children}</dd>
  </div>
);

type Action = "disable" | "enable" | "logout" | "password" | "totp";

function AccountActions({ analyst: a, onCredentials }: { analyst: AdminAnalyst; onCredentials: (c: AnalystCredentials) => void }) {
  const [dialog, setDialog] = useState<Action | null>(null);
  const setDisabled = useSetDisabledMutation();
  const revoke = useRevokeTokensMutation();
  const resetPassword = useResetPasswordMutation();
  const resetTOTP = useResetTOTPMutation();
  const close = () => setDialog(null);
  const shown = (credentials: AnalystCredentials) => {
    close();
    onCredentials(credentials);
  };

  return (
    <>
      <Button variant="outline" onClick={() => setDialog("logout")}>
        <Icon icon={Logout01Icon} />
        Log out everywhere
      </Button>
      <Button variant="outline" onClick={() => setDialog("password")}>
        <Icon icon={ResetPasswordIcon} />
        Reset password
      </Button>
      <Button variant="outline" onClick={() => setDialog("totp")}>
        <Icon icon={QrCodeIcon} />
        Reset authenticator
      </Button>
      {a.disabled ? (
        <Button variant="approve" onClick={() => setDialog("enable")}>
          Enable
        </Button>
      ) : (
        <Button variant="reject" onClick={() => setDialog("disable")}>
          <Icon icon={UserBlock01Icon} />
          Disable
        </Button>
      )}

      <ConfirmDialog
        open={dialog === "disable"}
        onOpenChange={(open) => !open && close()}
        title={`Disable ${a.name}?`}
        description="They are signed out at once and can't log in until an admin enables the account again. Their past decisions stay."
        confirmLabel="Disable"
        destructive
        typeToConfirm={a.email}
        isPending={setDisabled.isPending}
        error={setDisabled.error?.message}
        onConfirm={() => setDisabled.mutate({ id: a.id, disabled: true }, { onSuccess: () => (close(), toast.success(`${a.name} disabled`)) })}
      />
      <ConfirmDialog
        open={dialog === "enable"}
        onOpenChange={(open) => !open && close()}
        title={`Enable ${a.name}?`}
        description="They can log in again with their current password and authenticator."
        confirmLabel="Enable"
        isPending={setDisabled.isPending}
        error={setDisabled.error?.message}
        onConfirm={() => setDisabled.mutate({ id: a.id, disabled: false }, { onSuccess: () => (close(), toast.success(`${a.name} enabled`)) })}
      />
      <ConfirmDialog
        open={dialog === "logout"}
        onOpenChange={(open) => !open && close()}
        title={`Log ${a.name} out everywhere?`}
        description="Every desk session they have ends now, on any machine. They can log in again straight away."
        confirmLabel="Log out everywhere"
        isPending={revoke.isPending}
        error={revoke.error?.message}
        onConfirm={() => revoke.mutate(a.id, { onSuccess: () => (close(), toast.success(`${a.name} logged out everywhere`)) })}
      />
      <ConfirmDialog
        open={dialog === "password"}
        onOpenChange={(open) => !open && close()}
        title={`Reset ${a.name}'s password?`}
        description="Their current password stops working and their sessions end. The new password is shown once on the next screen."
        confirmLabel="Reset password"
        isPending={resetPassword.isPending}
        error={resetPassword.error?.message}
        onConfirm={() => resetPassword.mutate(a.id, { onSuccess: shown })}
      />
      <ConfirmDialog
        open={dialog === "totp"}
        onOpenChange={(open) => !open && close()}
        title={`Reset ${a.name}'s authenticator?`}
        description="For a lost or replaced phone. The old authenticator entry stops working and their sessions end. The new QR is shown once on the next screen."
        confirmLabel="Reset authenticator"
        isPending={resetTOTP.isPending}
        error={resetTOTP.error?.message}
        onConfirm={() => resetTOTP.mutate(a.id, { onSuccess: shown })}
      />
    </>
  );
}
