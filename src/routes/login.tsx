// Admin login: password + TOTP. Errors never say which factor failed, nor whether the account is an admin
import { useState } from "react";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { InformationCircleIcon } from "@hugeicons/core-free-icons";
import { HalftoneDusk } from "@/components/brand/HalftoneDusk";
import { Logo } from "@/components/brand/Logo";
import { RestrictedMark } from "@/components/brand/RestrictedMark";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { isApiError } from "@/core/helpers/axios.helper";
import { useValidator } from "@/core/helpers/useValidator.hook";
import { useLoginMutation } from "@/core/queries/auth.q";
import { LoginSchema } from "@/core/schemas/auth.schema";
import { tokenManager } from "@/lib/token-manager";

const searchSchema = z.object({
  reason: z.enum(["ended", "idle"]).optional().catch(undefined),
  redirect: z.string().optional().catch(undefined),
});

/** Only a path of this site, never another origin */
const safeRedirect = (path?: string) => (path?.startsWith("/") && !path.startsWith("//") && !path.startsWith("/login") ? path : "/observers");

export const Route = createFileRoute("/login")({
  validateSearch: searchSchema,
  beforeLoad: ({ search }) => {
    if (tokenManager.get()) throw redirect({ href: safeRedirect(search.redirect) });
  },
  component: LoginPage,
});

const REASONS = {
  ended: "Session ended. Log in again to continue.",
  idle: "Locked after 10 minutes without activity. Log in again to continue.",
};

function loginError(error: unknown) {
  if (isApiError(error, 401)) return "Email, password or code is wrong, or this account can't use the admin console.";
  if (isApiError(error, 429)) return "Too many attempts. Wait a few seconds, then try again.";
  if (isApiError(error) && error.status === 0) return "Can't reach the SentriNG API. Check the connection and try again.";
  return "Login failed. Try again.";
}

function LoginPage() {
  const { reason, redirect: next } = Route.useSearch();
  const navigate = useNavigate();
  const login = useLoginMutation();
  const [form, setForm] = useState({ email: "", password: "", totp_code: "" });
  const { validate, revalidate, errors } = useValidator({ schema: LoginSchema, store: form });

  const handleChange = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    revalidate(field, value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    validate((body) =>
      login.mutate(body, {
        onSuccess: () => navigate({ href: safeRedirect(next), replace: true }),
        // A wrong code is the usual failure: clear it so the next one from the app can be typed straight in
        onError: () => setForm((prev) => ({ ...prev, totp_code: "" })),
      }),
    );
  };

  return (
    <main className="grid min-h-[100dvh] grid-cols-[minmax(0,1.25fr)_minmax(420px,1fr)]">
      {/* The brand moment: the promise every portal exists to keep (brand §1), over the image direction (brand §7) */}
      <section className="flex flex-col justify-center gap-10 px-14 py-12">
        <div className="max-w-[880px] overflow-hidden rounded-lg border border-border">
          <HalftoneDusk />
        </div>
        <div className="max-w-xl space-y-3">
          <h1 className="text-[1.75rem] leading-tight font-semibold tracking-tight">Verified before visible.</h1>
          <p className="text-base leading-relaxed text-muted-foreground">
            Nothing is published until it has been witnessed at a polling unit and approved by two analysts working
            independently.
          </p>
        </div>
      </section>

      <section className="flex flex-col border-l border-border bg-card px-14 py-12">
        <div className="flex items-center gap-3 self-start">
          <Logo height={28} />
          <RestrictedMark />
        </div>

        <div className="my-auto w-full max-w-sm py-10">
          <h2 className="text-xl font-semibold">Log in to Admin</h2>
          <p className="mt-1 text-muted-foreground">Admin accounts only. Use the 6-digit code from your authenticator app.</p>

          {reason && (
            <p role="status" className="mt-6 flex items-center gap-2 rounded-md bg-accent-soft px-3 py-2">
              <Icon icon={InformationCircleIcon} className="text-in-review" />
              {REASONS[reason]}
            </p>
          )}

          <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
            <Field id="email" label="Email" error={errors.email}>
              <Input id="email" type="email" autoComplete="username" autoFocus value={form.email} onChange={(e) => handleChange("email", e.target.value)} aria-invalid={!!errors.email} aria-describedby="email-error" />
            </Field>
            <Field id="password" label="Password" error={errors.password}>
              <Input id="password" type="password" autoComplete="current-password" value={form.password} onChange={(e) => handleChange("password", e.target.value)} aria-invalid={!!errors.password} aria-describedby="password-error" />
            </Field>
            <Field id="totp_code" label="Authenticator code" error={errors.totp_code}>
              <Input
                id="totp_code"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                className="font-mono tracking-widest"
                value={form.totp_code}
                onChange={(e) => handleChange("totp_code", e.target.value.replace(/\D/g, ""))}
                aria-invalid={!!errors.totp_code}
                aria-describedby="totp_code-error"
              />
            </Field>

            {login.isError && (
              <p role="alert" className="text-critical">
                {loginError(login.error)}
              </p>
            )}

            <Button type="submit" className="w-full" disabled={login.isPending}>
              {login.isPending ? "Checking…" : "Log in"}
            </Button>
          </form>
        </div>

        <p className="max-w-sm text-xs text-muted-foreground">
          Admin access is granted from the command line. A session lasts 1 hour and locks after 10 minutes without activity.
        </p>
      </section>
    </main>
  );
}
