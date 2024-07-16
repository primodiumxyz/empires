import { cn } from "@/util/client";
import { VariantProps, cva } from "class-variance-authority";
import { forwardRef } from "react";

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
      <div className="flex items-center p-2 transition-all hover:bg-secondary/10 h-full">
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
  }
);
