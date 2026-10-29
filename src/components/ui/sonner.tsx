import { HugeiconsIcon } from "@hugeicons/react"
import {
  Alert02Icon,
  AlertDiamondIcon,
  CheckmarkCircle02Icon,
  InformationCircleIcon,
  Loading03Icon,
} from "@hugeicons/core-free-icons"
import { Toaster as Sonner, type ToasterProps } from "sonner"

// The console is dark only (brand §3), so no theme provider
const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      icons={{
        success: <HugeiconsIcon icon={CheckmarkCircle02Icon} strokeWidth={1.5} className="size-4 text-verified" />,
        info: <HugeiconsIcon icon={InformationCircleIcon} strokeWidth={1.5} className="size-4" />,
        warning: <HugeiconsIcon icon={Alert02Icon} strokeWidth={1.5} className="size-4 text-warning" />,
        error: <HugeiconsIcon icon={AlertDiamondIcon} strokeWidth={1.5} className="size-4 text-critical" />,
        loading: <HugeiconsIcon icon={Loading03Icon} strokeWidth={1.5} className="size-4 animate-spin" />,
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
