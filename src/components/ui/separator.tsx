"use client"

import * as React from "react"
import { cva } from "class-variance-authority"

import { cn } from "@/lib/utils"

const separatorVariants = cva(
  "bg-border",
  {
    variants: {
      orientation: {
        horizontal: "h-px w-full",
        vertical: "h-full w-px",
      },
    },
    defaultVariants: {
      orientation: "horizontal",
    },
  }
)

export interface SeparatorProps
  extends React.HTMLAttributes<HTMLHRElement>,
    React.RefAttributes<HTMLHRElement> {
  orientation?: "horizontal" | "vertical"
}

const Separator = React.forwardRef<HTMLHRElement, SeparatorProps>(
  ({ className, orientation, ...props }, ref) => {
    return (
      <hr
        ref={ref}
        className={cn(separatorVariants({ orientation, className }))}
        {...props}
      />
    )
  }
)
Separator.displayName = "Separator"

export { Separator }
