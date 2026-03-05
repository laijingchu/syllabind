import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const pillVariants = cva(
  "inline-flex items-center justify-center rounded-full font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
  {
    variants: {
      variant: {
        default: "",
        outline:
          "border border-primary/30 text-primary hover:bg-primary/10",
      },
      size: {
        default: "px-3 py-1.5 text-sm",
        sm: "px-2.5 py-1 text-xs",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function activeClass(variant: string | null | undefined) {
  if (variant === "outline") return "bg-primary/15 border-primary/60 hover:bg-primary/25 hover:border-primary"
  return "bg-foreground text-background hover:opacity-80"
}

function inactiveClass(variant: string | null | undefined) {
  if (variant === "outline") return ""
  return "bg-muted text-muted-foreground hover:bg-foreground/10"
}

interface PillProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "value">,
    VariantProps<typeof pillVariants> {
  active?: boolean
}

const Pill = React.forwardRef<HTMLButtonElement, PillProps>(
  ({ className, variant, size, active = false, ...props }, ref) => (
    <button
      ref={ref}
      type="button"
      className={cn(
        pillVariants({ variant, size }),
        active ? activeClass(variant) : inactiveClass(variant),
        className
      )}
      data-state={active ? "on" : "off"}
      aria-pressed={active}
      {...props}
    />
  )
)
Pill.displayName = "Pill"

export { Pill, pillVariants }
