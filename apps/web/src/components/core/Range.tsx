import { forwardRef } from "react";
import { cva, VariantProps } from "class-variance-authority";

import { cn } from "@/util/client";

const rangeVariants = cva("range pointer-events-auto", {
  variants: {
    variant: {
      neutral: "range-neutral",
      primary: "range-primary",
      accent: "range-accent",
      secondary: "range-secondary",
      success: "range-success",
      info: "range-info",
      warning: "range-warning",
      error: "range-error",
    },
  },
  defaultVariants: {
    variant: "neutral",
  },
});

interface RangeProps extends VariantProps<typeof rangeVariants> {
  min?: number;
  max?: number;
  defaultValue?: number;

  className?: string;
  onChange?: (val: number) => void;
}

export const Range = forwardRef<HTMLInputElement, RangeProps>(
  ({ min = 0, max = 100, defaultValue, onChange, className, variant }, ref) => {
    return (
      <div className="flex h-full items-center p-2 transition-all hover:bg-secondary/10">
        <input
          ref={ref}
          type="range"
          min={min}
          max={max}
          defaultValue={defaultValue}
          className={cn(rangeVariants({ variant, className }))}
          onChange={(e) => {
            onChange?.(parseInt(e.target.value));
          }}
        />
      </div>
    );
  },
);
