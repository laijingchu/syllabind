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
          "border border-border text-primary hover:bg-primary-surface",
      },
      size: {
        default: "px-3 py-2 text-sm",
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
  if (variant === "outline") return "bg-primary-surface border-border hover:bg-primary-surface hover:border-primary"
  return "bg-primary-inverted text-foreground-inverted hover:opacity-80"
}

function inactiveClass(variant: string | null | undefined) {
  if (variant === "outline") return ""
  return "bg-muted text-muted-foreground hover:bg-highlight"
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
