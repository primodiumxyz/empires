import { forwardRef } from "react";
import { cva, VariantProps } from "class-variance-authority";

import { Tooltip } from "@/components/core/Tooltip";
import { cn } from "@/util/client";

const badgeVariants = cva("badge flex pointer-events-auto shadow-inner", {
  variants: {
    variant: {
      neutral: "badge-neutral",
      primary: "badge-primary",
      accent: "badge-accent",
      secondary: "badge-secondary",
      success: "badge-success",
      info: "badge-info",
      warning: "badge-warning",
      error: "badge-error",
      ghost: "badge-ghost ring-0",
      glass: "badge-secondary bg-opacity-25 border-secondary/50",
    },
    size: {
      xs: "badge-xs border",
      sm: "badge-sm border-2",
      md: "badge-md",
      lg: "badge-lg",
    },
    modifier: {
      default: "",
      outline: "btn-outline",
    },
  },
  defaultVariants: {
    modifier: "default",
    variant: "neutral",
    size: "sm",
  },
});

interface BadgeProps extends React.ButtonHTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {
  tooltip?: React.ReactNode;
  tooltipDirection?: "right" | "left" | "top" | "bottom";
}

export const Badge = forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant, size, modifier, tooltip, tooltipDirection, ...props }, ref) => {
    return (
      <Tooltip tooltipContent={tooltip} direction={tooltipDirection}>
        <div className={cn(badgeVariants({ variant, size, modifier, className }))} ref={ref} {...props} />
      </Tooltip>
    );
  },
);
Badge.displayName = "Badge";
