// Enrollment cards (brand §6): printed on Paper with the Field lockup, the QR, the observer ref (mono) and "Single-use
// code". The plaintext code is printed too, for a phone whose camera can't read the QR
import { QrCode } from "@/components/enrollment/QrCode";
import type { IssuedCode } from "@/lib/types";

const dateFormat = new Intl.DateTimeFormat("en-GB", { timeZone: "Africa/Lagos", day: "numeric", month: "short", year: "numeric" });

export function EnrollmentCards({ codes }: { codes: IssuedCode[] }) {
  return (
    <div className="sn-card-sheet">
      {codes.map((c) => (
        <EnrollmentCard key={c.ref} code={c} />
      ))}
    </div>
  );
}

// The light theme's border (#D6D0C2) and muted text (#545E69) from tokens.css: the card is Paper whatever the screen
// theme, and the semantic tokens follow the screen
function EnrollmentCard({ code: c }: { code: IssuedCode }) {
  return (
    <article className="sn-card flex gap-4 rounded-md border border-[#D6D0C2] bg-[var(--sn-paper)] p-4 text-[var(--sn-ink)]">
      <QrCode value={c.enroll_uri} size="44mm" label={`Enrollment QR code for ${c.ref}`} />
      <div className="flex min-w-0 flex-col">
        <img src="/lockup-field-on-light.svg" alt="SentriNG Field" className="h-6 w-auto self-start" />
        <p className="mt-3 font-mono text-base font-medium break-all">{c.ref}</p>
        {c.cso && <p className="text-xs text-[#545E69]">{c.cso}</p>}
        <p className="mt-auto text-sm font-semibold">Single-use code</p>
        <p className="font-mono text-xs break-all">{c.code}</p>
        <p className="mt-1 text-xs text-[#545E69]">Scan in SentriNG Field before {dateFormat.format(new Date(c.expires_at))}</p>
      </div>
    </article>
  );
}
