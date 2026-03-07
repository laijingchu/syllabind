import * as React from "react"
import { cn } from "@/lib/utils"

const OVERLAY_BASE = "fixed inset-0 z-50 bg-black/80"
const OVERLAY_ANIMATED = `${OVERLAY_BASE} data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0`

export { OVERLAY_BASE, OVERLAY_ANIMATED }

/**
 * Standalone Overlay — use directly when you need a backdrop without a Radix primitive.
 * For Radix-based overlays (Dialog, AlertDialog, Sheet, Drawer), use OVERLAY_BASE or
 * OVERLAY_ANIMATED as className on the primitive's own Overlay component.
 */
const Overlay = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { animated?: boolean }
>(({ className, animated = true, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(animated ? OVERLAY_ANIMATED : OVERLAY_BASE, className)}
    {...props}
  />
))
Overlay.displayName = "Overlay"

export { Overlay }
