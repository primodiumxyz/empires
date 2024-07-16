import { cn } from "@/util/client";
import { VariantProps, cva } from "class-variance-authority";
import { forwardRef } from "react";

const loaderSizes = cva("loading loading-dots", {
  variants: {
    size: {
      sm: "loading-sm",
      xs: "loading-xs",
    },
  },
  defaultVariants: {
    size: "sm",
  },
});

interface LoaderProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof loaderSizes> {}

export const Loader = forwardRef<HTMLSpanElement, LoaderProps>(({ className, size }, ref) => {
  return <span ref={ref} className={cn(loaderSizes({ size, className }))} />;
});
