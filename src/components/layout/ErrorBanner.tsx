// A failed load: says what happened and that the console keeps retrying
import { AlertDiamondIcon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/ui/icon";

export function ErrorBanner({ error }: { error: Error | null }) {
  if (!error) return null;
  return (
    <div role="alert" className="mb-4 flex items-center gap-2 rounded-md border border-critical/40 bg-critical-soft px-3 py-2 text-critical">
      <Icon icon={AlertDiamondIcon} />
      <span>Couldn't load this: {error.message}. The console keeps retrying.</span>
    </div>
  );
}
