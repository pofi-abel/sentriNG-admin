// New sign-in details on screen: print or hand over now, then clear. Leaving asks first (CodesGuard)
import { PrinterIcon } from "@hugeicons/core-free-icons";
import { CredentialSlip } from "@/components/analysts/CredentialSlip";
import { CodesGuard } from "@/components/enrollment/CodesGuard";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import type { AnalystCredentials } from "@/lib/types";

export function CredentialsPanel({ credentials, onDone }: { credentials: AnalystCredentials; onDone: () => void }) {
  const what = [credentials.password && "password", credentials.otpauth_uri && "authenticator QR"].filter(Boolean).join(" and ");
  return (
    <div className="space-y-4">
      <CodesGuard active />
      <div className="flex items-center gap-3 rounded-md bg-accent-soft px-3 py-2 print:hidden">
        <p>
          Give {credentials.analyst.name} this {what} in person. It's shown only once: never send it by email or message.
        </p>
        <div className="ml-auto flex gap-2">
          <Button onClick={() => window.print()}>
            <Icon icon={PrinterIcon} />
            Print
          </Button>
          <Button variant="outline" onClick={onDone}>
            Done, clear
          </Button>
        </div>
      </div>
      <CredentialSlip credentials={credentials} />
    </div>
  );
}
