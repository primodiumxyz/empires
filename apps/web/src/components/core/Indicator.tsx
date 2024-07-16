import { cn } from "@/util/client";
import { VariantProps, cva } from "class-variance-authority";
import { forwardRef } from "react";

const indicatorVariants = cva("indicator-item badge", {
  variants: {
    variant: {
      neutral: "indicator-neutral",
      primary: "indicator-primary",
      accent: "indicator-accent",
      secondary: "indicator-secondary",
      success: "indicator-success",
      info: "indicator-info",
      warning: "indicator-warning",
      error: "indicator-error",
    },
  },
  defaultVariants: {
    variant: "neutral",
  },
});

interface IndicatorProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof indicatorVariants> {
  children?: React.ReactNode;
  indicatorContent?: React.ReactNode;
}

export const Indicator = forwardRef<HTMLDivElement, IndicatorProps>(
  ({ children, className, variant, indicatorContent }, ref) => {
    return (
      <div ref={ref} className="indicator">
        <span className={cn(indicatorVariants({ variant, className }))}>{indicatorContent}</span>
        {children}
      </div>
    );
  }
);
