import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  // @replit
  // Whitespace-nowrap: Badges should never wrap.
  "whitespace-nowrap inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2" +
  " hover-elevate ",
  {
    variants: {
      variant: {
        default:
          // @replit shadow-xs instead of shadow, no hover because we use hover-elevate
          "border-transparent bg-primary-inverted text-foreground-inverted shadow-xs",
        tertiary:
          // @replit no hover because we use hover-elevate
          "border-transparent bg-secondary text-secondary-foreground",
        destructive:
          // @replit shadow-xs instead of shadow, no hover because we use hover-elevate
          "border-transparent bg-danger-inverted text-foreground-inverted shadow-xs",
        "danger-surface":
          "bg-danger-surface text-destructive border-danger-border",
        "warning-inverted":
          "border-transparent bg-warning-inverted text-foreground-warning-inverted shadow-xs",
        "warning-surface":
          "bg-warning-surface text-warning border-warning-border",
        "success-inverted":
          "border-transparent bg-success-inverted text-foreground-success-inverted shadow-xs",
        "success-surface":
          "bg-success-surface text-success border-success-border",
          // @replit shadow-xs" - use badge outline variable
        secondary: "text-foreground border [border-color:hsl(var(--badge-outline))]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
