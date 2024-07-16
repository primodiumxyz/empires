import { cn } from "@/util/client";
import { VariantProps, cva } from "class-variance-authority";
import { forwardRef } from "react";

const progressVariants = cva("progress", {
  variants: {
    variant: {
      neutral: "progress-neutral",
      primary: "progress-primary",
      accent: "progress-accent",
      secondary: "progress-secondary",
      success: "progress-success",
      info: "progress-info",
      warning: "progress-warning",
      error: "progress-error",
    },
  },
  defaultVariants: {
    variant: "neutral",
  },
});

interface ProgressProps extends React.HTMLAttributes<HTMLProgressElement>, VariantProps<typeof progressVariants> {
  value?: number;
  max?: number;
}

export const Progress = forwardRef<HTMLProgressElement, ProgressProps>(({ value, max, className, variant }, ref) => {
  return <progress ref={ref} className={cn(progressVariants({ variant, className }))} value={value} max={max} />;
});
