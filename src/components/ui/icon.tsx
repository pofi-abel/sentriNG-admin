// Hugeicons Stroke Rounded at the brand's 1.5 stroke (brand §5). Decorative unless given a label: meaning is never icon-only
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import { cn } from "@/lib/utils";

export type { IconSvgElement };

export function Icon({ icon, size = 16, label, className }: { icon: IconSvgElement; size?: number; label?: string; className?: string }) {
  return (
    <HugeiconsIcon
      icon={icon}
      size={size}
      strokeWidth={1.5}
      className={cn("shrink-0", className)}
      aria-hidden={label ? undefined : true}
      aria-label={label}
      role={label ? "img" : undefined}
    />
  );
}
