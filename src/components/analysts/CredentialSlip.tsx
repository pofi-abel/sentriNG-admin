// Desk sign-in details, handed over in person (admin plan §8): on Paper like the enrollment cards, with the Desk lockup,
// the password and/or the authenticator QR. There is no self-service password change, so the password stays until an
// admin resets it
import { QrCode } from "@/components/enrollment/QrCode";
import type { AnalystCredentials } from "@/lib/types";

/** The base32 secret inside otpauth://totp/...?secret=..., for an authenticator app that can't scan */
const manualSecret = (uri: string) => new URL(uri).searchParams.get("secret")?.replace(/(.{4})/g, "$1 ").trim();

// The light theme's border and muted text, as on the enrollment cards: the slip is Paper whatever the screen theme
export function CredentialSlip({ credentials: c }: { credentials: AnalystCredentials }) {
  return (
    <article className="sn-card sn-slip flex max-w-[640px] gap-6 rounded-md border border-[#D6D0C2] bg-[var(--sn-paper)] p-5 text-[var(--sn-ink)]">
      {c.otpauth_uri && <QrCode value={c.otpauth_uri} size="44mm" label={`Authenticator QR code for ${c.analyst.email}`} />}
      <div className="flex min-w-0 flex-col gap-3">
        <img src="/lockup-desk-on-light.svg" alt="SentriNG Desk" className="h-6 w-auto self-start" />
        <div>
          <p className="font-semibold">{c.analyst.name}</p>
          <p className="font-mono text-sm">{c.analyst.email}</p>
        </div>
        {c.password && (
          <div>
            <p className="text-xs text-[#545E69]">Password</p>
            <p className="font-mono text-lg font-medium">{c.password}</p>
          </div>
        )}
        {c.otpauth_uri && (
          <div>
            <p className="text-xs text-[#545E69]">Scan the QR with Google Authenticator or Authy, or type this key</p>
            <p className="font-mono text-xs break-all">{manualSecret(c.otpauth_uri)}</p>
          </div>
        )}
        <p className="mt-auto text-xs text-[#545E69]">Keep this private. If it's lost, ask an admin to reset it.</p>
      </div>
    </article>
  );
}
